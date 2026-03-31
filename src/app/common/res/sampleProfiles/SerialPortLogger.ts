import {ProfileProperty} from "../../model/profile/Profile";
import {SCHEMA_VERSION} from "../../../../Version";
import {InterfaceType} from "../../model/profile/Interface";
import {ChannelType} from "../../model/profile/Channel";
import {CompareDataType, ElementType, RenderModeType} from "../../model/profile/Common";
import {HtmlEmbeddedComponentNames} from "../../model/profile/Html";
import {LayoutType, ViewFragmentType, ViewType} from "../../model/profile/View";
import {LayerEmbeddedNames} from "../../model/profile/Layer";
import {defaultStyles, embeddedRef, localRef} from "./sampleHelpers";

export const serialPortLogger: ProfileProperty = {
    name: "Serial Port Logger",
    schemaVersion: SCHEMA_VERSION,
    interfaces: [
        {
            id: 1, name: "Serial", type: InterfaceType.InterfaceSerialPortWebSerial, deleted: false,
            settings: {
                baudRate: {bind: false, value: 115200},
                dataBits: {bind: false, value: 8},
                stopBits: {bind: false, value: 1},
                parity: {bind: false, value: "none"},
                bufferSize: {bind: false, value: 255},
                flowControl: {bind: false, value: "none"},
            }
        }
    ],
    channels: [
        {
            id: 1, name: "Serial Input", type: ChannelType.Input, deleted: false,
            config: {
                interfaceRefs: [],
                nodes: [
                    {id: "0", type: "input", data: {label: "Serial", layerRef: null, hidden: false, bindings: []}, position: {x: 250, y: 50}},
                    {id: "1", type: "default", data: {label: "Line Deserializer", layerRef: embeddedRef(LayerEmbeddedNames.LineDeserializer, ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 200}},
                ],
                edges: [
                    {id: "0-1", source: "0", target: "1", routeConditionType: CompareDataType.Query, routeConditionSettings: {query: ""}, label: ""}
                ]
            }
        },
        {
            id: 2, name: "Serial Output", type: ChannelType.Output, deleted: false,
            config: {
                interfaceRefs: [],
                nodes: [
                    {id: "0", type: "output", data: {label: "Serial", layerRef: null, hidden: false, bindings: []}, position: {x: 250, y: 50}},
                    {id: "1", type: "default", data: {label: "Line Serializer", layerRef: embeddedRef(LayerEmbeddedNames.LineSerializer, ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 200}},
                ],
                edges: [
                    {id: "1-0", source: "1", target: "0", routeConditionType: CompareDataType.Query, routeConditionSettings: {query: ""}, label: ""}
                ]
            }
        }
    ],
    conditionalRenderings: [
        {
            id: 1, name: "Show Line",
            channelRef: localRef(1, "Serial Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Query, compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.DivWithTimestamp, ElementType.Html),
            renderModeType: RenderModeType.Gui,
            renderModeSettings: {mappings: [
                {destParamName: "content", sourceParam: {bind: true, paramFromSource: "data"}},
                {destParamName: "timestamp", sourceParam: {bind: true, paramFromSource: "_origin.datetime"}},
                {destParamName: "color", sourceParam: {bind: false, value: "#333333"}},
            ]}
        }
    ],
    views: [
        {
            id: 1, name: "Serial Log", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
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
