import {
    CommandPermissionLevel,

    CustomCommand,
    CustomCommandParameter,
    CustomCommandOrigin,
    CustomCommandResult
} from "@minecraft/server";
import { Identifier } from "@foxystar/core";

export abstract class ICustomCommand implements CustomCommand {
    public abstract identifier: Identifier;

    public get name(): string {
        return this.identifier.toString();
    }

    public abstract description: string;
    public abstract permissionLevel: CommandPermissionLevel;

    public cheatsRequired?: boolean;
    public mandatoryParameters?: CustomCommandParameter[];
    public optionalParameters?: CustomCommandParameter[];

    public aliases: Identifier[] = [];

    public abstract execute(
        origin: CustomCommandOrigin,
        ...args: unknown[]
    ): CustomCommandResult | undefined;

    public toJSON() {
        return {
            name: this.name,
            description: "§§%".concat(this.description),
            permissionLevel: this.permissionLevel,
            cheatsRequired: this.cheatsRequired,
            mandatoryParameters: this.mandatoryParameters,
            optionalParameters: this.optionalParameters,
        };
    }
}