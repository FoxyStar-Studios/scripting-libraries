import { createPatch } from "@foxystar/patches";

class SomeClass {
    method(x: number): number {
        console.log("Value:", x);
        return x;
    }
}

const Some = createPatch(SomeClass);

@Some.Patch
class _PatchA {

    @Some.Override("method", { priority: 1 })
    method(original: (x: number) => number, x: number) {
        console.log("A before");
        const result = original(x);
        console.log("A after");
        return result;
    }
}

@Some.Patch
class _PatchB {

    @Some.Override("method", { priority: 2 })
    method(original: (x: number) => number, x: number) {
        console.log("B before");
        const result = original(x);
        console.log("B after");
        return result;
    }
}

const instance = new SomeClass();
instance.method(1);