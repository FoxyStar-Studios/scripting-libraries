import { Expr, Statement, Program } from "../parser/expression.ts";
import { MolangRuntimeError } from "../diagnostics/error.ts";
import * as Suggestions from "../diagnostics/suggestions.ts";
import {
    DEFAULT_CONTEXT,
    isNamespace,

    MolangBinding,
    MolangContext,
    MolangNamespace
} from "./context.ts";

export interface MolangOptions {
    strict?: boolean;
}

export class ReturnSignal {
    constructor(public value: unknown) {};
}
export class BreakSignal {};
export class ContinueSignal {};

export class MolangRuntime {
    private loopDepth: number = 0;
    constructor(
        private context: MolangContext = DEFAULT_CONTEXT,
        private source: string,
        private options: MolangOptions = {},

        private rootContext: MolangContext = context,
    ) {}

    private static NAMESPACE_ALIASES: Record<string, string> = {
        v: "variable",
        t: "temp",
        q: "query",
        c: "context",
    };

    private safe<T>(fn: () => T): T {
        try {
            return fn();
        } catch (e) {
            if (this.options.strict) {
                throw e;
            }

            return 0 as T;
        }
    }

    public evaluateProgram(program: Program) {
        try {
            let result: unknown = undefined;
            for (const stmt of program.body) {
                result = this.evaluateStatement(stmt);
            }

            return result;
        }
        catch (e) {
            if (e instanceof ReturnSignal) {
                return e.value;
            }

            throw e;
        }
    }

    private evaluateStatement(stmt: Statement): unknown {
        switch (stmt.type) {
            case "ExprStatement": {
                return this.evaluate(stmt.expr);
            }

            case "AssignStatement": {
                if (stmt.target.type === "ArrowExpression") {
                    throw new MolangRuntimeError("Cannot assign through '->'",
                        stmt.target,
                        this.source
                    );
                }

                const value = this.evaluate(stmt.value);
                this.assign(stmt.target, value, stmt);

                return value;
            }

            case "BreakStatement": {
                if (this.loopDepth === 0) {
                    throw new MolangRuntimeError("break used outside of loop", stmt, this.source);
                }

                throw new BreakSignal();
            }

            case "ContinueStatement": {
                if (this.loopDepth === 0) {
                    throw new MolangRuntimeError("continue used outside of loop", stmt, this.source);
                }

                throw new ContinueSignal();
            }

            case "ReturnStatement": {
                const value = stmt.value
                    ? this.evaluate(stmt.value)
                    : undefined;

                throw new ReturnSignal(value);
            }

            case "ConditionalStatement": {
                const condition = this.evaluate(stmt.condition);

                if (this.toBoolean(condition)) {
                    return this.evaluateStatement(stmt.then);
                }

                if (stmt.else) {
                    return this.evaluateStatement(stmt.else);
                }

                return undefined;
            }

            case "LoopStatement": {
                const result = this.toNumber(this.evaluate(stmt.count));
                const count = Math.min(1024, Math.max(0, result | 0));

                this.loopDepth++;

                for (let i = 0; i < count; i++) {
                    try {
                        this.evaluateStatement(stmt.body);
                    } catch (e) {
                        if (e instanceof BreakSignal) {
                            break;
                        }

                        if (e instanceof ContinueSignal) {
                            continue;
                        }

                        throw e;
                    }
                }

                this.loopDepth--;
                return 0;
            }

            case "ForEachStatement": {
                const value = this.evaluate(stmt.iterable);
                if (!Array.isArray(value)) {
                    return 0;
                }

                const max = Math.min(1024, value.length);

                for (let i = 0; i < max; i++) {
                    try {
                        const iterationContext = Object.create(this.context);
                        iterationContext.this = value[i];

                        const nested = new MolangRuntime(
                            iterationContext,
                            this.source,
                            this.options,
                            this.rootContext
                        );

                        // ALWAYS assign iterator
                        nested.assign(stmt.iterator, value[i], stmt);
                        nested.evaluateStatement(stmt.body);
                    }
                    catch (e) {
                        if (e instanceof BreakSignal) {
                            break;
                        }

                        if (e instanceof ContinueSignal) {
                            continue;
                        }

                        throw e;
                    }
                }

                return 0;
            }

            case "BlockStatement": {
                let result: unknown = undefined;
                for (const s of stmt.body) {
                    result = this.evaluateStatement(s);
                }

                return result;
            }

            default: {
                throw new Error("Unknown statement type");
            }
        }
    }

