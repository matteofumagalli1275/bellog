import {HtmlEmbeddedComponentNames} from "./Html";
import {
    CompareDataSettings,
    CompareDataType,
    CustomProperty,
    ElementReference,
    ElementReferenceType,
    ElementType, RenderModeSettings, RenderModeType
} from "./Common";
import {ElementProperty} from "./Element";
import {ChannelNodeLayerData} from "./Channel";
import {ActionParamMapping} from "./Actions";
import {buildDefaultConditionalRendersCompareDataSettings} from "../../../setup/DefaultPropertiesConditionalRenders";



export interface ConditionalRenderProperty {
    id: number,
    name: string,
    channelRef: ElementReference,
    layerId: number,
    applyToEquivalentLayersInOtherChannels: boolean,
    compareDataType: CompareDataType,
    compareDataSettings: CompareDataSettings,
    stopPropagation: boolean,
    htmlRef: ElementReference,
    renderModeType: RenderModeType,
    renderModeSettings: RenderModeSettings
}