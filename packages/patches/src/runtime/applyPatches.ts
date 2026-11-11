import { defineMetadata, getMetadata } from "../metadata/metadata.ts";
import { ADDED_KEY, ORIGINALS_KEY } from "../symbols.ts";
import type {
    AddEntry,
    GetterEntry,
    MemberEntry,
    MethodEntry,
    OverrideEntry,
    PatchEntry,
    SetterEntry
} from "../types/patch.ts";
import type { RuntimeFn } from "../types/override.ts";
import type { PrototypeTarget } from "../decorators/Patch.ts";

type Originals = Map<string, PropertyDescriptor>;

function findDescriptor(prototype: object | null, key: string): PropertyDescriptor | undefined {
    for (let current = prototype; current; current = Object.getPrototypeOf(current)) {
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        if (descriptor) {
            return descriptor;
        }
    }

    return undefined;
}

/**
 * Resolves the pristine descriptor that a patch chain for `key` ends in.
 * Throws when the property cannot be patched.
 */
function resolveOriginal(nativeClass: PrototypeTarget, key: string, label: string): PropertyDescriptor {
    const own = Object.getOwnPropertyDescriptor(nativeClass.prototype, key);
    if (own) {
        if (!own.configurable) {
            throw new TypeError(
                `@Patch: Cannot patch "${key}" on ${label}. Property is not configurable`
            );
        }

        return own;
    }

    const parent: object | null = Object.getPrototypeOf(nativeClass.prototype);
    const inherited = findDescriptor(parent, key);
    if (!parent || !inherited) {
        throw new ReferenceError(
            `@Patch: Cannot patch "${key}" on ${label}. ` +
            `Property does not exist on its prototype chain`
        );
    }

    // Inherited member: the patch is installed on this class only, and the chain
    // ends in a `super`-like lookup at call time, so patches applied to a parent
    // class (before or after this one) are still honoured.
    if ("get" in inherited || "set" in inherited) {
        return {
            configurable: true,
            enumerable: inherited.enumerable,

            get: inherited.get && function (this: unknown): unknown {
                return Reflect.get(parent, key, this);
            },
            set: inherited.set && function (this: unknown, value: unknown): void {
                Reflect.set(parent, key, value, this);
            }
        };
    }

    return {
        configurable: true,
        enumerable: inherited.enumerable,
        writable: true,

        value: typeof inherited.value === "function"
            ? function (this: unknown, ...args: unknown[]): unknown {
                return (Reflect.get(parent, key, this) as RuntimeFn).apply(this, args);
            }
            : inherited.value
    };
}

/**
 * Builds the descriptor of a member introduced with `@Add`.
 * A getter and a setter for the same key are merged into one accessor.
 */
function buildAddition(additions: AddEntry[], key: string, label: string): PropertyDescriptor {
    const pick = (member: AddEntry["member"]): RuntimeFn | undefined => {
        const matches = additions.filter((e) => e.member === member);
        if (matches.length > 1) {
            throw new TypeError(
                `@Patch: Cannot add "${key}" to ${label}. A ${member} with that name is added more than once`
            );
        }

        return matches[0]?.fn;
    };

    const method = pick("method");
    const get = pick("getter");
    const set = pick("setter");

    if (method) {
        if (get || set) {
            throw new TypeError(
                `@Patch: Cannot add "${key}" to ${label} as both a method and an accessor`
            );
        }

        return { value: method, writable: true, configurable: true, enumerable: false };
    }

    return { get, set, configurable: true, enumerable: false };
}

/**
 * Rebuilds every patched member of `nativeClass` from `patches`.
 *
 * Everything is validated before the prototype is touched, so a patch that
 * cannot be applied throws without leaving the class half-patched.
 */
