
import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {
    LayerProperties,
    LayerProperty,
} from "../../../common/model/profile/Layer";
import {RootState} from "../AppStore";

const layerAdapter = createEntityAdapter({
    selectId: (layer: LayerProperty) => layer.id,
})

const layersSlice = createSlice({
    name: 'layers',
    initialState: layerAdapter.getInitialState(),
    reducers: {
        layerAddOne: layerAdapter.addOne,
        layerRemoveAll: layerAdapter.removeAll,
        layerSetMany: layerAdapter.setMany,
        layerRemoveOne: layerAdapter.removeOne,
        layerUpdateOne: layerAdapter.updateOne,
        layerConfigUpdate: (state, action: PayloadAction<{
            id: number,
            changes: Partial<LayerProperties>
        }>) => {
            Object.assign(state.entities[action.payload.id].config, action.payload.changes)
        }
    }
})

export const profileLayersReducer = layersSlice.reducer
export const profileLayersSelector = layerAdapter.getSelectors((state: RootState) => state.profile.layers)
export const profileLayersActions = layersSlice.actions