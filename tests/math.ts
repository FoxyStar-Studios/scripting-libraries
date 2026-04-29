import {
    AABB,
    Vector3,
    XoroshiroRandom
} from "@foxystar/math";

const position = Vector3.add(Vector3.ONE, Vector3.ZERO);
console.log(position);

const rng = new XoroshiroRandom(0n, 1n);
const result = rng.forBlockPos(position);

console.log(result, result.nextInt());

const aabb = AABB.fromPoints([ Vector3.ZERO, Vector3.ONE ]);
console.log(aabb.getCorners());