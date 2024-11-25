import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {profileReducer} from "../profile/Profile";
import {RootState} from "../AppStore";

export type Dependency = {
    rdnId: string,
    setup: ReturnType<typeof profileReducer>
}

const librariesAdapter = createEntityAdapter({
    selectId: (dependency: Dependency) => dependency.rdnId,
})

const librariesSlice = createSlice({
    name: 'libraries',
    initialState: librariesAdapter.getInitialState(),
    reducers: {
        addOne: librariesAdapter.addOne,
        removeOne: librariesAdapter.removeOne
    }
})

export const librariesReducer = librariesSlice.reducer
export const librariesExportsActions = librariesSlice.actions
export const librariesExportsSelectors = librariesAdapter.getSelectors((state: RootState) => state.dependencies)