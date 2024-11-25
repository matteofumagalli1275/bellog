
import {UserDataFolder, UserDataProfileMeta, UserDataProfileProject} from "../model/UserData";
import {ProfileProperty} from "../model/profile/Profile";

export interface ProfileRepositoryInterface {
    connect(): Promise<void>
    saveProfile(id: number, profile: ProfileProperty): Promise<void>
    createWorkspace(name: string): Promise<void>
    createProfile(name: string, profile?: ProfileProperty): Promise<void>
    deleteWorkspace(id: number): Promise<void>
    deleteProfile(id: number): Promise<void>
    renameWorkspace(id: number, name: string): Promise<void>
    moveProfileToWorkspace(id: number, name: string): Promise<void>
    attachProfiles(updateCb: (profile: {
        profiles?: UserDataProfileMeta[],
    }) => void): void
    attachWorkspaces(updateCb: (profile: {
        workspaces?: UserDataFolder[],
    }) => void): void
    attachProfile(id: number, updateCb: (profile: ProfileProperty) => void): void
    getProfiles(): Promise<UserDataProfileMeta[]>
    getProfile(id: number): Promise<UserDataProfileProject>
    onRemoteClosed(closeCb: () => void): void
    close(): void
    isSubscribableForUpdates(): boolean
}