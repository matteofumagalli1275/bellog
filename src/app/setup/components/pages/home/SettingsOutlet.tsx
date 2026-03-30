import * as React from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../../../../common/providers/indexedDb/db";

export const SettingsOutlet = () => {

    const tokenSetting = useLiveQuery(() => db.settings.get("websocketToken"));
    const websocketToken = tokenSetting?.value ?? '';

    function setWebsocketToken(value: string) {
        db.settings.update("websocketToken", {value})
    }

    function regenerateWebsocketToken() {
        db.settings.update("websocketToken", {value: crypto.randomUUID()})
    }

    return (
        <div className="column">
            <h1 className="title">Settings</h1>

            <div className="field">
                <div className="control">
                    <label className="label">WebSocket Token <span className="has-text-danger">*</span></label>
                    <div className="field has-addons">
                        <div className="control is-expanded">
                            <input className={`input${!websocketToken.trim() ? ' is-danger' : ''}`}
                                   type="text"
                                   placeholder="Security token for WebSocket connections"
                                   value={websocketToken}
                                   onChange={(evt) => {
                                       setWebsocketToken(evt.target.value)
                                   }}/>
                        </div>
                        <div className="control">
                            <button className="button" onClick={regenerateWebsocketToken}>
                                Regenerate
                            </button>
                        </div>
                    </div>
                </div>
                {!websocketToken.trim() ?
                    <p className="help is-danger">WebSocket Token is required for secure connections</p> : ""}
            </div>
        </div>
    )
}

export default SettingsOutlet;
