import {ProfileProperty} from "../../model/profile/Profile";
import {SCHEMA_VERSION} from "../../../../Version";
import {InterfaceType} from "../../model/profile/Interface";
import {ChannelType} from "../../model/profile/Channel";
import {CompareDataType, CustomPropertyType, ElementType, RenderModeType} from "../../model/profile/Common";
import {HtmlComponentDefinitionFramework, HtmlEmbeddedComponentNames} from "../../model/profile/Html";
import {LayoutType, ViewFragmentType, ViewType} from "../../model/profile/View";
import {LayerEmbeddedNames} from "../../model/profile/Layer";
import {defaultStyles, embeddedRef, localRef} from "./sampleHelpers";

// Script: JSON syntax highlighter (MIT — luyilin)
// @ts-ignore
const iotJsonHighlightJs = "/*\nhttps://github.com/luyilin/json-format-highlight\nThe MIT License (MIT)\n\nCopyright (c) luyilin <luyilin12@gmail.com> (https://github.com/luyilin)\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in\nall copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\nTHE SOFTWARE.\n*/\nfunction jsonHighlight(json, colorOptions = {}) {\n\n  const defaultColors = {\n    keyColor: 'dimgray',\n    numberColor: 'lightskyblue',\n    stringColor: 'lightcoral',\n    trueColor: 'lightseagreen',\n    falseColor: '#f66578',\n    nullColor: 'cornflowerblue'\n  }\n  \n  const entityMap = {\n    '&': '&amp;',\n    '<': '&lt;',\n    '>': '&gt;',\n    '\"': '&quot;',\n    \"'\": '&#39;',\n    '`': '&#x60;',\n    '=': '&#x3D;'\n  };\n  \n  function escapeHtml (html) {\n    return String(html).replace(/[&<>\"'`=]/g, function (s) {\n        return entityMap[s];\n    });\n  }\n  \n  const valueType = typeof json\n  if (valueType !== 'string') {\n    json = JSON.stringify(json, null, 2) || valueType\n  }\n  let colors = Object.assign({}, defaultColors, colorOptions)\n  json = json.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')\n  return json.replace(/(\"(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\\"])*\"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+]?\\d+)?)/g, (match) => {\n    let color = colors.numberColor\n    let style = ''\n    if (/^\"/.test(match)) {\n      if (/:$/.test(match)) {\n        color = colors.keyColor\n      } else {\n        color = colors.stringColor;\n        match = '\"' + escapeHtml(match.substr(1, match.length - 2)) + '\"';\n        style = 'word-wrap:break-word;white-space:pre-wrap;';\n      }\n    } else {\n      color = /true/.test(match)\n        ? colors.trueColor\n        : /false/.test(match)\n          ? colors.falseColor\n          : /null/.test(match)\n            ? colors.nullColor\n            : color\n    }\n    return `<span style=\"${style}color:${color}\">${match}</span>`\n  })\n}";

