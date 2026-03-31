import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {profileSelectInterfaceById} from "../../../../store/profile/ProfileSelectors";
import {profileInterfacesActions} from "../../../../store/profile/ProfileInterfacesSlice";
import {RootState} from "../../../../store/AppStore";
import {InterfaceCanSettings} from "../../../../../common/model/profile/Interface";
import {BindableInput} from "../BindableInput";
import {BindableSelect} from "../BindableSelect";
import {BindableSelectBoolean} from "../BindableSelectBoolean";
import {BindableDataList} from "../BindableDataList";

export const InterfaceCanSetup = (props: { id: number, handleClose: () => void }) => {

    const dispatch = useDispatch();
    const ifn = useSelector((state: RootState) => profileSelectInterfaceById(state, props.id))
    const settings = ifn.settings as InterfaceCanSettings

    function updateSettings(key: keyof InterfaceCanSettings, value: any) {
        dispatch(profileInterfacesActions.interfaceUpdate({id: props.id, settings: {[key]: value}}));
    }

    const isSerial = settings.transport?.value === "serial"

    const defaultBitrates = [10000, 20000, 50000, 100000, 125000, 250000, 500000, 800000, 1000000]

    return (
        <React.Fragment>
            <div className="field">
                <BindableSelect title={"Transport"}
                                options={["serial", "socket"]}
                                bv={settings.transport}
                                availableParams={[]}
                                setBindableVariable={(val) => updateSettings("transport", val)}
                />
            </div>

            <div className={`field is-grouped is-grouped-multiline ${isSerial ? "" : "is-hidden"}`}>
                <BindableDataList title={"CAN Bitrate"}
                                  options={defaultBitrates}
                                  bv={settings.bitrate}
                                  availableParams={[]}
                                  setBindableVariable={(val) => updateSettings("bitrate", val)}
                />

                <BindableSelect title={"Bus Mode"}
                                options={["normal", "listen-only"]}
                                bv={settings.busMode}
                                availableParams={[]}
                                setBindableVariable={(val) => updateSettings("busMode", val)}
                />

                <BindableSelectBoolean title={"CAN FD"}
                                       bv={settings.canFd}
                                       availableParams={[]}
                                       setBindableVariable={(val) => updateSettings("canFd", val)}
                />
            </div>

            <div className={`field ${isSerial ? "is-hidden" : ""}`}>
                <BindableInput title={"WebSocket URL"}
                               bv={settings.socketUrl}
                               availableParams={[]}
                               setBindableVariable={(val) => updateSettings("socketUrl", val)}
                />
            </div>

            <div className="field">
                <BindableInput title={"ID Whitelist (hex, comma-separated)"}
                               bv={settings.idWhitelist}
                               availableParams={[]}
                               setBindableVariable={(val) => updateSettings("idWhitelist", val)}
                />
            </div>

            <div className="field">
                <BindableInput title={"My Default CAN ID (hex)"}
                               bv={settings.defaultCanId}
                               availableParams={[]}
                               setBindableVariable={(val) => updateSettings("defaultCanId", val)}
                />
            </div>
        </React.Fragment>
    )
}
