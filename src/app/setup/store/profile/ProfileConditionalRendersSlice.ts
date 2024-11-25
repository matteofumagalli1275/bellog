import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {RootState} from "../AppStore";
import {ConditionalRenderProperty} from "../../../common/model/profile/Filter";
import {CompareDataType} from "../../../common/model/profile/Common";
import {buildDefaultConditionalRendersCompareDataSettings} from "../../DefaultPropertiesConditionalRenders";


const conditionalRendersAdapter = createEntityAdapter({
    selectId: (filter: ConditionalRenderProperty) => filter.id,
})

const conditionalRendersSlice = createSlice({
    name: 'conditionalRenders',
    initialState: conditionalRendersAdapter.getInitialState(),
    reducers: {
        addOne: conditionalRendersAdapter.addOne,
        removeOne: conditionalRendersAdapter.removeOne,
        updateOne: conditionalRendersAdapter.updateOne
    }
})

export const profileConditionalRendersReducers = conditionalRendersSlice.reducer
export const profileConditionalRendersActions = conditionalRendersSlice.actions
export const profileConditionalRendersSelectors = conditionalRendersAdapter.getSelectors((state: RootState) => state.profile.conditionalRenderings)
