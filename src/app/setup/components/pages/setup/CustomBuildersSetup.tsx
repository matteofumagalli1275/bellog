import {usePropagator, useStateWithCallback} from "../../../../common/utility/customHooks";
import * as React from "react";
import CodeMirror from '@uiw/react-codemirror';
import {autoCloseTags, javascript} from "@codemirror/lang-javascript";
import { useState } from "react";
import { EditableText } from "../../EditableText";
import {useDispatch, useSelector} from "react-redux";


export const CustomBuildersSetup = (props : {id: number}) => {

    const dispatch = useDispatch();


    const [visible, setVisible] = useState(false)

    return (
        <div>
        </div>

    )
}