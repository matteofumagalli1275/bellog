import {Iparser} from "./Iparser";

export class RawParser implements Iparser {

    private buffer: string = ""
    private onParsedCb: (data: Uint8Array | string) => void

    onParsed(cb: (data: Uint8Array | string) => void) {
        this.onParsedCb = cb
    }

    put(_data: Uint8Array) {
        this.onParsedCb?.(_data)
    }
}