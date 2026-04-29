import * as dnt from "dnt";
import * as path from "@std/path";
import * as fs from "@std/fs";

async function build(pkgName: string) {
    const root = "./packages/".concat(pkgName);
    const outDir = "./build/".concat(pkgName);

    if (!fs.existsSync(root)) {
        throw new Error("Missing package name (e.g. core, math, patches)");
    }

    // dynamically load package.json
    const pkg = await import(
        new URL(`../packages/${pkgName}/package.build.json`, import.meta.url).href, {
            with: { type: "json" },
        }
    ).then((m) => m.default);

    await dnt.emptyDir(outDir);
    await dnt.build({
        package: {
            ...pkg,
            publishConfig: {
                access: "public"
            }
        },
        entryPoints: [
            path.join(root, "src/index.ts")
        ],
        outDir,

        shims: {
            deno: true,
        },
        test: false,
    });

    // copy README
    const readmeSrc = path.join(root, "README.md");
    const readmeDest = path.join(outDir, "README.md");

    if (await fs.exists(readmeSrc)) {
        await fs.copy(readmeSrc, readmeDest, { overwrite: true });
    }
}

const pkgName = Deno.args[0];

if (!pkgName) {
    for await (const entry of Deno.readDir("./packages")) {
        if (!entry.isDirectory) {
            continue;
        }

        build(entry.name);
    }
} else {
    build(pkgName);
}
