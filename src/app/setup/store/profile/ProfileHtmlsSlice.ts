
import {createEntityAdapter, createSlice, PayloadAction, Update} from "@reduxjs/toolkit";
import {
    HtmlComponentDefinitionFramework,
    HtmlJavascriptHookConfig,
    HtmlProperty,
    HtmlSimpleTemplateLiteralConfig
} from "../../../common/model/profile/Html";
import {BindableVariable, CustomPropertyType} from "../../../common/model/profile/Common";
import {HtmlComponentRaw} from "../../../common/res/embeddedSetupObjects/htmlComponents/Raw";
import {HtmlComponentDiv} from "../../../common/res/embeddedSetupObjects/htmlComponents/Div";
import {
    buildDefaultCustomHtmlElem,
    buildDefaultCustomProperty,
    buildDefaultHtmlParameterDefaultValue
} from "../../DefaultPropertiesHtmls";
import {RootState} from "../AppStore";


const htmlAdapter = createEntityAdapter({
    selectId: (html: HtmlProperty) => html.id,
})

const htmlsSlice = createSlice({
    name: 'htmls',
    initialState: htmlAdapter.getInitialState(),
    reducers: {
        htmlAddOne: htmlAdapter.addOne,
        htmlRemoveOne: htmlAdapter.removeOne,
        htmlRemoveAll: htmlAdapter.removeAll,
        htmlSetMany: htmlAdapter.setMany,
        htmlUpdateType: (state, action: PayloadAction<{ id: number, type: HtmlComponentDefinitionFramework }>) => {
            state.entities[action.payload.id].type = action.payload.type
            if (action.payload.type === HtmlComponentDefinitionFramework.JavascriptHook)
                state.entities[action.payload.id].config = HtmlComponentRaw.config
            else
                state.entities[action.payload.id].config = HtmlComponentDiv.config
        },
        htmlUpdateOne: htmlAdapter.updateOne,
        htmlUpdateTemplateLiteralConfig: (state, action: PayloadAction<{
            id: number,
            changes: Partial<HtmlSimpleTemplateLiteralConfig>
        }>) => {
            const html = state.entities[action.payload.id]
            Object.assign(html.config, action.payload.changes)
        },
        htmlUpdateJavascriptHookConfig: (state, action: PayloadAction<{
            id: number,
            changes: Partial<HtmlJavascriptHookConfig>
        }>) => {
            const html = state.entities[action.payload.id]
            Object.assign(html.config, action.payload.changes)
        }
    }
})

export const profileHtmlsReducer = htmlsSlice.reducer
export const profileHtmlsActions = htmlsSlice.actions
export const profileHtmlsSelectors = htmlAdapter.getSelectors((root: RootState) => root.profile.htmls)