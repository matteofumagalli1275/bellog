import * as React from "react";
import {useState} from "react";
import {InterfacesProperty} from "../../../common/model/profile/Interface";
import {bellogRuntime} from "../../core/BellogRuntime";
import {ImportButton} from "./ImportButton";

export const WebSerialTopToolbar = (props: { ifc: InterfacesProperty }) => {

    const [connected, setConnected] = useState(false);

    const handleToggle = async () => {
        if (connected) {
            bellogRuntime.disconnectInterface(props.ifc.id);
            setConnected(false);
        } else {
            await bellogRuntime.connectInterface(props.ifc.id);
            setConnected(true);
        }
    };

    return (
        <React.Fragment>
            <ImportButton ifcId={props.ifc.id} />
            <button
                className={`blr-btn blr-btn--toolbar ${connected ? 'blr-btn--active' : ''}`}
                onClick={handleToggle}
            >
                {connected ? '\u26A1 Disconnect' : '\uD83D\uDD0C Connect'}
            </button>
        </React.Fragment>
    );
};