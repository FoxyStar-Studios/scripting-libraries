import { MolangParser } from "./parser/parser.ts";
import { MolangRuntime } from "./runtime/runtime.ts";
import { Program } from "./parser/expression.ts";
import { MolangContext, DEFAULT_CONTEXT, mergeContext } from "./runtime/context.ts";

import LRUCache from "./LRUCache.ts";

const MAX_CACHE_SIZE = 2048;
const cache = new LRUCache<string, Program>(MAX_CACHE_SIZE);

export function evaluate(input: string, context: MolangContext = {} as MolangContext): unknown {
    if (context === DEFAULT_CONTEXT) {
        context = mergeContext(DEFAULT_CONTEXT, {});
    }
    else if (!Object.prototype.isPrototypeOf.call(DEFAULT_CONTEXT, context)) {
        Object.setPrototypeOf(context, DEFAULT_CONTEXT);
    }

    let program = cache.get(input);
    if (!program) {
        const parser = new MolangParser(input);

        program = parser.parseProgram();
        cache.set(input, program);
    }

    const runtime = new MolangRuntime(context, input, { strict: false });
    return runtime.evaluateProgram(program);
}