// Script: CBOR decoder (MIT — Patrick Gansterer)
// @ts-ignore
const iotCborJs = "/*\n * The MIT License (MIT)\n *\n * Copyright (c) 2014-2016 Patrick Gansterer <paroga@paroga.com>\n *\n * Permission is hereby granted, free of charge, to any person obtaining a copy\n * of this software and associated documentation files (the \"Software\"), to deal\n * in the Software without restriction, including without limitation the rights\n * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n * copies of the Software, and to permit persons to whom the Software is\n * furnished to do so, subject to the following conditions:\n *\n * The above copyright notice and this permission notice shall be included in all\n * copies or substantial portions of the Software.\n *\n * THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n * SOFTWARE.\n */\n\n(function(global, undefined) { \"use strict\";\nvar POW_2_24 = 5.960464477539063e-8,\n    POW_2_32 = 4294967296,\n    POW_2_53 = 9007199254740992;\n\nfunction encode(value) {\n  var data = new ArrayBuffer(256);\n  var dataView = new DataView(data);\n  var lastLength;\n  var offset = 0;\n\n  function prepareWrite(length) {\n    var newByteLength = data.byteLength;\n    var requiredLength = offset + length;\n    while (newByteLength < requiredLength)\n      newByteLength <<= 1;\n    if (newByteLength !== data.byteLength) {\n      var oldDataView = dataView;\n      data = new ArrayBuffer(newByteLength);\n      dataView = new DataView(data);\n      var uint32count = (offset + 3) >> 2;\n      for (var i = 0; i < uint32count; ++i)\n        dataView.setUint32(i << 2, oldDataView.getUint32(i << 2));\n    }\n\n    lastLength = length;\n    return dataView;\n  }\n  function commitWrite() {\n    offset += lastLength;\n  }\n  function writeFloat64(value) {\n    commitWrite(prepareWrite(8).setFloat64(offset, value));\n  }\n  function writeUint8(value) {\n    commitWrite(prepareWrite(1).setUint8(offset, value));\n  }\n  function writeUint8Array(value) {\n    var dataView = prepareWrite(value.length);\n    for (var i = 0; i < value.length; ++i)\n      dataView.setUint8(offset + i, value[i]);\n    commitWrite();\n  }\n  function writeUint16(value) {\n    commitWrite(prepareWrite(2).setUint16(offset, value));\n  }\n  function writeUint32(value) {\n    commitWrite(prepareWrite(4).setUint32(offset, value));\n  }\n  function writeUint64(value) {\n    var low = value % POW_2_32;\n    var high = (value - low) / POW_2_32;\n    var dataView = prepareWrite(8);\n    dataView.setUint32(offset, high);\n    dataView.setUint32(offset + 4, low);\n    commitWrite();\n  }\n  function writeTypeAndLength(type, length) {\n    if (length < 24) {\n      writeUint8(type << 5 | length);\n    } else if (length < 0x100) {\n      writeUint8(type << 5 | 24);\n      writeUint8(length);\n    } else if (length < 0x10000) {\n      writeUint8(type << 5 | 25);\n      writeUint16(length);\n    } else if (length < 0x100000000) {\n      writeUint8(type << 5 | 26);\n      writeUint32(length);\n    } else {\n      writeUint8(type << 5 | 27);\n      writeUint64(length);\n    }\n  }\n\n  function encodeItem(value) {\n    var i;\n\n    if (value === false)\n      return writeUint8(0xf4);\n    if (value === true)\n      return writeUint8(0xf5);\n    if (value === null)\n      return writeUint8(0xf6);\n    if (value === undefined)\n      return writeUint8(0xf7);\n\n    switch (typeof value) {\n      case \"number\":\n        if (Math.floor(value) === value) {\n          if (0 <= value && value <= POW_2_53)\n            return writeTypeAndLength(0, value);\n          if (-POW_2_53 <= value && value < 0)\n            return writeTypeAndLength(1, -(value + 1));\n        }\n        writeUint8(0xfb);\n        return writeFloat64(value);\n\n      case \"string\":\n        var utf8data = [];\n        for (i = 0; i < value.length; ++i) {\n          var charCode = value.charCodeAt(i);\n          if (charCode < 0x80) {\n            utf8data.push(charCode);\n          } else if (charCode < 0x800) {\n            utf8data.push(0xc0 | charCode >> 6);\n            utf8data.push(0x80 | charCode & 0x3f);\n          } else if (charCode < 0xd800) {\n            utf8data.push(0xe0 | charCode >> 12);\n            utf8data.push(0x80 | (charCode >> 6)  & 0x3f);\n            utf8data.push(0x80 | charCode & 0x3f);\n          } else {\n            charCode = (charCode & 0x3ff) << 10;\n            charCode |= value.charCodeAt(++i) & 0x3ff;\n            charCode += 0x10000;\n\n            utf8data.push(0xf0 | charCode >> 18);\n            utf8data.push(0x80 | (charCode >> 12)  & 0x3f);\n            utf8data.push(0x80 | (charCode >> 6)  & 0x3f);\n            utf8data.push(0x80 | charCode & 0x3f);\n          }\n        }\n\n        writeTypeAndLength(3, utf8data.length);\n        return writeUint8Array(utf8data);\n\n      default:\n        var length;\n        if (Array.isArray(value)) {\n          length = value.length;\n          writeTypeAndLength(4, length);\n          for (i = 0; i < length; ++i)\n            encodeItem(value[i]);\n        } else if (value instanceof Uint8Array) {\n          writeTypeAndLength(2, value.length);\n          writeUint8Array(value);\n        } else {\n          var keys = Object.keys(value);\n          length = keys.length;\n          writeTypeAndLength(5, length);\n          for (i = 0; i < length; ++i) {\n            var key = keys[i];\n            encodeItem(key);\n            encodeItem(value[key]);\n          }\n        }\n    }\n  }\n\n  encodeItem(value);\n\n  if (\"slice\" in data)\n    return data.slice(0, offset);\n\n  var ret = new ArrayBuffer(offset);\n  var retView = new DataView(ret);\n  for (var i = 0; i < offset; ++i)\n    retView.setUint8(i, dataView.getUint8(i));\n  return ret;\n}\n\nfunction decode(data, tagger, simpleValue) {\n  var dataView = new DataView(data);\n  var offset = 0;\n\n  if (typeof tagger !== \"function\")\n    tagger = function(value) { return value; };\n  if (typeof simpleValue !== \"function\")\n    simpleValue = function() { return undefined; };\n\n  function commitRead(length, value) {\n    offset += length;\n    return value;\n  }\n  function readArrayBuffer(length) {\n    return commitRead(length, new Uint8Array(data, offset, length));\n  }\n  function readFloat16() {\n    var tempArrayBuffer = new ArrayBuffer(4);\n    var tempDataView = new DataView(tempArrayBuffer);\n    var value = readUint16();\n\n    var sign = value & 0x8000;\n    var exponent = value & 0x7c00;\n    var fraction = value & 0x03ff;\n\n    if (exponent === 0x7c00)\n      exponent = 0xff << 10;\n    else if (exponent !== 0)\n      exponent += (127 - 15) << 10;\n    else if (fraction !== 0)\n      return (sign ? -1 : 1) * fraction * POW_2_24;\n\n    tempDataView.setUint32(0, sign << 16 | exponent << 13 | fraction << 13);\n    return tempDataView.getFloat32(0);\n  }\n  function readFloat32() {\n    return commitRead(4, dataView.getFloat32(offset));\n  }\n  function readFloat64() {\n    return commitRead(8, dataView.getFloat64(offset));\n  }\n  function readUint8() {\n    return commitRead(1, dataView.getUint8(offset));\n  }\n  function readUint16() {\n    return commitRead(2, dataView.getUint16(offset));\n  }\n  function readUint32() {\n    return commitRead(4, dataView.getUint32(offset));\n  }\n  function readUint64() {\n    return readUint32() * POW_2_32 + readUint32();\n  }\n  function readBreak() {\n    if (dataView.getUint8(offset) !== 0xff)\n      return false;\n    offset += 1;\n    return true;\n  }\n  function readLength(additionalInformation) {\n    if (additionalInformation < 24)\n      return additionalInformation;\n    if (additionalInformation === 24)\n      return readUint8();\n    if (additionalInformation === 25)\n      return readUint16();\n    if (additionalInformation === 26)\n      return readUint32();\n    if (additionalInformation === 27)\n      return readUint64();\n    if (additionalInformation === 31)\n      return -1;\n    throw \"Invalid length encoding\";\n  }\n  function readIndefiniteStringLength(majorType) {\n    var initialByte = readUint8();\n    if (initialByte === 0xff)\n      return -1;\n    var length = readLength(initialByte & 0x1f);\n    if (length < 0 || (initialByte >> 5) !== majorType)\n      throw \"Invalid indefinite length element\";\n    return length;\n  }\n\n  function appendUtf16Data(utf16data, length) {\n    for (var i = 0; i < length; ++i) {\n      var value = readUint8();\n      if (value & 0x80) {\n        if (value < 0xe0) {\n          value = (value & 0x1f) <<  6\n                | (readUint8() & 0x3f);\n          length -= 1;\n        } else if (value < 0xf0) {\n          value = (value & 0x0f) << 12\n                | (readUint8() & 0x3f) << 6\n                | (readUint8() & 0x3f);\n          length -= 2;\n        } else {\n          value = (value & 0x0f) << 18\n                | (readUint8() & 0x3f) << 12\n                | (readUint8() & 0x3f) << 6\n                | (readUint8() & 0x3f);\n          length -= 3;\n        }\n      }\n\n      if (value < 0x10000) {\n        utf16data.push(value);\n      } else {\n        value -= 0x10000;\n        utf16data.push(0xd800 | (value >> 10));\n        utf16data.push(0xdc00 | (value & 0x3ff));\n      }\n    }\n  }\n\n  function decodeItem() {\n    var initialByte = readUint8();\n    var majorType = initialByte >> 5;\n    var additionalInformation = initialByte & 0x1f;\n    var i;\n    var length;\n\n    if (majorType === 7) {\n      switch (additionalInformation) {\n        case 25:\n          return readFloat16();\n        case 26:\n          return readFloat32();\n        case 27:\n          return readFloat64();\n      }\n    }\n\n    length = readLength(additionalInformation);\n    if (length < 0 && (majorType < 2 || 6 < majorType))\n      throw \"Invalid length\";\n\n    switch (majorType) {\n      case 0:\n        return length;\n      case 1:\n        return -1 - length;\n      case 2:\n        if (length < 0) {\n          var elements = [];\n          var fullArrayLength = 0;\n          while ((length = readIndefiniteStringLength(majorType)) >= 0) {\n            fullArrayLength += length;\n            elements.push(readArrayBuffer(length));\n          }\n          var fullArray = new Uint8Array(fullArrayLength);\n          var fullArrayOffset = 0;\n          for (i = 0; i < elements.length; ++i) {\n            fullArray.set(elements[i], fullArrayOffset);\n            fullArrayOffset += elements[i].length;\n          }\n          return fullArray;\n        }\n        return readArrayBuffer(length);\n      case 3:\n        var utf16data = [];\n        if (length < 0) {\n          while ((length = readIndefiniteStringLength(majorType)) >= 0)\n            appendUtf16Data(utf16data, length);\n        } else\n          appendUtf16Data(utf16data, length);\n        return String.fromCharCode.apply(null, utf16data);\n      case 4:\n        var retArray;\n        if (length < 0) {\n          retArray = [];\n          while (!readBreak())\n            retArray.push(decodeItem());\n        } else {\n          retArray = new Array(length);\n          for (i = 0; i < length; ++i)\n            retArray[i] = decodeItem();\n        }\n        return retArray;\n      case 5:\n        var retObject = {};\n        for (i = 0; i < length || length < 0 && !readBreak(); ++i) {\n          var key = decodeItem();\n          retObject[key] = decodeItem();\n        }\n        return retObject;\n      case 6:\n        return tagger(decodeItem(), length);\n      case 7:\n        switch (length) {\n          case 20:\n            return false;\n          case 21:\n            return true;\n          case 22:\n            return null;\n          case 23:\n            return undefined;\n          default:\n            return simpleValue(length);\n        }\n    }\n  }\n\n  var ret = decodeItem();\n  if (offset !== data.byteLength)\n    throw \"Remaining bytes\";\n  return ret;\n}\n\nvar obj = { encode: encode, decode: decode };\n\nif (typeof define === \"function\" && define.amd)\n  define(\"cbor/cbor\", obj);\nelse if (typeof module !== \"undefined\" && module.exports)\n  module.exports = obj;\nelse if (!global.CBOR)\n  global.CBOR = obj;\n\n})(this);";

