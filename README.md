<div align="center">

  # scripting-libraries
  Reusable libraries and utilities powering FoxyStar projects.
</div>

## Overview
This repository contains a set of modular packages used to build and maintain FoxyStar content and systems.
They are designed to be reusable, type-safe, and independent where possible.

## Packages
### [`@foxystar/core`](./packages/core/)
Core primitives and utilities shared across the FoxyStar ecosystem.

### [`@foxystar/math`](./packages/math/)
A collection of math, geometry, and procedural utilities for simulations, games, and systems.

### [`@foxystar/events`](./packages/events/)
A lightweight decorator-based event system for working with event signals such as those from Minecraft: Bedrock Edition's Scripting API.

## Goals
- Build reusable and modular systems
- Keep packages small and focused
- Maintain strong type safety across the ecosystem
- Separate core logic from environment-specific implementations

## Notes
- Packages are designed to be used independently where possible
- Some packages (like `@foxystar/events`) integrate with external APIs
- Lower-level packages (e.g. `core`, `math`) aim to remain environment-agnostic