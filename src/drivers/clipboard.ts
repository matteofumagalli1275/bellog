import {Driver, DriverStatus} from "./driver";


export class DriverClipboard implements Driver {

    private onReceiveCb: (data: Uint8Array) => void
    private onStatusChangeCb: (status: DriverStatus) => void
    private onError: () => void
    readonly name: string;
    private _status: DriverStatus;

    public get status(): DriverStatus {
        return this._status;
    }

    constructor() {
        this.name = "Clipboard"
        this._status = DriverStatus.CLOSE

        document.addEventListener('keydown', async (evt) => {
            if (evt.key === 'v' && evt.ctrlKey) {
                const text = await navigator.clipboard.readText();
                const arr = new TextEncoder().encode(text);
                this.onReceiveCb?.(arr)
            }
        });
    }

    onReceive(cb: (data: Uint8Array) => void) {
        this.onReceiveCb = cb
    }

    onStatusChange(cb: (status: DriverStatus) => void) {
        this.onStatusChangeCb = cb
        cb(this._status)
    }

    send(data: Uint8Array) {

    }

    open()
    {
        this._status = DriverStatus.OPEN
        this.onStatusChangeCb(this._status)
    }

    close()
    {
        this._status = DriverStatus.CLOSE
        this.onStatusChangeCb(this._status)
    }
}