import { EventHandler } from "./EventHandler.ts";

export type EventCallback<T> = (event: T) => void;

export type EventSignal<T, OptionsType = void> = {
    subscribe: (callback: EventCallback<T>, options?: OptionsType) => EventCallback<T>;
    unsubscribe: (callback: EventCallback<T>) => void;
};

export type EventConstructor<E> = new (unsubscribe?: () => void) => EventHandler<E>;

export type RegisteredEvent<E, OptionsType> = {
    constructor: EventConstructor<E>;
    signal: EventSignal<E, OptionsType>;
    options?: OptionsType;
};