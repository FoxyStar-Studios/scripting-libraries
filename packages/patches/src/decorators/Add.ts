import { registerOverride } from "./Override.ts";
import type { AddEntry } from "../types/patch.ts";
import type { AnyFn, RuntimeFn } from "../types/override.ts";

type AddContext =
    | ClassMethodDecoratorContext
    | ClassGetterDecoratorContext
    | ClassSetterDecoratorContext;

const MEMBERS = {
    method: "method",
    getter: "getter",
    setter: "setter"
} as const;

/**
 * Adds a brand new method, getter or setter to the patched class.
 *
 * The decorated member is installed as-is on the native prototype, so inside
 * it `this` is the native instance. Unlike `@Override` there is no `original`
 * argument, and the target must not already exist on the native class.
 *
 * @param nativeKey Name to install the member under. Defaults to its own name.
 */
export function Add(nativeKey?: string) {
    return function (value: AnyFn, context: AddContext): void {
        if (context.static) {
            throw new TypeError("@Add does not support static members");
        }

        if (context.private) {
            throw new TypeError("@Add does not support private (#) members");
        }

        const entry: AddEntry = {
            kind: "add",
            member: MEMBERS[context.kind],
            nativeKey: nativeKey ?? (context.name as string),
            fn: value as unknown as RuntimeFn
        };

        registerOverride(entry, value, context);
    };
}
