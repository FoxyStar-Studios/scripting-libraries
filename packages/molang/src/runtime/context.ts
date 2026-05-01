import { MolangMath } from "./math.ts";
import { PerlinNoise } from "@foxystar/math";

export type MolangPrimitive = number | string | boolean;
export type MolangArray = MolangPrimitive[];
export type MolangValue = MolangPrimitive | MolangArray;

export type MolangFunction = (...args: never[]) => unknown;

export type MolangBinding =
    | MolangValue
    | MolangFunction
    | MolangNamespace
    | undefined;

export type MolangNamespace = {
    [key: string]: MolangBinding;
};

export interface MolangContext extends MolangNamespace {
    math?: MolangNamespace;
    variable?: MolangNamespace;
    temp?: MolangNamespace;
    query?: MolangNamespace;
    context?: MolangNamespace;
};

const PERLIN = new PerlinNoise();
export const DEFAULT_CONTEXT: MolangContext = {
    math: MolangMath,

    variable: {},
    temp: {},
    context: {},
    query: {
        block_state: (_name: string) => {
            throw new Error("This function call can only be used in block context");
        },

        noise: (x: number, y: number) => {
            return PERLIN.noise({ x, y });
        },
    },
};

export function createMolangContext(
    initial?: MolangContext
): MolangContext {
    const ctx = mergeContext(DEFAULT_CONTEXT, initial ?? {});

    ctx.variable = {
        ...(initial?.variable ?? {}),
    }

    ctx.temp = {
        ...(initial?.temp ?? {}),
    }

    return ctx;
}


const LOCKED_KEYS = new Set([ "math" ]);
export function isNamespace(value: unknown): value is MolangNamespace {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeContext(
    base: MolangNamespace,
    user: MolangNamespace
): MolangNamespace {
    const out = Object.create(base);

    for (const key in user) {
        if (base === DEFAULT_CONTEXT && LOCKED_KEYS.has(key)) {
            throw new Error(`Cannot override core Molang namespace '${key}'`);
        }

        const userValue = user[key];
        const baseValue = base[key];

        const baseIsNamespace = isNamespace(baseValue);
        const userIsNamespace = isNamespace(userValue);

        if (baseIsNamespace && userIsNamespace) {
            out[key] = mergeContext(baseValue, userValue);
        }
        else {
            out[key] = userValue;
        }
    }

    return out;
}