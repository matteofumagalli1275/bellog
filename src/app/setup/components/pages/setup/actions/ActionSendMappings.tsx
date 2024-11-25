import * as React from "react";
import {ActionParamMapping} from "../../../../../common/model/profile/Actions";
import {IOParameter} from "../../../../../common/model/profile/Layer";
import AvailableProfileVariables from "../../../dialogs/special/AvailableProfileVariables";
import {BindableVariable} from "../../../../../common/model/profile/Common";
import {BindableInput} from "../BindableInput";

export const ActionSendMappings = (props: {
    mappings: ActionParamMapping[],
    availableParams: IOParameter[],
    setOValue: (index: number, key: keyof ActionParamMapping, value: any) => void
}) => {

    const mappings = props.mappings
    const availableParams = props.availableParams
    const setOValue = props.setOValue

    function setBindableVariable(index: number, elem: BindableVariable<any>) {
        setOValue(index, "sourceParam", elem)
    }

    return (
        <React.Fragment>
            {
                mappings.map((it, index) => {
                    return (
                        <div key={index} className="field is-grouped is-align-items-end">
                            <div className="control">
                                <div className="field">
                                    <label className="label">Destination Param</label>
                                    <div className="select">
                                        <select value={it.destParamName}>
                                            <option className="is-danger" defaultValue={it.destParamName}
                                                    disabled>{it.destParamName}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <BindableInput
                                title={"Variable"}
                                availableParams={availableParams}
                                           bv={it.sourceParam}
                                           setBindableVariable={(elem) => setBindableVariable(index, elem)}
                            />
                        </div>
                    )
                })
            }
        </React.Fragment>
    )
};