    private assign(target: Expr, value: MolangBinding, _stmt: Statement) {
        // Index assignment: arr[idx] = value
        if (target.type === "IndexExpression") {
            // Ensure the base identifier is assignable
            const root = this.findAssignmentRoot(target.array);
            if (root !== "variable" && root !== "temp") {
                throw new MolangRuntimeError(
                    `Cannot assign to namespace '${root}'`,
                    target,
                    this.source
                );
            }

            const container = this.evaluate(target.array);
            const index = this.evaluate(target.index);

            if (!isNamespace(container)) {
                throw new MolangRuntimeError(
                    "Cannot assign to property of null or undefined",
                    target,
                    this.source
                );
            }

            container[index] = value;
            return;
        }

        if (target.type !== "Identifier") {
            throw new MolangRuntimeError(
                "Invalid assignment target",
                target,
                this.source
            );
        }

        const parts = MolangRuntime.normalizePath(target.name);
        if (parts.length < 2) {
            throw new MolangRuntimeError(
                "Assignments must target a namespace like v.x or variable.x",
                target,
                this.source
            );
        }

        // Enforce allowed namespaces (very important for safety)
        const root = parts[0];
        if (root !== "variable" && root !== "temp") {
            throw new MolangRuntimeError(`Cannot assign to namespace '${root}'`,
                target,
                this.source
            );
        }

        let current: MolangBinding = this.context;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];

            if (!isNamespace(current)) {
                throw new MolangRuntimeError(
                    `Unknown identifier '${parts.join(".")}'`,
                    target,
                    this.source
                );
            }

            if (!(part in current)) {
                if (this.options.strict) {
                    let message =
                        `Cannot assign to '${parts.join(".")}' because '${parts.slice(0, i + 1).join(".")}' does not exist`;

                    const suggestion = this.suggestPath(parts, i, current);
                    if (suggestion) {
                        message += `. Did you mean '${suggestion}'?`;
                    }

                    throw new MolangRuntimeError(message, target, this.source);
                }

                current[part] = {};
            }

