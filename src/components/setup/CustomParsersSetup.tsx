import {useStateWithCallback} from "../../utility/customHooks";
import * as React from "react";
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from "@codemirror/lang-javascript";

export interface CustomParsersPropertiesSetup {
    name: string,
    code: string
}

export const CustomParsersSetup = (props : {cfg: CustomParsersPropertiesSetup, onConfigChange: any}) => {

    const [name, setName] = useStateWithCallback(props.cfg.code, () => {
        props.onConfigChange({name: name})
    })

    const [code, setCode] = useStateWithCallback(props.cfg.code, () => {
        props.onConfigChange({code: code})
    })

    return (
        <React.Fragment>
            <div>Name:</div>
            <input type="text" id="name" value={name}
                   onChange={(evt) => setName(evt.target.value)}></input>
            <CodeMirror
                value={code}
                height="200px"
                extensions={[javascript({ jsx: false })]}
                onChange={(value, viewUpdate) => {
                    setCode(value)
                }}  />
        </React.Fragment>

    )
}