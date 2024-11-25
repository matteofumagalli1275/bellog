import * as React from "react";
import CodeMirror, {EditorView, lineNumbers} from "@uiw/react-codemirror";
import {javascript, localCompletionSource, scopeCompletionSource} from "@codemirror/lang-javascript";
import { useUpdateEffect } from "../../common/utility/customHooks";
import {forwardRef, useState} from "react";
import { css } from "@codemirror/lang-css";
import { autocompletion } from "@codemirror/autocomplete";
import {html, htmlCompletionSource} from "@codemirror/lang-html";
import {lessCompletionSource} from "@codemirror/lang-less";

export const CodeEditor = forwardRef((props: {
    value: string, onChange: (value: string) => void,
    isHtml?: boolean, isCss?: boolean, isJs?: boolean,
    maxHeight?: string,
    additionalCompletitionSource?: any}, ref) => {

    const [htmlCode, setHtmlCode] = useState(props.value)

    useUpdateEffect(() => {
        // This trick is required because sometimes CodeMirror calls onChange with old rendered instance
        props.onChange(htmlCode)
    }, [htmlCode])

    const autocompletions = [
        ...(props.isHtml ? [htmlCompletionSource] : []),
        ...((props.isJs && !props.isHtml) ? [scopeCompletionSource(window), localCompletionSource] : []), // Having both html and js causes issue for window scope, do not know why
        ...((props.additionalCompletitionSource) ? [props.additionalCompletitionSource] : []), // Having both html and js causes issue for window scope, do not know why
        ...(props.isCss ? [lessCompletionSource] : []),
    ];

    const extensions = [
        lineNumbers(),
        autocompletion({
            override: autocompletions
        }),
        ...(props.isHtml ? [html()] : []), // Add HTML support if enabled
        ...(props.isCss ? [javascript()] : []), // Add JavaScript support if enabled
        ...(props.isJs ? [javascript({ jsx: false })] : []), // Add JavaScript support if enabled
    ];

    return (
        <CodeMirror
            ref={ref}
            value={props.value}
            minHeight="200px"
            maxHeight={props.maxHeight ? props.maxHeight : "800px"}
            extensions={extensions}
            onChange={(value) => {
                setHtmlCode(value)
        }} />
    );
})

export default CodeEditor;