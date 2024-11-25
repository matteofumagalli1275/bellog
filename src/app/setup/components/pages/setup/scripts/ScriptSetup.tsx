import * as React from "react";
import { useMemo, useRef, useState} from "react";
import { EditableText } from "../../../EditableText";
import CodeEditor from "../../../CodeEditor";
import {useDispatch, useSelector} from "react-redux";
import {appStore, RootState} from "../../../../store/AppStore";
import {
    profileSelectScriptName,
} from "../../../../store/profile/ProfileSelectors";
import {profileScriptsActions} from "../../../../store/profile/ProfileScriptsSlice";
import {CodeComponent} from "../CodeComponent";

export const ScriptSetup = (props: { id: number }) => {

    const dispatch = useDispatch()
    const scriptName = useSelector((state: RootState) => profileSelectScriptName(state, props.id))
    // To not select script code to prevent re-renders when codeeditor updates
    const scriptInitialCode = appStore.getState().profile.scripts.entities[props.id].code

    const [visible, setVisible] = useState(false)

    function deleteScript() {
        dispatch(profileScriptsActions.scriptRemove({id: props.id}))
    }

    function setName(name: string) {
        dispatch(profileScriptsActions.scriptUpdateName({id: props.id, name: name}))
    }

    function setCode(code: string) {
        dispatch(profileScriptsActions.scriptUpdateCode({id: props.id, code: code}))
    }

    return (
        <div>
            <a>
                <span className="icon-text mb-1">
                    <div className="is-flex control is-align-items-center">
                        <span className="icon">
                            <i className="fas fa-scroll"></i>
                        </span>

                        <strong>
                            <EditableText
                                text={scriptName ?? "Undefined"}
                                onChange={(text) => { setName(text) }} /></strong>


                        <button className="button is-info ml-5 is-small" onClick={() => setVisible(!visible)}>View Code</button>
                        <button className="button is-danger ml-5 is-small" onClick={deleteScript}>Delete</button>

                    </div>

                </span>
            </a>

            {visible ?            
             <CodeComponent code={scriptInitialCode} onCodeUpdate={setCode}/> : ""
            }

        </div>
    )
}