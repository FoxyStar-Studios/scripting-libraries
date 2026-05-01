## `@foxystar/minecraft`
Utilities and helpers for working with the [@minecraft/server](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/minecraft-server)

## Installation
```bash
npm install @foxystar/minecraft
```

## Overview
`@foxystar/minecraft` provides utilities for working Minecraft: Bedrock Edition's Scripting API, including helpers for blocks, items, and game systems.

It is designed to simplify common patterns and provide reusable building blocks for gameplay logic, scripting, and tooling.

## Quick Example
```ts
import { createBlockContext } from "@foxystar/minecraft";
import * as Molang from "@foxystar/molang";

const context = createItemStackContext(itemStack);

const result = Molang.evaluate("query.any_tag('minecraft:is_sword')", context);
console.log(result);
```

## Design Goals
- Provide practical utilities for Minecraft: Bedrock Edition's Scripting API
- Keep APIs simple and predictable
- Remain lightweight and modular
- Integrate cleanly with other FoxyStar packages