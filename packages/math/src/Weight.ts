import { IRandom } from "./random/IRandom.ts";
import { MathRandom } from "./random/MathRandom.ts";

export interface WeightedEntry<T> {
    value: T;
    weight: number;
}

export class WeightedTable<T> {
    protected readonly entries: WeightedEntry<T>[] = [];
    protected totalWeight = 0;

    constructor(
        private readonly random: IRandom = new MathRandom()
    ) {}

    static create<T>(
        random: IRandom = new MathRandom()
    ): WeightedTable<T> {
        return new WeightedTable<T>(random);
    }

    get size(): number {
        return this.entries.length;
    }

    isEmpty(): boolean {
        return this.entries.length === 0;
    }

    add(value: T, weight: number): this {
        if (!Number.isFinite(weight) || weight <= 0) {
            throw new Error(
                `Invalid weight '${weight}'`
            );
        }

        this.totalWeight += weight;
        this.entries.push({ value, weight });

        return this;
    }

    clear(): void {
        this.entries.length = 0;
        this.totalWeight = 0;
    }

    removeWhere(
        predicate: (entry: WeightedEntry<T>) => boolean
    ): number {
        let removed = 0;

        for (let i = this.entries.length - 1; i >= 0; i--) {
            const entry = this.entries[i];

            if (predicate(entry)) {
                this.entries.splice(i, 1);
                this.totalWeight -= entry.weight;

                removed++;
            }
        }

        return removed;
    }

    remove(value: T): boolean {
        const index = this.entries.findIndex(
            entry => entry.value === value
        );

        if (index === -1) {
            return false;
        }

        const [entry] = this.entries.splice(index, 1);
        this.totalWeight -= entry.weight;

        return true;
    }

    roll(): T {
        return this.rollEntry().value;
    }

    rollEntry(): WeightedEntry<T> {
        if (this.entries.length === 0) {
            throw new Error(
                "Cannot roll from an empty WeightedTable"
            );
        }

        let value = this.random.nextFloat() * this.totalWeight;

        for (const entry of this.entries) {
            value -= entry.weight;

            if (value <= 0) {
                return entry;
            }
        }

        return this.entries[this.entries.length - 1];
    }

    rollMany(count: number): T[] {
        const items = new Array<T>(count);

        for (let i = 0; i < count; i++) {
            items[i] = this.roll();
        }

        return items;
    }

    getEntries(): readonly WeightedEntry<T>[] {
        return [ ...this.entries ];
    }
}