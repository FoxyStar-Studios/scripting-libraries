import { MolangParseError } from "../diagnostics/error.ts";
import { MolangRuntime } from "../runtime/runtime.ts";
import {
    TOKEN_REGEX,

    Expr,
    Token,
    TokenType,
    Statement,
    Program,
} from "./expression.ts";

export class MolangParser {
    private tokens: Token[] = [];
    private position: number = 0;

    constructor(private input: string) {
        this.tokenize();
    }

    private tokenize() {
        let str = this.input;
        let offset = 0;

        while (str.length > 0) {
            const match = TOKEN_REGEX.exec(str);
            if (match === null || match.index !== 0) {
                throw new MolangParseError(`Unexpected token '${str[0]}'`, offset, this.input);
            }

            const raw = match[0];
            for (const type of Object.keys(match.groups!)) {
                if (match.groups![type as TokenType]) {
                    if (type !== "whitespace") {
                        this.tokens.push({
                            type: type as TokenType, value: raw,
                            start: offset,
                            end: offset + raw.length
                        });
                    }

                    offset += raw.length;
                    str = str.slice(raw.length);
                    break;
                }
            }
        }

        this.tokens.push({
            type: "eof", value: "",
            start: offset, end: offset
        });
    }

    private peek(): Token {
        return this.tokens[this.position];
    }

    private consume(expectedType?: TokenType): Token {
        const token = this.tokens[this.position++];
        if (expectedType && token.type !== expectedType) {
            throw new Error(`Expected token type ${expectedType}, but got ${token.type}`);
        }

        return token;
    }

    public parseProgram(): Program {
        const body: Statement[] = [];
        const start = this.peek().start;

        while (this.peek().type !== "eof") {
            body.push(
                this.parseStatement()
            );

            if (this.peek().type === "semicolon") {
                this.consume("semicolon");
            }
            else if (this.peek().type !== "eof") {
                throw new MolangParseError(
                    "Expected ';' between statements",
                    this.peek().start,
                    this.input
                );
            }
        }

        const end = this.peek().end;
        return { type: "Program", body, start, end };
    }

    private parseStatement(): Statement {
        const token = this.peek();

        // loop(...)
        if (token.type === "identifier" && token.value === "loop") {
            const start = token.start;
            this.consume("identifier"); // loop

            this.consume("parenthesis"); // (

            const count = this.parseExpression();
            if (this.peek().type !== "comma") {
                throw new MolangParseError("Expected ',' after loop count", this.peek().start, this.input);
            }
            this.consume("comma");

            // body is a STATEMENT, not an expression
            const body = this.parseStatement();

            this.consume("parenthesis"); // )

            return {
                type: "LoopStatement",
                count,
                body,
                start,
                end: body.end
            };
        }

        // for_each(...)
        if (token.type === "identifier" && token.value === "for_each") {
            const start = token.start;
            this.consume("identifier"); // for_each

            this.consume("parenthesis"); // (

            // iterator (must be assignable)
            const iterator = this.parseExpression();
            if (
                iterator.type !== "Identifier" &&
                iterator.type !== "IndexExpression"
            ) {
                throw new MolangParseError(
                    "'for_each' iterator must be an assignable variable",
                    iterator.start,
                    this.input
                );
            }

            if (this.peek().type !== "comma") {
                throw new MolangParseError(
                    "Expected ',' after for_each iterator",
                    this.peek().start,
                    this.input
                );
            }
            this.consume("comma");

            const iterable = this.parseExpression();

            if (this.peek().type !== "comma") {
                throw new MolangParseError(
                    "Expected ',' after for_each iterable",
                    this.peek().start,
                    this.input
                );
            }
            this.consume("comma");

            // body is a STATEMENT
            const body = this.parseStatement();

            this.consume("parenthesis"); // )
            return {
                type: "ForEachStatement",
                iterator,
                iterable,
                body,
                start,
                end: body.end
            };
        }


        if (token.type === "brace" && token.value === "{") {
            const start = token.start;
            this.consume("brace"); // {

            const body: Statement[] = [];

            while (!(this.peek().type === "brace" && this.peek().value === "}")) {
                body.push(this.parseStatement());

                if (this.peek().type === "semicolon") {
                    this.consume("semicolon");
                }
            }

            const end = this.consume("brace").end; // }
            return { type: "BlockStatement", body, start, end };
        }

        if (token.type === "identifier" && token.value === "return") {
            const start = token.start;
            this.consume("identifier");

            // return;
            if (this.peek().type === "semicolon" || this.peek().type === "eof") {
                return {
                    type: "ReturnStatement",
                    start,
                    end: token.end
                };
            }

            // return <expr>
            const value = this.parseExpression();
            return {
                type: "ReturnStatement",
                value,
                start,
                end: value.end
            };
        }

        // break
        if (token.type === "identifier" && token.value === "break") {
            const t = this.consume("identifier");
            return { type: "BreakStatement", start: t.start, end: t.end };
        }

        // continue
        if (token.type === "identifier" && token.value === "continue") {
            const t = this.consume("identifier");
            return { type: "ContinueStatement", start: t.start, end: t.end };
        }


        const expr = this.parseBinaryExpression();
        if (this.peek().type === "operator" && this.peek().value === "?") {
            this.consume("operator");

            // Only allow a STATEMENT here
            const thenStmt = this.parseStatement();

            let elseStmt: Statement | undefined;
            if (this.peek().type === "operator" && this.peek().value === ":") {
                this.consume("operator"); // :
                elseStmt = this.parseStatement();
            }

            return {
                type: "ConditionalStatement",
                condition: expr,
                then: thenStmt,
                else: elseStmt,
                start: expr.start,
                end: (elseStmt ?? thenStmt).end
            };
        }

        // Assignment
        if (this.peek().type === "assignment") {
            this.consume("assignment");

            const value = this.parseExpression();
            return {
                type: "AssignStatement",
                target: expr,
                value,
                start: expr.start,
                end: value.end
            };
        }

        // Expression statement
        return {
            type: "ExprStatement",
            expr,
            start: expr.start,
            end: expr.end
        };
    }

