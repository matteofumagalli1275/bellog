import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {
    buildDefaultInterfaces, buildDefaultInterfaceSettings
} from "../../DefaultProperties";
import {InterfaceSettings, InterfacesProperty, InterfaceType} from "../../../common/model/profile/Interface";
import {Normalize} from "../NormalizedProfile";
import {HtmlProperty} from "../../../common/model/profile/Html";
import {RootState} from "../AppStore";

type ProfileInterfaceRemoveAction = {id: number}
type ProfileInterfaceChangeTypeAction = {id: number, type: InterfaceType}
type ProfileInterfaceUpdateNameAction = {id: number, name: string}
type ProfileInterfaceUpdateArrayAction = {ids: number[]}

const interfaceAdapter = createEntityAdapter({
    selectId: (ifc: InterfacesProperty) => ifc.id,
})

const interfacesSlice = createSlice({
    name: 'interfaces',
    initialState: interfaceAdapter.getInitialState(),
    reducers: {
        interfaceAdd: (state) => {
            const [defaultItemId, defaultItem] = buildDefaultInterfaces(Object.values(state.entities))
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
        },
        interfaceRemove: (state, action: PayloadAction<ProfileInterfaceRemoveAction>) => {
            const index = state.ids.findIndex(it => it === action.payload.id);
            if (index !== -1) {
                state.ids.splice(index, 1);
            }
            delete state.entities[action.payload.id]
        },
        interfaceChangeType: (state, action: PayloadAction<ProfileInterfaceChangeTypeAction>) => {
            state.entities[action.payload.id].type = action.payload.type
            state.entities[action.payload.id].settings = buildDefaultInterfaceSettings(action.payload.type)
        },
        interfaceSetName: (state, action: PayloadAction<ProfileInterfaceUpdateNameAction>) => {
            state.entities[action.payload.id].name = action.payload.name
        },
        interfaceUpdate: (state, action: PayloadAction< {id: number, settings: Partial<InterfaceSettings>}>) => {
            Object.assign(state.entities[action.payload.id].settings, action.payload.settings)
        },
        interfaceSetMany: interfaceAdapter.setMany
    }
})

export const profileInterfacesReducer = interfacesSlice.reducer
export const profileInterfacesActions = interfacesSlice.actions
export const profileInterfacesSelectors = interfaceAdapter.getSelectors((state: RootState) => state.profile.interfaces)