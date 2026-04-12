import Dexie, { Table } from 'dexie';
import {
    UserDataFlags,
    UserDataFolder, UserDataProfileMeta,
    UserDataProfileProject,
    UserDataSettings
} from "../../model/UserData";

export type DbFolder =  Omit<UserDataFolder, 'id'> & { id?: number };

export type DbProfileProject = UserDataProfileProject

export type DbProfileMeta = Omit<UserDataProfileMeta, 'id'> & { id?: number };

export type DbFlags = UserDataFlags

export type DbSettings = UserDataSettings

export interface DbHistoryMeta {
    id?: number;
    profileId: number;
    name: string;
    startTime: number;
    endTime?: number;
    symbolsSnapshot?: string;   // JSON-serialized symbols Map
}

export interface DbHistoryEntry {
    id?: number;
    historyId: number;
    timestamp: number;
    channelId: number;
    nodeId: string;
    direction: string;
    data: any;
    error?: string;
}

export interface DbPersistentSymbol {
    profileId: number;
    name: string;
    value: string; // JSON-serialized
}

export class MySubClassedDexie extends Dexie {

  folders!: Table<DbFolder>;
  profilesMeta!: Table<DbProfileMeta>;
  profilesProject!: Table<DbProfileProject>;
  flags!: Table<DbFlags>;
  settings!: Table<DbSettings>;
  historyMeta!: Table<DbHistoryMeta>;
  historyEntries!: Table<DbHistoryEntry>;
  persistentSymbols!: Table<DbPersistentSymbol>;

  constructor() {
    super('Database_Bellog');
    this.version(1).stores({
        folders: '++id, name, path',
        profilesMeta: '++id, name, path, rndId, version, isLibrary, lastEditDate, lastRunDate',
        profilesProject: 'id, setup',
        flags: 'name, value',
        historyMeta: '++id, profileId, startTime',
        historyEntries: '++id, historyId, [historyId+timestamp]',
    });
    this.version(2).stores({
        settings: 'name',
    });
    this.version(3).stores({
        // Compound primary key [profileId+name] enables upsert via put().
        // Secondary index on profileId allows bulk load per profile.
        persistentSymbols: '[profileId+name], profileId',
    });
  }
}

export const db = new MySubClassedDexie();