    private parseExpression(): Expr {
        return this.parseConditionalExpression();
    }

    private parseBinaryExpression(precedence = 0): Expr {
        let left = this.parsePrimaryExpression();

        while (true) {
            const token = this.peek();
            if (token.type === "comma" || token.type === "parenthesis" || token.type === "eof") {
                break;
            }

            const tokenPrecedence = this.getOperatorPrecedence(token.value);
            if (tokenPrecedence < precedence) {
                break;
            }

            this.consume("operator");
            const right = this.parseBinaryExpression(tokenPrecedence + 1);

            if (token.value === "->") {
                left = {
                    type: "ArrowExpression",
                    left, right,
                    start: left.start,
                    end: right.end
                };

                continue; // Skip
            }

            if (left.type === "Literal" && right.type === "Literal") {
                const folded = this.tryFold(
                    token.value,
                    left.value,
                    right.value
                );

                if (folded !== undefined) {
                    left = {
                        type: "Literal",
                        value: folded,
                        start: left.start,
                        end: right.end
                    };

                    continue; // keep parsing higher-precedence ops
                }
            }

            left = {
                type: "BinaryExpression",
                operator: token.value,
                left, right,

                start: left.start,
                end: right.end
            };
        }

        return left;
    }

    private tryFold(op: string, left: unknown, right: unknown): unknown | undefined {
        if (typeof left !== "number" || typeof right !== "number") {
            return;
        }

        switch (op) {
            case "+":  return left + right;
            case "-":  return left - right;
            case "*":  return left * right;
            case "/":  return left / right;

            case "<":  return left < right;
            case ">":  return left > right;
            case "<=": return left <= right;
            case ">=": return left >= right;
        }

        return;
    }

    private getOperatorPrecedence(operator: string): number {
        switch (operator) {
            case "?": return -1; // handled outside binary parsing
            case ":": return -1;

            case "||": return 1;
            case "&&": return 2;
            case "??": return 0;

            case "|":  return 2;
            case "^":  return 3;
            case "&":  return 4;
            case "==":
            case "!=":
            case "<":
            case ">":
            case "<=":
            case ">=":
                return 5;
            case "<<":
            case ">>":
            case ">>>":
                return 6;
            case "+":
            case "-":
                return 7;
            case "*":
            case "/":
                return 8;
            case "->":
                return 9;
            default:
                return -1;
        }
    }

    private parseConditionalExpression(): Expr {
        const condition = this.parseBinaryExpression();

        if (
            this.peek().type === "operator" &&
            this.peek().value === "?"
        ) {
            this.consume("operator"); // ?
            const then = this.parseExpression();

            // A ? B : C
            if (
                this.peek().type === "operator" &&
                this.peek().value === ":"
            ) {
                this.consume("operator"); // :
                const elseStmt = this.parseExpression();

                return {
                    type: "ConditionalExpression",
                    condition,
                    then,
                    else: elseStmt,
                    start: condition.start,
                    end: elseStmt.end
                };
            }

            // Binary condition (A ? B)
            return {
                type: "ConditionalExpression",
                condition,
                then,
                start: condition.start,
                end: then.end
            };
        }

        return condition;
    }

