import {DriverStatus} from "../Interface";
import {DriverCache} from "../DriverCache";
import {CanFrame} from "./CanFrame";
import {SlcanCommands, SlcanParser} from "./SlcanProtocol";

export class CanSerialTransport {

    private port: SerialPort | null = null
    private portReader: ReadableStreamDefaultReader<Uint8Array> | null = null
    private readLoopDone: Promise<void> | null = null
    private parser: SlcanParser
    private cache: DriverCache<CanFrame>
    private onFrameCb: (frame: CanFrame) => void
    private onStatusChangeCb: (status: DriverStatus) => void
    private onErrorCb: (ex: Error) => void
    private _status: DriverStatus = DriverStatus.CLOSE

    get status(): DriverStatus { return this._status }

    constructor() {
        this.parser = new SlcanParser()
        this.cache = new DriverCache()
        this.cache.setTimeout(200, 100)
    }

    onFrame(cb: (frame: CanFrame) => void) { this.onFrameCb = cb }
    onStatusChange(cb: (status: DriverStatus) => void) { this.onStatusChangeCb = cb }
    onError(cb: (ex: Error) => void) { this.onErrorCb = cb }

    async open(options: { bitrate: number, busMode: string, canFd: boolean }) {
        try {
            // Request or reuse a serial port
            const ports = await navigator.serial.getPorts()
            this.port = ports.length > 0 ? ports[0] : await navigator.serial.requestPort()
            await this.port.open({ baudRate: 115200 })

            this._status = DriverStatus.OPEN
            this.onStatusChangeCb?.(this._status)

            // Wire cache flush to callback
            this.cache.onFlush((frames) => {
                frames.forEach((f) => this.onFrameCb?.(f))
            })

            // Send slcan init sequence
            await this.writeSerial(SlcanCommands.close()) // ensure clean state
            const bitrateCmd = SlcanCommands.setBitrate(options.bitrate)
            if (bitrateCmd) await this.writeSerial(bitrateCmd)
            await this.writeSerial(SlcanCommands.open(options.busMode))

            // Start reading
            this.parser.reset()
            this.readLoopDone = this.readLoop()
        } catch (err) {
            this._status = DriverStatus.CLOSE
            this.onStatusChangeCb?.(this._status)
            this.onErrorCb?.(err instanceof Error ? err : new Error(String(err)))
        }
    }

    private async readLoop() {
        try {
            while (this.port.readable && this._status === DriverStatus.OPEN) {
                this.portReader = this.port.readable.getReader()
                try {
                    while (true) {
                        const { value, done } = await this.portReader.read()
                        if (done) break
                        if (value) {
                            const frames = this.parser.feed(value)
                            frames.forEach((f) => this.cache.add(f))
                        }
                    }
                } finally {
                    this.portReader.releaseLock()
                }
            }
        } catch (err) {
            if (this._status === DriverStatus.OPEN) {
                this.onErrorCb?.(err instanceof Error ? err : new Error(String(err)))
            }
        }
        // Flush remaining
        this.cache.flush()
        if (this._status === DriverStatus.OPEN) {
            this._status = DriverStatus.CLOSE
            this.onStatusChangeCb?.(this._status)
        }
    }

    async send(frame: CanFrame) {
        const cmd = SlcanCommands.buildFrame(frame)
        await this.writeSerial(cmd)
    }

    async close() {
        this._status = DriverStatus.CLOSE
        try {
            await this.writeSerial(SlcanCommands.close())
        } catch { /* ignore if already closed */ }
        try {
            await this.portReader?.cancel()
        } catch { /* ignore */ }
        // Wait for readLoop to exit and release its lock before closing the port
        await this.readLoopDone?.catch(() => {})
        this.readLoopDone = null
        try {
            await this.port?.close()
        } catch { /* ignore */ }
        try {
            // Forget the port so the user is prompted to select one on next connect
            await (this.port as any)?.forget()
        } catch { /* ignore */ }
        this.port = null
        this.portReader = null
        this.parser.reset()
        this.cache.clean()
        this.onStatusChangeCb?.(this._status)
    }

    private async writeSerial(cmd: string) {
        if (!this.port?.writable) return
        const writer = this.port.writable.getWriter()
        try {
            await writer.write(new TextEncoder().encode(cmd))
        } finally {
            writer.releaseLock()
        }
    }

    destroy() {
        this.cache.clean()
        this.parser.reset()
    }
}
