import {ProfileProperty} from "../../model/profile/Profile";
import {SCHEMA_VERSION} from "../../../../Version";
import {InterfaceType} from "../../model/profile/Interface";
import {ChannelType} from "../../model/profile/Channel";
import {CompareDataType, CustomPropertyType, ElementType, IOParameterType, RenderModeType} from "../../model/profile/Common";
import {HtmlComponentDefinitionFramework, HtmlEmbeddedComponentNames} from "../../model/profile/Html";
import {LayoutType, ViewFragmentType, ViewType} from "../../model/profile/View";
import {LayerType} from "../../model/profile/Layer";
import {defaultStyles, embeddedRef, localRef} from "./sampleHelpers";

/* ──────────────────────────────────────────────────────
 * CANopen Decoder Layer
 *
 * Input:  data (Uint8Array — raw CAN payload)
 *         Available via _origin.can.*: id, hex_id, dlc, rtr, ext, fd
 *
 * Output: type     — CANopen object type string (NMT, SYNC, EMCY, PDO, SDO, HB, UNKNOWN)
 *         nodeId   — derived node ID (number)
 *         cobId    — COB-ID hex string
 *         detail   — human-readable decode of the payload
 *         hexData  — raw data as hex string
 *         raw      — original data (Uint8Array passthrough)
 * ────────────────────────────────────────────────────── */