// Script: Helper utilities (hex→bytes, compact JSON stringify)
// @ts-ignore
const iotHelperJs = "// Note: This regex matches even invalid JSON strings, but since we\u2019re\n// working on the output of `JSON.stringify` we know that only valid strings\n// are present (unless the user supplied a weird `options.indent` but in\n// that case we don\u2019t care since the output would be invalid anyway).\nconst stringOrChar = /(\"(?:[^\\\\\"]|\\\\.)*\")|[:,]/g;\n\nfunction stringify(passedObj, options = {}) {\n  const indent = JSON.stringify(\n    [1],\n    undefined,\n    options.indent === undefined ? 2 : options.indent\n  ).slice(2, -3);\n\n  const maxLength =\n    indent === \"\"\n      ? Infinity\n      : options.maxLength === undefined\n      ? 80\n      : options.maxLength;\n\n  let { replacer } = options;\n\n  return (function _stringify(obj, currentIndent, reserved) {\n    if (obj && typeof obj.toJSON === \"function\") {\n      obj = obj.toJSON();\n    }\n\n    const string = JSON.stringify(obj, replacer);\n\n    if (string === undefined) {\n      return string;\n    }\n\n    const length = maxLength - currentIndent.length - reserved;\n\n    if (string.length <= length) {\n      const prettified = string.replace(\n        stringOrChar,\n        (match, stringLiteral) => {\n          return stringLiteral || `${match} `;\n        }\n      );\n      if (prettified.length <= length) {\n        return prettified;\n      }\n    }\n\n    if (replacer != null) {\n      obj = JSON.parse(string);\n      replacer = undefined;\n    }\n\n    if (typeof obj === \"object\" && obj !== null) {\n      const nextIndent = currentIndent + indent;\n      const items = [];\n      let index = 0;\n      let start;\n      let end;\n\n      if (Array.isArray(obj)) {\n        start = \"[\";\n        end = \"]\";\n        const { length } = obj;\n        for (; index < length; index++) {\n          items.push(\n            _stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) ||\n              \"null\"\n          );\n        }\n      } else {\n        start = \"{\";\n        end = \"}\";\n        const keys = Object.keys(obj);\n        const { length } = keys;\n        for (; index < length; index++) {\n          const key = keys[index];\n          const keyPart = `${JSON.stringify(key)}: `;\n          const value = _stringify(\n            obj[key],\n            nextIndent,\n            keyPart.length + (index === length - 1 ? 0 : 1)\n          );\n          if (value !== undefined) {\n            items.push(keyPart + value);\n          }\n        }\n      }\n\n      if (items.length > 0) {\n        return [start, indent + items.join(`,\\n${nextIndent}`), end].join(\n          `\\n${currentIndent}`\n        );\n      }\n    }\n\n    return string;\n  })(passedObj, \"\", 0);\n}\n\nfunction hexStringToByteArray(hexString) {\n    if (hexString.length % 2 !== 0) {\n      throw \"Must have an even number of hex digits to convert to bytes\";\n    }\n    var numBytes = hexString.length / 2;\n    var byteArray = new Uint8Array(numBytes);\n    for (var i = 0; i < numBytes; i++) {\n      byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);\n    }\n    return byteArray;;\n  }";

