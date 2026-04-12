import {IOParameter} from "./Layer";
import {BindableVariable, IOParameterType} from "./Common";
import {ElementProperty} from "./Element";


export interface InterfaceTcpSocketSettings {
    ip: BindableVariable<string>
    port: BindableVariable<number>,
    ssl: BindableVariable<boolean>,
    wsPort: BindableVariable<number>,
}

export interface InterfaceAdbLogcatSettings {
    clearLogAtConnection: BindableVariable<boolean>
}

export interface InterfaceSerialPortWebSerialSettings {
    baudRate: BindableVariable<number>;
    dataBits: BindableVariable<number>;
    stopBits: BindableVariable<number>;
    parity: BindableVariable<ParityType>
    bufferSize: BindableVariable<number>;
    flowControl: BindableVariable<FlowControlType>;
    cacheTimeout?: BindableVariable<number>;
    cacheMaxElemCount?: BindableVariable<number>;
}

export interface InterfaceClipboardSettings {}

export interface InterfaceWebHidSettings {
    usagePage: BindableVariable<number>; // HID Usage Page (0 = any)
    usage: BindableVariable<number>;     // HID Usage (0 = any)
}

export interface InterfaceCanSettings {
    transport: BindableVariable<string>
    bitrate: BindableVariable<number>
    busMode: BindableVariable<string>
    canFd: BindableVariable<boolean>
    socketUrl: BindableVariable<string>
    idWhitelist: BindableVariable<string>
    defaultCanId: BindableVariable<string>
}


export type InterfaceSettings = InterfaceClipboardSettings |
    InterfaceSerialPortWebSerialSettings |
    InterfaceAdbLogcatSettings |
    InterfaceTcpSocketSettings |
    InterfaceCanSettings |
    InterfaceWebHidSettings

export enum InterfaceType {
    InterfaceClipboard = "Clipboard",
    InterfaceSerialPortWebSerial = "Serialport (WebSerial)",
    InterfaceWebAdb = "WebAdb",
    InterfaceTcpSocket = "TCP Socket",
    InterfaceCAN = "CAN Bus",
    InterfaceWebHid = "WebHID",
}

export interface InterfacesProperty extends ElementProperty {
    type: InterfaceType,
    settings: InterfaceSettings,
    deleted: boolean
}

export function getInterfaceOutput(type: InterfaceType): IOParameter[] {
    switch (type) {
        default:
            return [
                {id:0, name:"data", type: IOParameterType.Uint8Array},
                ...ORIGIN_PARAMS,
            ]
    }
}

export function getInterfaceInput(type: InterfaceType): IOParameter[] {
    switch (type) {
        default:
            return [{id:0, name:"data", type: IOParameterType.Uint8Array}]
    }
}

/**
 * Hidden parameters injected by the runtime into every data object
 * coming from an interface. These are always available as source params
 * without needing custom layer code.
 *
 * _origin           – the full origin object
 * _origin.datetime  – Date object of when data was received
 * _origin.time      – time-only string (HH:MM:SS.mmm)
 * _origin.timestamp – epoch millis (number)
 */
export const ORIGIN_PARAMS: IOParameter[] = [
    { id: -1, name: "_origin", type: IOParameterType.Object },
    { id: -2, name: "_origin.datetime", type: IOParameterType.Object },
    { id: -3, name: "_origin.time", type: IOParameterType.String },
    { id: -4, name: "_origin.timestamp", type: IOParameterType.Number },
    { id: -5, name: "_origin.can", type: IOParameterType.Object },
    { id: -6, name: "_origin.can.id", type: IOParameterType.Number },
    { id: -7, name: "_origin.can.hex_id", type: IOParameterType.String },
    { id: -8, name: "_origin.can.dlc", type: IOParameterType.Number },
    { id: -9, name: "_origin.can.rtr", type: IOParameterType.Object },
    { id: -10, name: "_origin.can.ext", type: IOParameterType.Object },
    { id: -11, name: "_origin.can.fd", type: IOParameterType.Object },
    { id: -12, name: "_origin.hid", type: IOParameterType.Object },
    { id: -13, name: "_origin.hid.reportId", type: IOParameterType.Number },
    { id: -14, name: "_origin.hid.vendorId", type: IOParameterType.Number },
    { id: -15, name: "_origin.hid.productId", type: IOParameterType.Number },
    { id: -16, name: "_origin.hid.productName", type: IOParameterType.String },
];
