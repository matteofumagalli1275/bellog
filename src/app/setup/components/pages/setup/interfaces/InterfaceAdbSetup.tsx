import { usePropagator, useStateWithCallback } from "../../../../../common/utility/customHooks";
import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {profileSelectInterfaceById} from "../../../../store/profile/ProfileSelectors";
import {useEffect, useState} from "react";
import {profileInterfacesActions} from "../../../../store/profile/ProfileInterfacesSlice";
import {RootState} from "../../../../store/AppStore";
import {
    InterfaceAdbLogcatSettings,
    InterfaceSerialPortWebSerialSettings
} from "../../../../../common/model/profile/Interface";
import {BindableSelect} from "../BindableSelect";
import {BindableSelectBoolean} from "../BindableSelectBoolean";

export const InterfaceAdbLogcatSetup =(props: {id: number, handleClose: () => void}) => {

    const dispatch = useDispatch();
    const ifn = useSelector((state: RootState) => profileSelectInterfaceById(state, props.id))
    const settings = ifn.settings as InterfaceAdbLogcatSettings
    const handleClose = props.handleClose

    function updateSettings(key: keyof InterfaceAdbLogcatSettings, value: any) {
        dispatch(profileInterfacesActions.interfaceUpdate({ id: props.id, settings: {[key]: value} }));
    }

    return (
        <React.Fragment>

            <BindableSelectBoolean title={"Flow control"}
                            bv={settings.clearLogAtConnection}
                            availableParams={[]}
                            setBindableVariable={(val) => updateSettings("clearLogAtConnection", val)}
            />

        </React.Fragment>

    )
}