const iotStylesCss = ".jsonDiv-title \n{ \n  height: 100%;\n  background: #CAE7B9;\n  color: #e97764;\n}\n\n.jsonDiv-content \n{ \n  height: 100%;\n  background: #cce6ff;\n  white-space: pre-wrap;\n}";

const iotMqttRenderCode =
    "var line = typeof data.data === 'string' ? data.data : String(data.data);\n" +
    "var match = line.match(/MQTT CCAPI (?:RECV|SEND):\\s*(\\S+)/);\n" +
    "if (!match || !match[1]) return '<div class=\"m-1\"><div class=\"jsonDiv-title p-1\">MQTT CCAPI</div><div class=\"jsonDiv-content p-1\">' + line + '</div></div>';\n" +
    "try {\n" +
    "  var bytes = hexStringToByteArray(match[1].trim());\n" +
    "  var decoded = CBOR.decode(bytes.buffer);\n" +
    "  var formatted = jsonHighlight(stringify(decoded));\n" +
    "  return '<div class=\"m-1\"><div class=\"jsonDiv-title p-1\">MQTT CCAPI</div><div class=\"jsonDiv-content p-1\">' + formatted + '</div></div>';\n" +
    "} catch(e) {\n" +
    "  return '<div class=\"m-1\"><div class=\"jsonDiv-title p-1\">MQTT CCAPI (parse error)</div><div class=\"jsonDiv-content p-1\">' + line + '</div></div>';\n" +
    "}";

