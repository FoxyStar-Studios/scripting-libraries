export interface IdentifierConfig {
    defaultNamespace: string;
    minecraftNamespace: string;
}

export class Identifier {
    private static NAMESPACE_SEPARATOR: string = ":";
    private static IDENTIFIER_REGEX = /^(?:(?<namespace>\w+(?:\.\w+)*):)?(?<name>\w+(?:\.\w+)*)(?:<(?<event>(?:\w+(?:\.\w+)*:)?\w+(?:\.\w+)*)>)?$/;
    
    private static CONFIG: IdentifierConfig = {
        defaultNamespace: "custom",
        minecraftNamespace: "minecraft"
    };

    public constructor(public namespace: string, public name: string, public event?: Identifier) {
        this.namespace = namespace;
        this.name = name;
        this.event = event;
    }

    public static configure(config: Partial<IdentifierConfig>) {
        this.CONFIG = { ...this.CONFIG, ...config };
    }

    public toString(prefix?: string, suffix?: string, separator: string = "."): string {
        let name = this.name;

        if (prefix !== void 0) {
            name = prefix.concat(separator, name);
        }

        if (suffix !== void 0) {
            name = name.concat(separator, suffix);
        }

        let result = this.namespace.concat(Identifier.NAMESPACE_SEPARATOR, name);
        if (this.event !== void 0) {
            result += `<${this.event.toString()}>`;
        }

        return result;
    }

    public toJSON(): string {
        return this.toString();
    }

    public valueOf(): string {
        return this.toString();
    }

    [Symbol.toPrimitive](hint: string) {
        if (hint === "string" || hint === "default") {
            return this.toString();
        }

        return null;
    }

    public withoutEvent(): Identifier {
        return new Identifier(this.namespace, this.name);
    }

    public equals(other: Identifier | string, ignoreEvent: boolean = false): boolean {
        if (typeof other === "string") {
            other = Identifier.parse(other);
        }

        if (this.namespace !== other.namespace) return false;
        if (this.name !== other.name) return false;

        if (ignoreEvent) {
            return true;
        }

        // Compare events
        if (!this.event && !other.event) return true;
        if (!this.event || !other.event) return false;

        return this.event.equals(other.event, ignoreEvent);
    }

    public isMinecraft(): boolean {
        return this.namespace === Identifier.CONFIG.minecraftNamespace;
    }

    public static of(base: string, name?: string): Identifier {
        if (typeof name === "string" && name.length > 0) {
            return new Identifier(base, name);
        }

        return new Identifier(this.CONFIG.defaultNamespace, base);
    }

    public static ofVanilla(name: string): Identifier {
        return this.of(this.CONFIG.minecraftNamespace, name);
    };

    public static parse(identifier: string): Identifier {
        const match = identifier.match(Identifier.IDENTIFIER_REGEX);

        if (!match || !match.groups) {
            throw new Error(`Invalid identifier: ${identifier}`);
        }

        const namespace = match.groups.namespace ?? this.CONFIG.minecraftNamespace;
        const name = match.groups.name;

        const event = match.groups.event
            ? Identifier.parse(match.groups.event)
            : undefined;

        return new Identifier(namespace, name, event);
    }

    public static isValid(identifier: string): boolean {
        return Identifier.IDENTIFIER_REGEX.test(identifier);
    }

    public static getNamespace(identifier: string): string | null {
        const match = identifier.match(Identifier.IDENTIFIER_REGEX);
        return match?.groups?.namespace ?? null;
    }

    public static getName(identifier: string): string | null {
        const match = identifier.match(Identifier.IDENTIFIER_REGEX);
        return match?.groups?.name ?? null;
    }

    public static getEvent(identifier: string): string | null {
        const match = identifier.match(Identifier.IDENTIFIER_REGEX);
        return match?.groups?.event ?? null;
    }
}