import { Identifier } from "@foxystar/core";

export type ComponentCtor<T = unknown> = {
    new (): T;
    componentId: Identifier;
};

export class ComponentRegistry<T> {
    private readonly registry = new Map<Identifier, T>();

    registerComponent = <C extends T>(ctor: ComponentCtor<C>): void => {
        if (!ctor.componentId) {
            throw new Error(`Component ${ctor.name} is missing a componentId`);
        }

        if (this.registry.has(ctor.componentId)) {
            throw new Error(
                `Component '${ctor.componentId}' is already registered`
            );
        }

        const instance = new ctor();
        this.registry.set(ctor.componentId, instance);
    }

    get(identifier: Identifier): T | undefined {
        return this.registry.get(identifier);
    }

    getAll(): T[] {
        return [ ...this.registry.values() ];
    }

    entries(): IterableIterator<[Identifier, T]> {
        return this.registry.entries();
    }

    registerAll(registerFn: (identifier: Identifier, component: T) => void): void {
        for (const [ identifier, component ] of this.registry) {
            registerFn(identifier, component);
        }
    }
}