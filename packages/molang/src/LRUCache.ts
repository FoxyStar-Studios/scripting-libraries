export default class LRUCache<K, V> extends Map<K, V> {
    constructor(private maxSize: number) {
        super();
    }

    override get(key: K): V | undefined {
        const value = super.get(key);
        if (value !== undefined) {
            super.delete(key);
            super.set(key, value);
        }

        return value;
    }

    override set(key: K, value: V): this {
        if (this.has(key)) {
            super.delete(key);
        }

        super.set(key, value);
        if (this.size > this.maxSize) {
            const firstKey = this.keys().next().value;
            super.delete(firstKey!);
        }

        return this;
    }
}