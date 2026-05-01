export const TOKEN_REGEX = new RegExp([
    // number
    "^(?<number>-?\\d+(?:\\.\\d+)?)",

    // string (double OR single quotes)
    "(?<string>\"[^\"]*\"|'[^']*')",

    // identifier + dotted path
    "(?<identifier>[a-zA-Z_][a-zA-Z0-9_]*(?:\\.[a-zA-Z_][a-zA-Z0-9_]*)*)",

    "(?<assignment>=(?!=))",
    "(?<operator>\\?\\?|->|>>>|>>|<<|\\|\\||&&|==|!=|<=|>=|\\^|\\||&|\\?|:|[+\\-*/<>!])",

    // grouping
    "(?<parenthesis>[()])",
    "(?<bracket>[\\[\\]])",
    "(?<brace>[{}])",

    // punctuation
    "(?<comma>,)",
    "(?<semicolon>;)",

    // whitespace
    "(?<whitespace>\\s+)"
].join("|^"));

export type ExprBase = { start: number; end: number };
export type Expr =
    | ({ type: "Literal"; value: unknown } & ExprBase)
    | ({ type: "Identifier"; name: string; path: string[] } & ExprBase)
    | ({ type: "BinaryExpression"; operator: string; left: Expr; right: Expr } & ExprBase)
    | ({ type: "CallExpression"; callee: Expr; arguments: Expr[] } & ExprBase)
    | ({ type: "UnaryExpression"; operator: string; expression: Expr } & ExprBase)
    | ({ type: "ArrayLiteral"; elements: Expr[] } & ExprBase)
    | ({ type: "IndexExpression"; array: Expr; index: Expr } & ExprBase)
    | ({ type: "ArrowExpression"; left: Expr; right: Expr } & ExprBase)
    | ({
        type: "ConditionalExpression";
        condition: Expr;
        then: Expr;
        else?: Expr; // undefined = A ? B
    } & ExprBase);

export type Statement =
    | ({ type: "ExprStatement"; expr: Expr; } & ExprBase)
    | ({ type: "AssignStatement"; target: Expr; value: Expr; } & ExprBase)
    | ({ type: "ReturnStatement"; value?: Expr } & ExprBase)
    | ({ type: "BreakStatement"; } & ExprBase)
    | ({ type: "ContinueStatement"; } & ExprBase)
    | ({
        type: "LoopStatement";
        count: Expr;
        body: Statement;
    } & ExprBase)
    | ({
        type: "ForEachStatement";
        iterator: Expr;
        iterable: Expr;
        body: Statement;
    } & ExprBase)
    | ({
        type: "ConditionalStatement";
        condition: Expr;
        then: Statement;
        else?: Statement
    } & ExprBase)
    | ({ type: "BlockStatement"; body: Statement[] } & ExprBase);

export type Program = {
    type: "Program";
    body: Statement[];
    start: number;
    end: number;
};


export type TokenType =
    | "number" | "string" | "identifier"
    | "assignment"
    | "operator"
    | "parenthesis"
    | "brace"
    | "comma"
    | "bracket"
    | "semicolon"
    | "eof";

export type Token = {
    type: TokenType;
    value: string;
    start: number;
    end: number;
};