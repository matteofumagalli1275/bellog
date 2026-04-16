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
 * Modbus RTU Decoder Layer
 *
 * Input:  data (Uint8Array — raw serial bytes from WebSerial)
 *
 * Frame boundary strategy
 * ───────────────────────
 * Modbus RTU uses a 3.5-character idle time to delimit frames.
 * This is impossible to detect reliably on a non-realtime host, so
 * the decoder instead uses a CRC-validated length approach:
 *
 *   1. For each candidate start in the byte buffer, derive all
 *      plausible frame lengths from the function code (FC) and any
 *      embedded byte-count fields.
 *   2. Validate each candidate with CRC-16/MODBUS.
 *   3. The first candidate whose CRC passes is emitted as a frame.
 *   4. If the buffer grows beyond 256 bytes (the hard Modbus RTU
 *      maximum) without any CRC match, the first byte is discarded
 *      to re-sync.  This keeps the decoder from getting stuck on
 *      corrupted or partial data.
 *
 * Direction ambiguity note
 * ────────────────────────
 * FC 01-04 requests are always 8 bytes; responses are variable.
 * When both interpretations produce the same frame length (e.g. a
 * FC 01 response with byte_count = 3 is also 8 bytes), the decoder
 * labels the frame REQ.  This edge case is rare and expected for a
 * bus-sniffer without hardware direction detection.
 *
 * Output fields
 * ─────────────
 *   addr    — slave address (0 = broadcast)
 *   fc      — function code
 *   fcName  — human-readable function code name
 *   dir     — REQ | RSP | MSG (write single) | ERROR | ?
 *   msgType — category key used for CSS colouring
 *   isError — 1 for exception response, 0 otherwise
 *   exception — exception code (0 if not an error)
 *   detail  — decoded field values in plain text
 *   hexData — full raw frame as hex string
 * ────────────────────────────────────────────────────── */
