import {
    EventHandler,
    EventSignal,
    EventCallback,
    Events
} from "@foxystar/events";

type TestEvent = { value: string };
class TestEventSignal implements EventSignal<TestEvent> {
    private callback?: EventCallback<TestEvent>;

    subscribe(callback: EventCallback<TestEvent>): EventCallback<TestEvent> {
        console.log("Subscribed!");

        this.callback = callback;
        return callback;
    }

    unsubscribe(_callback: EventCallback<TestEvent>): void {
        console.log("Unsubscribed!");
        this.callback = undefined;
    }

    emit(value: TestEvent) {
        this.callback?.(value);
    }
}

let callCount = 0;
const signal = new TestEventSignal();

@Events.registerEvent(signal)
class OnTest extends EventHandler<TestEvent> {
    public override onEvent(event: TestEvent): void {
        console.log("Event received:", event.value);

        callCount++;
        this.unsubscribe();
    }
}

Events.initializeEvents();

signal.emit({ value: "hello" });
signal.emit({ value: "again" });

if (callCount !== 1) {
    throw new Error("Handler should only run once");
}

Events.destroyEvents();

signal.emit({ value: "after destroy" }); // should NOT trigger anything