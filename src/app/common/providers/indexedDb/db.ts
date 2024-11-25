import Dexie, { Table } from 'dexie';
import {
    UserDataFlags,
    UserDataFolder, UserDataProfileMeta,
    UserDataProfileProject
} from "../../model/UserData";

export type DbFolder =  Omit<UserDataFolder, 'id'> & { id?: number };

export type DbProfileProject = UserDataProfileProject

export type DbProfileMeta = Omit<UserDataProfileMeta, 'id'> & { id?: number };

export type DbFlags = UserDataFlags

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

export class MySubClassedDexie extends Dexie {

  folders!: Table<DbFolder>;
  profilesMeta!: Table<DbProfileMeta>;
  profilesProject!: Table<DbProfileProject>;
  flags!: Table<DbFlags>;
  historyMeta!: Table<DbHistoryMeta>;
  historyEntries!: Table<DbHistoryEntry>;

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
  }
}

export const db = new MySubClassedDexie();