const modbusRtuDecoderLayer = `function middleware(ctx, accumulator, input, next, throwException, props) {
    var acc = (accumulator === null || accumulator === undefined) ? {buf: [], nextAcc: undefined} : accumulator;

    var d = input.data;
    if (!d || !d.length) return acc;
    for (var bi = 0; bi < d.length; bi++) acc.buf.push(d[bi] & 0xFF);

    /* ── CRC-16/MODBUS (poly 0x8005 reflected, init 0xFFFF) ── */
    function crc16(b, len) {
        var c = 0xFFFF;
        for (var i = 0; i < len; i++) {
            c ^= b[i] & 0xFF;
            for (var j = 0; j < 8; j++) c = (c & 1) ? ((c >>> 1) ^ 0xA001) : (c >>> 1);
        }
        return c;
    }
    function crcOk(b, len) {
        if (len < 4 || len > b.length) return false;
        var comp = crc16(b, len - 2);
        var got  = ((b[len - 1] & 0xFF) << 8) | (b[len - 2] & 0xFF);
        return comp === got;
    }

    var FC_NAMES = {
        1:'Read Coils', 2:'Read Discrete Inputs',
        3:'Read Holding Registers', 4:'Read Input Registers',
        5:'Write Single Coil', 6:'Write Single Register',
        15:'Write Multiple Coils', 16:'Write Multiple Registers',
        17:'Report Server ID', 22:'Mask Write Register',
        23:'Read/Write Multiple Registers', 24:'Read FIFO Queue'
    };
    var EX_NAMES = {
        1:'Illegal Function', 2:'Illegal Data Address', 3:'Illegal Data Value',
        4:'Server Device Failure', 5:'Acknowledge', 6:'Server Device Busy',
        8:'Memory Parity Error', 10:'Gateway Path Unavailable', 11:'Gateway Target Failed'
    };

    function u16(b, off) { return ((b[off] & 0xFF) << 8) | (b[off + 1] & 0xFF); }
    function hx(v) { return ('0' + (v & 0xFF).toString(16).toUpperCase()).slice(-2); }
    function hexStr(b, s, e) {
        var r = '';
        for (var i = s; i < e && i < b.length; i++) r += (i > s ? ' ' : '') + hx(b[i]);
        return r;
    }
    function regStr(b, off, bc) {
        var r = [];
        for (var i = 0; i < bc; i += 2) r.push(u16(b, off + i));
        return r.join(', ');
    }

    /* Returns candidate {len, dir, msgType} objects for the buffer starting at position 0.
       Shorter (more specific) candidates come first so that a variable-
       length response is preferred over the fixed-8 request form when
       their lengths differ.  When both are 8 bytes the REQ candidate
       wins (first in array). */
    function getCandidates(b, L) {
        if (L < 2) return [];
        var fc = b[1] & 0xFF;

        /* Exception response: always 5 bytes regardless of FC */
        if (fc & 0x80) return [{len: 5, dir: 'RSP', msgType: 'ERROR'}];

        switch (fc) {
            case 1: case 2: {
                var cs = [{len: 8, dir: 'REQ', msgType: 'READ_BITS'}];
                if (L >= 3) { var bc = b[2] & 0xFF; if (bc >= 1 && bc <= 250) cs.push({len: 5 + bc, dir: 'RSP', msgType: 'READ_BITS'}); }
                return cs;
            }
            case 3: case 4: {
                var cs2 = [{len: 8, dir: 'REQ', msgType: 'READ_REGS'}];
                if (L >= 3) { var bc2 = b[2] & 0xFF; if (bc2 >= 2 && bc2 <= 250 && !(bc2 & 1)) cs2.push({len: 5 + bc2, dir: 'RSP', msgType: 'READ_REGS'}); }
                return cs2;
            }
            case 5: case 6:
                /* Request and response are identical 8-byte echo */
                return [{len: 8, dir: 'MSG', msgType: 'WRITE_SINGLE'}];
            case 15: {
                var cs3 = [{len: 8, dir: 'RSP', msgType: 'WRITE_MULTI'}];
                if (L >= 7) { var bc3 = b[6] & 0xFF; if (bc3 >= 1 && bc3 <= 246) cs3.push({len: 9 + bc3, dir: 'REQ', msgType: 'WRITE_MULTI'}); }
                return cs3;
            }
            case 16: {
                var cs4 = [{len: 8, dir: 'RSP', msgType: 'WRITE_MULTI'}];
                if (L >= 7) { var bc4 = b[6] & 0xFF; if (bc4 >= 2 && bc4 <= 246 && !(bc4 & 1)) cs4.push({len: 9 + bc4, dir: 'REQ', msgType: 'WRITE_MULTI'}); }
                return cs4;
            }
            case 22:
                return [{len: 10, dir: 'MSG', msgType: 'MASK_WRITE'}];
            case 23: {
                var cs5 = [];
                if (L >= 3)  { var bc5 = b[2]  & 0xFF; if (bc5 >= 2 && bc5 <= 250 && !(bc5 & 1)) cs5.push({len:  5 + bc5, dir: 'RSP', msgType: 'READ_WRITE'}); }
                if (L >= 11) { var bc6 = b[10] & 0xFF; if (bc6 >= 2 && bc6 <= 242 && !(bc6 & 1)) cs5.push({len: 13 + bc6, dir: 'REQ', msgType: 'READ_WRITE'}); }
                return cs5;
            }
            default:
                return [{len: 8, dir: '?', msgType: 'UNKNOWN'}];
        }
    }

    /* Build the human-readable detail string for a validated frame */
    function decodeDetail(b, len, dir, fc) {
        switch (fc) {
            case 1: case 2:
                return dir === 'REQ'
                    ? 'StartAddr=' + u16(b, 2) + '  Qty=' + u16(b, 4)
                    : 'ByteCount=' + (b[2] & 0xFF) + '  Data=[' + hexStr(b, 3, 3 + (b[2] & 0xFF)) + ']';
            case 3: case 4:
                return dir === 'REQ'
                    ? 'StartReg=' + u16(b, 2) + '  Qty=' + u16(b, 4)
                    : 'Regs=[' + regStr(b, 3, b[2] & 0xFF) + ']';
            case 5: {
                var cv = u16(b, 4);
                return 'CoilAddr=' + u16(b, 2) + '  Value=' + (cv === 0xFF00 ? 'ON' : cv === 0 ? 'OFF' : '0x' + cv.toString(16).toUpperCase());
            }
            case 6:
                return 'RegAddr=' + u16(b, 2) + '  Value=' + u16(b, 4) + ' (0x' + u16(b, 4).toString(16).toUpperCase() + ')';
            case 15:
                return dir === 'REQ'
                    ? 'StartAddr=' + u16(b, 2) + '  Qty=' + u16(b, 4) + '  Data=[' + hexStr(b, 7, 7 + (b[6] & 0xFF)) + ']'
                    : 'StartAddr=' + u16(b, 2) + '  Qty=' + u16(b, 4);
            case 16:
                return dir === 'REQ'
                    ? 'StartReg=' + u16(b, 2) + '  Qty=' + u16(b, 4) + '  Values=[' + regStr(b, 7, b[6] & 0xFF) + ']'
                    : 'StartReg=' + u16(b, 2) + '  Qty=' + u16(b, 4);
            case 22:
                return 'Reg=' + u16(b, 2) + '  AndMask=0x' + u16(b, 4).toString(16).toUpperCase() + '  OrMask=0x' + u16(b, 6).toString(16).toUpperCase();
            case 23:
                return dir === 'REQ'
                    ? 'ReadStart=' + u16(b, 2) + '  ReadQty=' + u16(b, 4) + '  WriteStart=' + u16(b, 6) + '  WriteQty=' + u16(b, 8)
                    : 'Regs=[' + regStr(b, 3, b[2] & 0xFF) + ']';
            default:
                return hexStr(b, 2, len - 2);
        }
    }

    /* Main extraction loop — safety counter prevents runaway on garbage data */
    var safety = 512;
    while (acc.buf.length >= 4 && safety-- > 0) {
        var addr = acc.buf[0] & 0xFF;
        /* Valid Modbus RTU slave addresses: 0 (broadcast) … 247; 248-255 reserved */
        if (addr > 247) { acc.buf.shift(); continue; }

        var fc = acc.buf[1] & 0xFF;
        var candidates = getCandidates(acc.buf, acc.buf.length);
        if (!candidates.length) { acc.buf.shift(); continue; }

        var matched = false;
        for (var ci = 0; ci < candidates.length; ci++) {
            var cand = candidates[ci];
            /* Hard Modbus RTU maximum frame size is 256 bytes */
            if (cand.len > 256 || cand.len < 4) continue;
            /* Need more bytes — wait for next chunk */
            if (acc.buf.length < cand.len) continue;
            if (!crcOk(acc.buf, cand.len)) continue;

            /* Valid CRC — extract the frame */
            var frame = acc.buf.splice(0, cand.len);
            var isErr  = !!(fc & 0x80);
            var realFc = isErr ? (fc & 0x7F) : fc;
            var fcName = isErr
                ? ('Error (FC=0x' + realFc.toString(16).toUpperCase() + ')')
                : (FC_NAMES[realFc] || 'FC=0x' + realFc.toString(16).toUpperCase());
            var exCode = isErr && frame.length >= 3 ? (frame[2] & 0xFF) : 0;
            var detail = isErr
                ? (EX_NAMES[exCode] || 'Exception 0x' + exCode.toString(16).toUpperCase())
                : decodeDetail(frame, cand.len, cand.dir, realFc);

            /* Thread acc.nextAcc through each next() call so that downstream
               layer accumulators are also preserved across chunks */
            acc.nextAcc = next(acc.nextAcc, {
                addr:     addr,
                fc:       realFc,
                fcName:   fcName,
                dir:      cand.dir,
                msgType:  cand.msgType,
                isError:  isErr ? 1 : 0,
                exception: exCode,
                detail:   detail,
                hexData:  hexStr(frame, 0, frame.length)
            }, next.next, throwException);

            matched = true;
            break;
        }

        if (!matched) {
            /* If the buffer exceeds the maximum Modbus RTU frame size with
               no CRC match, discard the first byte to advance the search
               window.  Otherwise wait for more data to arrive. */
            if (acc.buf.length > 256) acc.buf.shift();
            else break;
        }
    }

    return acc;
}`;