    private parsePrimaryExpression(): Expr {
        return this.parseUnary();
    }

    private parseUnary(): Expr {
        const token = this.peek();
        if (token.type === "operator" && (token.value === "-" || token.value === "!")) {
            this.consume("operator");

            const expr = this.parseUnary();
            return {
                type: "UnaryExpression",
                operator: token.value,
                expression: expr,
                start: token.start,
                end: expr.end
            };
        }

        return this.parseAtom();
    }

    private parseAtom(): Expr {
        const token = this.peek();

        if (token.type === "number") {
            this.consume("number");
            return {
                type: "Literal",
                value: Number(token.value),
                start: token.start,
                end: token.end
            };
        }

        if (token.type === "string") {
            this.consume("string");
            return {
                type: "Literal",
                value: token.value.slice(1, -1),
                start: token.start,
                end: token.end
            };
        }

        if (token.type === "bracket" && token.value === "[") {
            const start = token.start;
            this.consume("bracket");

            const elements: Expr[] = [];

            while (!(this.peek().type === "bracket" && this.peek().value === "]")) {
                elements.push(this.parseExpression());

                if (this.peek().type !== "comma") {
                    break;
                }

                this.consume("comma");
            }

            const close = this.consume("bracket");
            return {
                type: "ArrayLiteral",
                elements,
                start, end: close.end
            };
        }

        if (token.type === "identifier" && (token.value === "true" || token.value === "false")) {
            this.consume("identifier");
            return {
                type: "Literal",
                value: token.value === "true",
                start: token.start,
                end: token.end
            };
        }

        if (token.type === "identifier") {
            this.consume("identifier");

            const path = MolangRuntime.normalizePath(token.value);

            let expr: Expr = {
                type: "Identifier",
                name: token.value,
                path,
                start: token.start,
                end: token.end
            };

            // Check if this is a function call
            if (this.peek().type === "parenthesis" && this.peek().value === "(") {
                this.consume("parenthesis");

                const args: Expr[] = [];

                while (true) {
                    const next = this.peek();

                    if (next.type === "eof") {
                        throw new MolangParseError("Unclosed function call", token.start, this.input);
                    }

                    if (next.type === "parenthesis" && next.value === ")") {
                        break;
                    }

                    if (next.type === "comma") {
                        throw new MolangParseError(`Unexpected token ','`, next.start, this.input);
                    }

                    args.push(this.parseExpression());

                    const afterArg = this.peek();
                    if (afterArg.type === "comma") {
                        this.consume("comma");

                        const lookahead = this.peek();
                        if (lookahead.type === "parenthesis" && lookahead.value === ")") {
                            throw new MolangParseError(`Unexpected token ')'`, lookahead.start, this.input);
                        }
                    }
                    else if (!(afterArg.type === "parenthesis" && afterArg.value === ")")) {
                        throw new MolangParseError(
                            `Unexpected token '${afterArg.value}'`,
                            afterArg.start,
                            this.input
                        );
                    }
                }

                this.consume("parenthesis");
                expr = {
                    type: "CallExpression",
                    callee: expr,
                    arguments: args,
                    start: expr.start,
                    end: this.tokens[this.position - 1].end
                };
            }

            while (this.peek().type === "bracket" && this.peek().value === "[") {
                this.consume("bracket");

                const index = this.parseExpression();
                const close = this.consume("bracket");

                expr = {
                    type: "IndexExpression",
                    array: expr,
                    index,
                    start: expr.start,
                    end: close.end
                };
            }

            return expr;
        }

        if (token.type === "parenthesis" && token.value === "(") {
            this.consume("parenthesis");

            let expr = this.parseExpression();
            this.consume("parenthesis");

            while (this.peek().type === "bracket" && this.peek().value === "[") {
                this.consume("bracket");

                const index = this.parseExpression();
                const close = this.consume("bracket");
                expr = {
                    type: "IndexExpression",
                    array: expr,
                    index,
                    start: expr.start,
                    end: close.end
                };
            }

            return expr;
        }

        throw new Error(`Unexpected token: ${token.value}`);
    }
}