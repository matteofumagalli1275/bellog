/**
 * Lightweight pub/sub data bus for the runtime engine.
 * Replaces BellogRuntimeLogStorageRam.
 *
 * The layer controller publishes data at each node; view fragments
 * and event engine subscribe by (channelId, nodeId).
 */

export type DataBusEntry = {
    timestamp: number;
    direction: string;
    channelId: number;
    nodeId: string;
    data: any;
    error?: string;
}

type DataBusCallback = (entry: DataBusEntry) => void;

class BellogRuntimeDataBus {

    private subscribers = new Map<string, Set<DataBusCallback>>();
    private wildcardSubscribers = new Set<DataBusCallback>();
    private resetCallbacks = new Set<() => void>();

    private key(channelId: number, nodeId: string): string {
        return `${channelId}:${nodeId}`;
    }

    /**
     * Subscribe to data published at a specific (channelId, nodeId).
     * Returns an unsubscribe function.
     */
    subscribe(channelId: number, nodeId: string, callback: DataBusCallback): () => void {
        const k = this.key(channelId, nodeId);
        if (!this.subscribers.has(k)) {
            this.subscribers.set(k, new Set());
        }
        this.subscribers.get(k)!.add(callback);
        return () => {
            const set = this.subscribers.get(k);
            if (set) {
                set.delete(callback);
                if (set.size === 0) this.subscribers.delete(k);
            }
        };
    }

    /**
     * Subscribe to ALL published data (used by the recorder).
     * Returns an unsubscribe function.
     */
    subscribeAll(callback: DataBusCallback): () => void {
        this.wildcardSubscribers.add(callback);
        return () => { this.wildcardSubscribers.delete(callback); };
    }

    /** Publish a data entry at a specific (channelId, nodeId). */
    publish(channelId: number, nodeId: string, timestamp: number, direction: string, data: any): void {
        const entry: DataBusEntry = { timestamp, direction, channelId, nodeId, data };
        this.fanOut(channelId, nodeId, entry);
    }

    /** Publish an error entry at a specific (channelId, nodeId). */
    publishError(channelId: number, nodeId: string, timestamp: number, direction: string, error: string): void {
        const entry: DataBusEntry = { timestamp, direction, channelId, nodeId, data: null, error };
        this.fanOut(channelId, nodeId, entry);
    }

    private fanOut(channelId: number, nodeId: string, entry: DataBusEntry): void {
        const k = this.key(channelId, nodeId);
        const subs = this.subscribers.get(k);
        if (subs) {
            for (const cb of subs) {
                try { cb(entry); } catch (e) { console.error('[DataBus] subscriber error:', e); }
            }
        }
        for (const cb of this.wildcardSubscribers) {
            try { cb(entry); } catch (e) { console.error('[DataBus] wildcard subscriber error:', e); }
        }
    }

    /**
     * Register a callback that fires when the bus is reset (e.g. on seek).
     * Subscribers should clear accumulated state. Returns unsubscribe fn.
     */
    onReset(cb: () => void): () => void {
        this.resetCallbacks.add(cb);
        return () => { this.resetCallbacks.delete(cb); };
    }

    /** Signal all reset listeners to clear their accumulated state. */
    notifyReset(): void {
        for (const cb of this.resetCallbacks) {
            try { cb(); } catch (e) { console.error('[DataBus] reset callback error:', e); }
        }
    }

    /** Remove all subscriptions. */
    clear(): void {
        this.subscribers.clear();
        this.wildcardSubscribers.clear();
        this.resetCallbacks.clear();
    }
}

export const bellogRuntimeDataBus = new BellogRuntimeDataBus();
