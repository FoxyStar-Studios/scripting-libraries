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

export type PatchEntry = {
    overrides: OverrideEntry[];
};