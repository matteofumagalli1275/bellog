
export enum DriverStatus {
    OPEN,
    CLOSE
}

export interface Driver {
    readonly name:string

    get status(): DriverStatus

    send(data: Uint8Array): void
    onReceive(cb: (this: Driver, data: Uint8Array) => void):void
    onStatusChange(cb: (this: Driver) => void):void

}