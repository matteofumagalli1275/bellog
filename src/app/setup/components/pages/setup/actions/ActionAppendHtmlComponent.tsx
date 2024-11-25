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
import {ActionParamMapping, ActionRenderSettings} from "../../../../../common/model/profile/Actions";
import {ViewFragmentFixed, ViewFragmentType} from "../../../../../common/model/profile/View";
import {CodeComponent} from "../CodeComponent";
import {HtmlParamMappings} from "../HtmlParamMappings";

export const ActionAppendHtmlComponent = (props: {
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

    const view = useMemo(() => {
        return getElementFromRef(viewRef, deps.views, deps.libraries)
    }, [viewRef, deps.views, deps.libraries])

    const html = useMemo(() => {
        return getElementFromRef(element.htmlRef, deps.htmls, deps.libraries)
    }, [element.htmlRef, deps.htmls, deps.libraries])

    const initialCode = useMemo(() => {
        return element.code
    }, [])

    function setViewRef(ref: ElementReference) {
        dispatch(profileActionsActions.updateActionAppendHtmlComponentViewRef(
            {id: props.id, viewRef: ref}))
    }

    function updateBindingType(bindType: RenderModeType) {
        dispatch(profileActionsActions.updateActionAppendHtmlComponentElement(
            {
                id: props.id,
                key: "mode",
                value: bindType
            }
        ))
    }

    function updateOValues(ovalues: ActionParamMapping[]) {
        dispatch(profileActionsActions.updateActionAppendHtmlComponentElement(
            {
                id: props.id,
                key: "mappings",
                value: ovalues
            }
        ))
    }

    function updateCode(code: string) {
        dispatch(profileActionsActions.updateActionAppendHtmlComponentElement(
            {
                id: props.id,
                key: "code",
                value: code
            }
        ))
    }

    function updateHtmlRef(htmlRef: ElementReference) {
        dispatch(profileActionsActions.updateActionAppendHtmlComponentElement(
            {
                id: props.id,
                key: "htmlRef",
                value: htmlRef
            }
        ))
    }

    function addPropertyBinding() {
        dispatch(profileActionsActions.addActionAppendHtmlComponentOverride(
            {
                id: props.id,
                htmlRef: element.htmlRef,
                availableParams: props.availableParams,
                deps: deps
            }
        ))
    }

    function setOValue(index: number, key: keyof ActionParamMapping, value: any) {
        const newValues = element.mappings.map((v, vindex) => {
            if (index === vindex)
                return {...v, [key]:value}
            return v
        })
        updateOValues(newValues)
    }

    return (
        <div>
            <ElementReferenceComponent title={"Select View"}
                                       elementReference={viewRef}
                                       onUpdate={setViewRef}/>

            <div>
                <div className="control mb-2">
                    <div className="field">
                        <label className="label">Bind Type</label>
                        <div className="select">
                            <div className="select">
                                <select value={element.mode}
                                        onChange={(evt) => {
                                            updateBindingType(evt.target.value as RenderModeType)
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

                <ElementReferenceComponent title={"Select Html Element"}
                                           elementReference={element.htmlRef}
                                           onUpdate={updateHtmlRef}/>

                {
                    element.mode === RenderModeType.Code &&
                    <CodeComponent code={initialCode} onCodeUpdate={updateCode}/>
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
                                setOValue={setOValue}
                                updateOvalues={updateOValues}
                            />
                            <button className="button is-success" onClick={addPropertyBinding}>Add Override
                            </button>
                        </fieldset>
                    </>
                }
            </div>

        </div>
    );
}