export interface CanFrame {
    id: number
    dlc: number
    data: Uint8Array
    rtr: boolean
    ext: boolean
    fd: boolean
}

/**
 * Build the `meta` object for DriverChunkInfo from a CAN frame.
 * This gets spread into `_origin` by BellogRuntime, producing
 * `_origin.can.id`, `_origin.can.hex_id`, etc.
 */
export function canFrameToChunkMeta(frame: CanFrame): Record<string, any> {
    return {
        can: {
            id: frame.id,
            hex_id: "0x" + frame.id.toString(16).toUpperCase(),
            dlc: frame.dlc,
            rtr: frame.rtr,
            ext: frame.ext,
            fd: frame.fd,
        }
    }
}

/**
 * Parse a comma-separated list of hex CAN IDs into a Set.
 * Returns null if the string is empty (= accept all).
 * Accepts "0x123, 0x456" or "123, 456" (hex assumed).
 */
export function parseCanIdWhitelist(str: string): Set<number> | null {
    const trimmed = str.trim()
    if (!trimmed) return null
    const ids = new Set<number>()
    for (const part of trimmed.split(",")) {
        const cleaned = part.trim().toLowerCase().replace(/^0x/, "")
        const num = parseInt(cleaned, 16)
        if (!isNaN(num)) ids.add(num)
    }
    return ids.size > 0 ? ids : null
}
