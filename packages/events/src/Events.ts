import { EVENT_REGISTRY, INSTANCES } from "./registry.ts";
import type { EventCallback } from "./types.ts";
import { EventHandler } from "./EventHandler.ts";
import { RegisterEvent } from "./decorators/RegisterEvent.ts";

export class Events {
    public static RegisterEvent = RegisterEvent;

    public static initializeEvents(): void {
        if (INSTANCES.length > 0) {
            return;
        }

        for (const entry of EVENT_REGISTRY) {
            let callback: EventCallback<unknown> | undefined;

            const instance = new entry.constructor(() => {
                if (!callback) return;

                entry.signal.unsubscribe(callback);
                callback = undefined;
            });

            const bound = (event: unknown) => instance.onEvent(event);

            callback = entry.options === undefined
                ? entry.signal.subscribe(bound)
                : entry.signal.subscribe(bound, entry.options);

            INSTANCES.push(instance);
        }
    }

    public static destroyEvents(instances?: EventHandler<unknown>[]): void {
        const target = instances ?? INSTANCES;

        for (const instance of target) {
            instance.unsubscribe();
        }

        if (!instances) {
            INSTANCES.length = 0;
        }
    }
}