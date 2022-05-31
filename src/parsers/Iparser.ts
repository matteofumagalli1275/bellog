
export interface Iparser {
    put(data: Uint8Array): void
    onParsed(cb: (data: Uint8Array | string) => void): void
}