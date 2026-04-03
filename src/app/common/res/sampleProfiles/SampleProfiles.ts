/**
 * Built-in sample profiles for the "Import by Example" dialog.
 * Each sample lives in its own file; this module re-exports the catalog.
 */
import {ProfileProperty} from "../../model/profile/Profile";
import {clipboardLineViewer} from "./ClipboardLineViewer";
import {jsonLint} from "./JsonLint";
import {serialPortLogger} from "./SerialPortLogger";
import {iotDeviceLogger} from "./IotDeviceLogger";
import {canopenDecoder} from "./CanopenDecoder";
import {serialTerminal} from "./SerialTerminal";
import {modbusRtuDecoder} from "./ModbusRtuDecoder";
export interface SampleProfile {
    name: string;
    description: string;
    profile: ProfileProperty;
}

export const SAMPLE_LIBRARIES: SampleProfile[] = [
    {
        name: "CANopen Decoder",
        description: "CANopen protocol decoder layer + HTML row component + CSS (library)",
        profile: {...canopenDecoder, settings: {...canopenDecoder.settings, isLibrary: true, rdnId: "org.bellog.canopen-decoder"}},
    },
];

export const SAMPLE_PROFILES: SampleProfile[] = [
    {
        name: "Clipboard Line Viewer",
        description: "Paste text, see each line with timestamps",
        profile: clipboardLineViewer,
    },
    {
        name: "JSON Lint",
        description: "Paste JSON to validate and pretty-print",
        profile: jsonLint,
    },
    {
        name: "Serial Port Logger",
        description: "WebSerial line-based log viewer with send capability",
        profile: serialPortLogger,
    },
    {
        name: "IoT Device Logger",
        description: "Serial log with CBOR→JSON decoding, error highlight, alloc tracking (3 views)",
        profile: iotDeviceLogger,
    },
    {
        name: "CANopen Decoder",
        description: "CAN Bus → CANopen protocol decoder with color-coded NMT, SDO, PDO, HB, EMCY views",
        profile: canopenDecoder,
    },
    {
        name: "Serial Terminal",
        description: "Raw serial terminal with keyboard input, ANSI support, and connect/disconnect events",
        profile: serialTerminal,
    },
    {
        name: "Modbus RTU Decoder",
        description: "Modbus RTU protocol decoder — CRC-validated frame extraction from raw serial bytes, colour-coded by FC type with Read, Write, Error and Raw views",
        profile: modbusRtuDecoder,
    },
];

