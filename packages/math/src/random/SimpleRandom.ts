import { Vec3Like, Vector3 } from "../phys/Vector3.ts";

import { IRandom } from "./IRandom.ts";

const MULTIPLIER = 0x5DEECE66Dn;
const ADDEND     = 0xBn;
const MASK       = (1n << 48n) - 1n;

export class SimpleRandom extends IRandom {
    private seed: bigint;
    private haveNextGaussian = false;
    private nextGaussianValue = 0;

    constructor(seed: bigint = 0n) {
        super();
        this.seed = SimpleRandom.initialScramble(seed);
    }

    static initialScramble(seed: bigint): bigint {
        return (seed ^ MULTIPLIER) & MASK;
    }

    setSeed(seed: bigint): void {
        this.seed = SimpleRandom.initialScramble(seed);
        this.haveNextGaussian = false;
    }

    private next(bits: number): bigint {
        this.seed = (this.seed * MULTIPLIER + ADDEND) & MASK;
        return this.seed >> BigInt(48 - bits);
    }

    nextInt(bound?: number): number {
        if (typeof bound !== "number") {
            return Number(this.next(32)) | 0; // force signed 32-bit
        }

        if (bound <= 0) {
            return 0;
        }

        // Power of two optimization
        if ((bound & -bound) === bound) {
            return Number(
                (BigInt(bound) * this.next(31)) >> 31n
            );
        }

        let bits: number, value: number;
        do {
            bits = Number(this.next(31));
            value = bits % bound;
        } while (bits - value + (bound - 1) < 0);

        return value;
    }

    nextLong(): bigint {
        const high = this.next(32);
        const low  = this.next(32);
        return (high << 32n) | low;
    }

    nextFloat(): number {
        return Number(this.next(24)) / (1 << 24);
    }

    nextDouble(): number {
        const a = this.next(26);
        const b = this.next(27);
        return Number((a << 27n) + b) / Number(1n << 53n);
    }

    nextBoolean(): boolean {
        return (this.next(32) & 1n) === 1n;
    }

    nextGaussian(): number {
        if (this.haveNextGaussian) {
            this.haveNextGaussian = false;
            return this.nextGaussianValue;
        }

        let u = 0, v = 0, s = 0;
        do {
            u = 2 * this.nextDouble() - 1;
            v = 2 * this.nextDouble() - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);

        const multiplier = Math.sqrt(-2 * Math.log(s) / s);
        this.nextGaussianValue = v * multiplier;
        this.haveNextGaussian = true;
        return u * multiplier;
    }

    fork(): SimpleRandom {
        const seed1 = (MULTIPLIER * this.seed + ADDEND) & MASK;
        const seed2 = (MULTIPLIER * seed1 + ADDEND) & MASK;
        this.seed = seed2;

        const nextLong = (this.next(32) << 32n) | this.next(32);

        const newSeed = (nextLong ^ MULTIPLIER) & MASK;
        return new SimpleRandom(newSeed);
    }

    forBlockPos(block: Vec3Like): SimpleRandom {
        const blockSeed = new Vector3(block).randomSeed();

        const value = this.seed ^ (blockSeed >> 16n);
        const newSeed = (value ^ MULTIPLIER) & MASK;
        return new SimpleRandom(newSeed);
    }
}