const iotAllocRenderCode =
    "var str = typeof data.data === 'string' ? data.data : String(data.data);\n" +
    "if (!window.__allocState) window.__allocState = {};\n" +
    "var track = window.__allocState;\n" +
    "if (str.indexOf('malloc error') > 0) {\n" +
    "} else if (str.indexOf('malloc') > 0) {\n" +
    "  var m = str.match(/malloc (.*) -> \\d+ at (.*)\\:(.*)/);\n" +
    "  if (m) { var ptr = m[1]; if (ptr in track) { track[ptr+'_'] = {err:'multi',func:m[2],line:m[3]}; } else { track[ptr] = {func:m[2],line:m[3]}; } }\n" +
    "} else if (str.indexOf('free') > 0) {\n" +
    "  var m2 = str.match(/free (.*) at (.*)\\:(.*)/);\n" +
    "  if (m2 && m2[1] in track) { delete track[m2[1]]; }\n" +
    "}\n" +
    "var log = '';\n" +
    "for (var key in track) { log += key + ':' + JSON.stringify(track[key]) + '\\n'; }\n" +
    "var el = document.getElementById('widgetAlloc');\n" +
    "if (el) { el.innerHTML = log; }\n" +
    "return '<div style=\"color:#8e24aa;font-family:monospace;font-size:0.85em;padding:2px 6px\">' + str + '</div>';";

