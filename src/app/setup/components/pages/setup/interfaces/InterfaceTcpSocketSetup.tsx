import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {profileSelectInterfaceById} from "../../../../store/profile/ProfileSelectors";
import {profileInterfacesActions} from "../../../../store/profile/ProfileInterfacesSlice";
import {RootState} from "../../../../store/AppStore";
import {InterfaceTcpSocketSettings} from "../../../../../common/model/profile/Interface";
import {BindableInput} from "../BindableInput";
import {BindableSelectBoolean} from "../BindableSelectBoolean";

export const InterfaceTcpSocketSetup = (props: { id: number, handleClose: () => void }) => {

    const dispatch = useDispatch();
    const ifn = useSelector((state: RootState) => profileSelectInterfaceById(state, props.id))
    const settings = ifn.settings as InterfaceTcpSocketSettings

    function updateSettings(key: keyof InterfaceTcpSocketSettings, value: any) {
        dispatch(profileInterfacesActions.interfaceUpdate({id: props.id, settings: {[key]: value}}));
    }

    return (
        <React.Fragment>
            <div className="field">
                <BindableInput title={"TCP Target IP"}
                               bv={settings.ip}
                               availableParams={[]}
                               setBindableVariable={(val) => updateSettings("ip", val)}
                />
            </div>

            <div className="field">
                <BindableInput title={"TCP Target Port"}
                               bv={settings.port}
                               availableParams={[]}
                               setBindableVariable={(val) => updateSettings("port", val)}
                />
            </div>

            <div className="field">
                <BindableSelectBoolean title={"TCP SSL/TLS"}
                                       bv={settings.ssl}
                                       availableParams={[]}
                                       setBindableVariable={(val) => updateSettings("ssl", val)}
                />
            </div>

            <div className="field">
                <BindableInput title={"WebSocket Proxy Port"}
                               bv={settings.wsPort}
                               availableParams={[]}
                               setBindableVariable={(val) => updateSettings("wsPort", val)}
                />
            </div>
        </React.Fragment>
    )
}
