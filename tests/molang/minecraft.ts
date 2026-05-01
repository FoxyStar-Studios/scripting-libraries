import { ItemStack } from "@minecraft/server";

import * as Molang from "@foxystar/molang";
import { createItemStackContext } from "@foxystar/minecraft";

const itemStack = new ItemStack("minecraft:iron_sword");
const context = createItemStackContext(itemStack);

const result = Molang.evaluate("query.any_tag('minecraft:is_sword')", context);
console.log(result);