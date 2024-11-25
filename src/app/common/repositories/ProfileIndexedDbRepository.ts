import {ProfileRepositoryInterface} from "./ProfileRepositoryInterface";
import {db} from "../providers/indexedDb/db";
import {UserDataFolder, UserDataProfileMeta} from "../model/UserData";
import {getDefaultProfileDbFormat} from "../../setup/DefaultProperties";
import {liveQuery, PromiseExtended, Subscription} from "dexie";
import {ProfileProperty} from "../model/profile/Profile";
import {it} from "node:test";

export class ProfileIndexedDbRepository implements ProfileRepositoryInterface {

    private workspacesSubscription: Subscription
    private profilesSubscription: Subscription
    private profileSubscription: Subscription

    updateWorkspacesCb: (db: {
        workspaces?: UserDataFolder[],
    }) => void;
    updateProfilesCb: (db: {
        profiles?: UserDataProfileMeta[],
    }) => void;
    updateProfileCb: (profile: ProfileProperty) => void;

    isSubscribableForUpdates():boolean {
        return true
    }

    async connect(): Promise<void> {

    }

    async saveProfile(id: number, profile: ProfileProperty): Promise<void> {
        let result = await db.profilesMeta.update(id, {
            name: profile.name,
            isLibrary: profile.settings.isLibrary,
            rdnId: profile.settings.rdnId,
            version: profile.settings.version
        })

        if (result == 0) {
            throw new Error(`Profile with id ${id} not found.`);
        }

        result = await db.profilesProject.update(id, {
            setup: JSON.stringify(profile)
        })

        if (result == 0) {
            throw new Error(`Error saving ${id}`);
        }
    }

    async createWorkspace(name: string): Promise<void> {
        await db.folders.add({
            name: name,
            path: `/${name}`
        });
    }

    async createProfile(name: string, profile?: ProfileProperty): Promise<void> {
        const profileToSave = profile ? profile : (getDefaultProfileDbFormat())
        const result = await db.profilesMeta.add({
            name: name,
            path: `/`,
            isLibrary: profileToSave.settings.isLibrary,
            rdnId: profileToSave.settings.rdnId,
            version: profileToSave.settings.version
        });

        await db.profilesProject.add({
            id: result,
            setup: JSON.stringify(profileToSave)
        }, result);
    }

    async deleteProfile(id: number) {
        await db.profilesMeta.delete(id);
        await db.profilesProject.delete(id);
    }

    async deleteWorkspace(id: number) {
        const workspace = await db.folders.get(id);
        if (!workspace) return;

        const { path } = workspace;

        // Cascade delete profiles and libraries
        const profiles = await db.profilesMeta.where("path").equals(path).toArray();
        for (const profile of profiles) {
            await db.profilesMeta.delete(profile.id);
            await db.profilesProject.delete(profile.id);
        }

        await db.folders.delete(id);
    }

    async renameWorkspace(id: number, name: string) {
        const item  = await db.folders.where("id").equals(id).first()
        if (!item) return;

        // Cascade delete profiles and libraries
        const profiles = await db.profilesMeta.where("path").equals(item.path).toArray();
        for (const profile of profiles) {
            await db.profilesMeta.update(profile.id, {
                path: '/' + name
            })
        }

        db.folders.update(item.id, {
            name: name,
            path: '/' + name
        })
    }

    async moveProfileToWorkspace(id: number, name: string) {
        db.profilesMeta.update(id, {
            path: "/" + name,
        })
    }

    attachWorkspaces(updateCb: (profile: {
        workspaces: UserDataFolder[],
    }) => void): void {
        this.updateWorkspacesCb = updateCb;
        const workspaceObservable = liveQuery (
            () => db.folders.toArray()
        );
        this.workspacesSubscription = workspaceObservable.subscribe({
            next: result => {
                this.updateWorkspacesCb({
                    workspaces: result.map((it): UserDataFolder => {
                        return {
                            id: it.id,
                            name: it.name,
                            path: it.path
                        }
                    }),
                });
            },
            error: error => console.error(error)
        });
    }

    attachProfiles(updateCb: (profile: {
        profiles: UserDataProfileMeta[]
    }) => void): void {
        this.updateProfilesCb = updateCb;
        const profilesObservable = liveQuery (
            () => db.profilesMeta.toArray()
        );
        this.profilesSubscription = profilesObservable.subscribe({
            next: result => {
                this.updateProfilesCb({
                    profiles: result.map((it): UserDataProfileMeta => {
                        return {
                            id: it.id,
                            name: it.name,
                            path: it.path,
                            isLibrary: it.isLibrary,
                            rdnId: it.rdnId,
                            version: it.version
                        }
                    }),
                });
            },
            error: error => console.error(error)
        });
    }

    attachProfile(id: number, updateCb: (profile: ProfileProperty) => void): void {
        this.updateProfileCb = updateCb;
        const profileObservable = liveQuery (
            () => db.profilesProject.where("id").equals(id).first()
        );
        this.profileSubscription = profileObservable.subscribe({
            next: result => {
                const profile: ProfileProperty = JSON.parse(result.setup)

                this.updateProfileCb(profile);
            },
            error: error => console.error(error)
        });
    }

    async getProfiles() {
        const result = await db.profilesMeta.toArray()
        return result.map((it) => {
            return it as UserDataProfileMeta
        })
    }

    getProfile(id: number) {
        return db.profilesProject.where("id").equals(id).first()
    }

    onRemoteClosed(closeCb: () =>
        void) {
    }

    close(): void {
        try {
            if(this.profilesSubscription) {
                this.profilesSubscription.unsubscribe()
            }
            if(this.workspacesSubscription) {
                this.workspacesSubscription.unsubscribe()
            }
            if(this.profileSubscription) {
                this.profileSubscription.unsubscribe()
            }
        } catch (error) {
            console.error("Error during unsubscribe:", error);
        }
    }
}