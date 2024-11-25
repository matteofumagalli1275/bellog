/**
 * Playback engine for history recordings.
 * Reads entries from IndexedDB and publishes them to the DataBus in time order,
 * simulating the original runtime data flow.
 *
 * Supports: play, pause, seek, speed control.
 */
import {historyRepository} from "../../common/repositories/HistoryRepository";
import {DbHistoryEntry, DbHistoryMeta} from "../../common/providers/indexedDb/db";
import {bellogRuntimeDataBus} from "./BellogRuntimeDataBus";

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export type PlaybackListener = (state: PlaybackState, cursorTime: number, progress: number) => void;

const CHUNK_SIZE = 1000;

class BellogRuntimePlaybackEngine {

    private _state: PlaybackState = 'stopped';
    private _meta: DbHistoryMeta | null = null;
    private _speed = 1;
    private _cursorTime = 0;          // current playback position (absolute timestamp)

    /** All entries loaded from DB, sorted by timestamp */
    private entries: DbHistoryEntry[] = [];
    private entryIndex = 0;           // next entry to publish

    private rafId: number | null = null;
    private lastFrameMs = 0;          // performance.now() of last frame

    private listeners = new Set<PlaybackListener>();

    get state(): PlaybackState { return this._state; }
    get meta(): DbHistoryMeta | null { return this._meta; }
    get speed(): number { return this._speed; }
    get cursorTime(): number { return this._cursorTime; }
    get startTime(): number { return this._meta?.startTime ?? 0; }
    get endTime(): number { return this._meta?.endTime ?? 0; }
    get duration(): number { return this.endTime - this.startTime; }
    get progress(): number {
        if (this.duration <= 0) return 0;
        return (this._cursorTime - this.startTime) / this.duration;
    }

    onChange(listener: PlaybackListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    private notify(): void {
        for (const l of this.listeners) {
            try { l(this._state, this._cursorTime, this.progress); } catch (_) {}
        }
    }

    /**
     * Load a history session. Must be called before play.
     */
    async load(historyId: number): Promise<void> {
        this.stop();
        const meta = await historyRepository.getSession(historyId);
        if (!meta) throw new Error(`History session ${historyId} not found`);
        this._meta = meta;

        // Restore symbols snapshot if available
        if (meta.symbolsSnapshot) {
            try {
                const obj = JSON.parse(meta.symbolsSnapshot);
                const bellog = (window as any)["bellog"];
                if (bellog?.symbols) {
                    for (const [k, v] of Object.entries(obj)) {
                        bellog.symbols.set(k, v);
                    }
                }
            } catch (_) {}
        }

        // Load all entries (chunked read, assembled in-memory for seek support)
        this.entries = await historyRepository.getAllEntries(historyId);
        this.entryIndex = 0;
        this._cursorTime = meta.startTime;
        this.notify();
    }

    setSpeed(speed: number): void {
        this._speed = Math.max(0.1, speed);
    }

    play(): void {
        if (this._state === 'playing') return;
        if (!this._meta) return;
        this._state = 'playing';
        this.lastFrameMs = performance.now();
        this.scheduleFrame();
        this.notify();
    }

    pause(): void {
        if (this._state !== 'playing') return;
        this._state = 'paused';
        if (this.rafId != null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.notify();
    }

    stop(): void {
        this._state = 'stopped';
        if (this.rafId != null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.entryIndex = 0;
        this._cursorTime = this._meta?.startTime ?? 0;
        this.notify();
    }

    /**
     * Seek to a specific timestamp. Publishes all entries up to that point
     * so that Fixed fragments show the correct last state.
     */
    seek(timestamp: number): void {
        const wasPlaying = this._state === 'playing';
        if (wasPlaying) {
            cancelAnimationFrame(this.rafId!);
            this.rafId = null;
        }

        const clamped = Math.max(this.startTime, Math.min(this.endTime, timestamp));
        this._cursorTime = clamped;

        // Find the entry index for this timestamp
        // Binary search for first entry >= clamped
        let lo = 0, hi = this.entries.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (this.entries[mid].timestamp < clamped) lo = mid + 1;
            else hi = mid;
        }

        // Signal views to clear accumulated state, then re-publish
        // all entries up to the seek point so views show correct state.
        bellogRuntimeDataBus.notifyReset();
        for (let i = 0; i < lo; i++) {
            this.publishEntry(this.entries[i]);
        }
        this.entryIndex = lo;

        if (wasPlaying) {
            this.lastFrameMs = performance.now();
            this.scheduleFrame();
        }
        this.notify();
    }

    private scheduleFrame(): void {
        this.rafId = requestAnimationFrame((now) => this.tick(now));
    }

    private tick(nowMs: number): void {
        if (this._state !== 'playing') return;

        const elapsedReal = nowMs - this.lastFrameMs;
        this.lastFrameMs = nowMs;

        // Advance cursor by elapsed × speed
        const advance = elapsedReal * this._speed;
        const newCursor = this._cursorTime + advance;
        this._cursorTime = Math.min(newCursor, this.endTime);

        // Publish all entries between old position and new cursor
        while (this.entryIndex < this.entries.length &&
               this.entries[this.entryIndex].timestamp <= this._cursorTime) {
            this.publishEntry(this.entries[this.entryIndex]);
            this.entryIndex++;
        }

        this.notify();

        // Check if we've reached the end
        if (this._cursorTime >= this.endTime && this.entryIndex >= this.entries.length) {
            this._state = 'paused';
            this.notify();
            return;
        }

        this.scheduleFrame();
    }

    private publishEntry(entry: DbHistoryEntry): void {
        if (entry.error) {
            bellogRuntimeDataBus.publishError(
                entry.channelId, entry.nodeId, entry.timestamp, entry.direction, entry.error
            );
        } else {
            bellogRuntimeDataBus.publish(
                entry.channelId, entry.nodeId, entry.timestamp, entry.direction, entry.data
            );
        }
    }
}

export const bellogRuntimePlaybackEngine = new BellogRuntimePlaybackEngine();
