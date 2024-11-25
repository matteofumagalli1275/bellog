import {usePropagator, useStateWithCallback, useUpdateEffect} from "../../../../../common/utility/customHooks";
import * as React from "react";
import {useEffect, useMemo, useReducer, useRef, useState} from "react";
import {InterfaceWebSerialSetup} from "./InterfaceWebSerialSetup";
import {InterfaceAdbLogcatSetup} from "./InterfaceAdbSetup";
import {InterfaceTcpSocketSetup} from "./InterfaceTcpSocketSetup";
import {InterfaceCanSetup} from "./InterfaceCanSetup";
import {useDispatch, useSelector} from "react-redux";
import {profileSelectInterfaceById} from "../../../../store/profile/ProfileSelectors";
import {profileInterfacesActions} from "../../../../store/profile/ProfileInterfacesSlice";
import {RootState} from "../../../../store/AppStore";
import {InterfaceType} from "../../../../../common/model/profile/Interface";

export const InterfaceSetup = (props: { id: number }) => {

    const dispatch = useDispatch();

    const ifn = useSelector((state: RootState) => profileSelectInterfaceById(state, props.id))
    const [driverModalIsOpen, setDriverModalIsOpen] = useState(false)
    const settingsActive = useMemo(() => {
        switch (ifn.type) {
            case InterfaceType.InterfaceSerialPortWebSerial:
            case InterfaceType.InterfaceWebAdb:
            case InterfaceType.InterfaceTcpSocket:
            case InterfaceType.InterfaceCAN:
                return true;
        }
        return false;
    }, [ifn.type])

    function setName(name: string) {
        dispatch(profileInterfacesActions.interfaceSetName({id: props.id, name: name}))
    }

    function updateDriverType(type: InterfaceType) {
        dispatch(profileInterfacesActions.interfaceChangeType({id: props.id, type: type}))
    }

    return (
        <div className="field">

            <div className="field">
                <label className="label">Name</label>
                <div className="control">
                    <input className="input" type="text" placeholder="Text input"
                           value={ifn.name}
                           onChange={(evt) => {
                               setName(evt.target.value)
                           }}/>
                </div>
            </div>
            <div className="field">
                <label className="label">Type</label>
                <div className="control">
                    <div className="select">
                        <select value={ifn.type}
                                onChange={(evt) => updateDriverType(evt.target.value as InterfaceType)}>
                            {
                                Object.values(InterfaceType).map(
                                    (driver, dindex) => {
                                        return <option key={dindex}
                                                       value={driver}>{driver}</option>
                                    }
                                )
                            }
                        </select>
                    </div>
                </div>
            </div>
            <fieldset className="fieldset">
                <legend className="ml-2">Settings</legend>
                {
                    (() => {
                        switch (ifn.type) {
                            case InterfaceType.InterfaceSerialPortWebSerial:
                                return (
                                    <InterfaceWebSerialSetup
                                        id={props.id}
                                        handleClose={() => {
                                            setDriverModalIsOpen(false)
                                        }}
                                    />
                                )
                            case InterfaceType.InterfaceWebAdb:
                                return (
                                    <InterfaceAdbLogcatSetup
                                        id={props.id}
                                        handleClose={() => {
                                            setDriverModalIsOpen(false)
                                        }}
                                    />
                                )
                            case InterfaceType.InterfaceTcpSocket:
                                return (
                                    <InterfaceTcpSocketSetup
                                        id={props.id}
                                        handleClose={() => {
                                            setDriverModalIsOpen(false)
                                        }}
                                    />
                                )
                            case InterfaceType.InterfaceCAN:
                                return (
                                    <InterfaceCanSetup
                                        id={props.id}
                                        handleClose={() => {
                                            setDriverModalIsOpen(false)
                                        }}
                                    />
                                )
                            default:
                                return (
                                    <p>No Setting required</p>
                                )
                        }
                    })()
                }
            </fieldset>

        </div>
)
}