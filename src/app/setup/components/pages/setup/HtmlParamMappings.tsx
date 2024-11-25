import * as React from "react";
import {useCallback} from "react";
import {IOParameter} from "../../../../common/model/profile/Layer";
import {BindableVariable, CustomProperty, CustomPropertyType} from "../../../../common/model/profile/Common";
import {ActionParamMapping, FunctionActionConfig} from "../../../../common/model/profile/Actions";
import {BindableInput} from "./BindableInput";
import {FunctionActionEditor} from "./FunctionActionEditor";
import {buildDefaultFunctionActionConfig} from "../../../DefaultPropertiesConditionalRenders";

interface ActionHtmlMappingsProps {
    mappings: ActionParamMapping[];
    htmlProps: CustomProperty[];
    availableParams: IOParameter[];
    setOValue: (index: number, key: keyof ActionParamMapping, value: any) => void;
    updateOvalues: (actionHtmlWithParamMappings: ActionParamMapping[]) => void;
}

export const HtmlParamMappings: React.FC<ActionHtmlMappingsProps> = ({
                                                                          mappings,
                                                                          htmlProps,
                                                                          availableParams,
                                                                          setOValue,
                                                                          updateOvalues,
                                                                      }) => {

    function setBindableVariable(index: number, elem: BindableVariable<number | string>) {
        setOValue(index, "sourceParam", elem)
    }

    // Memoize the delete handler to prevent unnecessary re-renders
    const handleDelete = useCallback(
        (index: number) => {
            updateOvalues(mappings.filter((_, vindex) => index !== vindex));
        },
        [mappings, updateOvalues]
    );

    // Check if a destParamName corresponds to a Function-type HTML property
    function isFunctionProperty(destParamName: string): boolean {
        if (!htmlProps || !destParamName) return false;
        const prop = htmlProps.find(p => p.name === destParamName);
        return prop?.type === CustomPropertyType.Function;
    }

    function onFunctionActionChange(index: number, config: FunctionActionConfig) {
        setOValue(index, "functionAction", config)
    }

    function onDestParamChange(index: number, newDestName: string) {
        const isFn = isFunctionProperty(newDestName);
        const mapping = mappings[index];

        if (isFn && !mapping.functionAction) {
            // Switching TO a Function property — initialize functionAction
            const newMappings = mappings.map((m, i) => {
                if (i === index) return {...m, destParamName: newDestName, functionAction: buildDefaultFunctionActionConfig()};
                return m;
            });
            updateOvalues(newMappings);
        } else if (!isFn && mapping.functionAction) {
            // Switching AWAY from a Function property — remove stale functionAction
            const newMappings = mappings.map((m, i) => {
                if (i === index) {
                    const { functionAction, ...rest } = m;
                    return {...rest, destParamName: newDestName};
                }
                return m;
            });
            updateOvalues(newMappings);
        } else {
            setOValue(index, "destParamName", newDestName);
        }
    }

    return (
        <>
            {mappings?.map((mapping, index) => {
                const isFunction = isFunctionProperty(mapping.destParamName);

                return (
                    <div key={index} className="mb-3">
                        <div className="field is-grouped is-align-items-end">
                            <div className="control">
                                <div className="field">
                                    <label className="label" htmlFor={`html-prop-${index}`}>
                                        HTML Property
                                    </label>
                                    <div className="select">
                                        <select
                                            id={`html-prop-${index}`}
                                            value={mapping.destParamName || ""}
                                            onChange={(evt) => onDestParamChange(index, evt.target.value)}
                                        >
                                            <option value="" disabled>
                                                Select Property
                                            </option>
                                            {htmlProps?.map((prop) => (
                                                <option key={prop.id} value={prop.name}>
                                                    {prop.name}{prop.type === CustomPropertyType.Function ? " ⚡" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {!isFunction && (
                                <BindableInput
                                    title={"Variable"}
                                    availableParams={availableParams}
                                    bv={mapping.sourceParam}
                                    setBindableVariable={(elem) => setBindableVariable(index, elem)}
                                />
                            )}

                            <div className="control">
                                <button
                                    className="button is-danger"
                                    onClick={() => handleDelete(index)}
                                    aria-label="Delete mapping"
                                >
                                  <span className="icon">
                                    <i className="fas fa-trash" aria-hidden="true"></i>
                                  </span>
                                </button>
                            </div>
                        </div>

                        {isFunction && mapping.functionAction && (
                            <FunctionActionEditor
                                config={mapping.functionAction}
                                availableParams={availableParams}
                                onChange={(config) => onFunctionActionChange(index, config)}
                            />
                        )}
                    </div>
                );
            })}
        </>
    );
};