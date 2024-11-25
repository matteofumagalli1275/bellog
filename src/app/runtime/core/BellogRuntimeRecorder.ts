/**
 * Runtime recorder. Streams DataBus entries to IndexedDB via HistoryRepository.
 * Buffers writes (~100 entries or 500 ms, whichever comes first).
 */
import {bellogRuntimeDataBus, DataBusEntry} from "./BellogRuntimeDataBus";
import {historyRepository} from "../../common/repositories/HistoryRepository";
import {DbHistoryEntry} from "../../common/providers/indexedDb/db";

const BUFFER_LIMIT = 100;
const FLUSH_INTERVAL_MS = 500;

class BellogRuntimeRecorder {

    private unsubscribe: (() => void) | null = null;
    private _recording = false;
    private _sessionId: number | null = null;
    private _entryCount = 0;
    private _startTime = 0;

    private buffer: Omit<DbHistoryEntry, 'id' | 'historyId'>[] = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;

    get recording(): boolean { return this._recording; }
    get sessionId(): number | null { return this._sessionId; }
    get entryCount(): number { return this._entryCount; }
    get startTime(): number { return this._startTime; }

    async startRecording(profileId: number, name?: string): Promise<void> {
        if (this._recording) return;

        const sessionName = name || `Recording ${new Date().toLocaleString()}`;
        this._sessionId = await historyRepository.createSession(profileId, sessionName);
        this._recording = true;
        this._entryCount = 0;
        this._startTime = Date.now();
        this.buffer = [];

        this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

        this.unsubscribe = bellogRuntimeDataBus.subscribeAll((entry: DataBusEntry) => {
            this.buffer.push({
                timestamp: entry.timestamp,
                channelId: entry.channelId,
                nodeId: entry.nodeId,
                direction: entry.direction,
                data: entry.data,
                ...(entry.error ? {error: entry.error} : {}),
            });
            this._entryCount++;
            if (this.buffer.length >= BUFFER_LIMIT) {
                this.flush();
            }
        });
    }

    async stopRecording(): Promise<number | null> {
        if (!this._recording || this._sessionId == null) return null;
        this._recording = false;
        this.unsubscribe?.();
        this.unsubscribe = null;

        if (this.flushTimer != null) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        // Final flush
        await this.flush();

        // Capture symbols snapshot
        let symbolsSnapshot: string | undefined;
        try {
            const bellog = (window as any)["bellog"];
            if (bellog?.symbols) {
                const obj: Record<string, any> = {};
                for (const [k, v] of bellog.symbols.entries()) {
                    obj[k] = v;
                }
                symbolsSnapshot = JSON.stringify(obj);
            }
        } catch (_) { /* ignore serialization errors */ }

        await historyRepository.finalizeSession(this._sessionId, symbolsSnapshot);
        const id = this._sessionId;
        this._sessionId = null;
        return id;
    }

    private async flush(): Promise<void> {
        if (this.buffer.length === 0 || this._sessionId == null) return;
        const batch = this.buffer.splice(0);
        try {
            await historyRepository.appendEntries(this._sessionId, batch);
        } catch (e) {
            console.error('[Recorder] flush error:', e);
        }
    }
}

export const bellogRuntimeRecorder = new BellogRuntimeRecorder();

