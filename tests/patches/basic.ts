import { Patch, Override } from "@foxystar/patches";

class SomeClass {
    method(x: number): number {
        console.log("Value:", x);
        return x;
    }
}

@Patch(SomeClass)
class _Patch {

    @Override("method")
    method(original: (x: number) => number, x: number) {
        console.log("Patch A");

        return original(x);
    }
}

const instance = new SomeClass();
instance.method(1);