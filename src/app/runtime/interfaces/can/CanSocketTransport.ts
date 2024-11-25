import {DriverStatus} from "../Interface";
import {DriverCache} from "../DriverCache";
import {CanFrame} from "./CanFrame";

/**
 * WebSocket transport for CAN frames.
 * Supports two wire formats (auto-detected on first message):
 *  - Binary: Linux socketcan `can_frame` struct (16 bytes per frame)
 *  - JSON text: { id: number, dlc?: number, data: number[], rtr?: bool, ext?: bool, fd?: bool }
 */
export class CanSocketTransport {

    private ws: WebSocket
    private cache: DriverCache<CanFrame>
    private onFrameCb: (frame: CanFrame) => void
    private onStatusChangeCb: (status: DriverStatus) => void
    private onErrorCb: (ex: Error) => void
    private _status: DriverStatus = DriverStatus.CLOSE

    get status(): DriverStatus { return this._status }

    constructor() {
        this.cache = new DriverCache()
        this.cache.setTimeout(200, 100)
    }

    onFrame(cb: (frame: CanFrame) => void) { this.onFrameCb = cb }
    onStatusChange(cb: (status: DriverStatus) => void) { this.onStatusChangeCb = cb }
    onError(cb: (ex: Error) => void) { this.onErrorCb = cb }

    async open(options: { socketUrl: string }) {
        this.cache.onFlush((frames) => {
            frames.forEach((f) => this.onFrameCb?.(f))
        })

        this.ws = new WebSocket(options.socketUrl)
        this.ws.binaryType = "arraybuffer"

        this.ws.onopen = () => {
            this._status = DriverStatus.OPEN
            this.onStatusChangeCb?.(this._status)
        }

        this.ws.onmessage = (event) => {
            try {
                if (event.data instanceof ArrayBuffer) {
                    this.parseBinaryFrames(event.data)
                } else if (typeof event.data === "string") {
                    this.parseJsonFrame(event.data)
                }
            } catch (err) {
                this.onErrorCb?.(err instanceof Error ? err : new Error(String(err)))
            }
        }

        this.ws.onerror = () => {
            this.onErrorCb?.(new Error("WebSocket error"))
        }

        this.ws.onclose = () => {
            this.cache.flush()
            if (this._status === DriverStatus.OPEN) {
                this._status = DriverStatus.CLOSE
                this.onStatusChangeCb?.(this._status)
            }
        }
    }

    /**
     * Parse Linux socketcan can_frame struct (16 bytes):
     *   [0..3]  can_id (uint32 LE, bits 31=err, 30=rtr, 29=eff/ext)
     *   [4]     can_dlc (data length)
     *   [5..7]  padding
     *   [8..15] data (up to 8 bytes)
     *
     * For CAN FD (canfd_frame, 72 bytes):
     *   [0..3]  can_id
     *   [4]     len (up to 64)
     *   [5]     flags  (bit 0 = BRS, bit 1 = ESI)
     *   [6..7]  reserved
     *   [8..71] data (up to 64 bytes)
     */
    private parseBinaryFrames(buffer: ArrayBuffer) {
        const view = new DataView(buffer)
        let offset = 0
        while (offset + 8 <= buffer.byteLength) {
            const rawId = view.getUint32(offset, true)
            const ext = (rawId & 0x80000000) !== 0 // EFF flag
            const rtr = (rawId & 0x40000000) !== 0 // RTR flag
            const id = rawId & 0x1FFFFFFF

            const dlc = view.getUint8(offset + 4)
            const fd = buffer.byteLength - offset >= 72 && dlc > 8

            const frameSize = fd ? 72 : 16
            if (offset + frameSize > buffer.byteLength) break

            const data = new Uint8Array(buffer, offset + 8, dlc)
            this.cache.add({ id, dlc, data: new Uint8Array(data), rtr, ext, fd })

            offset += frameSize
        }
    }

    private parseJsonFrame(text: string) {
        const obj = JSON.parse(text)
        const frame: CanFrame = {
            id: obj.id ?? 0,
            dlc: obj.dlc ?? (obj.data?.length ?? 0),
            data: new Uint8Array(obj.data ?? []),
            rtr: obj.rtr ?? false,
            ext: obj.ext ?? false,
            fd: obj.fd ?? false,
        }
        this.cache.add(frame)
    }

    send(frame: CanFrame) {
        if (this.ws?.readyState !== WebSocket.OPEN) return
        // Send as JSON for broad compatibility
        this.ws.send(JSON.stringify({
            id: frame.id,
            dlc: frame.dlc,
            data: Array.from(frame.data),
            rtr: frame.rtr,
            ext: frame.ext,
            fd: frame.fd,
        }))
    }

    close() {
        this._status = DriverStatus.CLOSE
        this.ws?.close()
        this.cache.clean()
        this.onStatusChangeCb?.(this._status)
    }

    destroy() {
        this.cache.clean()
    }
}
