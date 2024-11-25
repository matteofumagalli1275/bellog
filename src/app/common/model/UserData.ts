

export interface UserDataFolder {
    id: number;
    name: string;
    path: string;
}

export interface UserDataProfileProject {
    // This is an external id reference to UserDataProfile
    id: number;
    setup: string;
}

export interface UserDataFlags {
    name: string;
    value: boolean | string;
}

export interface UserDataProfileMeta {
    id: number;
    name: string;
    path: string;
    rdnId: string;
    version: string;
    isLibrary: boolean;
}