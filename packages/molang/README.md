## `@foxystar/molang`
A fast, extensible, and safe implementation of the [Molang](https://learn.microsoft.com/en-us/minecraft/creator/documents/molang/introduction) expression language.

## Installation
```bash
npm install @foxystar/molang
```

## Overview
`@foxystar/molang` is a full Molang interpreter written in TypeScript, designed for:
- Minecraft: Bedrock Edition's Scripting API
- Expression evaluation for custom components, systems, and tooling

It includes a parser, runtime, context system, and error handling, all built with strong typing and extensibility in mind.

## Features
- Full Molang parser (AST-based)
- Runtime interpreter with control flow support
- Context system with inheritance and scoping
- Safe evaluation (restricted mutation rules)
- Helpful error messages with suggestions
- Easily extensible (custom queries, variables, functions)
- Built-in math + random utilities

## Quick Example

```ts
import * as Molang from "@foxystar/molang";

const result = Molang.evaluate("1 + 2 * 3");
console.log(result); // 7
```

### Using Context
```ts
import * as Molang from "@foxystar/molang";

const context = Molang.createMolangContext({
    variable: {
        health: 10,
    }
});

Molang.evaluate("v.health + 5", context); // 15
```

### Custom functions
```ts
import * as Molang from "@foxystar/molang";

const context = Molang.createMolangContext({
    query: {
        double: (x: number) => x * 2,
    }
});

Molang.evaluate("q.double(5)", context); // 10
```

---

> [!NOTE]
> - Only `variable` and `temp` namespaces can be mutated
> - Prevents accidental writes to unsafe scopes
> - Strict mode available for additional validation

## Error Handling
Errors are descriptive and include helpful context:

```ts
Molang.evaluate("q.doubl(5)");
```

```
Cannot call 'q.doubl' because it is undefined. Did you mean 'query.double'?
```

## Design Goals
- Predictable and safe runtime behavior
- Clear and actionable error messages
- Minimal overhead with good performance
- Easy integration into existing systems