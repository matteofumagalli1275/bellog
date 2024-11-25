import * as React from "react";
import {useEffect, useRef, useMemo, useState, useCallback} from "react";
import {stripHtml} from "./highlightHtml";

interface SearchBarProps {
    /** All entries in the fragment (read-only). */
    entries: { html: string; isHook: boolean }[];
    /** Called when search term changes so parent can apply highlights. */
    onSearchTermChange: (term: string) => void;
    /** Called to scroll Virtuoso to a specific entry index. */
    onNavigate: (entryIndex: number) => void;
    /** Called when user closes the search bar. */
    onClose: () => void;
}

export const FragmentSearchBar = (props: SearchBarProps) => {

    const [term, setTerm] = useState('');
    const [currentIdx, setCurrentIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Compute matching entry indices
    const matchIndices = useMemo(() => {
        if (!term) return [];
        const lower = term.toLowerCase();
        const indices: number[] = [];
        for (let i = 0; i < props.entries.length; i++) {
            const e = props.entries[i];
            if (e.isHook || !e.html) continue;
            if (stripHtml(e.html).toLowerCase().includes(lower)) {
                indices.push(i);
            }
        }
        return indices;
    }, [term, props.entries]);

    // Notify parent of term changes
    useEffect(() => {
        props.onSearchTermChange(term);
    }, [term]);

    // Navigate to current match when matchIndices or currentIdx changes
    useEffect(() => {
        if (matchIndices.length > 0) {
            const clamped = Math.min(currentIdx, matchIndices.length - 1);
            if (clamped !== currentIdx) setCurrentIdx(clamped);
            props.onNavigate(matchIndices[clamped]);
        }
    }, [matchIndices, currentIdx]);

    const goNext = useCallback(() => {
        if (matchIndices.length === 0) return;
        setCurrentIdx(prev => (prev + 1) % matchIndices.length);
    }, [matchIndices]);

    const goPrev = useCallback(() => {
        if (matchIndices.length === 0) return;
        setCurrentIdx(prev => (prev - 1 + matchIndices.length) % matchIndices.length);
    }, [matchIndices]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            props.onClose();
        } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            goPrev();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            goNext();
        }
    };

    const displayIdx = matchIndices.length > 0 ? currentIdx + 1 : 0;

    return (
        <div className="blr-search-bar">
            <input
                ref={inputRef}
                type="text"
                className="blr-search-bar__input"
                placeholder="Search…"
                value={term}
                onChange={(e) => { setTerm(e.target.value); setCurrentIdx(0); }}
                onKeyDown={handleKeyDown}
            />
            <span className="blr-search-bar__count">
                {term ? `${displayIdx} / ${matchIndices.length}` : ''}
            </span>
            <button className="blr-search-bar__btn" onClick={goPrev} title="Previous (Shift+Enter)">&#9650;</button>
            <button className="blr-search-bar__btn" onClick={goNext} title="Next (Enter)">&#9660;</button>
            <button className="blr-search-bar__btn" onClick={props.onClose} title="Close (Escape)">&#10005;</button>
        </div>
    );
};
