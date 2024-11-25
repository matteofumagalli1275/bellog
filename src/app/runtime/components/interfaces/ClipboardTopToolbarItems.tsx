import * as React from "react";
import {InterfacesProperty} from "../../../common/model/profile/Interface";
import {bellogRuntime} from "../../core/BellogRuntime";
import {ImportButton} from "./ImportButton";

export const ClipboardTopToolbarItems = (props: { ifc: InterfacesProperty }) => {

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                bellogRuntime.feedData(props.ifc.id, text + "\r\n");
            }
        } catch (e) {
            console.error('Clipboard read failed:', e);
        }
    };

    return (
        <React.Fragment>
            <ImportButton ifcId={props.ifc.id} />
            <button className="blr-btn blr-btn--toolbar" onClick={handlePaste}>
                &#128203; Paste
            </button>
        </React.Fragment>
    );
};