import * as React from "react";
import {BindableVariable, ExportableSymbolPrefix, ScriptExportedSymbols} from "../../../../common/model/profile/Common";
import {RootState} from "../../../store/AppStore";
import {createSelector} from "@reduxjs/toolkit";
import AvailableProfileVariables from "../../dialogs/special/AvailableProfileVariables";
import {IOParameter} from "../../../../common/model/profile/Layer";

export const BindableDataList = (props: {
    title: string,
    options: (string | number)[],
    bv: BindableVariable<string | number>,
    availableParams: IOParameter[],
    setBindableVariable: (bv: BindableVariable<string | number>) => void
}) => {

    const bv = props.bv
    const availableParams = props.availableParams
    const [open, setOpen] = React.useState(false);

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
                <label className="label">{props.title}</label>
                <div className="field has-addons">
                    <div className="control">
                        {
                            bv.bind === false ?
                                <>
                                    <input
                                        list="myselect"
                                        style={{minWidth: "50px"}}
                                        className="input"
                                        type={"text"}
                                        placeholder="Enter text"
                                        value={bv.value}
                                        onChange={(evt) => props.setBindableVariable({...bv, ...{value: evt.target.value}})}/>
                                    <datalist id="myselect">
                                        {
                                            props.options.map((it) =>
                                                <option key={it}>{it}</option>
                                            )
                                        }
                                    </datalist>
                                </>
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