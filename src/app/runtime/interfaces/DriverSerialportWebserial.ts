import { DriverError } from "../../common/utility/exception"
import {Interface, DriverChunkInfo, DriverOpenClose, DriverStatus} from "./Interface"
import { DriverCache } from "./DriverCache"
import {GetDateForChunkInfo} from "../../common/utility/DataTimeUtils";
import {InterfaceSerialPortWebSerialSettings, InterfaceType} from "../../common/model/profile/Interface";


export const DriverSerialPortWebSerialDefaults = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    bufferSize: 255,
    flowControl: "none"
}

export class DriverSerialPortWebSerial implements DriverOpenClose {

    private readonly usbVendorId: number
    private readonly usbProductId: number
    private readonly options: SerialOptions
    private port: SerialPort
    private portReader:  ReadableStreamDefaultReader<Uint8Array>
    private DriverCache: DriverCache<Uint8Array>
    private onReceiveCb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void
    private onTransmitCb: (data: Uint8Array | string, chunkInfo: DriverChunkInfo) => void
    private onStatusChangeCb: (status: DriverStatus) => void
    private onErrorCb: (ex: Error) => void
    readonly name: string;
    _status: DriverStatus;
    private readingPromise: () => Promise<void>;

    public get status(): DriverStatus {
        return this._status;
    }

    constructor(private readonly params: InterfaceSerialPortWebSerialSettings) {
        this.name = InterfaceType.InterfaceSerialPortWebSerial
        this._status = DriverStatus.CLOSE
        const num = (v: any, fallback: number) => {
            const n = Number(v)
            return Number.isFinite(n) && n > 0 ? n : fallback
        }
        this.options = {
            baudRate: num(params.baudRate?.value, 115200),
            dataBits: num(params.dataBits?.value, 8),
            stopBits: num(params.stopBits?.value, 1),
            parity: params.parity?.value ?? "none",
            bufferSize: num(params.bufferSize?.value, 255),
            flowControl: params.flowControl?.value ?? "none",
        }
        this.DriverCache = new DriverCache()
        this.DriverCache.setTimeout(
            num(params.cacheTimeout?.value, 200),
            num(params.cacheMaxElemCount?.value, 100),
        )
    }

    attach(view: HTMLElement): void {
        
    }

    onError(cb: (ex: Error) => void): void {
        this.onErrorCb = cb
    }

    onReceive(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void): void {
        this.onReceiveCb = cb
    }

    onTransmit(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void): void {
        this.onTransmitCb = cb
    }

    onStatusChange(cb: (status: DriverStatus) => void) {
        this.onStatusChangeCb = cb
    }

    async send(data: Uint8Array | string) {
        try {
            let wdata = data
            if(typeof data === "string") {
                wdata = new TextEncoder().encode(data);
            }
            const writer = this.port.writable.getWriter();
            await writer.write(wdata as Uint8Array)
            writer.releaseLock()

            const date = new Date()
            const chunkInfo = {
                time: GetDateForChunkInfo(),
                isTx: true
            }
            this.onTransmitCb?.(wdata, chunkInfo)
        }
        catch (error)
        {
            console.error(error)
        }
    }

    open()
    {
        this.readingPromise = async () => {
            try
            {
                await this.getPortInstance()
                this.onStatusChangeCb?.(this._status)

                this.DriverCache.onFlush((data) => {

                    const flatNumberArray = data.reduce((acc, curr) => {
                        acc.push(...curr);
                        return acc;
                    }, []);

                    const dataFlat = new Uint8Array(flatNumberArray);

                    const chunkInfo = {
                        time: GetDateForChunkInfo(),
                        isTx: false
                    }
                    this.onReceiveCb?.(dataFlat, chunkInfo)
                })

                while (this.port.readable && this.status == DriverStatus.OPEN) {
                    this.portReader = this.port.readable.getReader();
                    try {
                        while (true) {
                            const {value, done} = await this.portReader.read();
                            if (done) {
                                // |reader| has been canceled.
                                break;
                            }
                            if (value) {
                                this.DriverCache.add(value)
                            }
                        }
                    } catch (error) {
                        console.error(error)
                    } finally {
                        this.portReader.releaseLock();
                    }
                }

                this.DriverCache.flush()
                try { await this.port.close() } catch { /* port may already be closed */ }
                try { await this.port.forget() } catch { /* ignore */ }
            }
            catch (error)
            {
                console.error(error)
                this.onErrorCb?.(error)
                if (!('usb' in navigator)) {
                    this.onErrorCb?.(new DriverError("WebUSB is not supported by your browser. Switch to either Chrome or Edge."))
                }
            }

            this.DriverCache.clean()
            this._status = DriverStatus.CLOSE
            this.onStatusChangeCb?.(this._status)
        }

        this.readingPromise()
    }

    close()
    {
        this.portReader?.cancel()
        this._status = DriverStatus.CLOSE
    }

    destroy() {
        
    }

    private async getPortInstance() {
        this.port = (await navigator.serial?.getPorts())?.find(
            (val) => {
                let info = val.getInfo()
                return (
                    info.usbProductId === this.usbProductId &&
                    info.usbVendorId === this.usbVendorId
                )
            }
        ) ?? await navigator.serial.requestPort()

        await this.port.open(this.options)
        this._status = DriverStatus.OPEN
    }
}