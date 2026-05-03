import { tokenize } from "./tokenizer.ts";
import { ExprError } from "./error.ts";

export type FlagValue = boolean | number;
export type Flags = Record<string, FlagValue>;

// EXPRESSION PARSER
export function evaluateExpression(expr: string, flags: Flags, line: number): boolean {
    if (/["'`]/.test(expr)) {
        throw new ExprError("Strings are not allowed in expressions", line);
    }

    let index = 0;
    const tokens = tokenize(expr, line);

    const peek = () => tokens[index];
    const consume = () => tokens[index++];

    function parsePrimary(): number | boolean {
        const token = consume();

        if (token === "defined") {
            if (consume() !== "(") {
                throw new ExprError("Expected '(' after defined", line);
            }

            const id = consume();

            if (typeof id !== "string") {
                throw new ExprError(`Expected identifier inside defined(), got ${String(id)}`, line);
            }

            if (consume() !== ")") {
                throw new ExprError("Expected ')' after defined()", line);
            }

            return id in flags;
        }

        if (typeof token === "string" && /^[A-Z_][A-Z0-9_]*$/.test(token)) {
            if (!(token in flags)) {
                throw new ExprError(`Unknown identifier '${token}'`, line);
            }

            return flags[token];
        }

        if (token === "(") {
            const value = parseOr();
            if (consume() !== ")") {
                throw new ExprError("Missing closing ')'", line);
            }

            return value;
        }

        if (token === "!") {
            return !toBoolean(parsePrimary());
        }

        if (typeof token === "number" || typeof token === "boolean") {
            return token;
        }

        throw new ExprError(`Unexpected token '${token}'`, line);
    }

    function parseComparison(): boolean {
        let left = parsePrimary();

        while (
            typeof peek() === "string" &&
            ["==", "!=", "<", ">", "<=", ">="].includes(peek() as string)
        ) {
            const op = consume();
            const right = parsePrimary();

            switch (op) {
                case "==": left = left === right; break;
                case "!=": left = left !== right; break;
                case "<": left = Number(left) < Number(right); break;
                case ">": left = Number(left) > Number(right); break;
                case "<=": left = Number(left) <= Number(right); break;
                case ">=": left = Number(left) >= Number(right); break;
            }
        }

        return toBoolean(left);
    }

    function parseAnd(): boolean {
        let left = parseComparison();

        while (typeof peek() === "string" && peek() === "&&") {
            consume();

            const right = parseComparison();
            left = left && right;
        }

        return left;
    }

    function parseOr(): boolean {
        let left = parseAnd();

        while (peek() === "||") {
            consume();

            const right = parseAnd();
            left = left || right;
        }

        return left;
    }

    const result = parseOr();

    if (index < tokens.length) {
        throw new ExprError(`Unexpected token '${peek()}'`, line);
    }

    return result;
}

function toBoolean(v: unknown): boolean {
    if (typeof v === "boolean") {
        return v
    }
    else if (typeof v === "number") {
        return v !== 0
    }

    return Boolean(v);
}