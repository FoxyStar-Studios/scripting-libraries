import { XoroshiroRandom } from "@foxystar/math";
const rng = new XoroshiroRandom();

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function randomRange(low: number, high: number): number {
    return low + rng.nextDouble() * (high - low);
}

function randomIntRange(low: number, high: number): number {
    if (high < low) {
        return low;
    }

    return low + rng.nextInt(high - low + 1);
}

export const MolangMath = {
    pi: Math.PI,

    abs: Math.abs,
    ceil: Math.ceil,
    exp: Math.exp,
    ln: Math.log,
    floor: Math.floor,
    pow: Math.pow,
    round: Math.round,
    sign: Math.sign,
    sqrt: Math.sqrt,
    trunc: Math.trunc,
    clamp: (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max);
    },
    max: Math.max,
    min: Math.min,

    cos: (v: number) => {
        return Math.cos(v * DEG_TO_RAD);
    },
    acos: (v: number) => {
        return Math.acos(v) * RAD_TO_DEG;
    },
    sin: (v: number) => {
        return Math.sin(v * DEG_TO_RAD);
    },
    asin: (v: number) => {
        return Math.asin(v) * RAD_TO_DEG;
    },
    atan: (v: number) => {
        return Math.atan(v) * RAD_TO_DEG;
    },
    atan2: (y: number, x: number) => {
        return Math.atan2(y, x) * RAD_TO_DEG;
    },

    copy_sign: (x: number, y: number) => {
        return Math.abs(x) * Math.sign(y);
    },

    random: (low: number, high: number) => {
        return randomRange(low, high);
    },
    random_integer: (low: number, high: number) => {
        return randomIntRange(low, high);
    },
    die_roll: (num: number, low: number, high: number) => {
        let sum = 0;
        for (let i = 0; i < num; i++) {
            sum += randomRange(low, high);
        }

        return sum;
    },
    die_roll_integer: (num: number, low: number, high: number) => {
        let sum = 0;
        for (let i = 0; i < num; i++) {
            sum += randomIntRange(low, high);
        }

        return sum;
    },

    hermite_blend: (t: number) => {
        return 3 * t * t - 2 * t * t * t;
    },
    lerp: (start: number, end: number, t: number) => {
        return start + (end - start) * t;
    },
    lerprotate: (start: number, end: number, t: number) => {
        const diff = ((end - start + 540) % 360) - 180;
        return start + diff * t;
    },
    min_angle: (value: number) => {
        const angle = ((value + 180) % 360 + 360) % 360 - 180;
        return angle;
    },
    mod: (value: number, denom: number) => {
        return ((value % denom) + denom) % denom;
    },
};