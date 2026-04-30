const METADATA = new WeakMap<object, Map<symbol, unknown>>();

export function getMetadata<T>(key: symbol, target: object): T | undefined {
    return METADATA.get(target)?.get(key) as T | undefined;
}

export function defineMetadata<T>(key: symbol, value: T, target: object): void {
    let store = METADATA.get(target);
    if (!store) {
        METADATA.set(target, (store = new Map()));
    }

    store.set(key, value);
}

export function deleteMetadata(key: symbol, target: object): void {
    METADATA.get(target)?.delete(key);
}