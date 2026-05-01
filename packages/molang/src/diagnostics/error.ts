import { ExprBase } from "../parser/expression.ts";

class MolangError extends Error {
    constructor(message: string, start: number, end: number, source: string) {
        super(MolangError.formatError(message, start, end, source));

        this.name = this.constructor.name;
    }

    private static formatError(message: string, pos: number, end: number, src: string): string {
        let line = 1;
        let lastLineStart = 0;

        for (let i = 0; i < pos; i++) {
            if (src[i] === "\n") {
                line++;
                lastLineStart = i + 1;
            }
        }

        const column = pos - lastLineStart + 1;
        const lines = src.split("\n");
        const lineText = lines[line - 1] ?? "";


        //const pointer = " ".repeat(column - 1) + "^";
        const span = Math.max(1, end - pos);
        const underlineLength = Math.min(span, Math.max(1, lineText.length - column + 1));

        const pointer =
            " ".repeat(column - 1) +
            "^".repeat(underlineLength);

        return (
            `${message} at line ${line - 1}, column ${column}\n` +
            `${lineText}\n` +
            `${pointer}`
        );
    }
}

export class MolangParseError extends MolangError {
    constructor(message: string, position: number, source: string) {
        super(message, position, position + 1, source);
    }
}

export class MolangRuntimeError extends MolangError {
    constructor(message: string, expr: ExprBase, source: string) {
        super(message, expr.start, expr.end, source);
    }
}