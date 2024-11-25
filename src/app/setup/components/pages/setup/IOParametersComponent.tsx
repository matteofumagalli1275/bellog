import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {CustomProperty, CustomPropertyType, IOParameterType} from "../../../../common/model/profile/Common";
import {IOParameter} from "../../../../common/model/profile/Layer";

export const IOParametersComponent = (props: {
        title: string,
        parameters: IOParameter[],
        setProperty: (property: IOParameter) => void,
        addProperty: () => void
        deleteProperty: (id: number) => void
    }) => {

    const dispatch = useDispatch();
    const properties = props.parameters

    function validateInputName(name: string) {
        const res = properties.filter((it) => it.name === name)
        return res.length <= 1
    }

    function setParameters(property: IOParameter) {
        props.setProperty(property)
    }

    return (
        <React.Fragment>
            <fieldset className="fieldset">
                <legend className="ml-2">{props.title}</legend>
                {
                    properties.map((param) => {
                        return (
                            <div key={param.id} className="field is-grouped is-align-items-end">
                                <div className="control">
                                    <div className="field">
                                        <label className="label">Name</label>
                                        <div className="control">
                                            <input
                                                className={`input ${validateInputName(param.name) === true ? '' : 'is-danger'}`}
                                                type="text"
                                                placeholder="Text input" value={param.name}
                                                onChange={(evt) =>
                                                    setParameters({...param, name: evt.target.value})}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="control">
                                    <div className="field">
                                        <label className="label">Type</label>
                                        <div className="select">
                                            <select value={param.type}
                                                    onChange={(evt) => {
                                                        setParameters({...param, type: evt.target.value as IOParameterType})}
                                                    }>
                                                {
                                                    Object.keys(IOParameterType).map(
                                                        (val, index) => {
                                                            return (
                                                                <option key={index}>{val}</option>
                                                            )
                                                        }
                                                    )
                                                }
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="control">
                                    <button
                                        className="button is-danger"
                                        onClick={() => props.deleteProperty(param.id)}
                                        aria-label="Delete"
                                    >
                                    <span className="icon">
                                      <i className="fas fa-trash"></i>
                                    </span>
                                    </button>
                                </div>
                            </div>
                        )
                    })
                }
                <button className="button is-success" onClick={props.addProperty}>Add New</button>
            </fieldset>

        </React.Fragment>
    )
}