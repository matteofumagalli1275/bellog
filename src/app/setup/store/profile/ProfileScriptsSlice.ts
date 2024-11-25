import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {buildDefaultGlobalScript} from "../../DefaultProperties";
import {Normalize} from "../NormalizedProfile";
import {CodeProperty} from "../../../common/model/profile/Common";
import {ActionProperty} from "../../../common/model/profile/Actions";

type ProfileScriptAddWithData = {name: string, code: string}
type ProfileScriptRemoveAction = {id: number}
type ProfileScriptUpdateAction = {id: number, name: string, code: string}
type ProfileScriptUpdateCodeAction = {id: number, code: string}
type ProfileScriptUpdateNameAction = {id: number, name: string}

const scriptAdapter = createEntityAdapter({
    selectId: (script: CodeProperty) => script.id,
})

const scriptSlice = createSlice({
    name: 'scripts',
    initialState: scriptAdapter.getInitialState({}),
    reducers: {
        scriptAdd: (state) => {
            const [defaultItemId, defaultItem] = buildDefaultGlobalScript(Object.values(state.entities))
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
        },
        scriptAddWithData: (state, action: PayloadAction<ProfileScriptAddWithData>) => {
            const [defaultItemId, defaultItem] = buildDefaultGlobalScript(Object.values(state.entities))
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
            state.entities[defaultItemId].code = action.payload.code
            state.entities[defaultItemId].name = action.payload.name
        },
        scriptRemove: (state, action: PayloadAction<ProfileScriptRemoveAction>) => {
            const index = state.ids.findIndex(it => it === action.payload.id);
            if (index !== -1) {
                state.ids.splice(index, 1);
            }
            delete state.entities[action.payload.id]
        },
        scriptUpdate: (state, action: PayloadAction<ProfileScriptUpdateAction>) => {
            state.entities[action.payload.id].name =  action.payload.name
            state.entities[action.payload.id].code =  action.payload.code
        },
        scriptUpdateName: (state, action: PayloadAction<ProfileScriptUpdateNameAction>) => {
            state.entities[action.payload.id].name =  action.payload.name
        },
        scriptUpdateCode: (state, action: PayloadAction<ProfileScriptUpdateCodeAction>) => {
            state.entities[action.payload.id].code =  action.payload.code
        }
    }
})

export const profileScriptsReducer = scriptSlice.reducer
export const profileScriptsActions = scriptSlice.actions