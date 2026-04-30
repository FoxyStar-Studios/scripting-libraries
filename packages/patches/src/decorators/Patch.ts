import { getMetadata, defineMetadata } from "../metadata/metadata.ts";
import { PATCHES_KEY } from "../symbols.ts";
import { collectOverrides } from "../runtime/collectOverrides.ts";
import { applyPatches } from "../runtime/applyPatches.ts";
import type { PatchEntry } from "../types/patch.ts";

export type Constructor = abstract new (...args: unknown[]) => unknown;

export function Patch<T extends Constructor>(nativeClass: T) {
    return function (patchClass: Constructor, context: ClassDecoratorContext) {
        const overrides = collectOverrides(patchClass, context.metadata as object);

        const patches = getMetadata<PatchEntry[]>(PATCHES_KEY, nativeClass) ?? [];

        defineMetadata(PATCHES_KEY, [ ...patches, {
            overrides
        }], nativeClass);

        applyPatches(nativeClass);
    };
}