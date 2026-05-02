import {
    system,
    StartupEvent,
    
    CommandPermissionLevel,
    CustomCommandOrigin,
    CustomCommandResult,
    CustomCommandStatus
} from "@minecraft/server";

import { Identifier } from "@foxystar/core";
import { EventHandler, Events } from "@foxystar/events";
import { CommandRegistry, ICustomCommand } from "@foxystar/minecraft";

@CommandRegistry.registerCommand
class TestCommand extends ICustomCommand {
    public identifier: Identifier = Identifier.of("test");
    public description: string = "Hello, world!";
    public permissionLevel: CommandPermissionLevel = CommandPermissionLevel.GameDirectors;

    public execute(_origin: CustomCommandOrigin): CustomCommandResult | undefined {
        return { status: CustomCommandStatus.Success };
    }
}

@Events.registerEvent(system.beforeEvents.startup)
export default class onStartup extends EventHandler<StartupEvent> {

    public onEvent(event: StartupEvent): void {
        CommandRegistry.registerAll(event.customCommandRegistry);
    }
}

Events.initializeEvents();