import {createAction, createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {db, DbFolder, DbProfileMeta} from "../../../common/providers/indexedDb/db";
import {UserDataFolder, UserDataProfileMeta} from "../../../common/model/UserData";
import {ProfileState, profileStateSetAction} from "../profile/Profile";

export interface dbEntriesType {
    workspaces: UserDataFolder[],
    profiles: UserDataProfileMeta[],
    libraries: UserDataProfileMeta[]
}

const initialState: dbEntriesType = {
    workspaces: [],
    profiles: [],
    libraries: []
}

const dbEntries = createSlice({
    name: 'dbEntries',
    initialState: initialState,
    reducers: {
        setProfiles: (state, action) => {
            state.profiles = action.payload
        },
        setLibraries: (state, action) => {
            state.libraries = action.payload
        },
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload
        }
    },
    selectors: {
        selectWorkspaces: (state) =>{
            return state.workspaces
        },
        selectLibraries: (state) =>{
            return state.libraries
        },
        selectProfiles: (state) =>{
            return state.profiles
        },
        selectWorkspaceById: (state, id) => {
            return state.workspaces.find((it) => it.id === id)
        },
        selectProfileById: (state, id) => {
            return state.profiles.find((it) => it.id === id)
        },
        selectProfilesByWorkspaceId: (state, id: number) => {
            const workspaceName = state.workspaces.find((it)=> it.id === id)
            return workspaceName ? state.profiles.filter((it) => it.path === '/' + workspaceName.name) : []
        },
        selectLibrariesByWorkspaceId: (state, id: number) => {
            const workspaceName = state.workspaces.find((it)=> it.id === id)
            return workspaceName ? state.libraries.filter((it) => it.path === '/' + workspaceName.name) : []
        }
    }
})

export const dbEntriesRootReducer = (state:dbEntriesType, action) => {
    return dbEntries.reducer(state, action)
};

export const dbEntriesSelectors = dbEntries.selectors
export const dbEntriesActions = dbEntries.actions
export const dbEntriesSelectorsWithParams = dbEntries.getSelectors()