export type AnyFn = (...args: never[]) => unknown;
export type RuntimeFn = (...args: unknown[]) => unknown;

export type OverrideFn<T extends AnyFn> = (
    original: (...args: Parameters<T>) => ReturnType<T>,
    ...args: Parameters<T>
) => ReturnType<T>;

export interface OverrideOptions {
    nativeKey?: string;
    priority?: number;
}