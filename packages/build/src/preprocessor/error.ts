export class PreprocessorError extends Error {
    constructor(message: string, public line: number) {
        super(`[@foxystar/preprocessor] Line ${line}: ${message}`);
    }
}

export class ExprError extends Error {
    constructor(msg: string, public line: number) {
        super(`[@foxystar/preprocessor] ${line}: ${msg}`);
    }
}