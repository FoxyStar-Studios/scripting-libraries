import {
    AABB,
    Vector3,
    XoroshiroRandom,

    WeightedTable
} from "@foxystar/math";

const position = Vector3.add(Vector3.ONE, Vector3.ZERO);
console.log(position);

const rng = new XoroshiroRandom(0n, 1n);
const result = rng.forBlockPos(position);

console.log(result, result.nextInt());

const aabb = AABB.fromPoints([ Vector3.ZERO, Vector3.ONE ]);
console.log(aabb.getCorners());

const table = new WeightedTable<string>()
    .add("a", 1)
    .add("b", 1)
    .add("c", 1);

console.log("Value:", table.roll());