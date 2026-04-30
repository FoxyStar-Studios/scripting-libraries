import type { RegisteredEvent } from "./types.ts";
import { EventHandler } from "./EventHandler.ts";

export const EVENT_REGISTRY: RegisteredEvent<unknown, unknown>[] = [];
export const INSTANCES: EventHandler<unknown>[] = [];