const canopenDecoderLayer = `function middleware(ctx, accumulator, input, next, throwException, props) {
    var canId = input._origin && input._origin.can ? input._origin.can.id : 0;
    var hexId = input._origin && input._origin.can ? input._origin.can.hex_id : '0x000';
    var dlc = input._origin && input._origin.can ? input._origin.can.dlc : 0;
    var rtr = input._origin && input._origin.can ? input._origin.can.rtr : false;
    var d = input.data;

    // hex dump of payload
    var hexData = '';
    if (d && d.length) {
        for (var i = 0; i < d.length; i++) {
            hexData += ('0' + d[i].toString(16).toUpperCase()).slice(-2);
            if (i < d.length - 1) hexData += ' ';
        }
    }

    var type = 'UNKNOWN';
    var nodeId = 0;
    var detail = '';

    // ---- NMT Command (COB-ID 0x000) ----
    if (canId === 0x000) {
        type = 'NMT';
        nodeId = dlc >= 2 ? d[1] : 0;
        var cs = dlc >= 1 ? d[0] : -1;
        var cmds = {1:'Start', 2:'Stop', 128:'Pre-Op', 129:'Reset Node', 130:'Reset Comm'};
        detail = (cmds[cs] || 'CMD=0x' + cs.toString(16).toUpperCase()) + ' → Node ' + nodeId;
    }
    // ---- SYNC (COB-ID 0x080) ----
    else if (canId === 0x080 && dlc === 0) {
        type = 'SYNC';
        detail = 'Sync pulse';
    }
    // ---- EMCY (0x081..0x0FF) ----
    else if (canId >= 0x081 && canId <= 0x0FF) {
        type = 'EMCY';
        nodeId = canId - 0x080;
        if (dlc >= 3) {
            var errCode = d[0] | (d[1] << 8);
            var errReg = d[2];
            detail = 'ErrCode=0x' + errCode.toString(16).toUpperCase() + ' Reg=0x' + errReg.toString(16).toUpperCase();
        } else {
            detail = hexData;
        }
    }
    // ---- TPDO1 (0x180..0x1FF) ----
    else if (canId >= 0x180 && canId <= 0x1FF) {
        type = 'TPDO1'; nodeId = canId - 0x180;
        detail = hexData;
    }
    // ---- RPDO1 (0x200..0x27F) ----
    else if (canId >= 0x200 && canId <= 0x27F) {
        type = 'RPDO1'; nodeId = canId - 0x200;
        detail = hexData;
    }
    // ---- TPDO2 (0x280..0x2FF) ----
    else if (canId >= 0x280 && canId <= 0x2FF) {
        type = 'TPDO2'; nodeId = canId - 0x280;
        detail = hexData;
    }
    // ---- RPDO2 (0x300..0x37F) ----
    else if (canId >= 0x300 && canId <= 0x37F) {
        type = 'RPDO2'; nodeId = canId - 0x300;
        detail = hexData;
    }
    // ---- TPDO3 (0x380..0x3FF) ----
    else if (canId >= 0x380 && canId <= 0x3FF) {
        type = 'TPDO3'; nodeId = canId - 0x380;
        detail = hexData;
    }
    // ---- RPDO3 (0x400..0x47F) ----
    else if (canId >= 0x400 && canId <= 0x47F) {
        type = 'RPDO3'; nodeId = canId - 0x400;
        detail = hexData;
    }
    // ---- TPDO4 (0x480..0x4FF) ----
    else if (canId >= 0x480 && canId <= 0x4FF) {
        type = 'TPDO4'; nodeId = canId - 0x480;
        detail = hexData;
    }
    // ---- RPDO4 (0x500..0x57F) ----
    else if (canId >= 0x500 && canId <= 0x57F) {
        type = 'RPDO4'; nodeId = canId - 0x500;
        detail = hexData;
    }
    // ---- SDO TX / Server→Client (0x580..0x5FF) ----
    else if (canId >= 0x580 && canId <= 0x5FF) {
        type = 'SDO_RX'; nodeId = canId - 0x580;
        if (dlc >= 4) {
            var scs = (d[0] >> 5) & 0x07;
            var idx = d[1] | (d[2] << 8);
            var sub = d[3];
            var sdoTypes = {0:'Seg Upload',1:'Seg Download',2:'Init Upload',3:'Init Download',4:'Abort'};
            detail = (sdoTypes[scs] || 'SCS=' + scs) + ' Idx=0x' + idx.toString(16).toUpperCase().padStart(4,'0') + ':' + sub;
            if (scs === 2 && dlc >= 8) {
                var val = d[4] | (d[5]<<8) | (d[6]<<16) | (d[7]<<24);
                detail += ' Val=' + val + ' (0x' + (val >>> 0).toString(16).toUpperCase() + ')';
            }
        } else { detail = hexData; }
    }
    // ---- SDO RX / Client→Server (0x600..0x67F) ----
    else if (canId >= 0x600 && canId <= 0x67F) {
        type = 'SDO_TX'; nodeId = canId - 0x600;
        if (dlc >= 4) {
            var ccs = (d[0] >> 5) & 0x07;
            var idx2 = d[1] | (d[2] << 8);
            var sub2 = d[3];
            var sdoTypes2 = {0:'Seg Download',1:'Init Download',2:'Seg Upload',3:'Init Upload',4:'Abort'};
            detail = (sdoTypes2[ccs] || 'CCS=' + ccs) + ' Idx=0x' + idx2.toString(16).toUpperCase().padStart(4,'0') + ':' + sub2;
            if (ccs === 1 && dlc >= 8) {
                var val2 = d[4] | (d[5]<<8) | (d[6]<<16) | (d[7]<<24);
                detail += ' Val=' + val2 + ' (0x' + (val2 >>> 0).toString(16).toUpperCase() + ')';
            }
        } else { detail = hexData; }
    }
    // ---- Heartbeat / Boot-up (0x700..0x77F) ----
    else if (canId >= 0x700 && canId <= 0x77F) {
        type = 'HB'; nodeId = canId - 0x700;
        if (dlc >= 1) {
            var states = {0:'Boot-up', 4:'Stopped', 5:'Operational', 127:'Pre-Operational'};
            detail = states[d[0]] || 'State=0x' + d[0].toString(16).toUpperCase();
        }
    }
    else {
        detail = hexData;
    }

    // RTR flag
    if (rtr) { type += ' [RTR]'; detail = 'Remote request'; }

    next(accumulator, {
        type: type,
        nodeId: nodeId,
        cobId: hexId,
        detail: detail,
        hexData: hexData,
        raw: d
    }, next.next, throwException);
    return accumulator;
}`;

/* ──────────────────────────────────────────────────────
 * HTML templates for each CANopen object type
 * ────────────────────────────────────────────────────── */

// Shared row template — type badge + COB-ID + Node + Detail + hex dump
const canopenRowHtml =
    '<div class="co-row co-${typeClass}">' +
    '  <span class="co-time">${time}</span>' +
    '  <span class="co-badge">${type}</span>' +
    '  <span class="co-cobid">${cobId}</span>' +
    '  <span class="co-node">N${nodeId}</span>' +
    '  <span class="co-detail">${detail}</span>' +
    '  <span class="co-hex">${hexData}</span>' +
    '</div>';

