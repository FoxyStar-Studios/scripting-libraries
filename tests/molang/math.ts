import * as Molang from "@foxystar/molang";

const context = Molang.createMolangContext();
const result = Molang.evaluate(`v.moo = 1;
(v.moo > 0) ? {
    v.x = math.sin(q.life_time * 45);
    v.x = v.x * v.x + 17.3;
    t.sin_x = math.sin(v.x);
    v.x = t.sin_x * t.sin_x + v.x * v.x;
    v.x = math.sqrt(v.x) * v.x * math.pi;
}`, context);

console.log(result);