import type { ItemStack } from "@minecraft/server";
import { MolangContext, createMolangContext } from "@foxystar/molang";

export function createItemStackContext(itemStack: ItemStack): MolangContext {
    return createMolangContext({
        variable: {
            identifier: itemStack.typeId,
        },
        temp: {},

        context: {},
        query: {
            any_tag(...tags: string[]) {
                return tags.some((tag) => itemStack.hasTag(tag));
            },
            all_tags(...tags: string[]) {
                return tags.every((tag) => itemStack.hasTag(tag));
            },
        },
    });
}