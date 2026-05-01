import {
    EquipmentSlot,
    EntityEquippableComponent,
} from "@minecraft/server";
import type {
    Player,
    Block,
    BlockPermutation,
} from "@minecraft/server";

import { Vector3, Vec3Like } from "@foxystar/math";
import { MolangContext, createMolangContext } from "@foxystar/molang";

import { createItemStackContext } from "./itemStackContext.ts";

const CARDINAL_OFFSETS = {
    south: Vector3.SOUTH,
    north: Vector3.NORTH,
    east:  Vector3.EAST,
    west:  Vector3.WEST
} as const;

function relativeLocation(block: Block, direction: Vec3Like, location: Vec3Like) {
    return Vector3.add(block.location, {
        x: direction.x * location.x + direction.z * location.z,
        y: location.y,
        z: direction.z * location.x - direction.x * location.z
    });
}

export function createBlockContext(
    block: Block,
    permutation: BlockPermutation = block.permutation,
    player?: Player
): MolangContext {
    const dimension = block.dimension;
    const above = block.above();
    const below = block.below();

    const facing = permutation.getState("minecraft:cardinal_direction") as keyof typeof CARDINAL_OFFSETS | undefined;
    const direction = facing ? CARDINAL_OFFSETS[facing] ?? Vector3.ZERO : Vector3.ZERO;

    return createMolangContext({
        variable: {
            identifier: block.typeId,
        },
        temp: {},

        context: {
            other: (): MolangContext => {
                if (player === void 0) {
                    return createMolangContext();
                }

                const equippable = player.getComponent(EntityEquippableComponent.componentId);
                const itemStack = equippable?.getEquipment(EquipmentSlot.Mainhand);

                if (itemStack === void 0) {
                    return createMolangContext();
                }

                return createItemStackContext(itemStack);
            },
        },
        query: {
            location: {
                ...block.location
            },
            dimension: dimension.id,

            sky_light_level: () => block.getSkyLightLevel(),
            light_level: () => block.getLightLevel(),

            get redstone_power() {
                return block.getRedstonePower() ?? 0;
            },
            get above_block_redstone_power() {
                return above?.getRedstonePower() ?? 0;
            },
            get below_block_redstone_power() {
                return below?.getRedstonePower() ?? 0;
            },

            block_relative: (dx: number, dy: number, dz: number) => {
                const location = relativeLocation(block, direction, { x: dx, y: dy, z: dz });
                const relativeBlock = dimension.getBlock(location);

                return relativeBlock?.typeId ?? "minecraft:air";
            },
            block_relative_any_tag: (dx: number, dy: number, dz: number, ...tags: string[]) => {
                const location = relativeLocation(block, direction, { x: dx, y: dy, z: dz });
                const relativeBlock = dimension.getBlock(location);

                return tags.some((tag) => relativeBlock?.hasTag(tag));
            },
            block_relative_all_tags: (dx: number, dy: number, dz: number, ...tags: string[]) => {
                const location = relativeLocation(block, direction, { x: dx, y: dy, z: dz });
                const relativeBlock = dimension.getBlock(location);

                return tags.every((tag) => relativeBlock?.hasTag(tag));
            },

            block_state: (name: string) => {
                return permutation.getState(name as keyof BlockPermutation["getAllStates"]);
            },
            above_block_state: (name: string) => {
                return above?.permutation?.getState(name as keyof BlockPermutation["getAllStates"]);
            },
            below_block_state: (name: string) => {
                return below?.permutation?.getState(name as keyof BlockPermutation["getAllStates"]);
            },

            any_tag(...tags: string[]) {
                return tags.some((tag) => block.hasTag(tag));
            },
            all_tags(...tags: string[]) {
                return tags.every((tag) => block.hasTag(tag));
            },
        },
    });
}