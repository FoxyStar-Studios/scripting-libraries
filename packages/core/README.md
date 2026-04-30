## `@foxystar/core`
Core primitives and utilities shared across the FoxyStar ecosystem.

## Installation
```bash
npm install @foxystar/core
```

## Overview
`@foxystar/core` provides:
- Foundational primitives (e.g. Identifier)
- Shared types and utilities
- Zero runtime systems or side effects
- This package is designed to be depended on by all other @foxystar/* packages.

## Example
```ts
import { Identifier } from "@foxystar/core";

const id = Identifier.parse("minecraft:stone");

console.log(id.namespace); // "minecraft"
console.log(id.name);      // "stone"
```

## Design Goals
- Minimal and dependency-free
- Stable and predictable
- Reusable across environments