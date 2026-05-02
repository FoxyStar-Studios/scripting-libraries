import { system, StartupEvent, ItemCustomComponent, BlockCustomComponent } from "@minecraft/server";

import { Identifier } from "@foxystar/core";
import { EventHandler, Events } from "@foxystar/events";
import { BlockComponentRegistry, ItemComponentRegistry } from "@foxystar/minecraft";

@BlockComponentRegistry.registerComponent
class TestBlockComponent implements BlockCustomComponent {
    public static componentId: Identifier = Identifier.of("test");

}


@ItemComponentRegistry.registerComponent
class TestItemComponent implements ItemCustomComponent {
    public static componentId: Identifier = Identifier.of("test");

}

@Events.registerEvent(system.beforeEvents.startup)
export default class onStartup extends EventHandler<StartupEvent> {

    public onEvent(event: StartupEvent): void {
        const { itemComponentRegistry, blockComponentRegistry } = event;

        BlockComponentRegistry.registerAll((identifier, component) => {
            blockComponentRegistry.registerCustomComponent(identifier.toString(), component);
        });

        ItemComponentRegistry.registerAll((identifier, component) => {
            itemComponentRegistry.registerCustomComponent(identifier.toString(), component);
        });
    }
}

Events.initializeEvents();