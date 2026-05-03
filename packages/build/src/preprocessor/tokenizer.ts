import { ExprError } from "./error.ts";

export type Token = string | boolean | number;

export function tokenize(expr: string, line: number): Token[] {
    const tokens: Token[] = [];
    const regex = /\s*(defined|[()!]|&&|\|\||==|!=|<=|>=|<|>|[A-Z_][A-Z0-9_]*|\d+)\s*/g;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(expr))) {
        const token = match[1];

        if (/^\d+$/.test(token)) {
            tokens.push(Number(token));
        }
        else if (token === "true" || token === "false") {
            tokens.push(token === "true")
        }
        else {
            tokens.push(token);
        }
    }

    const cleaned = expr.replace(/\s+/g, "");
    const matched = tokens.map(String).join("").replace(/\s+/g, "");

    if (cleaned !== matched) {
        throw new ExprError(`Invalid characters in expression '${expr}'`, line);
    }

    return tokens;
}