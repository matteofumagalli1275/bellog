
import {BindableVariable} from "../../../../common/model/profile/Common";
import AvailableProfileVariables from "../../dialogs/special/AvailableProfileVariables";
import {IOParameter} from "../../../../common/model/profile/Layer";
import React from "react";

export const BindableInput = (props: {
    title: string,
    bv: BindableVariable<string | number>,
    inputType?: string,
    small?: boolean,
    availableParams: IOParameter[],
    setBindableVariable: (bv: BindableVariable<string | number>) => void
}) => {

    const bv = props.bv
    const availableParams = props.availableParams
    const [open, setOpen] = React.useState(false);
    const sizeClass = props.small ? " is-small" : "";

    function onBindSelected(elem: BindableVariable<string | number>) {
        props.setBindableVariable(elem)
    }

    return (
        <>
            {
                open && <AvailableProfileVariables
                    open={open}
                    onClose={() => setOpen(false)}
                    onSelected={(elem) => onBindSelected(elem)}
                    paramsFromSource={availableParams.map((it) => it.name)}
                />
            }
            <div className="control">
                <label className={"label" + sizeClass}>{props.title}</label>
                <div className="field has-addons">
                    <div className="control">
                        {
                            bv.bind === false ?
                                <input
                                    style={{minWidth: "50px"}}
                                    className={"input" + sizeClass}
                                    type={props.inputType ?? "text"}
                                    placeholder="Enter text"
                                    value={bv.value}
                                    onChange={(evt) => props.setBindableVariable({...bv, ...{value: evt.target.value}})}/>
                                : <input
                                    className={"input" + sizeClass}
                                    type="text"
                                    placeholder="Enter text"
                                    disabled
                                    value={bv.symbol?.name ??
                                        bv.htmlProp?.propName ??
                                        bv.paramFromSource ?? ""
                                    }/>
                        }

                    </div>
                    <div className="control">
                        <div className="field">
                            <button className={"button is-info" + sizeClass} onClick={() => {
                                setOpen(true);
                            }}>
                                        <span className="icon">
                                          <i className="fas fa-link"></i>
                                        </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};