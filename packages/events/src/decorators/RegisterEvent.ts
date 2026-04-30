import { EVENT_REGISTRY } from "../registry.ts";
import type { EventSignal, EventConstructor, RegisteredEvent } from "../types.ts";

export function RegisterEvent<E, OptionsType = void>(
    eventSignal: EventSignal<E, OptionsType>,
    options?: OptionsType
) {
    return function <T extends EventConstructor<E>>(constructor: T) {
        EVENT_REGISTRY.push({
            constructor,
            signal: eventSignal,
            options
        } as RegisteredEvent<unknown, unknown>);
    };
}