/* ──────────────────────────────────────────────────────
 * HTML row template
 * ────────────────────────────────────────────────────── */
const modbusRowHtml =
    '<div class="mb-row mb-${msgType}">' +
    '  <span class="mb-time">${time}</span>' +
    '  <span class="mb-dir mb-dir-${dir}">${dir}</span>' +
    '  <span class="mb-addr">@${addr}</span>' +
    '  <span class="mb-badge">${fcBadge}</span>' +
    '  <span class="mb-fcname">${fcName}</span>' +
    '  <span class="mb-detail">${detail}</span>' +
    '  <span class="mb-hex">${hexData}</span>' +
    '</div>';

/* ──────────────────────────────────────────────────────
 * CSS — colour-coded by message category
 * ────────────────────────────────────────────────────── */
const modbusCss = `
.mb-row {
  display: flex; align-items: center; gap: 6px;
  padding: 2px 8px; font-family: 'Fira Mono', 'Consolas', monospace; font-size: 0.82em;
  border-bottom: 1px solid #f0f0f0;
}
.mb-row:hover { background: #f7f7f7; }

.mb-time   { color: #999; min-width: 90px; flex-shrink: 0; }
.mb-dir    { display: inline-block; padding: 1px 5px; border-radius: 3px;
             font-weight: 700; font-size: 0.75em; min-width: 36px; text-align: center;
             flex-shrink: 0; }
.mb-addr   { color: #546e7a; font-weight: 600; min-width: 34px; flex-shrink: 0; }
.mb-badge  { display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: 700;
             font-size: 0.78em; min-width: 46px; text-align: center; color: #fff;
             flex-shrink: 0; }
.mb-fcname { color: #546e7a; min-width: 210px; flex-shrink: 0;
             overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mb-detail { flex: 1; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mb-hex    { color: #b0bec5; font-size: 0.9em; flex-shrink: 0; }

/* Direction badge colours */
.mb-dir-REQ   { background: #1565C0; color: #fff; }
.mb-dir-RSP   { background: #2E7D32; color: #fff; }
.mb-dir-MSG   { background: #E65100; color: #fff; }
.mb-dir-ERROR { background: #C62828; color: #fff; }
.mb-dir-\\?   { background: #607D8B; color: #fff; }

/* Function-code badge colours per category */
.mb-READ_BITS   .mb-badge { background: #1976D2; }
.mb-READ_REGS   .mb-badge { background: #0288D1; }
.mb-WRITE_SINGLE .mb-badge { background: #F57C00; }
.mb-WRITE_MULTI  .mb-badge { background: #7B1FA2; }
.mb-READ_WRITE   .mb-badge { background: #00695C; }
.mb-MASK_WRITE   .mb-badge { background: #558B2F; }
.mb-ERROR        .mb-badge { background: #C62828; }
.mb-UNKNOWN      .mb-badge { background: #78909C; }

/* Error rows get a subtle background tint */
.mb-ERROR { background: #fff5f5; }
.mb-ERROR:hover { background: #ffe8e8; }
`;

