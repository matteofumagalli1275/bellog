import {CanFrame} from "./CanFrame";

/**
 * Standard CAN bitrate codes for the slcan "Sn" command.
 * Maps CAN bitrate → slcan code digit.
 */
const BITRATE_MAP: Record<number, string> = {
    10000: "0",
    20000: "1",
    50000: "2",
    100000: "3",
    125000: "4",
    250000: "5",
    500000: "6",
    800000: "7",
    1000000: "8",
}

/**
 * Incremental slcan ASCII protocol parser.
 * Feed raw serial bytes and get parsed CAN frames out.
 *
 * slcan frame format:
 *   t III L DD..DD \r   — standard 11-bit ID
 *   T IIIIIIII L DD..DD \r   — extended 29-bit ID
 *   r III L \r            — standard RTR
 *   R IIIIIIII L \r       — extended RTR
 *   d III L DD..DD \r     — standard CAN FD (extension)
 *   D IIIIIIII L DD..DD \r — extended CAN FD (extension)
 */
export class SlcanParser {
    private buffer: string = ""

    /**
     * Feed raw bytes from the serial port.
     * Returns an array of parsed CAN frames (may be empty).
     */
    feed(chunk: Uint8Array): CanFrame[] {
        this.buffer += new TextDecoder().decode(chunk)
        const frames: CanFrame[] = []
        let crIdx: number
        while ((crIdx = this.buffer.indexOf("\r")) !== -1) {
            const line = this.buffer.substring(0, crIdx)
            this.buffer = this.buffer.substring(crIdx + 1)
            const frame = this.parseLine(line)
            if (frame) frames.push(frame)
        }
        // Prevent unbounded buffer growth from garbage data
        if (this.buffer.length > 1024) {
            this.buffer = this.buffer.substring(this.buffer.length - 256)
        }
        return frames
    }

    reset() {
        this.buffer = ""
    }

    private parseLine(line: string): CanFrame | null {
        if (line.length < 2) return null
        const cmd = line[0]
        switch (cmd) {
            case "t": return this.parseDataFrame(line, false, false, false)
            case "T": return this.parseDataFrame(line, true, false, false)
            case "r": return this.parseRtrFrame(line, false)
            case "R": return this.parseRtrFrame(line, true)
            case "d": return this.parseDataFrame(line, false, false, true)
            case "D": return this.parseDataFrame(line, true, false, true)
            default: return null // ignore status/ack responses
        }
    }

    private parseDataFrame(line: string, ext: boolean, rtr: boolean, fd: boolean): CanFrame | null {
        const idLen = ext ? 8 : 3
        if (line.length < 1 + idLen + 1) return null
        const idHex = line.substring(1, 1 + idLen)
        const id = parseInt(idHex, 16)
        if (isNaN(id)) return null

        const dlcChar = line[1 + idLen]
        const dlc = parseInt(dlcChar, 16)
        if (isNaN(dlc)) return null

        const dataHex = line.substring(1 + idLen + 1)
        const expectedLen = dlc * 2
        if (dataHex.length < expectedLen) return null

        const data = new Uint8Array(dlc)
        for (let i = 0; i < dlc; i++) {
            data[i] = parseInt(dataHex.substring(i * 2, i * 2 + 2), 16)
        }

        return { id, dlc, data, rtr, ext, fd }
    }

    private parseRtrFrame(line: string, ext: boolean): CanFrame | null {
        const idLen = ext ? 8 : 3
        if (line.length < 1 + idLen + 1) return null
        const idHex = line.substring(1, 1 + idLen)
        const id = parseInt(idHex, 16)
        if (isNaN(id)) return null

        const dlcChar = line[1 + idLen]
        const dlc = parseInt(dlcChar, 16)
        if (isNaN(dlc)) return null

        return { id, dlc, data: new Uint8Array(0), rtr: true, ext, fd: false }
    }
}

export const SlcanCommands = {
    /**
     * Open CAN channel. "O\r" for normal mode, "L\r" for listen-only.
     */
    open(mode: string): string {
        return mode === "listen-only" ? "L\r" : "O\r"
    },

    /**
     * Close CAN channel.
     */
    close(): string {
        return "C\r"
    },

    /**
     * Set CAN bitrate via standard "Sn\r" command.
     * Returns empty string if bitrate is not in the standard table.
     */
    setBitrate(rate: number): string {
        const code = BITRATE_MAP[rate]
        return code != null ? `S${code}\r` : ""
    },

    /**
     * Encode a CAN frame as an slcan ASCII command.
     */
    buildFrame(frame: CanFrame): string {
        let cmd: string
        if (frame.rtr) {
            cmd = frame.ext ? "R" : "r"
        } else if (frame.fd) {
            cmd = frame.ext ? "D" : "d"
        } else {
            cmd = frame.ext ? "T" : "t"
        }

        const idStr = frame.ext
            ? frame.id.toString(16).toUpperCase().padStart(8, "0")
            : frame.id.toString(16).toUpperCase().padStart(3, "0")

        const dlcStr = frame.dlc.toString(16).toUpperCase()

        let dataStr = ""
        if (!frame.rtr) {
            for (let i = 0; i < frame.data.length; i++) {
                dataStr += frame.data[i].toString(16).toUpperCase().padStart(2, "0")
            }
        }

        return `${cmd}${idStr}${dlcStr}${dataStr}\r`
    },
}
