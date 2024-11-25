import * as React from "react";
import { EditableText } from "../../../EditableText";
import { useState } from "react";
import CodeEditor from "../../../CodeEditor";
import {useDispatch, useSelector} from "react-redux";
import {appStore, RootState} from "../../../../store/AppStore";
import {
    profileSelectStyleName
} from "../../../../store/profile/ProfileSelectors";
import {profileStylesActions} from "../../../../store/profile/ProfileStylesSlice";

export const StyleSetup = (props: { id: number}) => {

    const dispatch = useDispatch()
    const styleName = useSelector((state: RootState) => profileSelectStyleName(state, props.id))
    // To not select script code to prevent re-renders when codeeditor updates
    const styleInitialCode = appStore.getState().profile.styles.entities[props.id].code

    const [visible, setVisible] = useState(false)

    function deleteStyle() {
        dispatch(profileStylesActions.styleRemove({id: props.id}))
    }

    function setName(name: string) {
        dispatch(profileStylesActions.styleUpdateName({id: props.id, name: name}))
    }

    function setCode(code: string) {
        dispatch(profileStylesActions.styleUpdateCode({id: props.id, code: code}))
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
                                text={styleName ?? "Undefined"}
                                onChange={(text) => { setName(text) }} /></strong>


                        <button className="button is-info ml-5 is-small" onClick={() => setVisible(!visible)}>View Code</button>
                        <button className="button is-danger ml-5 is-small" onClick={deleteStyle}>Delete</button>

                    </div>

                </span>
            </a>

            {
                visible ? <CodeEditor
                    value={styleInitialCode}
                    isCss={true}
                    onChange={(value) => {
                        setCode(value)
                    }} /> : ""
            }


        </div>
    )
}