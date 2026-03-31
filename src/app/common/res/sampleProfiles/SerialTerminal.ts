import {ProfileProperty} from "../../model/profile/Profile";
import {SCHEMA_VERSION} from "../../../../Version";
import {InterfaceType} from "../../model/profile/Interface";
import {ChannelType} from "../../model/profile/Channel";
import {CompareDataType, ElementType} from "../../model/profile/Common";
import {HtmlComponentDefinitionFramework, HtmlEmbeddedComponentNames} from "../../model/profile/Html";
import {LayoutType, ViewFragmentType, ViewType} from "../../model/profile/View";
import {ActionType} from "../../model/profile/Actions";
import {EventType} from "../../model/profile/Event";
import {embeddedRef, localRef} from "./sampleHelpers";

// Called once when the HTML component element is created.
// Opens an xterm.js Terminal inside the element and wires keyboard → bellog.rawSend().
const terminalWidgetCode =
    "if (!this._initialized) {\n" +
    "    this._initialized = true;\n" +
    "    this.style.cssText = 'width:100%;height:100%;display:block;overflow:hidden;';\n" +
    "    var term = new Terminal({\n" +
    "        convertEol: true,\n" +
    "        scrollback: 5000,\n" +
    "        theme: { background: '#0d0d0d', foreground: '#00ff41', cursor: '#00ff41' },\n" +
    "        fontFamily: 'Consolas, \"Courier New\", monospace',\n" +
    "        fontSize: 14,\n" +
    "    });\n" +
    "    term.open(this);\n" +
    "    term.focus();\n" +
    "    this._term = term;\n" +
    "    window._bellogTerm = term;\n" +
    "    term.onData(function(data) {\n" +
    "        try { bellog.rawSend(data); } catch(e) {}\n" +
    "    });\n" +
    "    this.addEventListener('click', function() { term.focus(); });\n" +
    "    // Re-focus terminal on any keydown so no keypress is lost to parent focus stealing\n" +
    "    window.addEventListener('keydown', function() { term.focus(); }, { capture: true, passive: true });\n" +
    "    // Resize terminal when container changes size\n" +
    "    var ro = new ResizeObserver(function() {\n" +
    "        var core = term._core;\n" +
    "        if (!core) return;\n" +
    "        var dims = core._renderService.dimensions;\n" +
    "        if (!dims || !dims.css || !dims.css.cell || !dims.css.cell.width) return;\n" +
    "        var cols = Math.max(2, Math.floor(term.element.clientWidth  / dims.css.cell.width));\n" +
    "        var rows = Math.max(2, Math.floor(term.element.clientHeight / dims.css.cell.height));\n" +
    "        if (cols !== term.cols || rows !== term.rows) term.resize(cols, rows);\n" +
    "    });\n" +
    "    ro.observe(this);\n" +
    "}";

// Runs on every incoming data event — writes raw bytes to xterm.
const updateTerminalCode =
    "if (!window._bellogTerm) return;\n" +
    "var bytes = channelParams.data;\n" +
    "if (bytes instanceof Uint8Array) {\n" +
    "    window._bellogTerm.write(bytes);\n" +
    "} else if (typeof bytes === 'string') {\n" +
    "    window._bellogTerm.write(bytes);\n" +
    "}";

// Profile-level script: show connected/disconnected banners in the terminal.
const terminalEventsCode =
    "function waitForTerm(cb) {\n" +
    "    if (window._bellogTerm) { cb(); } else { setTimeout(function(){ waitForTerm(cb); }, 200); }\n" +
    "}\n" +
    "document.addEventListener('bellog:DriverOpened', function() {\n" +
    "    waitForTerm(function() { window._bellogTerm.writeln('\\r\\n\\x1b[32m[Connected]\\x1b[0m'); });\n" +
    "});\n" +
    "document.addEventListener('bellog:DriverClosed', function() {\n" +
    "    waitForTerm(function() { window._bellogTerm.writeln('\\r\\n\\x1b[31m[Disconnected]\\x1b[0m'); });\n" +
    "});";

const terminalCss =
    "html, body { margin: 0; padding: 0; height: 100%; background: #0d0d0d; }\n" +
    ".xterm-viewport { overflow-y: auto !important; }\n" +
    ".xterm { height: 100%; }\n";

export const serialTerminal: ProfileProperty = {
    name: "Serial Terminal",
    schemaVersion: SCHEMA_VERSION,
    interfaces: [
        {
            id: 1, name: "Serial", type: InterfaceType.InterfaceSerialPortWebSerial, deleted: false,
            settings: {
                baudRate:          {bind: false, value: 115200},
                dataBits:          {bind: false, value: 8},
                stopBits:          {bind: false, value: 1},
                parity:            {bind: false, value: "none"},
                bufferSize:        {bind: false, value: 255},
                flowControl:       {bind: false, value: "none"},
                cacheTimeout:      {bind: false, value: 5},
                cacheMaxElemCount: {bind: false, value: 1},
            }
        }
    ],
    channels: [
        {
            id: 1, name: "Input", type: ChannelType.Input, deleted: false,
            config: {
                interfaceRefs: [],
                nodes: [
                    {id: "0", type: "input", data: {label: "Serial", layerRef: null, hidden: false, bindings: []}, position: {x: 250, y: 50}},
                ],
                edges: []
            }
        }
    ],
    layers: [],
    htmls: [
        {
            id: 1, name: "TerminalWidget", type: HtmlComponentDefinitionFramework.JavascriptHook, deleted: false,
            config: {code: terminalWidgetCode, properties: []}
        }
    ],
    conditionalRenderings: [],
    views: [
        {
            id: 1, name: "Terminal", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Shell", type: ViewFragmentType.Fixed, percent: 100, config: {ui: localRef(1, "TerminalWidget", ElementType.Html)}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        }
    ],
    events: [
        {
            id: 1, name: "OnSerialData", type: EventType.ChannelUpdate, deleted: false,
            config: {
                channelRef: localRef(1, "Input", ElementType.Channel),
                layerId: 0,
                compareType: CompareDataType.Query,
                compareDataSettings: {query: ""},
                actionRef: localRef(1, "UpdateTerminal", ElementType.Action),
            }
        }
    ],
    actions: [
        {
            id: 1, name: "UpdateTerminal", type: ActionType.Custom,
            config: {code: updateTerminalCode}
        }
    ],
    scripts: [
        {id: 1, name: "terminal_events.js", code: terminalEventsCode}
    ],
    scriptsExportedSymbols: [],
    styles: [{id: 1, name: "terminal.css", code: terminalCss}],
    dependencies: [],
    settings: {isLibrary: false, rdnId: "", version: "1.0.0", maximumItemsPerView: 10000}
};
