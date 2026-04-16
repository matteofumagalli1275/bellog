import {ProfileProperty} from "../../model/profile/Profile";
import {SCHEMA_VERSION} from "../../../../Version";
import {InterfaceType} from "../../model/profile/Interface";
import {ChannelType} from "../../model/profile/Channel";
import {CompareDataType, ElementType, IOParameterType, RenderModeType} from "../../model/profile/Common";
import {HtmlEmbeddedComponentNames} from "../../model/profile/Html";
import {LayoutType, ViewFragmentType, ViewType} from "../../model/profile/View";
import {LayerType} from "../../model/profile/Layer";
import {defaultStyles, embeddedRef, localRef} from "./sampleHelpers";

/* ──────────────────────────────────────────────────────
 * Mouse HID Decoder Layer
 *
 * Input:  data (Uint8Array — raw HID report bytes, report ID already stripped)
 *         _origin.hid.reportId — the HID report ID
 *
 * The decoder handles the two most common USB HID mouse report layouts:
 *
 *   Layout A — 8-bit relative axes (3–4 bytes):
 *     Byte 0: button bitmask  (bit0=left, bit1=right, bit2=middle)
 *     Byte 1: X  (signed int8, relative)
 *     Byte 2: Y  (signed int8, relative)
 *     Byte 3: wheel (signed int8, optional)
 *
 *   Layout B — 16-bit relative axes (5–6 bytes):
 *     Byte 0:   button bitmask
 *     Byte 1–2: X  (signed int16 LE, relative)
 *     Byte 3–4: Y  (signed int16 LE, relative)
 *     Byte 5:   wheel (signed int8, optional)
 *
 * Output fields
 * ─────────────
 *   reportId — HID report ID (number)
 *   buttons  — compact string, e.g. "LR-" (L=left, R=right, M=middle pressed)
 *   left     — left button pressed (boolean)
 *   right    — right button pressed (boolean)
 *   middle   — middle button pressed (boolean)
 *   x        — horizontal movement (signed integer)
 *   y        — vertical movement (signed integer)
 *   wheel    — scroll wheel movement (signed integer)
 *   detail   — human-readable summary string
 *   hexData  — full raw report as hex string
 * ────────────────────────────────────────────────────── */
const mouseDecoderLayer = `function middleware(ctx, accumulator, input, next, throwException, props) {
    var d = input.data;
    var reportId = input._origin && input._origin.hid ? input._origin.hid.reportId : 0;

    function signed8(v) { return (v & 0xFF) > 127 ? (v & 0xFF) - 256 : (v & 0xFF); }
    function signed16(lo, hi) { var v = (lo & 0xFF) | ((hi & 0xFF) << 8); return v > 32767 ? v - 65536 : v; }

    var hexData = '';
    if (d && d.length) {
        for (var i = 0; i < d.length; i++) {
            hexData += ('0' + (d[i] & 0xFF).toString(16).toUpperCase()).slice(-2);
            if (i < d.length - 1) hexData += ' ';
        }
    }

    if (!d || d.length < 3) {
        return next(null, {
            reportId: reportId,
            buttons: '---', left: false, right: false, middle: false,
            x: 0, y: 0, wheel: 0,
            detail: 'Report #' + reportId + ' (' + (d ? d.length : 0) + ' bytes): ' + hexData,
            hexData: hexData
        });
    }

    var bm     = d[0] & 0xFF;
    var left   = !!(bm & 0x01);
    var right  = !!(bm & 0x02);
    var middle = !!(bm & 0x04);
    var btnStr = (left ? 'L' : '-') + (right ? 'R' : '-') + (middle ? 'M' : '-');

    var x = 0, y = 0, wheel = 0;
    if (d.length >= 5) {
        /* 16-bit layout */
        x = signed16(d[1], d[2]);
        y = signed16(d[3], d[4]);
        wheel = d.length >= 6 ? signed8(d[5]) : 0;
    } else {
        /* 8-bit layout */
        x = signed8(d[1]);
        y = signed8(d[2]);
        wheel = d.length >= 4 ? signed8(d[3]) : 0;
    }

    var detail = 'Btn:' + btnStr + '  X:' + (x >= 0 ? '+' : '') + x +
                 '  Y:' + (y >= 0 ? '+' : '') + y +
                 (wheel !== 0 ? '  W:' + (wheel > 0 ? '+' : '') + wheel : '');

    return next(null, {
        reportId: reportId,
        buttons: btnStr, left: left, right: right, middle: middle,
        x: x, y: y, wheel: wheel,
        detail: detail,
        hexData: hexData
    });
}`;

