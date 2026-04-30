## `@foxystar/math`
A collection of math, geometry, and procedural utilities for simulations, games, and systems.

## Installation
```bash
npm install @foxystar/math
```

## Overview
`@foxystar/math` provides:
- Vector and geometry utilities
- Random number generators
- Noise functions (e.g. Perlin noise)
- General math helpers

## Features
- Deterministic random generators
- Lightweight 3D math primitives
- Procedural generation utilities

## Examples
### Vector math
```ts
import { Vector3 } from "@foxystar/math";

const a = new Vector3(1, 2, 3);
const b = new Vector3(4, 5, 6);

const result = a.add(b);
```

### Axis-Aligned Bounding Box
```ts
import { AABB, Vector3 } from "@foxystar/math";

const box = new AABB(
    new Vector3(0, 0, 0),
    new Vector3(1, 1, 1)
);

console.log(
    box.containsPoint(new Vector3(0.5, 0.5, 0.5)) // true
);
```