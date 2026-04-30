import { getMetadata } from "../metadata/metadata.ts";
import { METHOD_META_KEY, OVERRIDE_KEY } from "../symbols.ts";
import type { OverrideEntry } from "../types/patch.ts";
import type { Constructor } from "../decorators/Patch.ts";

export function collectOverrides(patchClass: Constructor, metadata?: object): OverrideEntry[] {
    if (metadata) {
        const entries = getMetadata<OverrideEntry[]>(OVERRIDE_KEY, metadata);
        if (entries?.length) {
            return entries;
        }
    }

    const entries: OverrideEntry[] = [];

    for (const key of Object.getOwnPropertyNames(patchClass.prototype)) {
        if (key === "constructor") {
            continue;
        }

        const descriptor = Object.getOwnPropertyDescriptor(patchClass.prototype, key)!;

        for (const fn of [ descriptor.value, descriptor.get, descriptor.set ]) {
            if (typeof fn === "function") {
                const meta = getMetadata<OverrideEntry[]>(METHOD_META_KEY, fn);

                if (meta?.length) {
                    entries.push(...meta);
                }
            }
        }
    }

    return entries;
}