/* ──────────────────────────────────────────────────────
 * CSS
 * ────────────────────────────────────────────────────── */
const mouseCss = `
.hid-row {
  display: flex; align-items: center; gap: 8px;
  padding: 2px 8px; font-family: 'Fira Mono', 'Consolas', monospace; font-size: 0.82em;
  border-bottom: 1px solid #f0f0f0;
}
.hid-row:hover { background: #f5f5f5; }
.hid-time  { color: #999; min-width: 90px; }
.hid-rid   { color: #546e7a; min-width: 40px; }
.hid-btn   { font-weight: 700; min-width: 32px; letter-spacing: 1px; }
.hid-btn.pressed-L { color: #1e88e5; }
.hid-btn.pressed-R { color: #e53935; }
.hid-btn.pressed-M { color: #43a047; }
.hid-move  { color: #333; min-width: 120px; }
.hid-wheel { color: #8e24aa; min-width: 40px; }
.hid-hex   { color: #b0bec5; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.hid-raw-row {
  font-family: 'Fira Mono', 'Consolas', monospace; font-size: 0.82em;
  padding: 2px 8px; border-bottom: 1px solid #f0f0f0; color: #333;
}
.hid-raw-time { color: #999; margin-right: 8px; }
.hid-raw-rid  { color: #546e7a; font-weight: 600; margin-right: 8px; }
`;

/* ──────────────────────────────────────────────────────
 * Render code — decoded events view
 * ────────────────────────────────────────────────────── */
const mouseRenderCode =
    "var time = data._origin && data._origin.time ? data._origin.time : '';\n" +
    "var rid  = 'R' + (data.reportId != null ? data.reportId : '?');\n" +
    "var btn  = data.buttons || '---';\n" +
    "var btnClass = 'hid-btn' +\n" +
    "  (data.left   ? ' pressed-L' : '') +\n" +
    "  (data.right  ? ' pressed-R' : '') +\n" +
    "  (data.middle ? ' pressed-M' : '');\n" +
    "var move = 'X:' + (data.x >= 0 ? '+' : '') + (data.x || 0) +\n" +
    "           '  Y:' + (data.y >= 0 ? '+' : '') + (data.y || 0);\n" +
    "var wheel = data.wheel ? (data.wheel > 0 ? '+' : '') + data.wheel : '';\n" +
    "var hex  = data.hexData || '';\n" +
    "return '<div class=\"hid-row\">' +\n" +
    "  '<span class=\"hid-time\">'  + time  + '</span>' +\n" +
    "  '<span class=\"hid-rid\">'   + rid   + '</span>' +\n" +
    "  '<span class=\"' + btnClass + '\">' + btn + '</span>' +\n" +
    "  '<span class=\"hid-move\">'  + move  + '</span>' +\n" +
    "  '<span class=\"hid-wheel\">' + wheel + '</span>' +\n" +
    "  '<span class=\"hid-hex\">'   + hex   + '</span>' +\n" +
    "'</div>';";

/* ──────────────────────────────────────────────────────
 * Render code — button-press-only events view
 * (only renders when at least one button is pressed)
 * ────────────────────────────────────────────────────── */
const mouseButtonRenderCode =
    "var time = data._origin && data._origin.time ? data._origin.time : '';\n" +
    "var rid  = 'R' + (data.reportId != null ? data.reportId : '?');\n" +
    "var btn  = data.buttons || '---';\n" +
    "var hex  = data.hexData || '';\n" +
    "return '<div class=\"hid-row\">' +\n" +
    "  '<span class=\"hid-time\">'  + time + '</span>' +\n" +
    "  '<span class=\"hid-rid\">'   + rid  + '</span>' +\n" +
    "  '<span class=\"hid-btn pressed-L\">' + btn + '</span>' +\n" +
    "  '<span class=\"hid-hex\">'   + hex  + '</span>' +\n" +
    "'</div>';";

/* ──────────────────────────────────────────────────────
 * Render code — raw hex view (no decode, straight from interface)
 * ────────────────────────────────────────────────────── */
