## `@foxystar/build`
A modular collection of esbuild plugins and build utilities for FoxyStar projects.

## Installation
```bash
npm install @foxystar/build esbuild
```
> `esbuild` is required as a peer dependency.

## Usage
```ts
import { PreprocessorPlugin } from "@foxystar/build";
import esbuild from "esbuild";

await esbuild.build({
    entryPoints: [ "src/index.ts" ],
    bundle: true,
    plugins: [
        PreprocessorPlugin()
    ]
});
```

## Current Plugins
### Processor
A safe compile-time preprocessor with support for conditional code stripping.
- `//#if`, `//#elif`, `//#else`, `//#endif`
- Feature flags via esbuild `define`
- Safe expression evaluation (no `eval`)

### Supported Operators
- Logical: `&&`, `||`, `!`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Literals: numbers, `true`, `false`

### Using Feature Flags
Define flags using esbuild:
```ts
define: {
    __DEBUG__: "true",
    __VERSION__: "2"
}
```

### Preprocessor Syntax
Basic condition:
```ts
//#if defined(DEBUG)
console.log("Debug")
//#else
console.log("Production")
//#endif
```

Multiple conditions:
```ts
//#if VERSION == 1
console.log("v1")
//#elif VERSION == 2
console.log("v2")
//#endif
```