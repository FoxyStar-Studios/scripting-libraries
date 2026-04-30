import { getMetadata, defineMetadata } from "../metadata/metadata.ts";
import { METHOD_META_KEY, OVERRIDE_KEY } from "../symbols.ts";
import type {
    OverrideEntry,
    GetterFn,
    GetterEntry,
    SetterFn,
    SetterEntry
} from "../types/patch.ts";
import type { AnyFn, OverrideOptions, RuntimeFn } from "../types/override.ts";

function registerOverride(
    entry: OverrideEntry,
    value: object,
    context: ClassMethodDecoratorContext
) {
    const perFn = getMetadata<OverrideEntry[]>(METHOD_META_KEY, value) ?? [];
    defineMetadata(METHOD_META_KEY, [ ...perFn, entry ], value);

    if (context.metadata) {
        const classEntries =
            getMetadata<OverrideEntry[]>(OVERRIDE_KEY, context.metadata as object) ?? [];

        defineMetadata(OVERRIDE_KEY, [ ...classEntries, entry ], context.metadata as object);
    }
}

function resolveOptions(
    context: ClassMethodDecoratorContext,
    nativeKeyOrOptions?: string | OverrideOptions,
    maybeOptions?: OverrideOptions
) {
    if (typeof nativeKeyOrOptions === "string") {
        return {
            nativeKey: nativeKeyOrOptions,
            priority: maybeOptions?.priority ?? 0
        };
    }

    return {
        nativeKey: context.name as string,
        priority: nativeKeyOrOptions?.priority ?? 0
    };
}

function createOverride(kind: "method") {
    return function (
        nativeKeyOrOptions?: string | OverrideOptions,
        maybeOptions?: OverrideOptions
    ) {
        return function <T extends AnyFn>(
            value: T,
            context: ClassMethodDecoratorContext
        ): T {
            if (context.static) {
                throw new TypeError("@Override does not support static members");
            }

            const { nativeKey, priority } =
                resolveOptions(context, nativeKeyOrOptions, maybeOptions);

            const entry: OverrideEntry = {
                kind,
                nativeKey,
                priority,
                fn: value as unknown as RuntimeFn
            };

            registerOverride(entry, value, context);
            return value;
        };
    };
}

function createOverrideGetter() {
    return function (
        nativeKeyOrOptions?: string | OverrideOptions,
        maybeOptions?: OverrideOptions
    ) {
        return function <R>(
            value: GetterFn<R>,
            context: ClassMethodDecoratorContext
        ): typeof value {
            if (context.static) {
                throw new TypeError("@Override does not support static members");
            }

            const { nativeKey, priority } =
                resolveOptions(context, nativeKeyOrOptions, maybeOptions);

            const entry: OverrideEntry = {
                kind: "getter",
                nativeKey,
                priority,
                fn: value as unknown as GetterEntry["fn"]
            };

            registerOverride(entry, value, context);
            return value;
        };
    };
}

function createOverrideSetter() {
    return function (
        nativeKeyOrOptions?: string | OverrideOptions,
        maybeOptions?: OverrideOptions
    ) {
        return function <T>(
            value: SetterFn<T>,
            context: ClassMethodDecoratorContext
        ): typeof value {
            if (context.static) {
                throw new TypeError("@Override does not support static members");
            }

            const { nativeKey, priority } =
                resolveOptions(context, nativeKeyOrOptions, maybeOptions);

            const entry: OverrideEntry = {
                kind: "setter",
                nativeKey,
                priority,
                fn: value as unknown as SetterEntry["fn"]
            };

            registerOverride(entry, value, context);
            return value;
        };
    };
}

export const Override = Object.assign(
    createOverride("method"),
    {
        get: createOverrideGetter(),
        set: createOverrideSetter()
    }
);