export const iotDeviceLogger: ProfileProperty = {
    name: "IoT Device Logger",
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
            id: 1, name: "Input", type: ChannelType.Input, deleted: false,
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
        }
    ],
    htmls: [
        {
            id: 1, name: "JsonDiv", deleted: false,
            type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
            config: {
                code: '<div class="m-1">\n  <div class="jsonDiv-title p-1">\n    ${title}\n  </div>\n  <div class="jsonDiv-content p-1">\n    ${content}\n  </div>\n</div>',
                properties: [
                    {id: 1, name: "title", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "title"}},
                    {id: 2, name: "content", safeHtml: false, type: CustomPropertyType.Text, default: {bind: false, value: "content"}}
                ]
            }
        },
        {
            id: 2, name: "WidgetAlloc", deleted: false,
            type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
            config: {
                code: '<div style="width:100%;height:100%;display:flex;flex-direction:column">\n  <b>Remaining allocations</b>\n  <pre id="widgetAlloc" class="box" style="overflow:auto;flex:1;margin:0">${data}</pre>\n</div>',
                properties: [
                    {id: 1, name: "data", safeHtml: false, type: CustomPropertyType.Text, default: {bind: false, value: ""}}
                ]
            }
        }
    ],
    conditionalRenderings: [
        {
            id: 1, name: "MQTT CCAPI",
            channelRef: localRef(1, "Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "function(data) { return /MQTT CCAPI/.test(data.data); }"},
            stopPropagation: true,
            htmlRef: localRef(1, "JsonDiv", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: iotMqttRenderCode}
        },
        {
            id: 2, name: "Errors",
            channelRef: localRef(1, "Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "function(data) { return /ERROR/.test(data.data) && !/CCAPI_ERR_CODE_NO_ERROR/.test(data.data); }"},
            stopPropagation: true,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Gui,
            renderModeSettings: {mappings: [
                {destParamName: "content", sourceParam: {bind: true, paramFromSource: "data"}},
                {destParamName: "color", sourceParam: {bind: false, value: "#ed0202"}},
            ]}
        },
        {
            id: 3, name: "Main Lines",
            channelRef: localRef(1, "Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "function(data) { return !/alloc\\.c:/.test(data.data); }"},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Gui,
            renderModeSettings: {mappings: [
                {destParamName: "content", sourceParam: {bind: true, paramFromSource: "data"}},
                {destParamName: "color", sourceParam: {bind: false, value: "#000000"}},
            ]}
        },
        {
            id: 4, name: "Alloc Lines",
            channelRef: localRef(1, "Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "function(data) { return /alloc\\.c:/.test(data.data); }"},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: iotAllocRenderCode}
        },
        {
            id: 5, name: "All Plain",
            channelRef: localRef(1, "Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Gui,
            renderModeSettings: {mappings: [
                {destParamName: "content", sourceParam: {bind: true, paramFromSource: "data"}},
                {destParamName: "color", sourceParam: {bind: false, value: "#000000"}},
            ]}
        }
    ],
    views: [
        {
            id: 1, name: "Main", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Log", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(1, "MQTT CCAPI", ElementType.ConditionalRendering), localRef(2, "Errors", ElementType.ConditionalRendering), localRef(3, "Main Lines", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 2, name: "Alloc", type: ViewType.TabView, layout: LayoutType.Row2, deleted: false,
            config: {
                fragment1: {name: "Allocations", type: ViewFragmentType.Append, percent: 70, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(4, "Alloc Lines", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Widget", type: ViewFragmentType.Fixed, percent: 30, config: {ui: localRef(2, "WidgetAlloc", ElementType.Html)} as any},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 3, name: "No Render", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Raw", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(5, "All Plain", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        }
    ],
    layers: [],
    events: [],
    actions: [],
    scripts: [
        {id: 1, name: "jsonHighlight.js", code: iotJsonHighlightJs + "\nwindow.jsonHighlight = jsonHighlight;"},
        {id: 2, name: "cbor.js", code: iotCborJs},
        {id: 3, name: "helper.js", code: iotHelperJs + "\nwindow.stringify = stringify;\nwindow.hexStringToByteArray = hexStringToByteArray;"},
    ],
    scriptsExportedSymbols: [],
    styles: [
        ...defaultStyles,
        {id: 3, name: "iot-styles.css", code: iotStylesCss},
    ],
    dependencies: [],
    settings: {isLibrary: false, rdnId: "", version: "1.0.0", maximumItemsPerView: 5000}
};