/* ──────────────────────────────────────────────────────
 * CSS — color-coded per CANopen object type
 * ────────────────────────────────────────────────────── */
const canopenCss = `
.co-row {
  display: flex; align-items: center; gap: 6px;
  padding: 2px 8px; font-family: 'Fira Mono', 'Consolas', monospace; font-size: 0.82em;
  border-bottom: 1px solid #f0f0f0;
}
.co-row:hover { background: #f5f5f5; }
.co-time   { color: #999; min-width: 85px; }
.co-badge  { display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: 700;
             font-size: 0.78em; text-transform: uppercase; min-width: 52px; text-align: center; color: #fff; }
.co-cobid  { color: #546e7a; min-width: 55px; font-weight: 600; }
.co-node   { color: #78909c; min-width: 30px; }
.co-detail { flex: 1; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.co-hex    { color: #b0bec5; font-size: 0.9em; }

/* Type colors */
.co-NMT    .co-badge { background: #e53935; }
.co-SYNC   .co-badge { background: #8e24aa; }
.co-EMCY   .co-badge { background: #d84315; }
.co-TPDO1  .co-badge, .co-TPDO2 .co-badge, .co-TPDO3 .co-badge, .co-TPDO4 .co-badge { background: #1e88e5; }
.co-RPDO1  .co-badge, .co-RPDO2 .co-badge, .co-RPDO3 .co-badge, .co-RPDO4 .co-badge { background: #00897b; }
.co-SDO_TX .co-badge { background: #fb8c00; }
.co-SDO_RX .co-badge { background: #f4511e; }
.co-HB     .co-badge { background: #43a047; }
.co-UNKNOWN .co-badge { background: #78909c; }
`;

/* ──────────────────────────────────────────────────────
 * Code Render — builds the HTML row from layer output fields
 * ────────────────────────────────────────────────────── */
const canopenRenderCode =
    "var type = data.type || 'UNKNOWN';\n" +
    "var typeClass = type.replace(/\\s.*/, '');\n" +  // strip " [RTR]" for CSS class
    "var cobId = data.cobId || '---';\n" +
    "var nodeId = data.nodeId != null ? data.nodeId : '-';\n" +
    "var detail = data.detail || '';\n" +
    "var hexData = data.hexData || '';\n" +
    "var time = data._origin && data._origin.time ? data._origin.time : '';\n" +
    "return '<div class=\"co-row co-' + typeClass + '\">' +\n" +
    "  '<span class=\"co-time\">' + time + '</span>' +\n" +
    "  '<span class=\"co-badge\">' + type + '</span>' +\n" +
    "  '<span class=\"co-cobid\">' + cobId + '</span>' +\n" +
    "  '<span class=\"co-node\">N' + nodeId + '</span>' +\n" +
    "  '<span class=\"co-detail\">' + detail + '</span>' +\n" +
    "  '<span class=\"co-hex\">' + hexData + '</span>' +\n" +
    "'</div>';";

/* ──────────────────────────────────────────────────────
 * CANopen Raw render — just hex dump per frame, for the Raw tab
 * ────────────────────────────────────────────────────── */
const canopenRawRenderCode =
    "var cobId = data._origin && data._origin.can ? data._origin.can.hex_id : '---';\n" +
    "var dlc = data._origin && data._origin.can ? data._origin.can.dlc : 0;\n" +
    "var d = data.data;\n" +
    "var hex = '';\n" +
    "if (d && d.length) { for (var i=0; i<d.length; i++) { hex += ('0'+d[i].toString(16).toUpperCase()).slice(-2)+' '; } }\n" +
    "var time = data._origin && data._origin.time ? data._origin.time : '';\n" +
    "return '<div style=\"font-family:monospace;font-size:0.82em;padding:1px 8px;border-bottom:1px solid #f0f0f0\">' +\n" +
    "  '<span style=\"color:#999;min-width:85px;display:inline-block\">' + time + '</span> ' +\n" +
    "  '<span style=\"color:#546e7a;font-weight:600;min-width:55px;display:inline-block\">' + cobId + '</span> ' +\n" +
    "  '<span style=\"color:#78909c\">[' + dlc + ']</span> ' +\n" +
    "  '<span style=\"color:#333\">' + hex + '</span>' +\n" +
    "'</div>';";