            current = current[part as keyof MolangBinding];
        }

        const last = parts[parts.length - 1];
        if (!isNamespace(current)) {
            throw new MolangRuntimeError(
                `Cannot assign to '${parts.join(".")}'`,
                target,
                this.source
            );
        }

        current[last] = value;
    }

    private findAssignmentRoot(expr: Expr): string | null {
        if (expr.type === "Identifier") {
            return MolangRuntime.normalizePath(expr.name)[0] ?? null;
        }

        if (expr.type === "IndexExpression") {
            return this.findAssignmentRoot(expr.array);
        }

        return null;
    }

    public evaluate(expr: Expr): any {
        switch (expr.type) {
            case "Literal": {
                return expr.value;
            }

            case "Identifier": {
                try {
                    return this.resolvePath(expr.path, expr);
                } catch {
                    return undefined;
                }
            }

            case "BinaryExpression": {
                return this.safe(() => {
                    const left = this.evaluate(expr.left);
                    const right = this.evaluate(expr.right);

                    return this.applyOperator(expr.operator, left, right, expr);
                });
            }

            case "CallExpression": {
                try {
                    if (expr.callee.type !== "Identifier") {
                        throw new MolangRuntimeError("Invalid function call target",
                            expr.callee,
                            this.source
                        );
                    }

                    const name = expr.callee.name;
                    const func = this.evaluate(expr.callee);

                    if (func === undefined) {
                        const parts = MolangRuntime.normalizePath(name);

                        // resolve parent safely
                        let parent: MolangBinding = this.context;
                        for (let i = 0; i < parts.length - 1; i++) {
                            const p = parts[i];
                            if (!isNamespace(parent) || !(p in parent)) {
                                break;
                            }

                            parent = parent[p as keyof MolangBinding];
                        }

                        let message = `Cannot call '${name}' because it is undefined`;

                        if (isNamespace(parent)) {
                            const suggestion = this.suggestPath(parts, parts.length - 1, parent);
                            if (suggestion) {
                                message += `. Did you mean '${suggestion}'?`;
                            }
                        }

                        throw new MolangRuntimeError(message, expr.callee, this.source);
                    }

                    if (typeof func !== "function") {
                        const type = func === null ? "null" : typeof func;

                        let message =
                            `Cannot call '${name}' because it is of type '${type}', not a function`;

                        const parts = MolangRuntime.normalizePath(name);
                        const parent = this.context;

                        const suggestion = this.suggestPath(parts, parts.length - 1, parent);
                        if (suggestion) {
                            message += `. Did you mean '${suggestion}'?`;
                        }

                        throw new MolangRuntimeError(message, expr.callee, this.source);
                    }

                    const args = expr.arguments.map(a => this.evaluate(a));
                    if (args.length < func.length) {
                        throw new MolangRuntimeError(
                            `Function '${name}' expects at least ${func.length} arguments, but got ${args.length}`,
                            expr,
                            this.source
                        );
                    }

                    return func(...args);
                }
                catch (error: unknown) {
                    if (error instanceof MolangRuntimeError) {
                        throw error;
                    }

                    throw new MolangRuntimeError(
                        error instanceof Error ? error.message : String(error),
                        expr.callee,
                        this.source
                    );
                }
            }

            case "UnaryExpression": {
                const v = this.evaluate(expr.expression);
                switch (expr.operator) {
                    case "-": {
                        return -v;
                    }
                    case "!": {
                        return this.toNumber(v) === 0 ? 1 : 0;
                    }

                    default: {
                        throw new MolangRuntimeError(`Unknown unary operator ${expr.operator}`, expr, this.source);
                    }
                }
            }

            case "ArrayLiteral": {
                return expr.elements.map(e => this.evaluate(e));
            }

            case "IndexExpression": {
                const container = this.evaluate(expr.array);
                const idx = this.evaluate(expr.index);

                if (!isNamespace(container)) {
                    throw new MolangRuntimeError("Cannot index non-object value", expr, this.source);
                }

                return (container)[idx];

                /*if (typeof container !== "object" || container === null || !Array.isArray(container)) {
                    throw new MolangRuntimeError("Cannot index non-array value", expr, this.source);
                }

                if (typeof idx !== "number" || !Number.isInteger(idx)) {
                    throw new MolangRuntimeError("Array index must be an integer", expr, this.source);
                }

                if (Array.isArray(container) && (idx < 0 || idx >= container.length)) {
                    throw new MolangRuntimeError("Array index out of bounds", expr, this.source);
                }

                return container[idx];*/
            }

            case "ArrowExpression": {
                if (expr.left.type === "ArrowExpression") {
                    throw new MolangRuntimeError("Chained '->' not supported",
                        expr,
                        this.source
                    );
                }

                let target = this.evaluate(expr.left);
                if (typeof target === "function") {
                    if (target.length !== 0) {
                        throw new MolangRuntimeError("Arrow target function must take no arguments",
                            expr.left,
                            this.source
                        );
                    }

                    try {
                        target = target();
                    }
                    catch (error: unknown) {
                        if (error instanceof MolangRuntimeError) {
                            throw error;
                        }

                        throw new MolangRuntimeError(
                            `Error calling arrow target: ${error instanceof Error ? error.message : String(error)}`,
                            expr.left,
                            this.source
                        );
                    }
                }

                if (typeof target !== "object" || target === null) {
                    throw new MolangRuntimeError("Left side of '->' must be an object/context",
                        expr.left,
                        this.source
                    );
                }

                if (!("context" in target) || !("query" in target)) {
                    throw new MolangRuntimeError("Arrow target is not a valid entity context",
                        expr.left,
                        this.source
                    );
                }


                // Create a new runtime with swapped context
                const nestedRuntime = new MolangRuntime(
                    target,
                    this.source,
                    this.options,
                    this.rootContext
                );

                return nestedRuntime.evaluate(expr.right);
            }

            case "ConditionalExpression": {
                const condition = this.evaluate(expr.condition);

                if (this.toBoolean(condition)) {
                    return this.evaluate(expr.then);
                }

                // A ? B : C
                if (expr.else) {
                    return this.evaluate(expr.else);
                }

                // A ? B → returns 0 if false
                return 0;
            }

            default: {
                throw new Error(`Unknown expression type: ${(expr as Expr).type}`);
            }
        }
    }

    private toNumber(value: unknown): number {
        if (typeof value === "number") {
            return value;
        }
        else if (typeof value === "boolean") {
            return value ? 1 : 0;
        }

        return Number(value) || 0;
    }

    private toBoolean(v: unknown): boolean {
        return this.options.strict
            ? Boolean(v)
            : this.toNumber(v) !== 0;
    }

    private applyOperator(operator: string, left: unknown, right: unknown, expr: Expr): unknown {
        switch (operator) {
            case "&":
            case "|":
            case "^":
            case "<<":
            case ">>":
            case ">>>": {
                if (!Number.isInteger(left) || !Number.isInteger(right)) {
                    throw new MolangRuntimeError("Bitwise operators require numbers", expr, this.source);
                }

                const l = this.toNumber(left) | 0;
                const r = this.toNumber(right) | 0;

                switch (operator) {
                    case "&":  return l & r;
                    case "|":  return l | r;
                    case "^":  return l ^ r;
                    case "<<": return l << r;
                    case ">>": return l >> r;
                    case ">>>": return l >>> r;
                }

                return 0;
            }

            case "+":
            case "-":
            case "*":
            case "/": {
                const l = this.toNumber(left);
                const r = this.toNumber(right);

                switch (operator) {
                    case "+": return l + r;
                    case "-": return l - r;
                    case "*": return l * r;
                    case "/": return l / r;
                }

                return 0;
            }

            case "==": return left == right;
            case "!=": return left != right;

            case "<":
            case ">":
            case "<=":
            case ">=": {
                if ((typeof left === "number" && typeof right === "number") && this.options.strict === true) {
                    throw new MolangRuntimeError("Expected numbers for comparison", expr, this.source);
                }

                const l = this.toNumber(left);
                const r = this.toNumber(right);

                switch (operator) {
                    case "<": return l < r;
                    case ">": return l > r;
                    case "<=": return l <= r;
                    case ">=": return l >= r;
                }

                return 0;
            }

            case "??": {
                return (left !== undefined && left !== null) ? left : right;
            }

            case "&&":
            case "||": {
                if (typeof left !== "boolean" || typeof right !== "boolean") {
                    throw new MolangRuntimeError("Expected booleans", expr, this.source);
                }

                return operator === "&&"
                    ? (left && right)
                    : (left || right);
            }

            default: {
                throw new MolangRuntimeError(`Unknown operator '${operator}'`, expr, this.source);
            }
        }
    }

    // Paths
    public static normalizePath(path: string): string[] {
        const parts = path.split(".");

        // Apply alias only to the root namespace
        const root = parts[0];

        const alias = MolangRuntime.NAMESPACE_ALIASES[root];
        if (alias) {
            parts[0] = alias;
        }

        return parts;
    }

    private suggestPath(
        parts: string[],
        index: number,
        current: MolangNamespace
    ): string | undefined {
        const keys = Object.keys(current);
        const suggestion = Suggestions.findBestMatch(parts[index], keys);

        if (!suggestion) return;

        const fixed = [...parts];
        fixed[index] = suggestion;

        return fixed.join(".");
    }

    private resolvePath(value: string[] | string, expr: Expr): unknown {
        const parts = typeof value === "string" ? MolangRuntime.normalizePath(value) : value;
        let current: MolangBinding = this.context;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (!isNamespace(current)) {
                throw new MolangRuntimeError(
                    `Unknown identifier '${parts.join(".")}'`,
                    expr,
                    this.source
                );
            }

            if (!(part in current)) {
                let message = `Unknown identifier '${parts.join(".")}'`;

                // Suggestion logic
                const suggestion = this.suggestPath(parts, i, current);
                if (suggestion) {
                    message += `. Did you mean '${suggestion}'?`;
                }

                throw new MolangRuntimeError(
                    message,
                    expr,
                    this.source
                );
            }

            current = current[part as keyof MolangBinding];
        }

        return current;
    }
}