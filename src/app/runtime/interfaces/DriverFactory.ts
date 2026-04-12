import { Interface} from "./Interface";
import { InterfaceClipboard, DriverClipboardDefaults } from "./InterfaceClipboard";
import { DriverSerialPortWebSerial, DriverSerialPortWebSerialDefaults, } from "./DriverSerialportWebserial";
import { DriverAdbLogcat, DriverAdbLogcatDefaults } from "./DriverAdbLogcat";
import { DirverLoggerDecorator } from "./DirverLoggerDecorator";
import { DriverTcpSocket, DriverTcpSocketDefaults } from "./DriverTcpSocket";
import { DriverCan, DriverCanDefaults } from "./DriverCan";
import { DriverWebHid, DriverWebHidDefaults } from "./DriverWebHid";
import {
    InterfaceAdbLogcatSettings,
    InterfaceCanSettings,
    InterfaceSerialPortWebSerialSettings,
    InterfaceSettings,
    InterfaceType, InterfaceTcpSocketSettings,
    InterfaceWebHidSettings
} from "../../common/model/profile/Interface";

export class DriverFactory {

    static build(driver: InterfaceType, settings: InterfaceSettings, websocketToken?: string): Interface {
        switch (driver) {
            case InterfaceType.InterfaceClipboard:
                return new InterfaceClipboard()
            case InterfaceType.InterfaceSerialPortWebSerial:
                return new DirverLoggerDecorator(new DriverSerialPortWebSerial(settings as InterfaceSerialPortWebSerialSettings))
            case InterfaceType.InterfaceWebAdb:
                return new DirverLoggerDecorator(new DriverAdbLogcat(settings as InterfaceAdbLogcatSettings))
            case InterfaceType.InterfaceTcpSocket:
                return new DirverLoggerDecorator(new DriverTcpSocket(settings as InterfaceTcpSocketSettings, websocketToken))
            case InterfaceType.InterfaceCAN:
                return new DirverLoggerDecorator(new DriverCan(settings as InterfaceCanSettings, websocketToken))
            case InterfaceType.InterfaceWebHid:
                return new DirverLoggerDecorator(new DriverWebHid(settings as InterfaceWebHidSettings))
            default:
                return new InterfaceClipboard()
        }
    }

    static getDefaultParams(driverName: string): InterfaceSettings {
        switch (driverName) {
            case InterfaceType.InterfaceClipboard:
                return DriverClipboardDefaults
            case InterfaceType.InterfaceSerialPortWebSerial:
                return DriverSerialPortWebSerialDefaults
            case InterfaceType.InterfaceWebAdb:
                return DriverAdbLogcatDefaults
            case InterfaceType.InterfaceTcpSocket:
                return DriverTcpSocketDefaults
            case InterfaceType.InterfaceCAN:
                return DriverCanDefaults
            case InterfaceType.InterfaceWebHid:
                return DriverWebHidDefaults
            default:
                return DriverClipboardDefaults
        }
    }
}
