## `@foxystar/events`
A lightweight decorator-based event system for working with event signals such as those from Minecraft: Bedrock Edition's Scripting API.
It provides:
- Class-based event handlers
- Automatic subscription via decorators
- Clean lifecycle management
- 
## Installation

```bash
npm install @foxystar/events
```

## Quick Example
```ts
import { world, EntityDieAfterEvent } from "@minecraft/server";
import { EventHandler, Events } from "@foxystar/events";

@Events.RegisterEvent(world.afterEvents.entityDie, {
    entityTypes: [ "minecraft:creeper" ]
})
export class OnEntityDie extends EventHandler<EntityDieAfterEvent> {

    public onEvent(event: EntityDieAfterEvent): void {
        console.log(event.damageSource.cause, event.deadEntity.typeId);

        this.unsubscribe(); // optional
    }
}
```

## Initialization
Decorators only register handlers. They do not activate them.

You must initialize the event system:
```ts
import { Events } from "@foxystar/events";

Events.initializeEvents();
```

> [!WARNING]
> Call this once per runtime.

## Cleanup
To unsubscribe all handlers:
```ts
Events.destroyEvents();
```

## API
### `EventHandler<T>`
Base class for all event handlers.
```ts
abstract class EventHandler<T> {
    onEvent(event: T): void;
    unsubscribe(): void;
}
```

### `Events.RegisterEvent(signal, options?)`
Decorator that registers a class as an event handler.

### `Events.initializeEvents()`
Initializes and subscribes all registered handlers.

### `Events.destroyEvents()`
Unsubscribes all active handlers.

## Why use this?
- Avoid manual `subscribe` / `unsubscribe` boilerplate
- Organize event logic into classes
- Keep systems modular and reusable