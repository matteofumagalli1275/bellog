import {useStateWithCallback} from "../../utility/customHooks";
import * as React from "react";
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from "@codemirror/lang-javascript";
import {SetupGlobalScriptProperties} from "../../app/setup/SetupInterfaces";

export const ScriptSetup = (props : {cfg: SetupGlobalScriptProperties, onConfigChange: any}) => {

    const [code, setCode] = useStateWithCallback(props.cfg.code, () => {
        props.onConfigChange({code: code})
    })

    return (
        <div className="columns is-mobile">
            <CodeMirror
                className="column is-10 "
                value={code}
                height="200px"
                extensions={[javascript({ jsx: false })]}
                onChange={(value, viewUpdate) => {
                    setCode(value)
                }}  />
            <br/>
            <div className="column">
                <span className="icon is-large">
                  <span className="fa-stack fa-lg">
                    <i className="fas fa-trash fa-stack-1x has-text-danger"></i>
                  </span>
                </span>
            </div>
        </div>

    )
}