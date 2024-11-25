/**
 * Reactive property store for ReplaceHtmlProperties actions.
 * Maps a key (viewId:htmlRefScope:htmlRefId) to property overrides.
 * Fixed fragments subscribe to their key to re-render when properties change.
 */

type PropertyListener = (props: Record<string, any>) => void;

class BellogRuntimePropertyStore {

    private store: Map<string, Record<string, any>> = new Map();
    private listeners: Map<string, Set<PropertyListener>> = new Map();

    static buildKey(viewId: number, htmlRefScope: string, htmlRefId: number): string {
        return `${viewId}:${htmlRefScope}:${htmlRefId}`;
    }

    set(key: string, props: Record<string, any>): void {
        this.store.set(key, props);
        const subs = this.listeners.get(key);
        if (subs) {
            for (const cb of subs) {
                try { cb(props); } catch (e) { console.error('[PropertyStore] listener error:', e); }
            }
        }
    }

    get(key: string): Record<string, any> | undefined {
        return this.store.get(key);
    }

    subscribe(key: string, callback: PropertyListener): () => void {
        let subs = this.listeners.get(key);
        if (!subs) {
            subs = new Set();
            this.listeners.set(key, subs);
        }
        subs.add(callback);
        return () => {
            subs!.delete(callback);
            if (subs!.size === 0) this.listeners.delete(key);
        };
    }

    clear(): void {
        this.store.clear();
        this.listeners.clear();
    }
}

export const bellogRuntimePropertyStore = new BellogRuntimePropertyStore();
export { BellogRuntimePropertyStore };
