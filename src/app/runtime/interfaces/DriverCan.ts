import {DriverChunkInfo, DriverOpenClose, DriverStatus, Interface} from "./Interface";
import {InterfaceCanSettings, InterfaceType} from "../../common/model/profile/Interface";
import {CanFrame, canFrameToChunkMeta, parseCanIdWhitelist} from "./can/CanFrame";
import {CanSerialTransport} from "./can/CanSerialTransport";
import {CanSocketTransport} from "./can/CanSocketTransport";
import {GetDateForChunkInfo} from "../../common/utility/DataTimeUtils";

export const DriverCanDefaults = {
    transport: "serial",
    bitrate: 500000,
    busMode: "normal",
    canFd: false,
    socketUrl: "ws://localhost:8080",
    idWhitelist: "",
    defaultCanId: "0x000",
}

export class DriverCan implements DriverOpenClose {

    readonly name: string;
    _status: DriverStatus;

    private serialTransport: CanSerialTransport | null = null
    private socketTransport: CanSocketTransport | null = null
    private idWhitelist: Set<number> | null = null

    private onReceiveCb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void
    private onTransmitCb: (data: Uint8Array | string, chunkInfo: DriverChunkInfo) => void
    private onStatusChangeCb: (status: DriverStatus) => void
    private onErrorCb: (ex: Error) => void

    public get status(): DriverStatus { return this._status }

    constructor(private readonly params: InterfaceCanSettings, private readonly websocketToken?: string) {
        this.name = InterfaceType.InterfaceCAN
        this._status = DriverStatus.CLOSE
    }

    attach(view: HTMLElement): void {}

    onReceive(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void): void {
        this.onReceiveCb = cb
    }

    onTransmit(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void): void {
        this.onTransmitCb = cb
    }

    onStatusChange(cb: (status: DriverStatus) => void): void {
        this.onStatusChangeCb = cb
    }

    onError(cb: (ex: Error) => void): void {
        this.onErrorCb = cb
    }

    private handleFrame(frame: CanFrame) {
        // Apply whitelist filter
        if (this.idWhitelist && !this.idWhitelist.has(frame.id)) return

        const chunkInfo: DriverChunkInfo = {
            time: GetDateForChunkInfo(),
            isTx: false,
            meta: canFrameToChunkMeta(frame),
        }
        this.onReceiveCb?.(frame.data, chunkInfo)
    }

    async open() {
        const transport = this.params.transport?.value ?? "serial"
        this.idWhitelist = parseCanIdWhitelist(this.params.idWhitelist?.value ?? "")

        if (transport === "socket") {
            this.socketTransport = new CanSocketTransport()
            this.socketTransport.onFrame((f) => this.handleFrame(f))
            this.socketTransport.onStatusChange((s) => {
                this._status = s
                this.onStatusChangeCb?.(s)
            })
            this.socketTransport.onError((e) => this.onErrorCb?.(e))
            const baseUrl = this.params.socketUrl?.value ?? "ws://localhost:8080"
            const sep = baseUrl.includes('?') ? '&' : '?'
            const socketUrl = this.websocketToken ? `${baseUrl}${sep}token=${encodeURIComponent(this.websocketToken)}` : baseUrl
            await this.socketTransport.open({ socketUrl })
        } else {
            this.serialTransport = new CanSerialTransport()
            this.serialTransport.onFrame((f) => this.handleFrame(f))
            this.serialTransport.onStatusChange((s) => {
                this._status = s
                this.onStatusChangeCb?.(s)
            })
            this.serialTransport.onError((e) => this.onErrorCb?.(e))
            await this.serialTransport.open({
                bitrate: this.params.bitrate?.value ?? 500000,
                busMode: this.params.busMode?.value ?? "normal",
                canFd: this.params.canFd?.value ?? false,
            })
        }
    }

    /**
     * Send a CAN frame. Accepts a JSON string: {"id": 291, "data": [0,1,2]}
     * or raw Uint8Array (interpreted as data for the default CAN ID).
     */
    async send(data: Uint8Array | string) {
        let frame: CanFrame
        if (typeof data === "string") {
            try {
                const obj = JSON.parse(data)
                frame = {
                    id: obj.id ?? 0,
                    dlc: obj.data?.length ?? 0,
                    data: new Uint8Array(obj.data ?? []),
                    rtr: obj.rtr ?? false,
                    ext: obj.ext ?? false,
                    fd: obj.fd ?? false,
                }
            } catch {
                // If not valid JSON, encode string as data with default CAN ID
                const defaultId = parseInt((this.params.defaultCanId?.value ?? "0").replace(/^0x/i, ""), 16) || 0
                const encoded = new TextEncoder().encode(data)
                frame = { id: defaultId, dlc: encoded.length, data: encoded, rtr: false, ext: false, fd: false }
            }
        } else {
            const defaultId = parseInt((this.params.defaultCanId?.value ?? "0").replace(/^0x/i, ""), 16) || 0
            frame = { id: defaultId, dlc: data.length, data: data, rtr: false, ext: false, fd: false }
        }

        if (this.serialTransport) {
            await this.serialTransport.send(frame)
        } else if (this.socketTransport) {
            this.socketTransport.send(frame)
        }

        const chunkInfo: DriverChunkInfo = {
            time: GetDateForChunkInfo(),
            isTx: true,
            meta: canFrameToChunkMeta(frame),
        }
        this.onTransmitCb?.(frame.data, chunkInfo)
    }

    async close() {
        if (this.serialTransport) {
            await this.serialTransport.close()
            this.serialTransport = null
        }
        if (this.socketTransport) {
            this.socketTransport.close()
            this.socketTransport = null
        }
        this._status = DriverStatus.CLOSE
        this.onStatusChangeCb?.(this._status)
    }

    destroy() {
        this.serialTransport?.destroy()
        this.socketTransport?.destroy()
        this.serialTransport = null
        this.socketTransport = null
    }
}
