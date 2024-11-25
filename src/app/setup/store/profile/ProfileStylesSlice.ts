import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {buildDefaultGlobalScript, buildDefaultGlobalStyle, buildDefaultInterfaces} from "../../DefaultProperties";
import {CodeProperty} from "../../../common/model/profile/Common";
import {Normalize} from "../NormalizedProfile";

type ProfileStyleRemoveAction = {id: number}
type ProfileStyleUpdateAction = {id: number, name: string, code: string}
type ProfileStyleAddWithData = { name: string, code: string}
type ProfileStyleUpdateNameAction = {id: number, name: string}
type ProfileStyleUpdateCodeAction = {id: number, code: string}

const styleAdapter = createEntityAdapter({
    selectId: (style: CodeProperty) => style.id,
})

const styleSlice = createSlice({
    name: 'styles',
    initialState: styleAdapter.getInitialState(),
    reducers: {
        styleAdd: (state) => {
            const [defaultItemId, defaultItem] = buildDefaultGlobalStyle(Object.values(state.entities))
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
        },
        styleAddWithData: (state, action: PayloadAction<ProfileStyleAddWithData>) => {
            const [defaultItemId, defaultItem] = buildDefaultGlobalStyle(Object.values(state.entities))
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
            state.entities[defaultItemId].code = action.payload.code
            state.entities[defaultItemId].name = action.payload.name
        },
       styleRemove: (state, action: PayloadAction<ProfileStyleRemoveAction>) => {
           const index = state.ids.findIndex(it => it === action.payload.id);
           if (index !== -1) {
               state.ids.splice(index, 1);
           }
           delete state.entities[action.payload.id]
        },
        styleUpdate: (state, action: PayloadAction<ProfileStyleUpdateAction>) => {
            state.entities[action.payload.id].name =  action.payload.name
            state.entities[action.payload.id].code =  action.payload.code
        },
        styleUpdateName: (state, action: PayloadAction<ProfileStyleUpdateNameAction>) => {
            state.entities[action.payload.id].name =  action.payload.name
        },
        styleUpdateCode: (state, action: PayloadAction<ProfileStyleUpdateCodeAction>) => {
            state.entities[action.payload.id].code =  action.payload.code
        }
    }
})

export const profileStylesReducer = styleSlice.reducer
export const profileStylesActions = styleSlice.actions