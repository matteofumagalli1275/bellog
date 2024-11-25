import {ProfileRepositoryFactory} from "../../common/repositories/ProfileRepositoryFactory";
import {createAction, Middleware} from "@reduxjs/toolkit";
import {ProfileRepositoryInterface} from "../../common/repositories/ProfileRepositoryInterface";
import {profileStateSetAction} from "./profile/Profile";
import {statusBarActions} from "./statusBar/statusBarSlice";
import {messageActions} from "./message/messageSlice";
import {convertDbFormatToReduxState, convertReduxStateToDbFormat} from "./DbFormatConverter";
import {dbEntriesActions} from "./dbEntries/dbEntries";
import {ProfileProperty} from "../../common/model/profile/Profile";
import {DependencyRule} from "../../common/model/profile/Dependency";
import {librariesExportsActions} from "./dependencies/dependencies";
import * as semver from 'semver';

export const attachProfileDb = createAction<number>('ATTACH_PROFILE');
export const loadProfileDb = createAction<ProfileProperty>('LOAD_PROFILE');
export const saveProfileDb = createAction<void>('SAVE_PROFILE');
export const detachProfileDb = createAction<void>('DETACH_PROFILE');
export const loadLibrariesDb = createAction<{rdnId: string, version: string, rule: DependencyRule }[]>('LOAD_LIBRARIES_DB');
export const reloadPage = createAction<void>('RELOAD_PAGE');

export const attachDb = createAction<void>('ATTACH_DB');
export const detachDb = createAction<void>('DETACH_DB');
export const createWorkspaceDb = createAction<{name: string}>('CREATE_WORKSPACE');
export const createProfileDb = createAction<{name: string, profile?: ProfileProperty}>('CREATE_PROFILE');
export const deleteWorkspaceDb = createAction<{id: number}>('DELETE_WORKSPACE');
export const deleteProfileDb = createAction<{id: number}>('DELETE_PROFILE');
export const renameWorkspaceDb = createAction<{id: number, name: string}>('RENAME_WORKSPACE');
export const moveProfileToWorkspaceDb = createAction<{id: number, name: string}>('MOVE_PROFILE_TO_WORKSPACE');

