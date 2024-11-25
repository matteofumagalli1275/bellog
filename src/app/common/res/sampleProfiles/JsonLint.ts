import {ProfileProperty} from "../../model/profile/Profile";
import {SCHEMA_VERSION} from "../../../../Version";
import {InterfaceType} from "../../model/profile/Interface";
import {ChannelType} from "../../model/profile/Channel";
import {CompareDataType, CustomPropertyType, ElementType, IOParameterType, RenderModeType} from "../../model/profile/Common";
import {HtmlComponentDefinitionFramework, HtmlEmbeddedComponentNames} from "../../model/profile/Html";
import {LayoutType, ViewFragmentType, ViewType} from "../../model/profile/View";
import {LayerType} from "../../model/profile/Layer";
import {defaultStyles, embeddedRef, localRef} from "./sampleHelpers";

const jsonLintHtml = `<div class="m-2 p-3" style="background: \${bgColor}; border-radius: 4px; font-family: monospace; white-space: pre-wrap;">\${content}</div>`;

const jsonLintLayer = `function middleware(ctx, accumulator, input, next, throwException, props) {
    var raw = typeof input.data === "string" ? input.data : String.fromCharCode.apply(null, input.data);
    try {
        var parsed = JSON.parse(raw);
        next(accumulator, {data: JSON.stringify(parsed, null, 2), valid: true}, next.next, throwException);
    } catch(e) {
        next(accumulator, {data: "Invalid JSON: " + e.message + "\\n" + raw, valid: false}, next.next, throwException);
    }
    return accumulator;
}`;

export const jsonLint: ProfileProperty = {
    name: "JSON Lint",
    schemaVersion: SCHEMA_VERSION,
    interfaces: [
        {id: 1, name: "Clipboard", type: InterfaceType.InterfaceClipboard, settings: {}, deleted: false}
    ],
    channels: [
        {
            id: 1, name: "Input", type: ChannelType.Input, deleted: false,
            config: {
                interfaceRefs: [],
                nodes: [
                    {id: "0", type: "input", data: {label: "Clipboard", layerRef: null, hidden: false, bindings: []}, position: {x: 250, y: 50}},
                    {id: "1", type: "default", data: {label: "JSON Validator", layerRef: localRef(1, "JSON Validator", ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 200}},
                ],
                edges: [
                    {id: "0-1", source: "0", target: "1", routeConditionType: CompareDataType.Query, routeConditionSettings: {query: ""}, label: ""}
                ]
            }
        }
    ],
    layers: [
        {
            id: 1, name: "JSON Validator", type: LayerType.Layer, disabled: false, deterministic: true,
            config: {
                code: jsonLintLayer,
                input: [{id: 0, name: "data", type: IOParameterType.Uint8Array}],
                output: [
                    {id: 0, name: "data", type: IOParameterType.String},
                    {id: 1, name: "valid", type: IOParameterType.String}
                ],
                properties: [],
                testCode: ""
            }
        }
    ],
    htmls: [
        {
            id: 1, name: "JSON Output", deleted: false,
            type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
            config: {
                code: jsonLintHtml,
                properties: [
                    {id: 1, name: "content", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 2, name: "bgColor", safeHtml: true, type: CustomPropertyType.Color, default: {bind: false, value: "#f5f5f5"}}
                ]
            }
        }
    ],
    conditionalRenderings: [
        {
            id: 1, name: "Valid JSON",
            channelRef: localRef(1, "Input", ElementType.Channel), layerId: 1,
            applyToEquivalentLayersInOtherChannels: false,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.valid === true;"},
            stopPropagation: true,
            htmlRef: localRef(1, "JSON Output", ElementType.Html),
            renderModeType: RenderModeType.Gui,
            renderModeSettings: {mappings: [
                {destParamName: "content", sourceParam: {bind: true, paramFromSource: "data"}},
                {destParamName: "bgColor", sourceParam: {bind: false, value: "#e8f5e9"}},
            ]}
        },
        {
            id: 2, name: "Invalid JSON",
            channelRef: localRef(1, "Input", ElementType.Channel), layerId: 1,
            applyToEquivalentLayersInOtherChannels: false,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.valid === false;"},
            stopPropagation: true,
            htmlRef: localRef(1, "JSON Output", ElementType.Html),
            renderModeType: RenderModeType.Gui,
            renderModeSettings: {mappings: [
                {destParamName: "content", sourceParam: {bind: true, paramFromSource: "data"}},
                {destParamName: "bgColor", sourceParam: {bind: false, value: "#ffebee"}},
            ]}
        }
    ],
    views: [
        {
            id: 1, name: "JSON", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Output", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(1, "Valid JSON", ElementType.ConditionalRendering), localRef(2, "Invalid JSON", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        }
    ],
    events: [],
    actions: [],
    scripts: [],
    scriptsExportedSymbols: [],
    styles: [...defaultStyles],
    dependencies: [],
    settings: {isLibrary: false, rdnId: "", version: "1.0.0", maximumItemsPerView: 10000}
};
