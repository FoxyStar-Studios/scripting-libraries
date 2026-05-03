import esbuild from "esbuild";
import { evaluateExpression, Flags, FlagValue } from "./parser.ts";
import { PreprocessorError } from "./error.ts";

export function PreprocessorPlugin(): esbuild.Plugin {
    return {
        name: "@foxystar/preprocessor",

        setup: (build: esbuild.PluginBuild) => {
            const flags = extractFlags(build.initialOptions.define);

            build.onLoad({ filter: /\.ts$/ }, async (args) => {
                const source = await Deno.readTextFile(args.path);
                const contents = preprocess(source, flags);

                return { contents, loader: "ts" };
            });
        }
    };
}

function isPreprocessorFlag(key: string): boolean {
    return /^__[A-Z0-9_]+__$/.test(key);
}

function parseDefineValue(v: string): FlagValue {
    if (v === "true") return true;
    if (v === "false") return false;

    const number = Number(v);

    if (!Number.isNaN(number)) {
        return number;
    }

    throw new Error(`Unsupported define value: ${v}`);
}

function extractFlags(options: { [key: string]: string } = {}): Flags {
    return Object.fromEntries(
        Object.entries(options)
            .filter(([key]) => isPreprocessorFlag(key))
            .map(([k, v]) => [
                k.replace(/^__|__$/g, ""),
                parseDefineValue(v),
            ])
    );
}


// PREPROCESSOR CORE
function preprocess(source: string, flags: Flags): string {
    const lines = source.split(/\r?\n/);

    const output: string[] = [];
    const stack: { active: boolean; satisfied: boolean }[] = [];

    const parentActive = () =>
        stack.length === 0 || stack.slice(0, -1).every(s => s.active);

    const isActive = () =>
        stack.length === 0 || stack[stack.length - 1].active;

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];

        const ifMatch = raw.match(/^\s*\/\/#(if|elif)\b\s*(.*)$/);
        if (ifMatch !== null) {
            const [ _, kind, rest = "" ] = ifMatch;
            const expr = rest.trim();

            const value = evaluateExpression(expr, flags, i + 1);
            const currentActive = isActive();

            if (kind === "if") {
                stack.push({
                    active: value && currentActive,
                    satisfied: value
                });
            }
            else {
                if (!stack.length) {
                    throw new PreprocessorError("#elif without #if", i + 1);
                }

                const top = stack[stack.length - 1];
                const isParentActive = parentActive();

                top.active = isParentActive && !top.satisfied && value;
                top.satisfied ||= value;
            }

            continue;
        }

        const ctrlMatch = raw.match(/^\s*\/\/#(else|endif)\s*$/);
        if (ctrlMatch) {
            const [ _, kind ] = ctrlMatch;

            if (!stack.length) {
                throw new PreprocessorError(`#${kind} without #if`, i + 1);
            }

            const top = stack[stack.length - 1];

            if (kind === "else") {
                const isParentActive = parentActive();

                top.active = isParentActive && !top.satisfied;
                top.satisfied = true;
            }
            else {
                stack.pop();
            }

            continue;
        }

        if (isActive()) {
            output.push(raw);
        }
    }

    if (stack.length) {
        throw new PreprocessorError("Unterminated #if block", lines.length);
    }

    return output.join("\n");
}