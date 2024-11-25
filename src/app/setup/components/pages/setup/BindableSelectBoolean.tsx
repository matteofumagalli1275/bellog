import * as React from "react";
import {BindableVariable, ExportableSymbolPrefix, ScriptExportedSymbols} from "../../../../common/model/profile/Common";
import {RootState} from "../../../store/AppStore";
import {createSelector} from "@reduxjs/toolkit";
import AvailableProfileVariables from "../../dialogs/special/AvailableProfileVariables";
import {IOParameter} from "../../../../common/model/profile/Layer";

export const BindableSelectBoolean = (props: {
    title: string,
    bv: BindableVariable<boolean>,
    availableParams: IOParameter[],
    setBindableVariable: (bv: BindableVariable<boolean>) => void
}) => {

    const bv = props.bv
    const availableParams = props.availableParams
    const [open, setOpen] = React.useState(false);

    function onBindSelected(elem: BindableVariable<boolean>) {
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
                <label className="label">{props.title}</label>
                <div className="field has-addons">
                    <div className="control">
                        {
                            bv.bind === false ?
                                <div className="select">
                                    <select value={bv.value ? 1 : 0}
                                            onChange={(evt) => props.setBindableVariable({...bv, ...{value: parseInt(evt.target.value) === 1}})}>
                                        <option value={0}>No</option>
                                        <option value={1}>Yes</option>
                                    </select>
                                </div>
                                : <input
                                    className="input"
                                    type="text"
                                    disabled
                                    value={bv.symbol?.name ??
                                        bv.htmlProp?.propName ??
                                        bv.paramFromSource ?? ""
                                    }/>
                        }

                    </div>
                    <div className="control">
                        <div className="field">
                            <button className="button is-info" onClick={() => {
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