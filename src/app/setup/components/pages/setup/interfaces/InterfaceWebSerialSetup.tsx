import * as React from "react";
import { useState } from "react";
import {useDispatch, useSelector} from "react-redux";
import {profileSelectInterfaceById} from "../../../../store/profile/ProfileSelectors";
import {profileInterfacesActions} from "../../../../store/profile/ProfileInterfacesSlice";
import {RootState} from "../../../../store/AppStore";
import {BindableInput} from "../BindableInput";
import {InterfaceSerialPortWebSerialSettings} from "../../../../../common/model/profile/Interface";
import {BindableSelect} from "../BindableSelect";
import {BindableDataList} from "../BindableDataList";

export const InterfaceWebSerialSetup = (props: {id: number, handleClose: () => void}) => {

    const dispatch = useDispatch();
    const ifn = useSelector((state: RootState) => profileSelectInterfaceById(state, props.id))
    const settings = ifn.settings as InterfaceSerialPortWebSerialSettings

    const [advancedOpen, setAdvancedOpen] = useState(false)
    const defaultBaudRates = [
        110, 150, 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200,
        230400, 460800, 921600,
    ]

    function updateSettings(key: keyof InterfaceSerialPortWebSerialSettings, value: any) {
        dispatch(profileInterfacesActions.interfaceUpdate({ id: props.id, settings: {[key]: value} }));
    }

    return (
        <React.Fragment>

            <div className="field is-grouped is-grouped-multiline">

                <BindableDataList title={"Baudrate"}
                                  options={defaultBaudRates}
                                  bv={settings.baudRate}
                                  availableParams={[]}
                                  setBindableVariable={(val) => updateSettings("baudRate", val)}
                />


                <BindableSelect title={"Databits"}
                                options={["7", "8"]}
                                bv={settings.dataBits}
                                availableParams={[]}
                                setBindableVariable={(val) => updateSettings("dataBits", val)}
                />

                <BindableSelect title={"Stop Bits"}
                                options={["1", "2"]}
                                bv={settings.stopBits}
                                availableParams={[]}
                                setBindableVariable={(val) => updateSettings("stopBits", val)}
                />


                <BindableSelect title={"Parity"}
                                options={["none", "even", "odd"]}
                                bv={settings.parity}
                                availableParams={[]}
                                setBindableVariable={(val) => updateSettings("parity", val)}
                />
                <div className="field is-grouped is-grouped-multiline">
                    <BindableInput title={"Buffersize"}
                                   bv={settings.bufferSize}
                                   availableParams={[]}
                                   setBindableVariable={(val) => updateSettings("bufferSize", val)}
                    />

                    <BindableSelect title={"Flow control"}
                                    options={["none", "hardware"]}
                                    bv={settings.flowControl}
                                    availableParams={[]}
                                    setBindableVariable={(val) => updateSettings("flowControl", val)}
                    />
                </div>
                </div>

            <div className="mt-3">
                <a onClick={() => setAdvancedOpen(!advancedOpen)} style={{cursor: "pointer", userSelect: "none"}}>
                    <span className="icon is-small mr-1">
                        <i className={`fas fa-chevron-${advancedOpen ? "down" : "right"}`}/>
                    </span>
                    <span>Advanced</span>
                </a>
                {advancedOpen && (
                    <div className="field is-grouped is-grouped-multiline mt-2">
                        <BindableInput title={"Cache timeout (ms)"}
                                       bv={settings.cacheTimeout ?? {bind: false, value: 200}}
                                       availableParams={[]}
                                       setBindableVariable={(val) => updateSettings("cacheTimeout", val)}
                        />
                        <BindableInput title={"Cache max elements"}
                                       bv={settings.cacheMaxElemCount ?? {bind: false, value: 100}}
                                       availableParams={[]}
                                       setBindableVariable={(val) => updateSettings("cacheMaxElemCount", val)}
                        />
                    </div>
                )}
            </div>
        </React.Fragment>
)
}
