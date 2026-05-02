import { Identifier } from "@foxystar/core";

export type ComponentCtor<T = unknown> = {
    new (): T;
    componentId: Identifier;
};

export class ComponentRegistry<T> {
    private readonly REGISTRY = new Map<Identifier, T>();

    registerComponent<C extends T>(ctor: ComponentCtor<C>): void {
        if (!ctor.componentId) {
            throw new Error(`Component ${ctor.name} is missing a componentId`);
        }

        if (this.REGISTRY.has(ctor.componentId)) {
            throw new Error(
                `Component '${ctor.componentId}' is already registered`
            );
        }

        const instance = new ctor();
        this.REGISTRY.set(ctor.componentId, instance);
    }

    get(identifier: Identifier): T | undefined {
        return this.REGISTRY.get(identifier);
    }

    getAll(): T[] {
        return [ ...this.REGISTRY.values() ];
    }

    entries(): IterableIterator<[Identifier, T]> {
        return this.REGISTRY.entries();
    }

    registerAll(registerFn: (identifier: Identifier, component: T) => void): void {
        for (const [ identifier, component ] of this.REGISTRY) {
            registerFn(identifier, component);
        }
    }
}