import { Patch, PrototypeTarget } from "../decorators/Patch.ts";
import { Add } from "../decorators/Add.ts";
import { Override } from "../decorators/Override.ts";
import type { OverrideOptions } from "../types/override.ts";

type OverrideForFn<Keys extends string> = {
    <K extends Keys>(
        keyOrOptions?: K | OverrideOptions,
        maybeOptions?: OverrideOptions
    ): ReturnType<typeof Override>;

    get: <K extends Keys>(
        keyOrOptions?: K | OverrideOptions,
        maybeOptions?: OverrideOptions
    ) => ReturnType<typeof Override.get>;

    set: <K extends Keys>(
        keyOrOptions?: K | OverrideOptions,
        maybeOptions?: OverrideOptions
    ) => ReturnType<typeof Override.set>;
};

export function createPatch<T extends PrototypeTarget>(nativeClass: T) {
    // Read keys off the prototype rather than `InstanceType<T>`, so classes with
    // private constructors or constructor parameters are typed as well.
    type Keys = keyof T["prototype"] & string;

    const OverrideFor = Object.assign(
        function (
            keyOrOptions?: Keys | OverrideOptions,
            maybeOptions?: OverrideOptions
        ) {
            return Override(keyOrOptions, maybeOptions);
        }, {
            get(
                keyOrOptions?: Keys | OverrideOptions,
                maybeOptions?: OverrideOptions
            ) {
                return Override.get(keyOrOptions, maybeOptions);
            },

            set(
                keyOrOptions?: Keys | OverrideOptions,
                maybeOptions?: OverrideOptions
            ) {
                return Override.set(keyOrOptions, maybeOptions);
            }
        }
    ) as OverrideForFn<Keys>;

    const PatchFor = Patch(nativeClass);
    return {
        Patch: PatchFor,
        Override: OverrideFor,
        Add
    };
}