const mouseRawRenderCode =
    "var time = data._origin && data._origin.time ? data._origin.time : '';\n" +
    "var rid  = data._origin && data._origin.hid ? 'R' + data._origin.hid.reportId : 'R?';\n" +
    "var d    = data.data;\n" +
    "var hex  = '';\n" +
    "if (d && d.length) { for (var i = 0; i < d.length; i++) { hex += ('0' + (d[i] & 0xFF).toString(16).toUpperCase()).slice(-2) + ' '; } }\n" +
    "return '<div class=\"hid-raw-row\">' +\n" +
    "  '<span class=\"hid-raw-time\">' + time + '</span>' +\n" +
    "  '<span class=\"hid-raw-rid\">'  + rid  + '</span>' +\n" +
    "  '<span>' + hex.trim() + '</span>' +\n" +
    "'</div>';";

export const mouseInputDecoder: ProfileProperty = {
    name: "Mouse Input Decoder",
    schemaVersion: SCHEMA_VERSION,
    interfaces: [
        {
            id: 1, name: "Mouse", type: InterfaceType.InterfaceWebHid, deleted: false,
            settings: {
                usagePage: {bind: false, value: 0x0001},  // Generic Desktop
                usage:     {bind: false, value: 0x0002},  // Mouse
            }
        }
    ],
    channels: [
        {
            id: 1, name: "HID Input", type: ChannelType.Input, deleted: false,
            config: {
                interfaceRefs: [],
                nodes: [
                    {id: "0", type: "input",   data: {label: "Mouse", layerRef: null, hidden: false, bindings: []}, position: {x: 250, y: 50}},
                    {id: "1", type: "default", data: {label: "Mouse Decoder", layerRef: localRef(1, "Mouse Decoder", ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 200}},
                ],
                edges: [
                    {id: "0-1", source: "0", target: "1", routeConditionType: CompareDataType.Query, routeConditionSettings: {query: ""}, label: ""}
                ]
            }
        }
    ],
    layers: [
        {
            id: 1, name: "Mouse Decoder", type: LayerType.Layer, disabled: false, deterministic: true,
            config: {
                code: mouseDecoderLayer,
                input: [{id: 0, name: "data", type: IOParameterType.Uint8Array}],
                output: [
                    {id: 0, name: "reportId", type: IOParameterType.Number},
                    {id: 1, name: "buttons",  type: IOParameterType.String},
                    {id: 2, name: "left",     type: IOParameterType.Object},
                    {id: 3, name: "right",    type: IOParameterType.Object},
                    {id: 4, name: "middle",   type: IOParameterType.Object},
                    {id: 5, name: "x",        type: IOParameterType.Number},
                    {id: 6, name: "y",        type: IOParameterType.Number},
                    {id: 7, name: "wheel",    type: IOParameterType.Number},
                    {id: 8, name: "detail",   type: IOParameterType.String},
                    {id: 9, name: "hexData",  type: IOParameterType.String},
                ],
                properties: [],
                testCode: ""
            }
        }
    ],
    conditionalRenderings: [
        {
            id: 1, name: "Mouse Event",
            channelRef: localRef(1, "HID Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: mouseRenderCode}
        },
        {
            id: 2, name: "Button Press",
            channelRef: localRef(1, "HID Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "function(data) { return data.left || data.right || data.middle; }"},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: mouseButtonRenderCode}
        },
        {
            id: 3, name: "Raw HID Report",
            channelRef: localRef(1, "HID Input", "Channel" as any), layerId: 0,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: mouseRawRenderCode}
        },
    ],
    views: [
        {
            id: 1, name: "Mouse", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "All Events", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(1, "Mouse Event", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Buttons Only", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(2, "Button Press", ElementType.ConditionalRendering)]}},
                fragment3: {name: "Raw Reports", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(3, "Raw HID Report", ElementType.ConditionalRendering)]}},
            }
        }
    ],
    htmls: [],
    events: [],
    actions: [],
    scripts: [],
    scriptsExportedSymbols: [],
    styles: [
        ...defaultStyles,
        {id: 3, name: "mouse-hid.css", code: mouseCss},
    ],
    dependencies: [],
    settings: {isLibrary: false, rdnId: "", version: "1.0.0", maximumItemsPerView: 10000}
};
