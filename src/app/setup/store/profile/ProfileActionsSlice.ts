import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {
    ElementReference,
    ElementReferenceType,
    ElementType,
    RenderModeType
} from "../../../common/model/profile/Common";
import {IOParameter} from "../../../common/model/profile/Layer";
import {getElementFromRef} from "../../components/Utils";
import {
    ActionCustomSettings,
    ActionParamMapping,
    ActionProperty,
    ActionRenderSettings,
    ActionRenderSettingsBinding,
    ActionSendDataSettings,
    ActionType
} from "../../../common/model/profile/Actions";
import {
    buildDefaultActionConfigByType,
    buildDefaultActionRenderElementToRender,
    buildDefaultActionRenderOverride, buildDefaultActionSendDataMappingsAndCode
} from "../../DefaultPropertiesActions";
import {RootState} from "../AppStore";
import {ProfilesDeps} from "./Profile";
import {getExpectedNodeInputParams} from "../../../common/utility/CommonUtil";

const actionAdapter = createEntityAdapter({
    selectId: (action: ActionProperty) => action.id,
})

const actionsSlice = createSlice({
    name: 'actions',
    initialState: actionAdapter.getInitialState(),
    reducers: {
        addOne: actionAdapter.addOne,
        updateOne: actionAdapter.updateOne,
        /*
        actionRenderAdd: (state, action: PayloadAction<{ type: EventType,
            deps: ProfileActionsDeps }>) => {
            const [defaultItemId, defaultItem] = buildDefaultAction(
                Object.values(state.entities), action.payload.deps.views
            );
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
        },*/
        actionRemove: (state, action: PayloadAction<{ id: number }>) => {
            const index = state.ids.findIndex(it => it === action.payload.id);
            if (index !== -1) {
                state.ids.splice(index, 1);
            }
            delete state.entities[action.payload.id]
        },
        updateName: (state, action: PayloadAction<{ id: number, name: string }>) => {
            const event = state.entities[action.payload.id];
            event.name = action.payload.name
        },
        updateActionType: (state, action: PayloadAction<{
            id: number,
            actionType: ActionType,
            availableParams: IOParameter[],
            deps: ProfilesDeps
        }>) => {
            const item = state.entities[action.payload.id]
            item.type = action.payload.actionType
            item.config = buildDefaultActionConfigByType(
                action.payload.actionType,
                action.payload.availableParams,
                action.payload.deps
            )
        },
        // Action -> Append Html Component
        updateActionAppendHtmlComponentViewRef: (state, action: PayloadAction<{
            id: number,
            viewRef: ElementReference,
        }>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionRenderSettings
            settings.viewRef = action.payload.viewRef
        },
        updateActionAppendHtmlComponentElement: (state, action: PayloadAction<{ id: number,
            key: keyof ActionRenderSettingsBinding, value: any}>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionRenderSettings
            const element = settings.elementToRender
            element[action.payload.key] = action.payload.value
        },
        addActionAppendHtmlComponentOverride: (state, action: PayloadAction<{
            id: number, htmlRef: ElementReference, availableParams: IOParameter[], deps: ProfilesDeps
        }>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionRenderSettings
            settings.elementToRender.mappings.push(
                buildDefaultActionRenderOverride(
                    action.payload.htmlRef,
                    action.payload.availableParams,
                    action.payload.deps.htmls,
                    action.payload.deps.libraries
                )
            )
        },
        // Action -> Replace Html Properties
        updateActionReplaceHtmlPropertiesViewRef: (state, action: PayloadAction<{
            id: number,
            viewRef: ElementReference,
        }>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionRenderSettings
            settings.viewRef = action.payload.viewRef
        },
        updateActionReplaceHtmlPropertiesElement: (state, action: PayloadAction<{ id: number,
            key: keyof ActionRenderSettingsBinding, value: any}>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionRenderSettings
            const element = settings.elementToRender
            element[action.payload.key] = action.payload.value
        },
        addActionReplaceHtmlPropertiesOverride: (state, action: PayloadAction<{
            id: number, htmlRef: ElementReference, availableParams: IOParameter[], deps: ProfilesDeps
        }>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionRenderSettings
            settings.elementToRender.mappings.push(
                buildDefaultActionRenderOverride(
                    action.payload.htmlRef,
                    action.payload.availableParams,
                    action.payload.deps.htmls,
                    action.payload.deps.libraries
                )
            )
        },
        // Action -> Send Data
        updateActionSendDataChannelRef: (state, action: PayloadAction<{
            id: number,
            channelRef: ElementReference,
        }>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionSendDataSettings
            settings.channelRef = action.payload.channelRef
            settings.nodeId = -1
            settings.mode = RenderModeType.Gui
            settings.code = ''
            settings.mappings = []
        },
        updateActionSendDataNodeId: (state, action: PayloadAction<{
            id: number,
            nodeId: number,
            availableParams: IOParameter[],
            deps: ProfilesDeps
        }>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionSendDataSettings
            settings.nodeId = action.payload.nodeId
            // Find the node in the channel graph and get its input params
            const channel = getElementFromRef(settings.channelRef, action.payload.deps.channels, action.payload.deps.libraries)
            if (channel) {
                const node = channel.config.nodes.find(n => n.id === action.payload.nodeId.toString())
                if (node) {
                    const nodeInputParams = node.data.layerRef
                        ? getExpectedNodeInputParams(node.data.layerRef, action.payload.deps)
                        : [{id: 0, name: "data", type: "Uint8Array" as any}]
                    const mappingsAndCode = buildDefaultActionSendDataMappingsAndCode(
                        nodeInputParams,
                        action.payload.availableParams
                    )
                    settings.mode = RenderModeType.Gui
                    settings.code = mappingsAndCode.code
                    settings.mappings = mappingsAndCode.mappings
                }
            }
        },
        updateActionSendData: (state, action: PayloadAction<{
            id: number,
            key: keyof ActionSendDataSettings,
            value: any,
        }>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionSendDataSettings;
            (settings as any)[action.payload.key] = action.payload.value
        },
        // Action -> Custom
        updateActionCustom: (state, action: PayloadAction<{
            id: number,
            key: keyof ActionCustomSettings,
            value: any,
        }>) => {
            const item = state.entities[action.payload.id]
            const settings = item.config as ActionCustomSettings
            settings[action.payload.key] = action.payload.value
        }
    }
})

export const profileActionsReducer = actionsSlice.reducer
export const profileActionsActions = actionsSlice.actions
export const profileActionsSelectors = actionAdapter.getSelectors((state:RootState) => state.profile.actions)

