import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {DependencyProperty} from "../../../common/model/profile/Dependency";
import {EventProperty} from "../../../common/model/profile/Event";
import {RootState} from "../AppStore";

const dependencyAdapter = createEntityAdapter({
    selectId: (dependency: DependencyProperty) => dependency.id,
})

const dependenciesSlice = createSlice({
    name: 'dependencies',
    initialState: dependencyAdapter.getInitialState(),
    reducers: {
        addOne: dependencyAdapter.addOne,
        removeOne: dependencyAdapter.removeOne,
        updateOne: dependencyAdapter.updateOne
    }
})

export const profileDependenciesReducer = dependenciesSlice.reducer
export const profileDependenciesActions = dependenciesSlice.actions
export const profileDependenciesSelectors = dependencyAdapter.getSelectors((state: RootState) => state.profile.dependencies)