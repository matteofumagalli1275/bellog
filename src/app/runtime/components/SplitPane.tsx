import * as React from "react";
import {useCallback, useRef, useState, useEffect} from "react";

export type SplitDirection = "horizontal" | "vertical";

interface SplitPaneProps {
    /** "horizontal" = side-by-side columns, "vertical" = stacked rows */
    direction: SplitDirection;
    /** Initial size of the first pane in percent (0–100) */
    initialPercent: number;
    /** Content for the first pane */
    first: React.ReactNode;
    /** Content for the second pane */
    second: React.ReactNode;
}

/**
 * A two-pane split container with a draggable divider.
 * Works for both horizontal (column) and vertical (row) splits.
 */
export const SplitPane = ({direction, initialPercent, first, second}: SplitPaneProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [percent, setPercent] = useState(initialPercent);
    const dragging = useRef(false);

    const isHorizontal = direction === "horizontal";

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;
        document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
        // Prevent text selection while dragging
        document.body.style.userSelect = "none";
    }, [isHorizontal]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            let newPercent: number;
            if (isHorizontal) {
                newPercent = ((e.clientX - rect.left) / rect.width) * 100;
            } else {
                newPercent = ((e.clientY - rect.top) / rect.height) * 100;
            }
            // Clamp between 5% and 95%
            newPercent = Math.max(5, Math.min(95, newPercent));
            setPercent(newPercent);
        };

        const onMouseUp = () => {
            if (dragging.current) {
                dragging.current = false;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            }
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [isHorizontal]);

    const flexDir = isHorizontal ? "row" : "column";
    const sizeKey = isHorizontal ? "width" : "height";

    return (
        <div
            ref={containerRef}
            className="blr-split-pane"
            style={{flexDirection: flexDir}}
        >
            <div className="blr-split-pane__panel" style={{[sizeKey]: `${percent}%`}}>
                {first}
            </div>
            <div
                className={`blr-split-pane__divider ${isHorizontal ? "blr-split-pane__divider--h" : "blr-split-pane__divider--v"}`}
                onMouseDown={onMouseDown}
            />
            <div className="blr-split-pane__panel blr-split-pane__panel--grow">
                {second}
            </div>
        </div>
    );
};
