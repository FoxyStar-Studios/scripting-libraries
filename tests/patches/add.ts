import { createPatch } from "@foxystar/patches";

class SomeClass {
    value: number = 5;
}

// Tell TypeScript about the members the patch adds.
interface SomeClass {
    label: string;
    double(): number;
}

const Some = createPatch(SomeClass);

// Lets `this` be typed as the patched class inside the patch.
interface _PatchAdd extends SomeClass {}

@Some.Patch
class _PatchAdd {
    static readonly LABEL = Symbol("label");

    @Some.Add()
    get label(): string {
        return (this as any)[_PatchAdd.LABEL] ?? "unnamed";
    }

    @Some.Add()
    set label(value: string) {
        (this as any)[_PatchAdd.LABEL] = value;
    }

    @Some.Add()
    double(): number {
        return this.value * 2;
    }
}

// Added members can be overridden like native ones.
@Some.Patch
class _PatchOverride {

    @Some.Override("double")
    double(original: () => number) {
        console.log("double override");
        return original();
    }
}

const instance = new SomeClass();

console.log("label:", instance.label);
instance.label = "test";
console.log("label:", instance.label);
console.log("double:", instance.double());
