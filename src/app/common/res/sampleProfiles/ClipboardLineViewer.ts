import {ProfileProperty} from "../../model/profile/Profile";
import {SCHEMA_VERSION} from "../../../../Version";
import {InterfaceType} from "../../model/profile/Interface";
import {ChannelType} from "../../model/profile/Channel";
import {CompareDataType, ElementType, RenderModeType} from "../../model/profile/Common";
import {HtmlEmbeddedComponentNames} from "../../model/profile/Html";
import {LayoutType, ViewFragmentType, ViewType} from "../../model/profile/View";
import {LayerEmbeddedNames} from "../../model/profile/Layer";
import {defaultStyles, embeddedRef, localRef} from "./sampleHelpers";

export const clipboardLineViewer: ProfileProperty = {
    name: "Clipboard Line Viewer",
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
                    {id: "1", type: "default", data: {label: "Line Deserializer", layerRef: embeddedRef(LayerEmbeddedNames.LineDeserializer, ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 200}},
                ],
                edges: [
                    {id: "0-1", source: "0", target: "1", routeConditionType: CompareDataType.Query, routeConditionSettings: {query: ""}, label: ""}
                ]
            }
        }
    ],
    conditionalRenderings: [
        {
            id: 1, name: "Show Line",
            channelRef: localRef(1, "Input", ElementType.Channel),
            layerId: 1,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.DivWithTimestamp, ElementType.Html),
            renderModeType: RenderModeType.Gui,
            renderModeSettings: {
                mappings: [
                    {destParamName: "content", sourceParam: {bind: true, paramFromSource: "data"}},
                    {destParamName: "timestamp", sourceParam: {bind: true, paramFromSource: "_origin.datetime"}},
                    {destParamName: "color", sourceParam: {bind: false, value: "#333333"}},
                ]
            }
        }
    ],
    views: [
        {
            id: 1, name: "Log", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Lines", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(1, "Show Line", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        }
    ],
    htmls: [],
    layers: [],
    events: [],
    actions: [],
    scripts: [],
    scriptsExportedSymbols: [],
    styles: [...defaultStyles],
    dependencies: [],
    settings: {isLibrary: false, rdnId: "", version: "1.0.0", maximumItemsPerView: 10000}
};
