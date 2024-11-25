/**
 * Wraps case-insensitive occurrences of `term` in <mark> tags within
 * the text segments of an HTML string, leaving tags and attributes intact.
 */
export function highlightHtml(html: string, term: string): string {
    if (!term) return html;
    // Split HTML into tags and text segments
    const parts = html.split(/(<[^>]*>)/);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    for (let i = 0; i < parts.length; i++) {
        // Even indices are text segments, odd indices are tags
        if (i % 2 === 0 && parts[i]) {
            parts[i] = parts[i].replace(re, '<mark>$1</mark>');
        }
    }
    return parts.join('');
}

/** Strip HTML tags and return plain text for searching. */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}
