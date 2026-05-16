import { IRandom } from "./IRandom.ts";

export class MathRandom extends IRandom {

    public nextInt(bound?: number): number {
        if (bound !== undefined) {
            if (!Number.isInteger(bound) || bound <= 0) {
                throw new RangeError(
                    `Bound must be a positive integer, got ${bound}`
                );
            }

            return Math.floor(Math.random() * bound);
        }

        // 32-bit signed integer
        return (Math.random() * 0x100000000) | 0;
    }

    public nextLong(): bigint {
        const high = BigInt(this.nextInt());
        const low = BigInt(this.nextInt() >>> 0);

        return (high << 32n) | low;
    }

    public nextFloat(): number {
        return Math.random();
    }

    public nextDouble(): number {
        return Math.random();
    }

    public nextBoolean(): boolean {
        return Math.random() < 0.5;
    }

    public nextGaussian(): number {
        // Box-Muller transform
        let u = 0;
        let v = 0;

        while (u === 0) {
            u = Math.random();
        }

        while (v === 0) {
            v = Math.random();
        }

        return Math.sqrt(-2 * Math.log(u))
            * Math.cos(2 * Math.PI * v);
    }

    public fork(): IRandom {
        // Math.random is global/non-seeded,
        // so forking just creates another wrapper.
        return new MathRandom();
    }
}