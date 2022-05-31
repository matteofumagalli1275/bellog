import {Iparser} from "./Iparser";

export class LineParser implements Iparser {

    private buffer: string = ""
    private onParsedCb: (data: Uint8Array | string) => void

    onParsed(cb: (data: Uint8Array | string) => void) {
        this.onParsedCb = cb
    }

    put(_data: Uint8Array) {
        const data = String.fromCharCode.apply(null, _data);
        for (let i = 0; i < data.length; i++) {
            if (data[i] == '\r' || data[i] == '\n') {
                if (this.buffer.length > 0) {

                    this.onParsedCb?.(this.buffer)
                    this.buffer = ""
                }
            } else {
                this.buffer += data[i]
            }
        }
    }
}