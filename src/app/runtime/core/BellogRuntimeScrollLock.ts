/**
 * Shared scroll-lock state.
 * When locked, all Append fragments auto-scroll to bottom on new entries.
 * Manual user scroll disengages the lock.
 */

type Listener = (locked: boolean) => void;

class BellogRuntimeScrollLock {
    private _locked = true;
    private listeners: Listener[] = [];

    get locked(): boolean {
        return this._locked;
    }

    setLocked(value: boolean): void {
        if (this._locked === value) return;
        this._locked = value;
        for (const fn of this.listeners) fn(value);
    }

    toggle(): void {
        this.setLocked(!this._locked);
    }

    subscribe(fn: Listener): () => void {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    }
}

export const bellogRuntimeScrollLock = new BellogRuntimeScrollLock();
