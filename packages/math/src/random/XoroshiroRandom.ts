import { Vec3Like } from "../phys/Vector3.ts";
import { IRandom } from "./IRandom.ts";

const MASK_64 = (1n << 64n) - 1n;
function rotl(x: bigint, k: number) {
    return ((x << BigInt(k)) | (x >> (64n - BigInt(k)))) & MASK_64;
}

export class XoroshiroRandom extends IRandom {
    private low: bigint = 0n;
    private high: bigint = 0n;
    private haveNextGaussian = false;
    private nextGaussianValue = 0;

    constructor(seedLow = 0n, seedHigh = 0n) {
        super();
        this.setSeed(seedLow, seedHigh);
        this.haveNextGaussian = false;
        this.nextGaussianValue = 0;
    }

    setSeed(low: bigint, high = 0n) {
        if ((low | high) === 0n) {
            low  = 0x9E3779B97F4A7C15n;
            high = 0x6A09E667F3BCC909n;
        }

        this.low = low & MASK_64;
        this.high = high & MASK_64;
        this.haveNextGaussian = false;
    }

    private next() {
        const result =
            (rotl(this.low + this.high, 17) + this.low) & MASK_64;

        let h = this.high ^ this.low;
        const l = rotl(this.low, 49) ^ h ^ (h << 21n);
        h = rotl(h, 28);

        this.low = l & MASK_64;
        this.high = h & MASK_64;

        return result;
    }

    nextInt(bound?: number) {
        if (typeof bound !== "number") {
            return Number((this.next() >> 33n) & 0xFFFFFFFFn) | 0;
        }

        if (bound <= 0) {
            return 0;
        }

        const b = BigInt(bound);
        const threshold = (-b & MASK_64) % b;

        for (;;) {
            const r = Number(this.next() >> 32n);
            if (BigInt(r) < threshold) {
                continue;
            }

            return r % bound;
        }
    }

    nextLong() {
        return BigInt.asIntN(64, this.next());
    }

    nextFloat() {
        return Number(this.next() >> 40n) / (1 << 24);
    }

    nextDouble() {
        return Number(this.next() >> 11n) * (1.0 / (1 << 53));
    }

    nextBoolean() {
        return (this.next() & 1n) !== 0n;
    }

    nextGaussian() {
        if (this.haveNextGaussian) {
            this.haveNextGaussian = false;
            return this.nextGaussianValue;
        }

        let u, v, s;
        do {
            u = 2 * this.nextDouble() - 1;
            v = 2 * this.nextDouble() - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);

        const mul = Math.sqrt(-2 * Math.log(s) / s);
        this.nextGaussianValue = v * mul;
        this.haveNextGaussian = true;
        return u * mul;
    }

    fork() {
        let forkLow = this.next();
        let forkHigh = (this.low + this.high) & MASK_64;

        if ((forkLow | forkHigh) === 0n) {
            forkLow  = 0x9E3779B97F4A7C15n;
            forkHigh = 0x6A09E667F3BCC909n;
        }

        return new XoroshiroRandom(forkLow, forkHigh);
    }

    forBlockPos(block: Vec3Like) {
        const v2 =
            116129781n * BigInt(block.z) ^
            ((0x2FC20F00000001n * BigInt(block.x)) >> 32n);

        const positional =
            (v2 * (42317861n * v2 + 11n)) >> 16n;

        const seedLow = this.low ^ positional;
        return new XoroshiroRandom(seedLow, this.high);
    }
}