import * as React from "react";
import {useRef} from "react";
import {bellogRuntime} from "../../core/BellogRuntime";

/**
 * Reusable "Import" toolbar button.
 * Reads a file as raw binary and feeds it through the interface's input pipeline
 * via feedData(). Interfaces that should not support import simply omit this component.
 */
export const ImportButton = (props: { ifcId: number }) => {

    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        bellogRuntime.feedData(props.ifcId, new Uint8Array(buffer));
        // Reset so the same file can be re-imported
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <React.Fragment>
            <input
                ref={inputRef}
                type="file"
                style={{display: 'none'}}
                onChange={handleFile}
            />
            <button className="blr-btn blr-btn--toolbar" onClick={handleClick}>
                &#128229; Import
            </button>
        </React.Fragment>
    );
};
