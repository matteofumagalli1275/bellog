# Bellog Documentation

- [Security Considerations](SecurityConsiderations.md)
- [TCP via Websockify](Websockify.md)

---

## Introduction

Bellog is a browser-based tool for receiving, decoding, and visualizing data streams in real time. It turns raw bytes — from a serial port, a CAN bus, a clipboard paste, or a TCP socket — into structured, color-coded, filterable views.

You define a **Profile** that describes where data comes from (interface), how it flows through processing stages (channels and layers), and how it is rendered (views and conditional renderings). If you know HTML and JavaScript you can build advanced protocol decoders, dashboards, and interactive tools.

## Requirements

- **Google Chrome** or **Microsoft Edge** for WebSerial (COM / CAN) and ADB support.
- Other Chromium derivatives may not work (e.g. Brave does not expose WebSerial).
- Mobile devices are **not** supported.

---

## Profile Structure

A profile is the top-level configuration unit. It contains all the objects that define a data pipeline.

| Component | Description |
|-----------|-------------|
| [Interfaces](#interfaces) | Data sources and sinks (clipboard, serial, CAN, etc.) |
| [Channels](#channels) | Directed graphs that route data through layers |
| [Layers](#layers) | Middleware functions that transform or decode data |
| [HTML Components](#html-components) | Reusable templates for rendering items |
| [Views](#views) | Tabbed pages that display rendered data |
| [Conditional Renderings](#conditional-renderings) | Rules that decide how each data item is displayed |
| [Events](#events) | Conditions that trigger actions when data matches |
| [Actions](#actions) | Operations executed by events (send data, update HTML, run code) |
| [Scripts & Styles](#scripts--styles) | Global JavaScript and CSS injected into the page |
| [Global Variables](#global-variables) | Exported symbols shared across the profile |
| [Dependencies](#dependencies--libraries) | Library profiles that can be referenced |
| [Settings](#settings) | Global profile configuration |

---

### Interfaces

An interface defines where data comes from (and optionally where it can be sent).

| Driver | Description |
|--------|-------------|
| **Clipboard** | Paste text with Ctrl+V. If an action sends data to this interface, it is copied to the system clipboard. |
| **Serialport (WebSerial)** | Bidirectional serial communication. Configurable baud rate, data bits, stop bits, parity, flow control, and buffer size. Chrome/Edge only. |
| **CAN Bus** | Connect via WebSerial (slcan) or WebSocket (SocketCAN bridge). Supports CAN 2.0 and CAN FD. Optional ID whitelist and default CAN ID for outbound frames. |
| **WebAdb** | Receive Android logcat output via ADB. Chrome/Edge only. |
| **TCP Socket (WebSockify)** | Connect to a TCP server through the Websockify protocol. See the [Websockify guide](Websockify.md). |

Every interface injects `_origin` metadata into each data item:

| Parameter | Type | Description |
|-----------|------|-------------|
| `_origin` | Object | Full origin object |
| `_origin.datetime` | Object | `Date` object of when data was received |
| `_origin.time` | String | Time string (HH:MM:SS.mmm) |
| `_origin.timestamp` | Number | Epoch milliseconds |
| `_origin.can` | Object | CAN-specific metadata (only for CAN interface) |
| `_origin.can.id` | Number | CAN identifier |
| `_origin.can.hex_id` | String | CAN hex identifier (e.g. `0x1A3`) |
| `_origin.can.dlc` | Number | Data Length Code |
| `_origin.can.rtr` | Boolean | Remote Transmission Request flag |
| `_origin.can.ext` | Boolean | Extended frame flag |
| `_origin.can.fd` | Boolean | CAN FD flag |

---

### Channels

A channel is a **directed graph** that defines how data flows from an interface through a chain of layers. Each node in the graph is either the interface input or a layer. Edges connect nodes and can have **route conditions** (Code, Query, or Regex) to conditionally route data down different paths.

There are two channel types:

| Type | Description |
|------|-------------|
| **Input** | Processes incoming data from the interface |
| **Output** | Processes outgoing data to be sent through the interface |

Each edge between nodes can map output parameters of one layer to input parameters of the next via **bindings**.

---

### Layers

Layers are middleware functions that sit between the interface and the views. They receive data, transform it, and pass it downstream. Each layer maintains its own **accumulator** (persistent state between invocations).

Built-in layers:

| Name | Description |
|------|-------------|
| **Line Deserializer** | Splits a byte stream into lines on `\r`/`\n`. Configurable newline characters, discard characters, and max line size. |
| **Line Serializer** | Appends line terminators for outbound data. |

Custom layer signature:

```javascript
function middleware(ctx, accumulator, input, next, throwException, props) {
    // ctx           – runtime context (read-only)
    // accumulator   – persistent state between calls (null on first call)
    // input         – object with fields matching the layer's input parameters
    // next(acc, output, next.next, throwException) – emit output downstream
    // throwException(msg) – signal an error
    // props         – configurable properties defined in the layer setup

    var decoded = decodeMyProtocol(input.data);
    next(accumulator, { data: decoded }, next.next, throwException);
    return accumulator;
}
```

Each layer declares its **input parameters**, **output parameters**, and **properties**:

- **Input/Output parameters** define the shape of data flowing in and out. Types: `Uint8Array`, `String`, `Number`, `Array`, `Object`.
- **Properties** are configurable values (Text, Number, Color) that can be set in the setup UI and accessed via `props`.
- **Deterministic** flag: when enabled, the layer is expected to produce the same output for the same input (used for optimizations).
- **Test code**: optional test cases that validate the layer logic.

---

### HTML Components

HTML components are templates used to render data items in views and as containers for view fragments.

Two frameworks are available:

| Framework | Description |
|-----------|-------------|
| **SimpleTemplateLiteral** | HTML string with `${propName}` placeholders, evaluated as JS template literals. |
| **JavascriptHook** | A function that receives a DOM element and mutates it directly. |

Built-in components:

| Name | Description |
|------|-------------|
| **Div** | `<div>` with color and content |
| **DivWithTimestamp** | `<div>` with formatted timestamp and content |
| **Span** | Inline `<span>` |
| **Raw** | Raw HTML |
| **Button** | Clickable button |

Custom template example:

```html
<div class="m-1">
  <span style="color: ${color}">${new Date(timestamp).toLocaleString()}</span>
  <span>${content}</span>
</div>
```

Each component declares **properties** with types (Text, Number, Color, Function) and default values. Properties can be **bound** to data from the pipeline, to global variables, or set to literal values.

> A SimpleTemplateLiteral component **must** have a single root element.

[Bulma CSS](https://bulma.io/) and Font Awesome are bundled and available in all templates.

---

### Views

Views are tabbed pages displayed at runtime. Each view has a **layout** that divides it into **fragments**.

**Layouts:**

| Layout | Description |
|--------|-------------|
| Full | Single full-width fragment |
| Column2 | Two side-by-side columns |
| Row2 | Two stacked rows |
| Column2Row1 | Two columns on top, one row below |
| Row1Column2 | One row on top, two columns below |
| Column1Row2 | One column on top, two rows below |

**Fragment types:**

| Type | Description |
|------|-------------|
| **Append** | Streaming log — items are appended as they arrive. Supports virtualization for thousands of items. |
| **Fixed** | Static display — a single HTML component is rendered and can be updated via actions. |

Each **Append** fragment has:
- A **container** HTML component that wraps all appended items (can be used for background styling, etc.).
- A list of **conditional renderings** that determine how each item is displayed.

Each **Fixed** fragment references a single HTML component.

---

### Conditional Renderings

Conditional renderings are ordered rules attached to a view fragment. For each data item arriving from the pipeline, the rules are evaluated in order. When a rule matches, it determines which HTML component to use and how to bind data to its properties.

Each rule has:

| Field | Description |
|-------|-------------|
| **Channel & Layer** | Which point in the pipeline this rule listens to |
| **Condition** | How to match data: `Code` (JS function), `Query` (expression), or `Regex` (pattern) |
| **Stop propagation** | If true, stop evaluating further rules after this one matches |
| **HTML component** | Which template to render |
| **Render mode** | `Gui` (map parameters visually) or `Code` (custom JS rendering function) |
| **Mappings** | Bind layer output fields, `_origin.*` metadata, or literal values to HTML template properties |

---

### Events

Events watch the data pipeline and trigger actions when conditions are met.

| Type | Description |
|------|-------------|
| **ChannelUpdate** | Fires when data passes through a specific channel/layer node and matches a condition (Code, Query, or Regex). Triggers an associated action. |

Events can be configured to apply to equivalent layers across channels.

---

### Actions

Actions are operations that can be triggered by events or by HTML button clicks.

| Type | Description |
|------|-------------|
| **SendData** | Sends data to a specific channel/layer node. Parameters can be mapped from the triggering event. |
| **ReplaceHtmlProperties** | Updates the properties of an HTML component in a Fixed view fragment. |
| **Custom** | Executes arbitrary JavaScript code. |

**HTML buttons** can trigger actions via the `data-iwclick` attribute:

```html
<button data-iwclick="myAction" class="button is-primary">Send</button>
```

---

### Scripts & Styles

**Scripts** are global JavaScript files injected into the runtime page. They execute with full page scope. You can define helper functions, import libraries, or set up timers.

**Styles** are global CSS files. They apply to all views and HTML components.

> **Security warning:** scripts execute with full page privileges. Only add code from sources you trust. See [Security Considerations](SecurityConsiderations.md).

---

### Global Variables

Global variables (exported symbols) are named values that can be read and written from scripts, layers, and HTML components. They live in the `window.bellog.symbols` namespace.

Each variable has:
- **Name** — used as `bellog.symbols.<name>` in the namespace
- **Default value** — initial value
- **Public** — whether it is visible to other profiles
- **Persistent** — whether it survives across sessions
- **Description** — documentation

Variables can be bound to HTML component properties, enabling reactive UI updates.

---

### Dependencies & Libraries

A profile can be marked as a **library** by setting `isLibrary: true` in settings and providing a **Reverse Domain Name** identifier (e.g. `org.bellog.canopen-decoder`).

Other profiles can add a library as a **dependency**, which allows them to reference the library's layers, HTML components, and symbols via **Library References** instead of duplicating code.

Dependency rules:
- **EQUAL** — exact version match
- **GREATER_EQUAL** — version must be equal or newer

---

### Settings

| Setting | Description |
|---------|-------------|
| **Is Library** | Marks this profile as a reusable library |
| **RDN ID** | Reverse domain name identifier for libraries |
| **Version** | Semantic version string |
| **Maximum items per view** | Caps the number of rendered items per view fragment (default: 10,000). Items beyond this limit are discarded from the oldest. |

---

## Runtime

The runtime page loads a profile, builds the data pipeline, and connects to the interface.

### Data flow

```
Interface → Channel graph → Layer 1 → Layer 2 → ... → DataBus → Views
                                                           ↓
                                                      Event Engine → Actions
                                                           ↓
                                                        Recorder → IndexedDB
```

The **DataBus** is a lightweight pub/sub system at the center of the runtime. Every data item that exits a channel node is published to the bus. Views, the event engine, and the recorder subscribe independently.

### Toolbar

| Button | Description |
|--------|-------------|
| **Play / Connect** | Open the interface (serial port, CAN adapter, etc.) |
| **Lock-to-bottom** | Auto-scroll to the latest data |
| **Clear** | Clear all views |
| **Record** | Start/stop recording to IndexedDB |
| **Import** | Load a previously recorded session |

### Recording & Playback

The recorder subscribes to all DataBus entries and buffers them to IndexedDB in batches. A recorded session can be replayed with play, pause, seek, and speed controls. Symbol state is captured when recording stops.

When **not** recording, data lives only in memory. Each view fragment keeps up to `maximumItemsPerView` entries in a ring buffer. There is no persistent storage for live data.

---

## Global Hooks

The `window.bellog` object is available from any script, layer, or HTML component at runtime.

### Sending data

```javascript
// Broadcast data to all connected interfaces
bellog.rawSend("hello");
bellog.rawSend(new Uint8Array([0x01, 0x02, 0x03]));

// Send data to a specific interface by id
const ifc = bellog.getInterfaces({ name: "Serial" })[0];
bellog.send(ifc.id, "hello");
```

### Querying interfaces

```javascript
// List all interfaces → [{ id, name, type }, ...]
bellog.getInterfaces();

// Filter by type (matches InterfaceType enum values)
bellog.getInterfaces({ type: "Serialport (WebSerial)" });
bellog.getInterfaces({ type: "CAN Bus" });

// Filter by name
bellog.getInterfaces({ name: "My Serial Port" });

// Combine filters
bellog.getInterfaces({ type: "TCP Socket", name: "Main" });
```

Available `type` values: `"Clipboard"`, `"Serialport (WebSerial)"`, `"CAN Bus"`, `"WebAdb"`, `"TCP Socket"`.

### Global variables (symbols)

```javascript
// Read a declared global variable
const val = bellog.symbols.get("myVar");

// Write a declared global variable
bellog.symbols.set("myVar", 42);
```

Only variables declared in the **Global Variables** table are present in `bellog.symbols`. The initial value comes from the declared default.

### Builder helpers

```javascript
// Use a builder to compose then send
bellog.buildAndSend("LineBuilder", { Text: "text" });
bellog.buildAndSend("HexStringBuilder", { HexString: "AABBCC" });
bellog.buildAndSend("MyCustomBuilder", { param1: 111 });
```

### Driver lifecycle events

```javascript
document.addEventListener("bellog:DriverOpened", function (e) {
    console.log("Driver opened");
});
document.addEventListener("bellog:DriverClosed", function (e) {
    console.log("Driver closed");
});
```

### Copy-pasted libraries

Scripts support the CommonJS `module`/`exports` shim. When pasting a library that uses `module.exports`, expose it to `window` manually:

```javascript
// paste lodash (CommonJS build) here, then:
window._ = module.exports;
```

UMD libraries that detect `window` will write to it automatically and need no extra line.

---

## Sample Profiles

Bellog includes built-in examples accessible via **Import by Example**:

| Profile | Description |
|---------|-------------|
| Clipboard Line Viewer | Paste text, see each line with timestamps |
| JSON Lint | Paste JSON to validate and pretty-print |
| Serial Port Logger | WebSerial line-based log viewer with send capability |
| IoT Device Logger | Serial log with CBOR to JSON decoding, error highlight, alloc tracking (3 views) |
| CANopen Decoder | CAN Bus to CANopen protocol decoder with color-coded message types |

**Sample library:** CANopen Decoder (reusable decoder layer, HTML row component, CSS styles).

---

## SDK / Profiles as Code

For developers who prefer writing profiles as code instead of using the setup UI, see the [vscode-sample](../vscode-sample/) folder. It demonstrates how to split a profile into clean source files (JS layers, HTML templates, CSS) and assemble them into a `.bll` file with a Python build script.

---

## Import / Export

Profiles can be exported as `.bll` files (pure JSON serialization of the profile structure) and imported back. This is useful for sharing profiles or version-controlling them outside the app.

- **Export**: click the download icon in the setup toolbar
- **Import**: click the upload icon in the setup toolbar or in the home page

---

## Debugging

When writing custom JavaScript:

- Use `console.log()` and check browser DevTools.
- Write `debugger;` to trigger a breakpoint:

```javascript
debugger; // browser stops here when DevTools is open
```

---

## Troubleshooting

**Some data is lost using WebSerial**
Check DevTools for errors. Heavy HTML rendering can cause serial buffer overruns. If a view updates too frequently, consider simplifying the HTML or increasing the buffer size in the interface settings.

**Can't see data with WebSerial**
Refresh the page and click the play icon. Verify the baud rate matches your device. Check that your browser supports WebSerial. As a sanity check, create a simple profile with a single view — if raw bytes arrive, the interface works and the issue is in the pipeline.

**Library references not available after adding a dependency**
After adding a library dependency, its references should be available immediately. If not, save the profile and reload.

---

## CAN Bus Setup

### WebSocket Bridge (SocketCAN)

For Linux systems with SocketCAN, use the bundled Python bridge:

```bash
# Virtual CAN (testing)
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
python backends/socketcan/can_websocket_bridge.py --channel vcan0 --token <your-token>

# Real adapter
python backends/socketcan/can_websocket_bridge.py --channel can0 --bitrate 500000 --token <your-token>
```

Requires: `python-can`, `websockets` (pip install).

The `--token` value must match the **WebSocket Token** shown in Bellog's **Settings** page. Bellog appends it automatically as `?token=…` on every connection. If `--token` is omitted the bridge accepts all connections (not recommended outside localhost).

In the CAN interface settings, set the transport to WebSocket and configure the socket URL.

### slcan (WebSerial)

For slcan-compatible adapters, select the WebSerial transport in the CAN interface settings and configure bitrate and bus mode.

---

## FAQ

**Can I trigger an action on a timer?**
Yes — create a `setInterval` in a global script and call `bellog.rawSend()` or `bellog.buildAndSend()`.

**Can I trigger an action when specific data arrives?**
Use an Event with a ChannelUpdate condition. Or call global hooks from within a layer.

**Can I use Bellog for binary protocols?**
Yes — write a custom layer that decodes the binary format. The layer receives `Uint8Array` input and can output structured objects with named fields. See the CANopen Decoder sample for a complex example.

**Can I create a custom interface driver?**
Not directly. For unsupported hardware, use the WebSocket transport of the CAN interface or the TCP Client with a custom bridge application.
