import { BlockCustomComponent, ItemCustomComponent } from "@minecraft/server";

import { ComponentRegistry } from "./ComponentRegistry.ts";

export const BlockComponentRegistry = new ComponentRegistry<BlockCustomComponent>();
export const ItemComponentRegistry = new ComponentRegistry<ItemCustomComponent>();