export const storeMiddleWare: Middleware<{}, any> = (store) => {
    let repoProfile: ProfileRepositoryInterface;
    let repoProfileId: number
    let repoDb: ProfileRepositoryInterface;

    return (next) => async (action: any) => {
        try {

            switch (action.type) {
                // Profile Setup Page
                case attachProfileDb.type:
                    repoProfileId = action.payload
                    repoProfile = ProfileRepositoryFactory.getRepository()
                    await repoProfile.connect()
                    repoProfile.attachProfile(repoProfileId,(profile) => {
                        // Convert to redux state format
                        const [newState, anomalies] = convertDbFormatToReduxState(profile)
                        store.dispatch(profileStateSetAction(newState));
                        if(anomalies.length > 0) {
                            store.dispatch(statusBarActions.setErrors(anomalies.map((it) => {
                                return {message: it}
                            })))
                        }

                        const dependencies = Object.values(newState.dependencies.entities).map((it) => {
                            return {
                                rdnId: it.rdnId,
                                version: it.version,
                                rule: it.rule
                            }
                        })
                        store.dispatch(loadLibrariesDb(dependencies))
                    })
                    repoProfile.onRemoteClosed(() => {
                        store.dispatch({ type: detachProfileDb.type });
                    })
                    break;

                case loadProfileDb.type:
                    const [newState, anomalies] = convertDbFormatToReduxState(action.payload)
                    store.dispatch(profileStateSetAction(newState));
                    if(anomalies.length > 0) {
                        store.dispatch(statusBarActions.setErrors(anomalies.map((it) => {
                            return {message: it}
                        })))
                    }
                    const dependencies2 = Object.values(newState.dependencies.entities).map((it) => {
                        return {
                            rdnId: it.rdnId,
                            version: it.version,
                            rule: it.rule
                        }
                    })
                    store.dispatch(loadLibrariesDb(dependencies2))

                    break;

                case saveProfileDb.type:
                    const profileState = store.getState().profile;
                    // Libraries must have a valid Reverse Domain Name
                    if (profileState.settings.isLibrary) {
                        const rdnRegex = /^(?:[a-zA-Z][a-zA-Z0-9-]*\.)+[a-zA-Z][a-zA-Z0-9-]*$/;
                        if (!rdnRegex.test(profileState.settings.rdnId || '')) {
                            store.dispatch(messageActions.setError(
                                'Libraries require a valid Reverse Domain Name (e.g. org.bellog.mylib)'
                            ));
                            return;
                        }
                    }
                    const profileDb = convertReduxStateToDbFormat(profileState)
                    // Convert from redux state format to db format
                    await repoProfile.saveProfile(repoProfileId, profileDb)
                    break;

                case detachProfileDb.type:
                    if (repoProfile) repoProfile.close()
                    break;

                case loadLibrariesDb.type:
                    const dependencies: {rdnId: string, version: string, rule: DependencyRule }[] = action.payload
                    const profiles = await repoProfile.getProfiles()
                    let missingDeps = []
                    for (const item of dependencies) {
                        const libraryItems = profiles
                            .filter((it) => it.isLibrary)
                            .filter((it) => it.rdnId === item.rdnId)
                            .filter((it) => {
                                if (item.rule === DependencyRule.EQUAL) {
                                    return semver.eq(it.version, item.version);
                                } else if (item.rule === DependencyRule.GREATER_EQUAL) {
                                    return semver.gte(it.version, item.version);
                                }
                                return false;
                            });
                        if(libraryItems.length > 0) {
                            const librarySetup = await repoProfile.getProfile(libraryItems[0].id)
                            if(librarySetup) {
                                const libraryDb = convertDbFormatToReduxState(JSON.parse(librarySetup.setup))
                                store.dispatch(librariesExportsActions.addOne({rdnId: libraryDb[0].settings.rdnId, setup: libraryDb[0]}))
                            }
                        } else {
                            missingDeps.push(libraryItems)
                        }
                    }
                    if(missingDeps.length > 0) {
                        store.dispatch(statusBarActions.setErrors(missingDeps.map((it) => {
                            return {message: it.rdnId + " is missing"}
                        })))
                    }
                    break;

                case reloadPage.type:
                    // Current dirty trick to refresh libraries
                    //window.location.reload()
                    break;

                // Home Page
                case attachDb.type:
                    repoDb = ProfileRepositoryFactory.getRepository()
                    await repoDb.connect();
                    repoDb.attachProfiles((data) => {
                        store.dispatch(dbEntriesActions.setLibraries(data.profiles.filter((it) => it.isLibrary)))
                        store.dispatch(dbEntriesActions.setProfiles(data.profiles.filter((it) => !it.isLibrary)))
                    });
                    repoDb.attachWorkspaces((data) => {
                        store.dispatch(dbEntriesActions.setWorkspaces(data.workspaces))
                 });
                    repoDb.onRemoteClosed(() => {
                        store.dispatch({ type: detachDb.type });
                    });
                    break;

                case detachDb.type:
                    if (repoDb) repoDb.close();
                    break;

                case createWorkspaceDb.type:
                    await repoDb.createWorkspace(action.payload.name);
                    break;

                case createProfileDb.type:
                    await repoDb.createProfile(action.payload.name, action.payload.profile);
                    break;

                case deleteWorkspaceDb.type:
                    await repoDb.deleteWorkspace(action.payload.id);
                    break;

                case deleteProfileDb.type:
                    await repoDb.deleteProfile(action.payload.id);
                    break;

                case renameWorkspaceDb.type:
                    await repoDb.renameWorkspace(action.payload.id, action.payload.name);
                    break;

                case moveProfileToWorkspaceDb.type:
                    await repoDb.moveProfileToWorkspace(action.payload.id, action.payload.name);
                    break;

                default:
                    break;
            }

            return next(action);
        } catch (error) {
            store.dispatch(messageActions.setError(error.message))
        }
    };
};