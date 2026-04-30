import { Patch, Override } from "@foxystar/patches";

class SomeClass {
    private currentValue: number = 5;

    get health(): number {
        return this.currentValue;
    }

    set health(value: number) {
        this.currentValue = value;
    }
}

@Patch(SomeClass)
class _PatchHealth {

    @Override.get("health")
    getHealth(original: () => number) {
        const result = original();
        console.log("getHealth:", result);
        return result;
    }

    @Override.set("health")
    setHealth(value: number, original: (value: number) => void) {
        console.log("setHealth:", value)
        original(value);
    }
}

const instance = new SomeClass();

instance.health;
instance.health = 10;
instance.health;