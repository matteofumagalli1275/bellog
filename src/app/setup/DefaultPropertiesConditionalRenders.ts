import {generateUniqueName} from "../common/utility/JSUtils";
import {ConditionalRenderProperty} from "../common/model/profile/Filter";
import {
    CompareDataSettings,
    CompareDataType,
    CustomProperty,
    CustomPropertyType,
    ElementReference,
    ElementType, RenderModeSettings,
    RenderModeType
} from "../common/model/profile/Common";
import {getElementFromRef, getEmbeddedRefFromElement, getUndefinedRef} from "./components/Utils";
import {HtmlComponentDiv} from "../common/res/embeddedSetupObjects/htmlComponents/Div";
import {IOParameter} from "../common/model/profile/Layer";
import {HtmlProperty} from "../common/model/profile/Html";
import {Dependency} from "./store/dependencies/dependencies";
import {ActionParamMapping, FunctionActionConfig, FunctionActionMode} from "../common/model/profile/Actions";
import * as beautify from "js-beautify"

export function buildDefaultConditionalRenders(values: ConditionalRenderProperty[]): ConditionalRenderProperty {

    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    const newName = generateUniqueName("Filter", values.map((it) => it.name))

    return {
        id: maxId + 1,
        name: newName,
        channelRef: getUndefinedRef(ElementType.Channel),
        layerId: 0,
        applyToEquivalentLayersInOtherChannels: false,
        compareDataType: CompareDataType.Query,
        compareDataSettings: buildDefaultConditionalRendersCompareDataSettings(CompareDataType.Query, []),
        stopPropagation: false,
        htmlRef: getEmbeddedRefFromElement(HtmlComponentDiv, ElementType.Html),
        renderModeType: RenderModeType.Gui,
        renderModeSettings: {
            mappings: []
        }
    }
}

export function buildDefaultConditionalRendersCompareDataSettings(type: CompareDataType, availableParams: IOParameter[]): CompareDataSettings {
    switch (type) {
        case CompareDataType.Code:
            return {code: beautify(`function(params) {
                //${availableParams.map((it) => "params." + it.name).join(', ')}
                /* Return true to accept the data, false otherwise */
                return true
            }`),}
        case CompareDataType.Query:
            return {query: ""}
    }
}

export function buildDefaultConditionalRendersModeSettings(type: RenderModeType, html: HtmlProperty, availableParams: IOParameter[]): RenderModeSettings {
    const htmlProps = html?.config?.properties ?? [];
    switch (type) {
        case RenderModeType.Code:
            return {code: beautify(`function(htmlElement, params) {
                //${availableParams.map((it) => "params." + it.name).join(', ')}
                /* Two ways to deal with this function:
                 * 1) Return null and modify htmlElement as a normal dom element
                 * 2) Return a map of the properties to assign
                 */
                return {
                    ${htmlProps.map((it) => `["${it.name}"]:${availableParams.length > 0 ?
                    "params." + availableParams[0].name : "null"}`).join(",")}
                }
            }`),}
        case RenderModeType.Gui:
            return {mappings: []}
    }
}

export function buildDefaultConditionalRendersGuiMapping(): ActionParamMapping {

    return {
        destParamName: "",
        sourceParam: {
            bind: false,
            value: ""
        }
    }
}

/**
 * Auto-generate one mapping per HTML property for a conditional render in GUI mode.
 * Function-type properties get a pre-initialized FunctionActionConfig;
 * other properties are auto-bound to available source params by index.
 */
export function buildAutoConditionalRenderGuiMappings(
    htmlProps: CustomProperty[],
    availableParams: IOParameter[]
): ActionParamMapping[] {
    if (!htmlProps || htmlProps.length === 0) return [];

    return htmlProps.map((prop, index) => {
        const isFunction = prop.type === CustomPropertyType.Function;
        return {
            destParamName: prop.name,
            sourceParam: isFunction
                ? { bind: false, value: "" }
                : {
                    bind: availableParams.length > 0,
                    paramFromSource: availableParams.length > 0
                        ? (index < availableParams.length ? availableParams[index].name : availableParams[0].name)
                        : undefined,
                    value: availableParams.length > 0 ? undefined : "",
                },
            ...(isFunction ? { functionAction: buildDefaultFunctionActionConfig() } : {}),
        };
    });
}

export function buildDefaultFunctionActionConfig(): FunctionActionConfig {
    return {
        mode: FunctionActionMode.SendData,
        code: beautify(`function(params) {
    // params: parameters available from the filter context
    // bellog.symbols: access global symbols
    //
    // Example: send data to an output channel
    // bellog.channels.send(channelId, { data: new Uint8Array([0x01, 0x02]) });
}`),
        sendDataConfig: {
            channelRef: getUndefinedRef(ElementType.Channel),
            nodeId: -1,
            mappings: [],
        },
    }
}