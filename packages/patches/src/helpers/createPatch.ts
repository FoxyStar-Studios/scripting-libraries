import { Patch, AbstractConstructor, PrototypeTarget } from "../decorators/Patch.ts";
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
    type Keys =
        T extends AbstractConstructor
            ? keyof InstanceType<T> & string : string;

    const OverrideFor = Object.assign(
        function (
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
        }, {
            get(
                keyOrOptions?: Keys | OverrideOptions,
                maybeOptions?: OverrideOptions
            ) {
                if (typeof keyOrOptions === "string") {
                    return Override.get(keyOrOptions, maybeOptions);
                }

                return Override.get(keyOrOptions);
            },

            set(
                keyOrOptions?: Keys | OverrideOptions,
                maybeOptions?: OverrideOptions
            ) {
                if (typeof keyOrOptions === "string") {
                    return Override.set(keyOrOptions, maybeOptions);
                }

                return Override.set(keyOrOptions);
            }
        }
    ) as OverrideForFn<Keys>;

    const PatchFor = Patch(nativeClass);
    return {
        Patch: PatchFor,
        Override: OverrideFor
    };
}