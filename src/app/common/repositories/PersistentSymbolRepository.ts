import {db, DbPersistentSymbol} from "../providers/indexedDb/db";

class PersistentSymbolRepository {

    /** Load all stored persistent symbols for a profile. */
    async getAll(profileId: number): Promise<DbPersistentSymbol[]> {
        return db.persistentSymbols.where('profileId').equals(profileId).toArray();
    }

    /** Upsert a single symbol value (fire-and-forget friendly). */
    async set(profileId: number, name: string, value: string): Promise<void> {
        await db.persistentSymbols.put({profileId, name, value});
    }

    /** Remove all persisted symbols for a profile (e.g. on profile delete). */
    async deleteAll(profileId: number): Promise<void> {
        await db.persistentSymbols.where('profileId').equals(profileId).delete();
    }
}

export const persistentSymbolRepository = new PersistentSymbolRepository();
