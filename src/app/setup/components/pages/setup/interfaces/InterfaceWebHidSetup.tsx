import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {profileSelectInterfaceById} from "../../../../store/profile/ProfileSelectors";
import {profileInterfacesActions} from "../../../../store/profile/ProfileInterfacesSlice";
import {RootState} from "../../../../store/AppStore";
import {BindableInput} from "../BindableInput";
import {InterfaceWebHidSettings} from "../../../../../common/model/profile/Interface";

const HID_USAGE_PAGE_HINTS = [
    {label: "Any (0x0000)", usagePage: 0, usage: 0},
    {label: "Generic Desktop – Mouse (0x0001 / 0x0002)", usagePage: 0x0001, usage: 0x0002},
    {label: "Generic Desktop – Keyboard (0x0001 / 0x0006)", usagePage: 0x0001, usage: 0x0006},
    {label: "Generic Desktop – Gamepad (0x0001 / 0x0005)", usagePage: 0x0001, usage: 0x0005},
    {label: "Consumer Control (0x000C / 0x0001)", usagePage: 0x000C, usage: 0x0001},
];

export const InterfaceWebHidSetup = (props: {id: number, handleClose: () => void}) => {

    const dispatch = useDispatch();
    const ifn = useSelector((state: RootState) => profileSelectInterfaceById(state, props.id))
    const settings = ifn.settings as InterfaceWebHidSettings

    function updateSettings(key: keyof InterfaceWebHidSettings, value: any) {
        dispatch(profileInterfacesActions.interfaceUpdate({id: props.id, settings: {[key]: value}}));
    }

    function applyHint(usagePage: number, usage: number) {
        dispatch(profileInterfacesActions.interfaceUpdate({
            id: props.id,
            settings: {
                usagePage: {bind: false, value: usagePage},
                usage: {bind: false, value: usage},
            }
        }));
    }

    return (
        <React.Fragment>
            <div className="field">
                <label className="label is-small">Quick select</label>
                <div className="control">
                    <div className="select is-small">
                        <select
                            defaultValue=""
                            onChange={(e) => {
                                const idx = parseInt(e.target.value)
                                if (!isNaN(idx)) {
                                    const h = HID_USAGE_PAGE_HINTS[idx]
                                    applyHint(h.usagePage, h.usage)
                                }
                            }}
                        >
                            <option value="" disabled>Select a device type…</option>
                            {HID_USAGE_PAGE_HINTS.map((h, i) => (
                                <option key={i} value={i}>{h.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="field is-grouped is-grouped-multiline mt-2">
                <BindableInput
                    title={"Usage Page (hex, 0=any)"}
                    bv={settings.usagePage}
                    availableParams={[]}
                    setBindableVariable={(val) => updateSettings("usagePage", val)}
                />
                <BindableInput
                    title={"Usage (hex, 0=any)"}
                    bv={settings.usage}
                    availableParams={[]}
                    setBindableVariable={(val) => updateSettings("usage", val)}
                />
            </div>

            <p className="help mt-1">
                Use Usage Page and Usage to filter which device the browser will offer when connecting.
                Set both to 0 to show all HID devices. Refer to the{" "}
                <a href="https://usb.org/sites/default/files/hut1_4.pdf" target="_blank" rel="noopener noreferrer">
                    HID Usage Tables
                </a>{" "}for standard values.
            </p>
        </React.Fragment>
    )
}
