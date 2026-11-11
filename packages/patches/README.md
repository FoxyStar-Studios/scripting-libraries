## `@foxystar/patches`
A lightweight, type-safe patching system for extending and modifying class behavior using decorators.

## Installation
```bash
npm install @foxystar/patches
```

## Overview
`@foxystar/patches` provides a clean and flexible way to:
- Override class methods, getters, and setters
- Add new methods, getters, and setters
- Chain multiple patches together
- Control execution order with priorities
- Write modular, reusable patches

It was designed primarily for systems like Minecraft: Bedrock Edition's Scripting API, but works anywhere you need runtime patching.

## Quick Example

```ts
import { createPatch } from "@foxystar/patches";
class SomeClass {
    method(x: number): number {
        return x * 2;
    }
}

const Some = createPatch(SomeClass);

@Some.Patch
class MyPatch {
    @Some.Override("method")
    method(original: (x: number) => number, x: number) {
        return original(x) + 1;
    }
}

new SomeClass().method(5); // -> 11 
```

## How It Works
Each override receives:

```ts
(original, ...args) 
```
- `original` -> the next function in the chain (or the original method)
- `...args` -> original arguments

Multiple patches are automatically chained together.

## Chaining & Priority
You can stack multiple patches and control execution order:

```ts
@Some.Patch
class PatchA {

    @Some.Override("method", { priority: 0 })
    method(original, x: number) {
        console.log("A");
        return original(x);
    }
}

@Some.Patch
class PatchB {

    @Some.Override("method", { priority: 1 })
    method(original, x: number) {
        console.log("B before");
        const result = original(x);
        console.log("B after");

        return result;
    }
} 
```

**Execution order**: `A` -> `B before` -> `(original)` -> `B after`

## Getters & Setters
You can override accessors as well:

```ts
@Some.Patch
class HealthPatch {

    @Some.Override.get("health")
    getHealth(original) {
        const value = original();
        console.log("get:", value);

        return value;
    }
    
    @Some.Override.set("health")
    setHealth(value: number, original) {
        console.log("set:", value);
        original(value);
    }
} 
```

## Adding New Members
Use `Add` to give a class methods, getters, or setters it does not have yet:

```ts
// Tell TypeScript about the new members
// (for a library class, put this inside `declare module "..." { }`).
interface SomeClass {
    label: string;
    describe(): string;
}

const Some = createPatch(SomeClass);
const LABEL = Symbol("label");

// Optional: types `this` as the patched class inside the patch.
interface LabelPatch extends SomeClass {}

@Some.Patch
class LabelPatch {

    @Some.Add()
    get label(): string {
        return (this as any)[LABEL] ?? "unnamed";
    }

    @Some.Add()
    set label(value: string) {
        (this as any)[LABEL] = value;
    }

    @Some.Add()
    describe(): string {
        return `${this.label}: ${this.method(1)}`;
    }
}

const instance = new SomeClass();
instance.label = "test";
instance.describe();
```

- The member is installed as-is, so `this` is the patched instance and there is no `original` argument
- `@Add("name")` installs the member under a different name
- Adding a member that already exists throws; use `Override` for those
- Added members can be overridden by other patches, like native ones

## Type-Safe Overrides
When using `createPatch`, property keys are fully typed:

```ts
@Some.Override("method") // autocomplete
@Some.Override("invalid") // compile error 
```

## Without `createPatch`
You can still use the base decorators:

```ts
import { Patch, Override } from "@foxystar/patches";

@Patch(SomeClass)
class MyPatch {
    @Override("method")
    method(original, x: number) {
        return original(x);
    }
} 
```

> [!NOTE]
> But you lose autocomplete and key safety.

## API

### `createPatch(Class)`
Creates a typed patch context:

```ts
const Some = createPatch(SomeClass); 
```

Provides:
- `Some.Patch`
- `Some.Override`
- `Some.Override.get`
- `Some.Override.set`
- `Some.Add`

### `@Add(key?)`
Adds a new method, getter, or setter. The target is `key`, else the name of the decorated member.

### `@Patch(Class)`
Registers a patch class.

### `@Override(key?, options?)`
Overrides a method. The target is `key`, else `options.nativeKey`, else the name of the decorated method.

Options:
```ts
{
    nativeKey?: string;
    priority?: number;
}
```

### `@Override.get(key)`
Overrides a getter.

### `@Override.set(key)`
Overrides a setter.

## Design Principles  
- Separation of concerns: typed API, generic runtime  
- Composable patches: chain safely and predictably  
- Minimal boilerplate: decorators handle everything  

---

> [!IMPORTANT]
> - Static methods are not supported
> - Patch order is determined by priority
> - Lower priority runs first (outermost); higher priority runs closer to the original implementation
> - Members inherited from a parent class can be patched; the patch only affects the class it is applied to

## Why use this?
Instead of:

```ts
// manual monkey patching:
const original = obj.method;
obj.method = function (...) { ... };
```

You get:

```ts
@Override("method")
method(original, ...) { ... }
```

It's basically cleaner, safer, and scalable.