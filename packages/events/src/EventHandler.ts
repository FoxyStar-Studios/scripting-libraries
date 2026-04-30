export abstract class EventHandler<T> {
    private _unsubscribe?: () => void;

    constructor(unsubscribe?: () => void) {
        if (unsubscribe !== undefined) {
            this._unsubscribe = unsubscribe;
        }
    }

    public abstract onEvent(event: T): void;

    public unsubscribe() {
        this._unsubscribe?.();
        this._unsubscribe = undefined;
    }
}