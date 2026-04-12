import {DriverError} from "../../common/utility/exception"
import {DriverChunkInfo, DriverOpenClose, DriverStatus} from "./Interface"
import {GetDateForChunkInfo} from "../../common/utility/DataTimeUtils";
import {InterfaceType, InterfaceWebHidSettings} from "../../common/model/profile/Interface";

// Minimal ambient declarations for the WebHID API (not yet in lib.dom.d.ts for all envs)
declare global {
    interface HIDDeviceFilter {
        vendorId?: number;
        productId?: number;
        usagePage?: number;
        usage?: number;
    }
    interface HIDDeviceRequestOptions {
        filters: HIDDeviceFilter[];
    }
    interface HIDCollectionInfo {
        usagePage?: number;
        usage?: number;
    }
    interface HIDDevice extends EventTarget {
        readonly vendorId: number;
        readonly productId: number;
        readonly productName: string;
        readonly opened: boolean;
        readonly collections: HIDCollectionInfo[];
        open(): Promise<void>;
        close(): Promise<void>;
        sendReport(reportId: number, data: BufferSource): Promise<void>;
        sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
        receiveFeatureReport(reportId: number): Promise<DataView>;
        addEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
        removeEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
    }
    interface HIDInputReportEvent extends Event {
        readonly device: HIDDevice;
        readonly reportId: number;
        readonly data: DataView;
    }
    interface HID extends EventTarget {
        getDevices(): Promise<HIDDevice[]>;
        requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
    }
    interface Navigator {
        readonly hid: HID;
    }
}

export const DriverWebHidDefaults = {
    usagePage: 0,
    usage: 0,
}

function hidReportToChunkMeta(reportId: number, device: HIDDevice): Record<string, any> {
    return {
        hid: {
            reportId,
            vendorId: device.vendorId,
            productId: device.productId,
            productName: device.productName,
        }
    }
}

export class DriverWebHid implements DriverOpenClose {

    /**
     * A physical HID device often exposes multiple logical interfaces (e.g. the
     * Logitech G502 appears twice — once for standard movement, once for gaming
     * features).  We open ALL matching interfaces and listen on each so that
     * whichever one carries the input reports is captured.
     */
    private openDevices: HIDDevice[] = []
    private inputReportHandlers: Map<HIDDevice, (event: HIDInputReportEvent) => void> = new Map()
    private disconnectHandler: ((event: any) => void) | null = null

    private onReceiveCb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void
    private onTransmitCb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void
    private onStatusChangeCb: (status: DriverStatus) => void
    private onErrorCb: (ex: Error) => void

    readonly name: string
    _status: DriverStatus

    public get status(): DriverStatus {
        return this._status
    }

    constructor(private readonly params: InterfaceWebHidSettings) {
        this.name = InterfaceType.InterfaceWebHid
        this._status = DriverStatus.CLOSE
    }

    attach(view: HTMLElement): void {}

    onError(cb: (ex: Error) => void): void { this.onErrorCb = cb }
    onReceive(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void): void { this.onReceiveCb = cb }
    onTransmit(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void): void { this.onTransmitCb = cb }
    onStatusChange(cb: (status: DriverStatus) => void): void { this.onStatusChangeCb = cb }

    /**
     * Send an output report.  First byte = HID report ID, remaining = payload.
     * Sends to the first open device interface.
     */
    async send(data: Uint8Array | string) {
        const target = this.openDevices.find(d => d.opened)
        if (!target) return
        try {
            const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data
            const reportId = bytes.length > 0 ? bytes[0] : 0
            const payload = bytes.length > 1 ? bytes.slice(1) : new Uint8Array(0)
            await target.sendReport(reportId, payload)
            this.onTransmitCb?.(bytes as Uint8Array, {time: GetDateForChunkInfo(), isTx: true})
        } catch (error) {
            console.error(error)
            this.onErrorCb?.(error)
        }
    }

