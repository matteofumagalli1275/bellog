import {useEffect, useState} from "react";
import * as React from "react";
import {bellogRuntime} from "../core/BellogRuntime";
import {bellogRuntimeDataBus} from "../core/BellogRuntimeDataBus";
import {bellogRuntimeScrollLock} from "../core/BellogRuntimeScrollLock";
import {WebSerialTopToolbar} from "./interfaces/WebSerialTopToolbarItems";
import {CommonTopToolbarItems} from "./interfaces/CommonTopToolbarItems";
import {InterfaceType} from "../../common/model/profile/Interface";
import {ClipboardTopToolbarItems} from "./interfaces/ClipboardTopToolbarItems";
import {CanTopToolbarItems} from "./interfaces/CanTopToolbarItems";

export const RuntimeTopToolbar = () => {

    const ifcs = bellogRuntime.getInterfaces();
    const [selectedIfcId, setSelectedIfcId] = useState(ifcs.length > 0 ? ifcs[0].id : -1);
    const selectedIfc = ifcs.find(i => i.id === selectedIfcId) ?? ifcs[0];
    const [locked, setLocked] = useState(bellogRuntimeScrollLock.locked);

    useEffect(() => {
        return bellogRuntimeScrollLock.subscribe(setLocked);
    }, []);

    if (!selectedIfc) return null;

    const renderIfcItems = () => {
        switch (selectedIfc.type) {
            case InterfaceType.InterfaceClipboard:
                return <ClipboardTopToolbarItems ifc={selectedIfc} />;
            case InterfaceType.InterfaceSerialPortWebSerial:
                return <WebSerialTopToolbar ifc={selectedIfc} />;
            case InterfaceType.InterfaceCAN:
                return <CanTopToolbarItems ifc={selectedIfc} />;
            default:
                return null;
        }
    };

    return (
        <div className="blr-toolbar">
            <div className="blr-toolbar-brand">
                <a href="/index.html" title="Back to Home">
                    <img src="/logo.png" alt="Bellog" style={{ height: 24, verticalAlign: 'middle' }} />
                </a>
                <select
                    className="blr-select"
                    value={selectedIfcId}
                    onChange={(e) => setSelectedIfcId(parseInt(e.target.value))}
                >
                    {ifcs.map((ifc) => (
                        <option key={ifc.id} value={ifc.id}>{ifc.name}</option>
                    ))}
                </select>
            </div>
            <div className="blr-toolbar-items">
                {renderIfcItems()}
            </div>
            <div className="blr-toolbar-center">
                <button className="blr-btn blr-btn--toolbar" onClick={() => bellogRuntimeDataBus.notifyReset()}>&#128465; Clear</button>
                <button className={`blr-btn blr-btn--toolbar ${locked ? 'blr-btn--active' : ''}`} onClick={() => bellogRuntimeScrollLock.toggle()}>
                    {locked ? '\uD83D\uDD12 Lock' : '\uD83D\uDD13 Lock'}
                </button>
            </div>
            <div className="blr-toolbar-right">
                <CommonTopToolbarItems />
            </div>
        </div>
    );
};