/* ──────────────────────────────────────────────────────
 * Render code — decoded frames
 * ────────────────────────────────────────────────────── */
const modbusRenderCode =
    "var addr    = data.addr    != null ? data.addr    : '?';\n" +
    "var fc      = data.fc      != null ? '0x' + data.fc.toString(16).toUpperCase().padStart(2,'0') : '?';\n" +
    "var fcName  = data.fcName  || '';\n" +
    "var dir     = data.dir     || '?';\n" +
    "var msgType = data.msgType || 'UNKNOWN';\n" +
    "var detail  = data.detail  || '';\n" +
    "var hexData = data.hexData || '';\n" +
    "var time    = data._origin && data._origin.time ? data._origin.time : '';\n" +
    "var DIRS    = ['REQ','RSP','MSG','ERROR'];\n" +
    "var dirClass = 'mb-dir-' + (DIRS.indexOf(dir) >= 0 ? dir : '?');\n" +
    "return '<div class=\"mb-row mb-' + msgType + '\">' +\n" +
    "  '<span class=\"mb-time\">'   + time    + '</span>' +\n" +
    "  '<span class=\"mb-dir '     + dirClass + '\">' + dir    + '</span>' +\n" +
    "  '<span class=\"mb-addr\">@' + addr    + '</span>' +\n" +
    "  '<span class=\"mb-badge\">'  + fc      + '</span>' +\n" +
    "  '<span class=\"mb-fcname\">' + fcName  + '</span>' +\n" +
    "  '<span class=\"mb-detail\">' + detail  + '</span>' +\n" +
    "  '<span class=\"mb-hex\">'    + hexData + '</span>' +\n" +
    "'</div>';";

/* ──────────────────────────────────────────────────────
 * Render code — raw serial byte chunks (no decode)
 * ────────────────────────────────────────────────────── */
