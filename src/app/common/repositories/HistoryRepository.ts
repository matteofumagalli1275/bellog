import {db, DbHistoryEntry, DbHistoryMeta} from "../providers/indexedDb/db";

class HistoryRepository {

    async createSession(profileId: number, name: string): Promise<number> {
        return await db.historyMeta.add({
            profileId,
            name,
            startTime: Date.now(),
        });
    }

    async finalizeSession(historyId: number, symbolsSnapshot?: string): Promise<void> {
        await db.historyMeta.update(historyId, {
            endTime: Date.now(),
            symbolsSnapshot,
        });
    }

    async appendEntries(historyId: number, entries: Omit<DbHistoryEntry, 'id' | 'historyId'>[]): Promise<void> {
        const rows: DbHistoryEntry[] = entries.map(e => ({...e, historyId}));
        await db.historyEntries.bulkAdd(rows);
    }

    async getEntriesInRange(historyId: number, startTime: number, endTime: number): Promise<DbHistoryEntry[]> {
        return await db.historyEntries
            .where('[historyId+timestamp]')
            .between([historyId, startTime], [historyId, endTime], true, true)
            .toArray();
    }

    async getAllEntries(historyId: number): Promise<DbHistoryEntry[]> {
        return await db.historyEntries
            .where('[historyId+timestamp]')
            .between([historyId, -Infinity], [historyId, Infinity], true, true)
            .toArray();
    }

    async getEntryCount(historyId: number): Promise<number> {
        return await db.historyEntries
            .where('historyId')
            .equals(historyId)
            .count();
    }

    async getSessionsForProfile(profileId: number): Promise<DbHistoryMeta[]> {
        return await db.historyMeta
            .where('profileId')
            .equals(profileId)
            .reverse()
            .sortBy('startTime');
    }

    async getSession(historyId: number): Promise<DbHistoryMeta | undefined> {
        return await db.historyMeta.get(historyId);
    }

    async deleteSession(historyId: number): Promise<void> {
        await db.historyEntries.where('historyId').equals(historyId).delete();
        await db.historyMeta.delete(historyId);
    }

    async exportSession(historyId: number): Promise<Blob> {
        const meta = await db.historyMeta.get(historyId);
        if (!meta) throw new Error(`History session ${historyId} not found`);

        const entries = await this.getAllEntries(historyId);
        const lines: string[] = [];

        // First line: metadata
        lines.push(JSON.stringify({
            _type: 'meta',
            profileId: meta.profileId,
            name: meta.name,
            startTime: meta.startTime,
            endTime: meta.endTime,
            symbolsSnapshot: meta.symbolsSnapshot,
        }));

        // Subsequent lines: entries
        for (const e of entries) {
            lines.push(JSON.stringify({
                t: e.timestamp,
                ch: e.channelId,
                n: e.nodeId,
                d: e.direction,
                v: e.data,
                ...(e.error ? {err: e.error} : {}),
            }));
        }

        return new Blob([lines.join('\n')], {type: 'application/x-jsonlines'});
    }

    async importSession(profileId: number, jsonlText: string): Promise<number> {
        const lines = jsonlText.split('\n').filter(l => l.trim());
        if (lines.length === 0) throw new Error('Empty history file');

        const firstLine = JSON.parse(lines[0]);
        let metaLine: any = null;
        let dataStartIndex = 0;

        if (firstLine._type === 'meta') {
            metaLine = firstLine;
            dataStartIndex = 1;
        }

        const historyId = await db.historyMeta.add({
            profileId,
            name: metaLine?.name || `Import ${new Date().toISOString()}`,
            startTime: metaLine?.startTime || Date.now(),
            endTime: metaLine?.endTime,
            symbolsSnapshot: metaLine?.symbolsSnapshot,
        });

        const batchSize = 500;
        for (let i = dataStartIndex; i < lines.length; i += batchSize) {
            const batch = lines.slice(i, i + batchSize);
            const rows: DbHistoryEntry[] = batch.map(line => {
                const parsed = JSON.parse(line);
                return {
                    historyId,
                    timestamp: parsed.t,
                    channelId: parsed.ch,
                    nodeId: parsed.n,
                    direction: parsed.d,
                    data: parsed.v,
                    ...(parsed.err ? {error: parsed.err} : {}),
                };
            });
            await db.historyEntries.bulkAdd(rows);
        }

        return historyId;
    }
}

export const historyRepository = new HistoryRepository();