export const canopenDecoder: ProfileProperty = {
    name: "CANopen Decoder",
    schemaVersion: SCHEMA_VERSION,
    interfaces: [
        {
            id: 1, name: "CAN", type: InterfaceType.InterfaceCAN, deleted: false,
            settings: {
                transport: {bind: false, value: "serial"},
                bitrate: {bind: false, value: 500000},
                busMode: {bind: false, value: "normal"},
                canFd: {bind: false, value: false},
                socketUrl: {bind: false, value: "ws://localhost:8080"},
                idWhitelist: {bind: false, value: ""},
                defaultCanId: {bind: false, value: "0x600"},
            }
        }
    ],
    channels: [
        {
            id: 1, name: "CAN Input", type: ChannelType.Input, deleted: false,
            config: {
                interfaceRefs: [],
                nodes: [
                    {id: "0", type: "input", data: {label: "CAN", layerRef: null, hidden: false, bindings: []}, position: {x: 250, y: 50}},
                    {id: "1", type: "default", data: {label: "CANopen Decoder", layerRef: localRef(1, "CANopen Decoder", ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 200}},
                ],
                edges: [
                    {id: "0-1", source: "0", target: "1", routeConditionType: CompareDataType.Query, routeConditionSettings: {query: ""}, label: ""}
                ]
            }
        }
    ],
    layers: [
        {
            id: 1, name: "CANopen Decoder", type: LayerType.Layer, disabled: false, deterministic: true,
            config: {
                code: canopenDecoderLayer,
                input: [{id: 0, name: "data", type: IOParameterType.Uint8Array}],
                output: [
                    {id: 0, name: "type", type: IOParameterType.String},
                    {id: 1, name: "nodeId", type: IOParameterType.Number},
                    {id: 2, name: "cobId", type: IOParameterType.String},
                    {id: 3, name: "detail", type: IOParameterType.String},
                    {id: 4, name: "hexData", type: IOParameterType.String},
                    {id: 5, name: "raw", type: IOParameterType.Uint8Array},
                ],
                properties: [],
                testCode: ""
            }
        }
    ],
    htmls: [
        {
            id: 1, name: "CANopen Row", deleted: false,
            type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
            config: {
                code: canopenRowHtml,
                properties: [
                    {id: 1, name: "typeClass", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "UNKNOWN"}},
                    {id: 2, name: "time", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 3, name: "type", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "?"}},
                    {id: 4, name: "cobId", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "0x000"}},
                    {id: 5, name: "nodeId", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "0"}},
                    {id: 6, name: "detail", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 7, name: "hexData", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                ]
            }
        }
    ],
    conditionalRenderings: [
        // Decoded view — all CANopen frames rendered with color-coded badges
        {
            id: 1, name: "CANopen Frame",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            applyToEquivalentLayersInOtherChannels: false,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        // Heartbeat-only view
        {
            id: 2, name: "Heartbeat Only",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            applyToEquivalentLayersInOtherChannels: false,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.type === 'HB';"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        // SDO-only view
        {
            id: 3, name: "SDO Only",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            applyToEquivalentLayersInOtherChannels: false,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.type === 'SDO_TX' || data.type === 'SDO_RX';"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        // PDO-only view
        {
            id: 4, name: "PDO Only",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            applyToEquivalentLayersInOtherChannels: false,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return /PDO/.test(data.type);"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        // EMCY-only view
        {
            id: 5, name: "EMCY Only",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            applyToEquivalentLayersInOtherChannels: false,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.type === 'EMCY';"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        // Raw CAN view (no decode, just hex)
        {
            id: 6, name: "Raw CAN",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 0,
            applyToEquivalentLayersInOtherChannels: false,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRawRenderCode}
        },
    ],
    views: [
        {
            id: 1, name: "All Frames", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "CANopen", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(1, "CANopen Frame", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 2, name: "SDO", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "SDO Transfer", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(3, "SDO Only", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 3, name: "PDO", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "PDO Data", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(4, "PDO Only", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 4, name: "Heartbeat", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "HB", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(2, "Heartbeat Only", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 5, name: "Raw CAN", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Raw", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(6, "Raw CAN", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
    ],
    events: [],
    actions: [],
    scripts: [],
    scriptsExportedSymbols: [],
    styles: [
        ...defaultStyles,
        {id: 3, name: "canopen.css", code: canopenCss},
    ],
    dependencies: [],
    settings: {isLibrary: false, rdnId: "", version: "1.0.0", maximumItemsPerView: 10000}
};
