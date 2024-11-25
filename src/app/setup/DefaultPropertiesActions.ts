import {
    ActionParamMapping,
    ActionProperty,
    ActionRenderSettingsBinding,
    ActionSettings,
    ActionType,
} from "../common/model/profile/Actions";
import {ElementReference, ElementType, RenderModeType} from "../common/model/profile/Common";
import {generateUniqueName} from "../common/utility/JSUtils";
import {IOParameter} from "../common/model/profile/Layer";
import {HtmlProperty} from "../common/model/profile/Html";
import {getElementFromRef, getLocalRefFromElement, getUndefinedRef} from "./components/Utils";
import * as beautify from "js-beautify"
import {getExpectedChannelInputParams, getExpectedNodeInputParams} from "../common/utility/CommonUtil";
import {Dependency} from "./store/dependencies/dependencies";
import {ProfilesDeps} from "./store/profile/Profile";

export function buildDefaultActionConfigByType(actionType: ActionType, availableParams: IOParameter[], deps: ProfilesDeps): ActionSettings {
    if (actionType === ActionType.ReplaceHtmlProperties) {
        return {
            viewRef: getUndefinedRef(ElementType.View),
            elementToRender: buildDefaultActionRenderElementToRender(
                getUndefinedRef(ElementType.Html),
                availableParams,
                deps.htmls,
                deps.libraries
            )
        }
    }
    else if (actionType === ActionType.SendData) {

        if (deps.channels.length <= 0) {
            throw new Error("At least a channel is required")
        }
        const ref = getLocalRefFromElement(deps.channels[0], ElementType.Channel)

        return {
            channelRef: ref,
            nodeId: -1,
            mode: RenderModeType.Gui,
            code: '',
            mappings: []
        }
    }
    else if (actionType === ActionType.Custom) {

        if (deps.channels.length <= 0) {
            throw new Error("At least a channel is required")
        }
        return {
            code: beautify(`function(params) {
                //${availableParams.map((it) => "params." + it.name).join(', ')}
            }`),
        }
    }
}

export function buildDefaultAction(values: ActionProperty[],
                                   availableParams: IOParameter[], deps: ProfilesDeps): [number, ActionProperty] {
    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    const newName = generateUniqueName("Action", values.map((it) => it.name))

    const type =  ActionType.ReplaceHtmlProperties
    return [
        maxId + 1, {
            id: maxId + 1,
            name: newName,
            type: type,
            config: buildDefaultActionConfigByType(
                type,
                availableParams,
                deps
            )
        }]
}

export function buildDefaultActionRenderElementToRender(htmlRef: ElementReference, availableParams: IOParameter[], htmls: HtmlProperty[], libraries: Dependency[]): ActionRenderSettingsBinding {
    const html = getElementFromRef(htmlRef, htmls, libraries)
    const properties = html ? html.config.properties : []
    return {
        htmlRef: htmlRef,
        mode: RenderModeType.Gui,
        code: beautify(`function(htmlElement, params) {
                //${availableParams.map((it) => "params." + it.name).join(', ')}
                /* Two ways to deal with this function:
                 * 1) Return null and modify htmlElement as a normal dom element
                 * 2) Return a map of the properties to assign
                 */
                return {
                    ${properties.map((it) => `["${it.name}"]:${availableParams.length > 0 ? 
                        "params." + availableParams[0].name : "null"}`).join(",")}
                }
            }`),
        mappings: []
    }
}

export function buildDefaultActionRenderOverride(htmlRef: ElementReference,
                                                 availableParams: IOParameter[], htmls: HtmlProperty[], libraries: Dependency[]): ActionParamMapping {
    const html = getElementFromRef(htmlRef, htmls, libraries)
    const props = html?.config?.properties ?? []
    const params = availableParams ?? []

    return {
        destParamName: props.length > 0 ? props[0].name : "",
        sourceParam: {
            bind: params.length > 0,
            paramFromSource: params.length > 0 ? params[0].name : undefined,
            value: params.length > 0 ? undefined : ""
        }
    }
}

export function buildDefaultActionSendDataMappingsAndCode(
    nodeInputParams: IOParameter[],
    availableParams: IOParameter[]
): {code: string, mappings: ActionParamMapping[]} {
    if (nodeInputParams.length === 0) return {code: '', mappings: []}
    return {
        code: beautify(`function(params) {
                //${availableParams.map((it) => "params." + it.name).join(', ')}
                return {
                    ${nodeInputParams.map((it) => `["${it.name}"]:${availableParams.length > 0 ? "params." + availableParams[0].name : "null"}`).join(",")}
                }
            }`),
        mappings: nodeInputParams.map((it, index) => {
            return {
                destParamName: it.name,
                sourceParam: {
                    bind: availableParams.length > 0,
                    paramFromSource: availableParams.length > 0
                        ? (index < availableParams.length ? availableParams[index].name : availableParams[0].name)
                        : undefined,
                    value: availableParams.length > 0 ? undefined : "",
                }
            }
        })
    }
}