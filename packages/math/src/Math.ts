import { Vec2Like, Vec3Like } from "./phys/Vector3.ts";
import { IRandom } from "./random/IRandom.ts";

export class MathUtils {
    /** Clamps a number between a minimum and maximum value */
    public static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /** Linearly interpolates between two values based on a given factor (0 to 1) */
    public static lerp(start: number, end: number, factor: number): number {
        return start + (end - start) * this.clamp(factor, 0, 1);
    }

    /** Converts degrees to radians */
    public static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /** Converts radians to degrees */
    public static toDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    public static fromRotation(rotation: Vec2Like): Vec3Like {
        const rotationH = this.toRadians(rotation.y * -1);
        const z0 = Math.cos(rotationH);
        const x0 = Math.sin(rotationH);

        const rotationV = this.toRadians(rotation.x * -1);
        const h = Math.cos(rotationV);
        const v = Math.sin(rotationV);

        return {
            x: h * x0,
            y: v,
            z: h * z0
        }
    }

    public static rotateOffset(offset: Vec3Like, yawDegrees: number): Vec3Like {
        const yaw = -yawDegrees * Math.PI / 180;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);

        return {
            x: offset.x * cos - offset.z * sin,
            y: offset.y,
            z: offset.x * sin + offset.z * cos
        }
    }

    /** Generates a random integer between min and max (inclusive) */
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Generates a random float between min and max */
    public static randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    // Randomness
    public static nextInt(random: IRandom, min: number, max: number) {
        return min >= max ? min : random.nextInt(max - min + 1) + min;
    }

    public static nextFloat(random: IRandom, min: number, max: number) {
        return min >= max ? min : random.nextFloat() * (max - min) + min;
    }

    public static nextDouble(random: IRandom, min: number, max: number) {
        return min >= max ? min : random.nextDouble() * (max - min) + min;
    }
};