export type Vec3Like = {
    x: number;
    y: number;
    z: number;
}

export type Vec2Like = {
    x: number;
    y: number;
}

export class Vector3 implements Vec3Like {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;

    constructor(a: Vec3Like | number, y?: number, z?: number) {
        if (typeof a === "object") {
            this.x = a.x;
            this.y = a.y;
            this.z = a.z;
        }
        else {
            this.x = a;
            this.y = y ?? 0;
            this.z = z ?? 0;
        }
    }

    assign(vec: Vec3Like): this {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;

        return this;
    }

    dot(vector?: Vec3Like): number {
        return Vector3.dot(this, vector);
    }

    magnitude(): number {
        return Vector3.magnitude(this);
    }

    distance(vector: Vec3Like) {
        return Vector3.distance(this, vector);
    }

    manhattanDistance() {
        return Vector3.manhattanDistance(this);
    }

    distanceSquared(vector: Vec3Like) {
        return Vector3.distanceSquared(this, vector);
    }

    add(vector: Vec3Like | number): this {
        return this.assign(Vector3.add(this, vector));
    }

    subtract(vector: Vec3Like | number): this {
        return this.assign(Vector3.subtract(this, vector));
    }

    multiply(vector: Vec3Like | number): this {
        return this.assign(Vector3.multiply(this, vector));
    }

    divide(vector: Vec3Like | number): this {
        return this.assign(Vector3.divide(this, vector));
    }

    equals(vector: Vec3Like): boolean {
        return Vector3.equals(this, vector);
    }

    center(): this {
        return this.assign(Vector3.center(this));
    }

    abs(): this {
        return this.assign(Vector3.abs(this));
    }

    floor(): this {
        return this.assign(Vector3.floor(this));
    }

    ceil(): this {
        return this.assign(Vector3.ceil(this));
    }

    serialize(): bigint {
        return Vector3.serialize(this);
    }

    randomSeed(): bigint {
        const bx = BigInt(this.x);
        const by = BigInt(this.y);
        const bz = BigInt(this.z);

        const lx = 3129871n * bx;
        const lz = 116129781n * bz;
        const value = by ^ lx ^ lz;

        return value * (42317861n * value + 11n);
    }

    // Static methods
    static dot(a: Vec3Like, b?: Vec3Like): number {
        if (b === void 0) {
            b = a;
        }

        return (a.x * b.x + a.y * b.y + a.z * b.z);
    }

    static magnitude(vector: Vec3Like): number {
        return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
    }

    static distance(a: Vec3Like, b: Vec3Like): number {
        return this.magnitude(
            this.subtract(a, b)
        );
    }

    static manhattanDistance(vector: Vec3Like): number {
        const abs = Vector3.abs(vector);

        return (abs.x + abs.y + abs.z);
    }

    static add(a: Vec3Like, b: Vec3Like | number): Vec3Like {
        return {
            x: a.x + (typeof b === "number" ? b : b.x),
            y: a.y + (typeof b === "number" ? b : b.y),
            z: a.z + (typeof b === "number" ? b : b.z)  
        }
    }

    static subtract(a: Vec3Like, b: Vec3Like | number): Vec3Like {
        return {
            x: a.x - (typeof b === "number" ? b : b.x),
            y: a.y - (typeof b === "number" ? b : b.y),
            z: a.z - (typeof b === "number" ? b : b.z)  
        }
    }

    static multiply(a: Vec3Like, b: Vec3Like | number): Vec3Like {
        return {
            x: a.x * (typeof b === "number" ? b : b.x),
            y: a.y * (typeof b === "number" ? b : b.y),
            z: a.z * (typeof b === "number" ? b : b.z)  
        }
    }

    static divide(a: Vec3Like, b: Vec3Like | number): Vec3Like {
        return {
            x: a.x / (typeof b === "number" ? b : b.x),
            y: a.y / (typeof b === "number" ? b : b.y),
            z: a.z / (typeof b === "number" ? b : b.z)  
        }
    }

    static equals(a: Vec3Like, b: Vec3Like): boolean {
        return a.x === b.x && a.y === b.y && a.z === b.z;
    }

    static center(vector: Vec3Like): Vec3Like {
        return {
            x: Math.floor(vector.x) + 0.5,
            y: Math.floor(vector.y) + 0.5,
            z: Math.floor(vector.z) + 0.5,
        }
    }