const modbusRawRenderCode =
    "var d    = data.data;\n" +
    "var hex  = '';\n" +
    "if (d && d.length) { for (var i = 0; i < d.length; i++) hex += ('0' + (d[i] & 0xFF).toString(16).toUpperCase()).slice(-2) + ' '; }\n" +
    "var time = data._origin && data._origin.time ? data._origin.time : '';\n" +
    "return '<div style=\"font-family:monospace;font-size:0.82em;padding:2px 8px;border-bottom:1px solid #f0f0f0\">' +\n" +
    "  '<span style=\"color:#999;min-width:90px;display:inline-block\">'  + time + '</span>' +\n" +
    "  '<span style=\"color:#aaa;margin:0 6px\">[' + (d ? d.length : 0) + 'B]</span>' +\n" +
    "  '<span style=\"color:#333\">' + hex + '</span>' +\n" +
    "'</div>';";

export const modbusRtuDecoder: ProfileProperty = {
    name: "Modbus RTU Decoder",
    schemaVersion: SCHEMA_VERSION,
    interfaces: [
        {
            id: 1, name: "Serial", type: InterfaceType.InterfaceSerialPortWebSerial, deleted: false,
            settings: {
                baudRate:    {bind: false, value: 9600},
                dataBits:    {bind: false, value: 8},
                stopBits:    {bind: false, value: 1},
                parity:      {bind: false, value: "none"},
                bufferSize:  {bind: false, value: 256},
                flowControl: {bind: false, value: "none"},
                cacheTimeout: 5,
                cacheMaxElemCount: 1
            }
        }
    ],
    channels: [
        {
            id: 1, name: "Serial Input", type: ChannelType.Input, deleted: false,
            config: {
                interfaceRefs: [],
                nodes: [
                    {id: "0", type: "input",   data: {label: "Serial",              layerRef: null,                                                                           hidden: false, bindings: []}, position: {x: 250, y:  50}},
                    {id: "1", type: "default", data: {label: "Modbus RTU Decoder",  layerRef: localRef(1, "Modbus RTU Decoder", ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 200}},
                ],
                edges: [
                    {id: "0-1", source: "0", target: "1", routeConditionType: CompareDataType.Query, routeConditionSettings: {query: ""}, label: ""}
                ]
            }
        }
    ],
    layers: [
        {
            id: 1, name: "Modbus RTU Decoder", type: LayerType.Layer, disabled: false,
            /* State is accumulated across calls via window.bellog.symbols */
            deterministic: true,
            config: {
                code: modbusRtuDecoderLayer,
                input: [
                    {id: 0, name: "data", type: IOParameterType.Uint8Array}
                ],
                output: [
                    {id: 0, name: "addr",      type: IOParameterType.Number},
                    {id: 1, name: "fc",        type: IOParameterType.Number},
                    {id: 2, name: "fcName",    type: IOParameterType.String},
                    {id: 3, name: "dir",       type: IOParameterType.String},
                    {id: 4, name: "msgType",   type: IOParameterType.String},
                    {id: 5, name: "isError",   type: IOParameterType.Number},
                    {id: 6, name: "exception", type: IOParameterType.Number},
                    {id: 7, name: "detail",    type: IOParameterType.String},
                    {id: 8, name: "hexData",   type: IOParameterType.String},
                ],
                properties: [],
                testCode: `function test(props) {
    /* ── helpers ────────────────────────────────────────────── */
    function crc16(bytes) {
        var c = 0xFFFF;
        for (var i = 0; i < bytes.length; i++) {
            c ^= bytes[i] & 0xFF;
            for (var j = 0; j < 8; j++) c = (c & 1) ? ((c >>> 1) ^ 0xA001) : (c >>> 1);
        }
        return c;
    }
    /* Build a complete RTU frame: input bytes + CRC-16/MODBUS appended */
    function frame(bytes) {
        var crc = crc16(bytes);
        return new Uint8Array(bytes.concat([crc & 0xFF, (crc >> 8) & 0xFF]));
    }
    /* Space-separated uppercase hex string (matches the layer's hexData field) */
    function toHex(arr) {
        return Array.from(arr).map(function(b) {
            return ('0' + (b & 0xFF).toString(16).toUpperCase()).slice(-2);
        }).join(' ');
    }
    /* Concatenate multiple Uint8Arrays into one */
    function concat() {
        var total = 0, off = 0;
        for (var i = 0; i < arguments.length; i++) total += arguments[i].length;
        var out = new Uint8Array(total);
        for (var i = 0; i < arguments.length; i++) { out.set(arguments[i], off); off += arguments[i].length; }
        return out;
    }

    /* ── test frames ─────────────────────────────────────────── */
    var fc03req = frame([0x01, 0x03, 0x00, 0x00, 0x00, 0x02]);                              // Read 2 holding regs @ 0
    var fc03rsp = frame([0x01, 0x03, 0x04, 0x12, 0x34, 0x56, 0x78]);                        // Response: regs [4660, 22136]
    var fc06msg = frame([0x05, 0x06, 0x00, 0x64, 0x01, 0x2C]);                              // Write single reg 100 = 300
    var fc03err = frame([0x01, 0x83, 0x02]);                                                 // FC03 exception: Illegal Data Address
    var fc10rsp = frame([0x01, 0x10, 0x00, 0x00, 0x00, 0x02]);                              // Write-multi response (8 bytes)
    var fc10req = frame([0x01, 0x10, 0x00, 0x00, 0x00, 0x02, 0x04, 0x00, 0x64, 0x00, 0xC8]); // Write 2 regs: [100, 200]
    var fc01req = frame([0x01, 0x01, 0x00, 0x00, 0x00, 0x08]);                              // Read 8 coils @ 0
    var fc01rsp = frame([0x01, 0x01, 0x01, 0xAB]);                                           // Response: 1 byte of coil data

    return [
        /* FC03 Read Holding Registers — request (fixed 8-byte frame) */
        {test: {data: fc03req},
         expected: [{addr: 1, fc: 3, fcName: 'Read Holding Registers', dir: 'REQ', msgType: 'READ_REGS',
                     isError: 0, exception: 0, detail: 'StartReg=0  Qty=2', hexData: toHex(fc03req)}]},

        /* FC03 Read Holding Registers — response (5 + byte_count bytes).
           bc=4 → 9 bytes total; CRC disambiguates it from the 8-byte REQ form */
        {test: {data: fc03rsp},
         expected: [{addr: 1, fc: 3, fcName: 'Read Holding Registers', dir: 'RSP', msgType: 'READ_REGS',
                     isError: 0, exception: 0, detail: 'Regs=[4660, 22136]', hexData: toHex(fc03rsp)}]},

        /* FC06 Write Single Register — request and response are identical echoes */
        {test: {data: fc06msg},
         expected: [{addr: 5, fc: 6, fcName: 'Write Single Register', dir: 'MSG', msgType: 'WRITE_SINGLE',
                     isError: 0, exception: 0, detail: 'RegAddr=100  Value=300 (0x12C)', hexData: toHex(fc06msg)}]},

        /* Exception response — FC03 error with code 02 (Illegal Data Address) */
        {test: {data: fc03err},
         expected: [{addr: 1, fc: 3, fcName: 'Error (FC=0x3)', dir: 'RSP', msgType: 'ERROR',
                     isError: 1, exception: 2, detail: 'Illegal Data Address', hexData: toHex(fc03err)}]},

        /* FC16 Write Multiple Registers — response (always 8 bytes) */
        {test: {data: fc10rsp},
         expected: [{addr: 1, fc: 16, fcName: 'Write Multiple Registers', dir: 'RSP', msgType: 'WRITE_MULTI',
                     isError: 0, exception: 0, detail: 'StartReg=0  Qty=2', hexData: toHex(fc10rsp)}]},

        /* FC16 Write Multiple Registers — request (9 + bc bytes; bc=4 → 13 bytes) */
        {test: {data: fc10req},
         expected: [{addr: 1, fc: 16, fcName: 'Write Multiple Registers', dir: 'REQ', msgType: 'WRITE_MULTI',
                     isError: 0, exception: 0, detail: 'StartReg=0  Qty=2  Values=[100, 200]', hexData: toHex(fc10req)}]},

        /* FC01 Read Coils — request (fixed 8-byte frame) */
        {test: {data: fc01req},
         expected: [{addr: 1, fc: 1, fcName: 'Read Coils', dir: 'REQ', msgType: 'READ_BITS',
                     isError: 0, exception: 0, detail: 'StartAddr=0  Qty=8', hexData: toHex(fc01req)}]},

        /* FC01 Read Coils — response (5 + 1 = 6 bytes).
           The 8-byte REQ candidate is skipped because buf.length < 8, so RSP wins */
        {test: {data: fc01rsp},
         expected: [{addr: 1, fc: 1, fcName: 'Read Coils', dir: 'RSP', msgType: 'READ_BITS',
                     isError: 0, exception: 0, detail: 'ByteCount=1  Data=[AB]', hexData: toHex(fc01rsp)}]},

        /* Reserved addresses 0xFF and 0xFE (> 247) are discarded byte-by-byte;
           the valid FC06 frame following them is still decoded correctly */
        {test: {data: concat(new Uint8Array([0xFF, 0xFE]), fc06msg)},
         expected: [{addr: 5, fc: 6, fcName: 'Write Single Register', dir: 'MSG', msgType: 'WRITE_SINGLE',
                     isError: 0, exception: 0, detail: 'RegAddr=100  Value=300 (0x12C)', hexData: toHex(fc06msg)}]},

        /* Two complete frames in a single serial chunk — both emitted in order */
        {test: {data: concat(fc03req, fc06msg)},
         expected: [
             {addr: 1, fc: 3, fcName: 'Read Holding Registers', dir: 'REQ', msgType: 'READ_REGS',
              isError: 0, exception: 0, detail: 'StartReg=0  Qty=2', hexData: toHex(fc03req)},
             {addr: 5, fc: 6, fcName: 'Write Single Register', dir: 'MSG', msgType: 'WRITE_SINGLE',
              isError: 0, exception: 0, detail: 'RegAddr=100  Value=300 (0x12C)', hexData: toHex(fc06msg)}
         ]},
    ];
}`
            }
        }
    ],
    htmls: [
        {
            id: 1, name: "Modbus Row", deleted: false,
            type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
            config: {
                code: modbusRowHtml,
                properties: [
                    {id: 1, name: "msgType", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "UNKNOWN"}},
                    {id: 2, name: "time",    safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 3, name: "dir",     safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "?"}},
                    {id: 4, name: "addr",    safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "0"}},
                    {id: 5, name: "fcBadge", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "0x01"}},
                    {id: 6, name: "fcName",  safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 7, name: "detail",  safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 8, name: "hexData", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                ]
            }
        }
    ],
    conditionalRenderings: [
        // ── All decoded frames ─────────────────────────────────────
        {
            id: 1, name: "All Messages",
            channelRef: localRef(1, "Serial Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: localRef(1, "Modbus Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: modbusRenderCode}
        },
        // ── Exception / error responses ────────────────────────────
        {
            id: 2, name: "Errors Only",
            channelRef: localRef(1, "Serial Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "function(data) { return data.isError === 1; }"},
            stopPropagation: false,
            htmlRef: localRef(1, "Modbus Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: modbusRenderCode}
        },
        // ── FC 01-04: read coils / discrete inputs / registers ─────
        {
            id: 3, name: "Read Operations",
            channelRef: localRef(1, "Serial Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "function(data) { return data.msgType === 'READ_BITS' || data.msgType === 'READ_REGS'; }"},
            stopPropagation: false,
            htmlRef: localRef(1, "Modbus Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: modbusRenderCode}
        },
        // ── FC 05-06, 0F, 10: write operations ────────────────────
        {
            id: 4, name: "Write Operations",
            channelRef: localRef(1, "Serial Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "function(data) { return data.msgType === 'WRITE_SINGLE' || data.msgType === 'WRITE_MULTI'; }"},
            stopPropagation: false,
            htmlRef: localRef(1, "Modbus Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: modbusRenderCode}
        },
        // ── Raw serial byte stream (no decode) ────────────────────
        {
            id: 5, name: "Raw Stream",
            channelRef: localRef(1, "Serial Input", ElementType.Channel), layerId: 0,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: modbusRawRenderCode}
        },
    ],
    views: [
        {
            id: 1, name: "All Messages", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Decoded",   type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(1, "All Messages",     ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment",  type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment",  type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 2, name: "Read", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "FC 01-04", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(3, "Read Operations",  ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 3, name: "Write", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "FC 05-10", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(4, "Write Operations", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 4, name: "Errors", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Exceptions", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(2, "Errors Only",       ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment",   type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment",   type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 5, name: "Raw", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Bytes",    type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(5, "Raw Stream",        ElementType.ConditionalRendering)]}},
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
        {id: 3, name: "modbus-rtu.css", code: modbusCss},
    ],
    dependencies: [],
    settings: {isLibrary: false, rdnId: "", version: "1.0.0", maximumItemsPerView: 10000}
};
