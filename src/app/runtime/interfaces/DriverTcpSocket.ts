import {DriverChunkInfo, DriverOpenClose, DriverStatus} from "./Interface"
import {DriverCache} from "./DriverCache"
import {GetDateForChunkInfo} from "../../common/utility/DataTimeUtils";
import {InterfaceType, InterfaceTcpSocketSettings} from "../../common/model/profile/Interface";

export const DriverTcpSocketDefaults = {
    ip: "192.168.1.10",
    port: 5555,
    ssl: false,
    wsPort: 8765,
}

export class DriverTcpSocket implements DriverOpenClose {

    private cache: DriverCache<Uint8Array>
    private websocket: WebSocket
    private onReceiveCb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void
    private onTransmitCb: (data: Uint8Array | string, chunkInfo: DriverChunkInfo) => void
    private onStatusChangeCb: (status: DriverStatus) => void
    private onErrorCb: (ex: Error) => void
    private idlePromise: Promise<void>;

    readonly name: string;
    _status: DriverStatus;

    public get status(): DriverStatus {
        return this._status;
    }

    constructor(readonly params: InterfaceTcpSocketSettings, private readonly websocketToken?: string) {
        this.name = InterfaceType.InterfaceTcpSocket
        this._status = DriverStatus.CLOSE
        this.cache = new DriverCache()
        this.cache.setTimeout(200, 100)
        this.idlePromise = null
    }

    attach(view: HTMLElement): void {}

    onReceive(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void): void {
        this.onReceiveCb = cb
    }

    onTransmit(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void): void {
        this.onTransmitCb = cb
    }

    onStatusChange(cb: (status: DriverStatus) => void) {
        this.onStatusChangeCb = cb
    }

    onError(cb: (ex: Error) => void) {
        this.onErrorCb = cb
    }

    async loadImport(file: File) {
        await this.close()
        if (this.idlePromise) {
            await this.idlePromise
        }

        const stream = file.stream().getReader()
        const value = (await stream.read()).value

        if (value) {
            this.cache.add(value)
        }

        this.cache.clean()
    }

    async send(data: Uint8Array | string) {
        const chunkInfo = {
            time: GetDateForChunkInfo(),
            isTx: true
        }
        let wdata = data
        if (typeof data === "string") {
            wdata = new TextEncoder().encode(data)
        }
        this.websocket?.send(wdata)
        this.onTransmitCb?.(wdata, chunkInfo)
    }

    async open() {
        this.idlePromise = new Promise<void>(async (resolve) => {
            try {
                const tcpHost = this.params.ip?.value ?? "192.168.1.10"
                const tcpPort = this.params.port?.value ?? 5555
                const tcpSsl = this.params.ssl?.value ?? false
                const wsPort = this.params.wsPort?.value ?? 8765

                const queryParams = new URLSearchParams()
                if (this.websocketToken) queryParams.set("token", this.websocketToken)
                queryParams.set("tcp_host", tcpHost)
                queryParams.set("tcp_port", String(tcpPort))
                if (tcpSsl) queryParams.set("ssl", "true")
                const url = `ws://localhost:${wsPort}/?${queryParams.toString()}`

                this.websocket = new WebSocket(url)
                this.websocket.binaryType = "arraybuffer"

                this.websocket.onopen = () => {
                    this._status = DriverStatus.OPEN
                    this.onStatusChangeCb?.(this._status)
                }

                this.cache.clean()
                this.websocket.onmessage = async (event) => {
                    if (event.data instanceof ArrayBuffer) {
                        this.cache.add(new Uint8Array(event.data))
                    } else if (event.data instanceof Blob) {
                        this.cache.add(new Uint8Array(await event.data.arrayBuffer()))
                    }
                }

                this.websocket.onclose = () => {
                    this.cache.flush()
                    resolve()
                }

                this.websocket.onerror = () => {
                    this.onErrorCb?.(new Error("WebSocket connection error"))
                    resolve()
                }

                this.cache.onFlush((data) => {
                    data.forEach((d) => {
                        const chunkInfo = {
                            time: GetDateForChunkInfo(),
                            isTx: false
                        }
                        this.onReceiveCb?.(d, chunkInfo)
                    })
                })

            } catch (error) {
                console.error(error)
                this.onErrorCb?.(error)
                resolve()
            }
        })

        await this.idlePromise

        this.cache.clean()
        this.websocket = null
        this._status = DriverStatus.CLOSE
        this.onStatusChangeCb?.(this._status)
    }

    async close() {
        this.websocket?.close()
    }

    destroy() {}
}
