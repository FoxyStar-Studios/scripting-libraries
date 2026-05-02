import { CustomCommandRegistry } from "@minecraft/server";
import { Identifier } from "@foxystar/core";

import { ICustomCommand } from "./ICustomCommand.ts";

export class CommandRegistry {
    private static readonly REGISTRY = new Map<Identifier, ICustomCommand>();
    private static readonly ENUMS = new Map<Identifier, string[]>();

    static registerCommand(ctor: new () => ICustomCommand): void {
        const instance = new ctor();

        if (CommandRegistry.REGISTRY.has(instance.identifier)) {
            throw new Error(`Command '${instance.identifier.toString()}' is already registered`);
        }

        CommandRegistry.REGISTRY.set(instance.identifier, instance);

        // aliases
        for (const alias of instance.aliases) {
            if (CommandRegistry.REGISTRY.has(alias)) {
                throw new Error(`Alias '${alias.toString()}' is already registered`);
            }

            const aliasInstance = new ctor();
            aliasInstance.identifier = alias;

            CommandRegistry.REGISTRY.set(alias, aliasInstance);
        }
    }

    static registerEnum(identifier: Identifier, values: string[]): Identifier {
        const existing = CommandRegistry.ENUMS.get(identifier);

        if (existing !== undefined) {
            const same =
                existing.length === values.length &&
                existing.every((v, i) => v === values[i]);

            if (!same) {
                throw new Error(
                    `Enum '${identifier.toString()}' already exists with different values`
                );
            }

            return identifier;
        }

        CommandRegistry.ENUMS.set(identifier, values);
        return identifier;
    }

    static get(identifier: Identifier): ICustomCommand | undefined {
        return CommandRegistry.REGISTRY.get(identifier);
    }

    static getAll(): ICustomCommand[] {
        return [ ...CommandRegistry.REGISTRY.values() ];
    }

    static registerAll(registry: CustomCommandRegistry): void {
        for (const command of CommandRegistry.REGISTRY.values()) {
            registry.registerCommand(
                command.toJSON(),
                command.execute.bind(command)
            );
        }

        for (const [ name, values ] of CommandRegistry.ENUMS) {
            registry.registerEnum(name.toString(), values);
        }
    }
}