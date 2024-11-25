import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {buildDefaultExportSymbol, buildDefaultGlobalScript} from "../../DefaultProperties";
import {Normalize} from "../NormalizedProfile";
import {CodeProperty, ScriptExportedSymbols} from "../../../common/model/profile/Common";
import {ActionProperty} from "../../../common/model/profile/Actions";
import {RootState} from "../AppStore";

const scriptExportedSymbolsAdapter = createEntityAdapter({
    selectId: (exported: ScriptExportedSymbols) => exported.id,
})

const scriptExportedSymbolsSlice = createSlice({
    name: 'scriptsExportedSymbols',
    initialState: scriptExportedSymbolsAdapter.getInitialState({}),
    reducers: {
        addOne: (state) => {
            const [defaultItemId, defaultItem] = buildDefaultExportSymbol(Object.values(state.entities))
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
        },
        addBelow: (state, action: PayloadAction<{id: number}>) => {
            const id = action.payload.id
            const [defaultItemId, defaultItem] = buildDefaultExportSymbol(Object.values(state.entities))
            if(state.entities[id]) {
                const insertIndex = state.ids.find(rowId => rowId === id);
                state.ids.splice(insertIndex, 0, defaultItemId);
            } else {
                state.ids.push(defaultItemId)
            }
            state.entities[defaultItemId] = defaultItem
        },
        updateOne: scriptExportedSymbolsAdapter.updateOne,
        scriptRemove: (state, action: PayloadAction<{id: number}>) => {
            const index = state.ids.findIndex(it => it === action.payload.id);
            if (index !== -1) {
                state.ids.splice(index, 1);
            }
            delete state.entities[action.payload.id]
        },
        scriptUpdateName: (state, action: PayloadAction<{id: number, name: string}>) => {
            state.entities[action.payload.id].name =  action.payload.name
        },
        moveUp: (state, action: PayloadAction<{id: number}>) => {
            const index = state.ids.indexOf(action.payload.id);
            if (index > 0) {
                [state.ids[index - 1], state.ids[index]] = [state.ids[index], state.ids[index - 1]];
            }
        },
        moveDown: (state, action: PayloadAction<{id: number}>) => {
            const index = state.ids.indexOf(action.payload.id);
            if (index >= 0 && index < state.ids.length - 1) {
                [state.ids[index], state.ids[index + 1]] = [state.ids[index + 1], state.ids[index]];
            }
        },
    }
})

export const profileExportedSymbolsAdapterReducer = scriptExportedSymbolsSlice.reducer
export const profileExportedSymbolsAdapterActions = scriptExportedSymbolsSlice.actions
export const profileExportedSymbolsAdapterSelectors = scriptExportedSymbolsAdapter.getSelectors((state: RootState) => state.profile.scriptsExportedSymbols)