    open() {
        (async () => {
            try {
                if (!('hid' in navigator)) {
                    this.onErrorCb?.(new DriverError("WebHID is not supported by your browser. Switch to Chrome or Edge."))
                    return
                }

                const usagePage = this.params.usagePage?.value ?? 0
                const usage = this.params.usage?.value ?? 0

                const filter: HIDDeviceFilter = {}
                if (usagePage !== 0) filter.usagePage = usagePage
                if (usage !== 0) filter.usage = usage

                // Collect ALL previously-granted devices.
                const granted = await navigator.hid.getDevices()
                console.log('[WebHID] Granted devices:', granted.length,
                    granted.map(d => `${d.productName} collections:[${d.collections.map(c => `${c.usagePage}/${c.usage}`).join(',')}]`))

                // Find devices whose collections match the usagePage/usage filter.
                const matching = granted.filter(d => {
                    if (usagePage === 0) return true
                    return d.collections.some(c =>
                        c.usagePage === usagePage && (usage === 0 || c.usage === usage)
                    )
                })

                // Open ALL HID interfaces that belong to any matched physical device.
                // A gaming mouse (e.g. Logitech G502) exposes multiple HID interfaces at the
                // OS level; the one whose collection matches the filter may not be the
                // interface that actually delivers inputreport events — another interface of
                // the same physical device might. Opening all of them ensures coverage.
                const matchingProducts = new Set(matching.map(d => d.productName))
                let targets: HIDDevice[] = matching.length > 0
                    ? granted.filter(d => matchingProducts.has(d.productName))
                    : []

                if (targets.length === 0) {
                    console.log('[WebHID] No matching granted device — showing picker')
                    const selected = await navigator.hid.requestDevice({
                        filters: Object.keys(filter).length > 0 ? [filter] : []
                    })
                    targets = selected
                    console.log('[WebHID] User selected:', targets.map(d => d.productName))
                } else {
                    console.log('[WebHID] Reusing', targets.length, 'granted device(s):',
                        targets.map(d => `${d.productName} [${d.collections.map(c => `${c.usagePage}/${c.usage}`).join(',')}]`))
                }

                if (targets.length === 0) {
                    this.onErrorCb?.(new Error("No HID device selected."))
                    return
                }

                // Open every matching interface
                for (const dev of targets) {
                    try {
                        if (dev.opened) await dev.close().catch(() => {})
                        await dev.open()
                        console.log('[WebHID] Opened:', dev.productName,
                            'collections:', dev.collections.map(c => `${c.usagePage}/${c.usage}`))

                        const handler = (event: HIDInputReportEvent) => {
                            const {reportId, data} = event
                            const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
                            console.log('[WebHID] inputreport from', dev.productName,
                                'reportId:', reportId, 'bytes:', bytes.length)
                            const chunkInfo: DriverChunkInfo = {
                                time: GetDateForChunkInfo(),
                                isTx: false,
                                meta: hidReportToChunkMeta(reportId, dev)
                            }
                            this.onReceiveCb?.(bytes, chunkInfo)
                        }

                        dev.addEventListener('inputreport', handler)
                        this.inputReportHandlers.set(dev, handler)
                        this.openDevices.push(dev)
                    } catch (devErr) {
                        console.warn('[WebHID] Could not open', dev.productName, ':', devErr)
                    }
                }

                if (this.openDevices.length === 0) {
                    this.onErrorCb?.(new Error("Could not open any HID device interface."))
                    return
                }

                this._status = DriverStatus.OPEN
                this.onStatusChangeCb?.(this._status)

                // Disconnect fires on navigator.hid, not on the device
                this.disconnectHandler = (event: any) => {
                    const disconnected: HIDDevice = event.device
                    if (!this.openDevices.includes(disconnected)) return
                    console.log('[WebHID] Device disconnected:', disconnected.productName)
                    const handler = this.inputReportHandlers.get(disconnected)
                    if (handler) disconnected.removeEventListener('inputreport', handler)
                    this.inputReportHandlers.delete(disconnected)
                    this.openDevices = this.openDevices.filter(d => d !== disconnected)

                    if (this.openDevices.length === 0) {
                        this._status = DriverStatus.CLOSE
                        this.onStatusChangeCb?.(this._status)
                    }
                }
                ;(navigator.hid as any).addEventListener('disconnect', this.disconnectHandler)

            } catch (error) {
                console.error('[WebHID] open() error:', error)
                this.onErrorCb?.(error)
                this._status = DriverStatus.CLOSE
                this.onStatusChangeCb?.(this._status)
            }
        })()
    }

    close() {
        for (const [dev, handler] of this.inputReportHandlers) {
            dev.removeEventListener('inputreport', handler)
            dev.close().catch(() => {})
        }
        this.inputReportHandlers.clear()
        this.openDevices = []

        if (this.disconnectHandler) {
            ;(navigator.hid as any).removeEventListener('disconnect', this.disconnectHandler)
            this.disconnectHandler = null
        }

        this._status = DriverStatus.CLOSE
        this.onStatusChangeCb?.(this._status)
    }

    destroy() {
        this.close()
    }
}
