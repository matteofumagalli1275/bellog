

export enum DriverStatus {
    OPEN,
    CLOSE
}

export interface DriverChunkInfo {
    time: string,
    isTx: boolean,
    meta?: Record<string, any>
}

export interface Interface {
    readonly name:string
    /* Called when the driver is attached to the view */
    attach(view: HTMLElement): void
    /* Send data to the device
     * @param data The data to send
    */
    send(data: Uint8Array | string): void // TODO DESTINATION INFO
    /* Provide callback to receive data from the device driver
    * @param cb The callback to call when data is received
    * @param data The data received
    * @param chunkInfo Additional data from complex interfaces (CAN bus address, HID report ID, etc.) and timestamp
    */ 
    onReceive(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void):void
    /* Provide callback to receive confirmation of data sent to device
    * @param cb The callback to call when data is received
    * @param data The data received
    * @param chunkInfo Additional data from complex interfaces (CAN bus address, HID report ID, etc.)  and timestamp
    */ 
    onTransmit(cb: (data: Uint8Array, chunkInfo: DriverChunkInfo) => void):void
    onError(cb: (ex: Error) => void):void
    destroy()
}

export interface DriverOpenClose extends Interface {
    get status(): DriverStatus
    open()
    close()
    onStatusChange(cb: (this: Interface) => void):void
}

export interface DriverLoggable extends Interface {
    loadImport()
    enableLogging(prefixName: string)
    disableLogging()
}

export function isDriverOpenClose(driver: Interface): boolean {
    return !!(driver as DriverOpenClose)?.open;
}

export function isDriverLoggable(driver: Interface): boolean {
    return !!(driver as DriverLoggable)?.enableLogging;
}
