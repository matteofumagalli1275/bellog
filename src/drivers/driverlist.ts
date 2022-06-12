import {Driver} from "./driver";
import {DriverClipboard} from "./clipboard";
import {DriverSerialPortWebSerial} from "./serialport-webserial";

interface DirverListEntry {
    name: string,
    driver: { new(...args: any[]): Driver }
}

export const DriverList: DirverListEntry[] = [
    {
        name: "Clipboard",
        driver: DriverClipboard
    },
    {
        name: "Serialport WebSerial",
        driver: DriverSerialPortWebSerial
    }
]