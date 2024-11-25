import * as React from "react";
import {useMemo} from "react";
import 'react-querybuilder/dist/query-builder.css';
import {useDispatch, useSelector} from "react-redux";
import {profileSelectEventDeps} from "../../../../store/profile/ProfileSelectors";
import {RootState} from "../../../../store/AppStore";
import {
    ElementReference,
    ElementReferenceType,
    ElementType,
    RenderModeType
} from "../../../../../common/model/profile/Common";
import {ElementReferenceComponent} from "../ElementReferenceComponent";
import {getElementFromRef} from "../../../Utils";
import {IOParameter} from "../../../../../common/model/profile/Layer";
import {profileActionsActions} from "../../../../store/profile/ProfileActionsSlice";
import {
    ActionParamMapping,
    ActionProperty,
    ActionRenderSettings,
    ActionRenderSettingsBinding
} from "../../../../../common/model/profile/Actions";
import {ViewFragmentFixed, ViewFragmentType} from "../../../../../common/model/profile/View";
import {CodeComponent} from "../CodeComponent";
import {HtmlParamMappings} from "../HtmlParamMappings";

export const ActionReplaceHtmlProperties = (props: {
    id: number,
    availableParams: IOParameter[]
}) => {

    const dispatch = useDispatch();

    const deps = useSelector(profileSelectEventDeps)
    const action = useSelector((state:RootState) => state.profile.actions.entities[props.id])
    const settings = action.config as ActionRenderSettings
    const element = settings.elementToRender
    const viewRef = settings.viewRef
    const availableParams = props.availableParams
    const html = getElementFromRef(element.htmlRef, deps.htmls, deps.libraries)
    const view = getElementFromRef(settings.viewRef, deps.views, deps.libraries)
    const initialCode = element.code

    function setViewRef(ref: ElementReference) {
        dispatch(profileActionsActions.updateActionReplaceHtmlPropertiesViewRef(
            {id: props.id, viewRef: ref}
        ))
    }

    function updateActionReplaceHtmlPropertiesElement(key: keyof ActionRenderSettingsBinding, value: any) {
        dispatch(profileActionsActions.updateActionReplaceHtmlPropertiesElement(
            {
                id: props.id,
                key: key,
                value: value
            }
        ))

    }

    function addPropertyBinding() {
        dispatch(profileActionsActions.addActionReplaceHtmlPropertiesOverride(
            {
                id: props.id,
                htmlRef: element.htmlRef,
                availableParams: props.availableParams,
                deps: deps
            }
        ))
    }

    return (
        <div>
            <ElementReferenceComponent title={"Select View"}
                                       elementReference={viewRef}
                                       onUpdate={setViewRef}/>

            <ElementReferenceComponent title={"Select Html Element"}
                                       elementReference={element.htmlRef}
                                       onUpdate={(ref) => {
                                           updateActionReplaceHtmlPropertiesElement("htmlRef", ref)
                                       }}/>

            {
                html && view &&
                <div>
                    <div className="control mb-2">
                        <div className="field">
                            <label className="label">Bind Type</label>
                            <div className="select">
                                <div className="select">
                                    <select value={element.mode}
                                            onChange={(evt) => {
                                                updateActionReplaceHtmlPropertiesElement("mode", evt.target.value as RenderModeType)
                                            }}>
                                        <option key={-1} defaultValue={-1} disabled>None</option>
                                        {
                                            Object.values(RenderModeType).map((it) =>
                                                <option key={it} value={it}>{it}</option>
                                            )
                                        }
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {
                        element.mode === RenderModeType.Code &&
                        <CodeComponent code={initialCode} onCodeUpdate={(code) => {
                            updateActionReplaceHtmlPropertiesElement("code", code)
                        }}/>
                    }

                    {
                        element.mode === RenderModeType.Gui &&
                        <>
                            <fieldset className="fieldset">
                                <legend className="ml-2">Overrides</legend>
                                <HtmlParamMappings
                                    mappings={element.mappings}
                                    availableParams={props.availableParams}
                                    htmlProps={html.config.properties}
                                    setOValue={(index: number, key: keyof ActionParamMapping, value: any) => {
                                        const newMappings = element.mappings.map((v, vindex) => {
                                            if (index === vindex)
                                                return {...v, [key]: value}
                                            return v
                                        })
                                        updateActionReplaceHtmlPropertiesElement("mappings", newMappings)}
                                    }

                                    updateOvalues={(mappings) => {
                                        updateActionReplaceHtmlPropertiesElement("mappings", mappings)}
                                    }
                                />
                                <button className="button is-success" onClick={addPropertyBinding}>Add Override
                                </button>
                            </fieldset>
                        </>
                    }
                </div>
            }

        </div>
    );
}