export function applyPatches(nativeClass: PrototypeTarget, patches: PatchEntry[]): void {
    const label = nativeClass.name || "(anonymous)";

    // Aggregate all entries by their target native key.
    const buckets = new Map<string, MemberEntry[]>();
    for (const { overrides } of patches) {
        for (const entry of overrides) {
            const bucket = buckets.get(entry.nativeKey) ?? [];

            bucket.push(entry);
            buckets.set(entry.nativeKey, bucket);
        }
    }

    // Ensure we always start chaining from the pristine original descriptor,
    // not from whatever the prototype currently holds (which may already be patched).
    const originals = getMetadata<Originals>(ORIGINALS_KEY, nativeClass) ?? new Map();

    // Keys introduced by `@Add`. They have no pristine original: their base
    // descriptor is rebuilt from the patch entries every time.
    const added = getMetadata<Set<string>>(ADDED_KEY, nativeClass) ?? new Set();

    const captured: Originals = new Map();
    const introduced = new Set<string>();
    const pending: [ string, PropertyDescriptor ][] = [];

    for (const [ key, entries ] of buckets) {
        const additions = entries.filter((e): e is AddEntry => e.kind === "add");
        const overrides = entries.filter((e): e is OverrideEntry => e.kind !== "add");

        let original = originals.get(key);
        if (additions.length > 0) {
            if (original || (!added.has(key) && findDescriptor(nativeClass.prototype, key))) {
                throw new TypeError(
                    `@Patch: Cannot add "${key}" to ${label}. ` +
                    `Property already exists, use @Override to change it`
                );
            }

            original = buildAddition(additions, key, label);
            introduced.add(key);
        }
        else if (!original) {
            original = resolveOriginal(nativeClass, key, label);
            captured.set(key, original);
        }

        // Sort descending: the chain is built from the original outwards, so the
        // highest priority ends up closest to the original and the lowest
        // priority wraps outermost and executes first.
        const sorted = [ ...overrides ].sort((a, b) => b.priority - a.priority);

        const methods = sorted.filter((e): e is MethodEntry => e.kind === "method");
        const getters = sorted.filter((e): e is GetterEntry => e.kind === "getter");
        const setters = sorted.filter((e): e is SetterEntry => e.kind === "setter");

        if (methods.length > 0 && (getters.length > 0 || setters.length > 0)) {
            throw new TypeError(
                `@Patch: Cannot mix method and accessor overrides for "${key}" on ${label}`
            );
        }

        const isAccessor = "get" in original || "set" in original;

        if (methods.length > 0) {
            if (isAccessor) {
                throw new TypeError(
                    `@Patch: "${key}" on ${label} is an accessor. ` +
                    `Use @Override.get / @Override.set instead of @Override`
                );
            }

            if (typeof original.value !== "function") {
                throw new TypeError(
                    `@Patch: Cannot patch "${key}" on ${label}. Property is not a method`
                );
            }

            const chained = methods.reduce<RuntimeFn>(
                (next, { fn }) =>
                    function (this: unknown, ...args: unknown[]) {
                        return fn.call(this, next.bind(this), ...args);
                    },

                original.value as RuntimeFn
            );

            pending.push([ key, {
                ...original,

                value: chained,
                writable: true,
                configurable: true,
            }]);
        }
        else if (getters.length > 0 || setters.length > 0) {
            if (!isAccessor) {
                throw new TypeError(
                    `@Patch: "${key}" on ${label} is not an accessor. ` +
                    `Use @Override instead of @Override.get / @Override.set`
                );
            }

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

            pending.push([ key, {
                configurable: true,
                enumerable: original.enumerable ?? false,

                ...(chainedGet !== undefined && { get: chainedGet }),
                ...(chainedSet !== undefined && { set: chainedSet }),
            }]);
        }
        else {
            // Added member with no overrides on top of it.
            pending.push([ key, original ]);
        }
    }

    // Everything validated: commit.
    for (const [ key, descriptor ] of pending) {
        Object.defineProperty(nativeClass.prototype, key, descriptor);
    }

    for (const [ key, descriptor ] of captured) {
        originals.set(key, descriptor);
    }

    for (const key of introduced) {
        added.add(key);
    }

    defineMetadata(ORIGINALS_KEY, originals, nativeClass);
    defineMetadata(ADDED_KEY, added, nativeClass);
}