    static min(a: Vec3Like, b: Vec3Like | number): Vec3Like {
        return {
            x: Math.min(a.x, (typeof b === "number" ? b : b.x)),
            y: Math.min(a.y, (typeof b === "number" ? b : b.y)),
            z: Math.min(a.z, (typeof b === "number" ? b : b.z))
        }
    }

    static max(a: Vec3Like, b: Vec3Like | number): Vec3Like {
        return {
            x: Math.max(a.x, (typeof b === "number" ? b : b.x)),
            y: Math.max(a.y, (typeof b === "number" ? b : b.y)),
            z: Math.max(a.z, (typeof b === "number" ? b : b.z))
        }
    }

    static abs(vector: Vec3Like): Vec3Like {
        return {
            x: Math.abs(vector.x),
            y: Math.abs(vector.y),
            z: Math.abs(vector.z)  
        }
    }

    static floor(vector: Vec3Like): Vec3Like {
        return {
            x: Math.floor(vector.x),
            y: Math.floor(vector.y),
            z: Math.floor(vector.z)
        }
    }

    static ceil(vector: Vec3Like): Vec3Like {
        return {
            x: Math.ceil(vector.x),
            y: Math.ceil(vector.y),
            z: Math.ceil(vector.z)
        }
    }


    static distanceSquared(a: Vec3Like, b: Vec3Like): number {
        const vector = this.subtract(a, b);
        return vector.x ** 2 + vector.y ** 2 + vector.z ** 2;
    }

    static toVector2(direction: Vec3Like): Vec2Like {
        const yaw = Math.atan2(-direction.x, -direction.z) * (180 / Math.PI);

        // Pitch: ângulo vertical
        const pitch = Math.atan2(direction.y, Math.sqrt(direction.x ** 2 + direction.z ** 2)) * (180 / Math.PI);
        return { x: pitch, y: yaw };
    }

    static UP: Vec3Like = { x: 0, y: 1, z: 0 };
    static DOWN: Vec3Like = { x: 0, y: -1, z: 0 };
    static LEFT: Vec3Like = { x: -1, y: 0, z: 0 };
    static RIGHT: Vec3Like = { x: 1, y: 0, z: 0 };
    static FORWARD: Vec3Like = { x: 0, y: 0, z: 1 };
    static BACK: Vec3Like = { x: 0, y: 0, z: -1 };
    static ONE: Vec3Like = { x: 1, y: 1, z: 1 };
    static ZERO: Vec3Like = { x: 0, y: 0, z: 0 };
    static NEGATIVE_ONE: Vec3Like = { x:-1, y: -1, z: -1 };
    static WEST: Vec3Like = { x: -1, y: 0, z: 0 };
    static EAST: Vec3Like = { x: 1, y: 0, z: 0 };
    static NORTH: Vec3Like = { x: 0, y: 0, z: -1 };
    static SOUTH: Vec3Like = { x: 0, y: 0, z: 1 };
    static HALF: Vec3Like = { x: 0.5, y: 0.5, z: 0.5 };


    // Configuration: Total must be <= 53
    private static BITS_X = 18;
    private static BITS_Y = 16;
    private static BITS_Z = 18;

    // Pre-calculated multipliers (Like bit shifts: 2^n)
    private static MASK_X = (1 << 18) - 1; // 0x3FFFF
    private static MASK_Y = (1 << 16) - 1; // 0xFFFF
    private static MASK_Z = (1 << 18) - 1; // 0x3FFFF

    static serialize(v: Vec3Like = Vector3.ZERO): bigint {
        // Force inputs to unsigned integers based on bit depth
        const x = BigInt(v.x & this.MASK_X);
        const y = BigInt(v.y & this.MASK_Y);
        const z = BigInt(v.z & this.MASK_Z);

        // Combine using multiplication (Arithmetic packing)
        return (x << 34n) | (y << 18n) | z;
    }

    static deserialize(n: bigint): Vec3Like {
        const xRaw = Number((n >> 34n) & BigInt(this.MASK_X));
        const yRaw = Number((n >> 18n) & BigInt(this.MASK_Y));
        const zRaw = Number(n & BigInt(this.MASK_Z));

        return {
            x: this.signExtend(xRaw, this.BITS_X),
            y: this.signExtend(yRaw, this.BITS_Y),
            z: this.signExtend(zRaw, this.BITS_Z),
        }
    }

    // Helper to restore negative numbers from unsigned bits
    private static signExtend(val: number, bits: number): number {
        const max = 1 << (bits - 1);
        return (val & (max - 1)) - (val & max);
    }
}