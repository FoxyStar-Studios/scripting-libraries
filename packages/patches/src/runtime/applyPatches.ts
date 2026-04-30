import { defineMetadata, getMetadata } from "../metadata/metadata.ts";
import { ORIGINALS_KEY, PATCHES_KEY } from "../symbols.ts";
import type {
    GetterEntry,
    MethodEntry,
    OverrideEntry,
    PatchEntry,
    SetterEntry
} from "../types/patch.ts";
import type { RuntimeFn } from "../types/override.ts";
import type { PrototypeTarget } from "../decorators/Patch.ts";

export function applyPatches(nativeClass: PrototypeTarget): void {
    const patches = getMetadata<PatchEntry[]>(PATCHES_KEY, nativeClass) ?? [];

    // Aggregate all entries by their target native key.
    const buckets = new Map<string, OverrideEntry[]>();
    for (const { overrides } of patches) {
        for (const entry of overrides) {
            const bucket = buckets.get(entry.nativeKey) ?? [];

            bucket.push(entry);
            buckets.set(entry.nativeKey, bucket);
        }
    }

    // Ensure we always start chaining from the pristine original descriptor,
    // not from whatever the prototype currently holds (which may already be patched).
    let originals = getMetadata<Record<string, PropertyDescriptor>>(ORIGINALS_KEY, nativeClass);
    if (!originals) {
        originals = {};
        defineMetadata(ORIGINALS_KEY, originals, nativeClass);
    }

    for (const [ key, entries ] of buckets) {
        if (!originals[key]) {
            const descriptor = Object.getOwnPropertyDescriptor(nativeClass.prototype, key);
            if (!descriptor) {
                throw new ReferenceError(
                    `@Patch: Cannot patch "${key}" on ${nativeClass.name ?? '(anonymous)'}. ` +
                    `Property does not exist on its prototype`
                );
            }

            originals[key] = descriptor;
        }

        const original = originals[key];

        // Sort ascending so lower-priority entries wrap outermost and execute first.
        const sorted = [ ...entries ].sort((a, b) => b.priority - a.priority);

        const methods = sorted.filter((e): e is MethodEntry => e.kind === "method");
        const getters = sorted.filter((e): e is GetterEntry => e.kind === "getter");
        const setters = sorted.filter((e): e is SetterEntry => e.kind === "setter");

        if (methods.length > 0 && (getters.length > 0 || setters.length > 0)) {
            throw new TypeError(
                `@Patch: Cannot mix method and accessor overrides for "${key}" ` +
                `on ${nativeClass.name ?? '(anonymous)'}`
            );
        }

        if (methods.length > 0) {
            const chained = methods.reduce<RuntimeFn>(
                (next, { fn }) =>
                    function (this: unknown, ...args: unknown[]) {
                        return fn.call(this, next.bind(this), ...args);
                    },

                original.value as RuntimeFn
            );

            Object.defineProperty(nativeClass.prototype, key, {
                ...original,

                value: chained,
                writable: true,
                configurable: true,
            });
        }
        else {
            const chainedGet = getters.reduce<(() => unknown) | undefined>(
                (next, { fn }) =>
                    function (this: unknown): unknown {
                        return fn.call(this, () => next?.call(this));
                    },

                original.get
            );

            const chainedSet = setters.reduce<((v: unknown) => void) | undefined>(
                (next, { fn }) =>
                    function (this: unknown, value: unknown): void {
                        fn.call(this, value, (v) => next?.call(this, v));
                    },

                original.set
            );

            Object.defineProperty(nativeClass.prototype, key, {
                configurable: true,
                enumerable: original.enumerable ?? false,

                ...(chainedGet !== undefined && { get: chainedGet }),
                ...(chainedSet !== undefined && { set: chainedSet }),
            });
        }
    }
}