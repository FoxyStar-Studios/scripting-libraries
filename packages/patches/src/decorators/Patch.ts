import { getMetadata, defineMetadata } from "../metadata/metadata.ts";
import { PATCHES_KEY } from "../symbols.ts";
import { collectOverrides } from "../runtime/collectOverrides.ts";
import { applyPatches } from "../runtime/applyPatches.ts";
import type { PatchEntry } from "../types/patch.ts";

// runtime-safe (accepts private constructors)
export type PrototypeTarget = {
    name?: string;
    prototype: object;
};

// typed constructor (for inference only)
export type AbstractConstructor = abstract new (...args: unknown[]) => unknown;

export function Patch<T extends PrototypeTarget>(nativeClass: T) {
    return function (patchClass: AbstractConstructor, context: ClassDecoratorContext) {
        const overrides = collectOverrides(patchClass, context.metadata as object);

        const patches = getMetadata<PatchEntry[]>(PATCHES_KEY, nativeClass) ?? [];

        defineMetadata(PATCHES_KEY, [ ...patches, {
            overrides
        }], nativeClass);

        applyPatches(nativeClass);
    };
}