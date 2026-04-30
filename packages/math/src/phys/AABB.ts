import { Vec3Like, Vector3 } from "./Vector3.ts";

export const Direction = {
    Down:  "Down",
    East:  "East",
    North: "North",
    South: "South",
    Up:    "Up",
    West:  "West",
} as const;
export type Direction = typeof Direction[keyof typeof Direction];

interface AABBLike {
    center: Vec3Like;
    extent: Vec3Like
};

export class AABB {
    constructor(public min: Vec3Like, public max: Vec3Like) {
        this.min = Vector3.min(min, max);
        this.max = Vector3.max(min, max);
    }

    get center(): Vec3Like {
        const result = Vector3.add(this.min, this.max);

        return Vector3.divide(result, 2);
    }

    static fromOriginSize(origin: Vec3Like, size: Vec3Like) {
        return new AABB(
            origin,
            Vector3.add(origin, size)
        );
    }

    clone() {
        return new AABB(
            { ...this.min },
            { ...this.max }
        );
    }

    offset(offset: Vec3Like) {
        return new AABB(
            Vector3.add(this.min, offset),
            Vector3.add(this.max, offset)
        );
    }

    expand(amount: number): AABB {
        return new AABB(
            Vector3.subtract(this.min, amount),
            Vector3.add(this.max, amount)
        );
    }

    inflate(vector: Vec3Like): AABB {
        return new AABB(
            Vector3.subtract(this.min, vector),
            Vector3.add(this.max, vector)
        );
    }

    intersects(other: AABB, offset: Vec3Like = Vector3.ZERO) {
        const minX = this.min.x + offset.x;
        const minY = this.min.y + offset.y;
        const minZ = this.min.z + offset.z;

        const maxX = this.max.x + offset.x;
        const maxY = this.max.y + offset.y;
        const maxZ = this.max.z + offset.z;

        return (
            maxX > other.min.x &&
            minX < other.max.x &&

            maxY > other.min.y &&
            minY < other.max.y &&

            maxZ > other.min.z &&
            minZ < other.max.z
        );
    }

    intersectsRay(origin: Vec3Like, direction: Vec3Like): boolean {
        const invDirection = {
            x: 1 / direction.x,
            y: 1 / direction.y,
            z: 1 / direction.z,
        };

        let t1 = (this.min.x - origin.x) * invDirection.x;
        let t2 = (this.max.x - origin.x) * invDirection.x;

        let tmin = Math.min(t1, t2);
        let tmax = Math.max(t1, t2);

        t1 = (this.min.y - origin.y) * invDirection.y;
        t2 = (this.max.y - origin.y) * invDirection.y;

        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));

        t1 = (this.min.z - origin.z) * invDirection.z;
        t2 = (this.max.z - origin.z) * invDirection.z;

        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));

        return tmax >= Math.max(tmin, 0);
    }

    containsPoint(point: Vec3Like) {
        return (
            point.x >= this.min.x && point.x <= this.max.x &&
            point.y >= this.min.y && point.y <= this.max.y &&
            point.z >= this.min.z && point.z <= this.max.z
        );
    }

    static fromPixels(origin: Vec3Like, size: Vec3Like) {
        const PX = 1 / 16;

        return AABB.fromOriginSize(
            Vector3.multiply(origin, PX),
            Vector3.multiply(size, PX)
        );
    }

    rotate(direction: Direction, pivot: Vec3Like) {
        const corners = this.getCorners();

        const rotated = corners.map(p => {
            const vector = Vector3.subtract(p, pivot);

            switch (direction) {
                case Direction.North:
                    break;
                case Direction.South:
                    vector.x = -vector.x; vector.z = -vector.z;
                    break;
                case Direction.West:
                    [vector.x, vector.z] = [-vector.z, vector.x];
                    break;
                case Direction.East:
                    [vector.x, vector.z] = [vector.z, -vector.x];
                    break;
                case Direction.Up:
                    [vector.y, vector.z] = [-vector.z, vector.y];
                    break;
                case Direction.Down:
                    [vector.y, vector.z] = [vector.z, -vector.y];
                    break;
            }

            return Vector3.add(vector, pivot);
        });

        return AABB.fromPoints(rotated);
    }

    getCorners(): Vec3Like[] {
        const { min, max } = this;
        return [
            { x: min.x, y: min.y, z: min.z },

            { x: min.x, y: min.y, z: max.z },
            { x: min.x, y: max.y, z: min.z },
            { x: min.x, y: max.y, z: max.z },
            { x: max.x, y: min.y, z: min.z },
            { x: max.x, y: min.y, z: max.z },
            { x: max.x, y: max.y, z: min.z },

            { x: max.x, y: max.y, z: max.z },
        ];
    }

    getIntersectingBlocks(): Vec3Like[] {
        const locations: Vec3Like[] = [];
        const min = Vector3.floor(this.min);
        const max = Vector3.ceil(this.max);

        for (let x = min.x; x < max.x; x++) {
            for (let y = min.y; y < max.y; y++) {
                for (let z = min.z; z < max.z; z++) {
                    locations.push({ x, y, z });
                }
            }
        }

        return locations;
    }

    transform(
        rotation: Vec3Like | undefined,
        rotationPivot: Vec3Like | undefined,
        scale: Vec3Like | undefined,
        scalePivot: Vec3Like | undefined,
        translation: Vec3Like | undefined
    ): AABB {
        let corners = this.getCorners();

        // Scale
        if (scale) {
            const pivot = scalePivot ?? { x: 0, y: 0, z: 0 };

            corners = corners.map(p => {
                const dx = p.x - pivot.x;
                const dy = p.y - pivot.y;
                const dz = p.z - pivot.z;

                return {
                    x: pivot.x + dx * scale.x,
                    y: pivot.y + dy * scale.y,
                    z: pivot.z + dz * scale.z
                };
            });
        }

        // Rotate (90° increments only)
        if (rotation) {
            const pivot = rotationPivot ?? { x: 0, y: 0, z: 0 };

            corners = corners.map(p => {
                let x = p.x - pivot.x;
                const y = p.y - pivot.y;
                let z = p.z - pivot.z;

                const ry = (rotation.y ?? 0) % 360;

                if (ry === 90)       [ x, z ] = [ z, -x ];
                else if (ry === 180) { x = -x; z = -z; }
                else if (ry === 270) [ x, z ] = [ -z, x ];

                return {
                    x: x + pivot.x,
                    y: y + pivot.y,
                    z: z + pivot.z
                };
            });
        }

        // Translate
        if (translation) {
            corners = corners.map(p => ({
                x: p.x + translation.x,
                y: p.y + translation.y,
                z: p.z + translation.z
            }));
        }

        return AABB.fromPoints(corners);
    }

    static fromPoints(points: Vec3Like[]) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.z < minZ) minZ = p.z;

            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
            if (p.z > maxZ) maxZ = p.z;
        }

        return new AABB(
            { x: minX, y: minY, z: minZ },
            { x: maxX, y: maxY, z: maxZ }
        );
    }

    static from(aabb: AABBLike) {
        const min = Vector3.subtract(aabb.center, aabb.extent);
        const max = Vector3.add(aabb.center, aabb.extent);

        return new AABB(min, max);
    }
}