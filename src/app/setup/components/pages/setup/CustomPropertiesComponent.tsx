import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {CustomProperty, CustomPropertyType} from "../../../../common/model/profile/Common";
import {BindableInput} from "./BindableInput";
import {buildDefaultCustomProperty, buildDefaultHtmlParameterDefaultValue} from "../../../DefaultPropertiesHtmls";
export const CustomPropertiesComponent = (props: {
    overrideTitle: string,
    properties: CustomProperty[],
    setProperties: (properties: CustomProperty[]) => void,
    overrideMode: boolean,
}) => {

    const { properties, setProperties, overrideMode, overrideTitle } = props;

    function validateInputName(name: string) {
        return properties.filter((it) => it.name === name).length <= 1;
    }

    function setProperty(updatedProperty: CustomProperty) {
        setProperties(properties.map(prop => prop.id === updatedProperty.id ? updatedProperty : prop));
    }

    function deleteProperty(id: number) {
        setProperties(properties.filter(prop => prop.id !== id));
    }

    function addProperty() {
        const newProperty = buildDefaultCustomProperty(properties)
        setProperties([...properties, newProperty]);
    }

    return (
        <fieldset className="fieldset">
            <legend className="ml-2">{overrideTitle}</legend>
            {
                properties.map((param) => (
                    <div key={param.id} className="field is-grouped is-align-items-end">
                        <div className="control">
                            <div className="field">
                                <label className="label">Name</label>
                                <div className="control">
                                    <input
                                        className={`input ${validateInputName(param.name) ? '' : 'is-danger'}`}
                                        type="text"
                                        placeholder="Text input"
                                        value={param.name}
                                        disabled={overrideMode}
                                        onChange={(evt) => setProperty({...param, name: evt.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="control">
                            <div className="field">
                                <label className="label">Type</label>
                                <div className="select">
                                    <select
                                        value={param.type}
                                        disabled={overrideMode}
                                        onChange={(evt) => setProperty({...param, type: evt.target.value as CustomPropertyType})}
                                    >
                                        {Object.keys(CustomPropertyType).map((val, index) => (
                                            <option key={index} value={val}>{val}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        {param.type !== CustomPropertyType.Function && (
                            <>
                                <BindableInput
                                    title="Variable"
                                    inputType={param.type.toLowerCase()}
                                    bv={param.default}
                                    availableParams={[]}
                                    setBindableVariable={(elem) => setProperty({...param, default: elem})}
                                />
                                <div className="control">
                                    <div className="field">
                                        <label className="label">SafeHTML</label>
                                        <div className="select">
                                            <select
                                                value={param.safeHtml ? "ON" : "OFF"}
                                                onChange={(evt) => setProperty({...param, safeHtml: evt.target.value === "ON"})}
                                            >
                                                <option>OFF</option>
                                                <option>ON</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {!overrideMode && (
                            <div className="control">
                                <button
                                    className="button is-danger"
                                    onClick={() => deleteProperty(param.id)}
                                    aria-label="Delete"
                                >
                                    <span className="icon">
                                        <i className="fas fa-trash"></i>
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                ))
            }
            {!overrideMode && (
                <button className="button is-success" onClick={addProperty}>Add Property</button>
            )}
        </fieldset>
    );
};
