import type { RuntimeFn } from "./override.ts";

export type MethodEntry = {
    kind: "method";
    nativeKey: string;
    priority: number;
    fn: RuntimeFn;
};

export type GetterFn<R = unknown> = (original: () => R) => R;
export type GetterEntry = {
    kind: "getter";
    nativeKey: string;
    priority: number;
    fn: GetterFn;
};

export type SetterFn<T = unknown> = (value: T, original: (v: T) => void) => void;
export type SetterEntry = {
    kind: "setter";
    nativeKey: string;
    priority: number;
    fn: SetterFn;
};

export type OverrideEntry = MethodEntry | GetterEntry | SetterEntry;

// A brand new member, installed as-is on the native prototype.
export type AddEntry = {
    kind: "add";
    member: "method" | "getter" | "setter";
    nativeKey: string;
    fn: RuntimeFn;
};

export type MemberEntry = OverrideEntry | AddEntry;

export type PatchEntry = {
    overrides: MemberEntry[];
};