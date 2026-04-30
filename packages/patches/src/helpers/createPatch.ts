import { Patch, Constructor } from "../decorators/Patch.ts";
import { Override } from "../decorators/Override.ts";
import type { OverrideOptions } from "../types/override.ts";

export function createPatch<T extends Constructor>(nativeClass: T) {
    type Keys = keyof InstanceType<T> & string;

    function OverrideFor(
        keyOrOptions?: Keys | OverrideOptions,
        maybeOptions?: OverrideOptions
    ) {
        if (typeof keyOrOptions === "string") {
            return Override({
                ...maybeOptions,
                nativeKey: keyOrOptions
            });
        }

        return Override(keyOrOptions);
    }

    OverrideFor.get = function (
        keyOrOptions?: Keys | OverrideOptions,
        maybeOptions?: OverrideOptions
    ) {
        return Override.get(keyOrOptions, maybeOptions);
    };

    OverrideFor.set = function (
        keyOrOptions?: Keys | OverrideOptions,
        maybeOptions?: OverrideOptions
    ) {
        return Override.set(keyOrOptions, maybeOptions);
    };

    return {
        Patch: Patch(nativeClass),
        Override: OverrideFor,
    };
}
