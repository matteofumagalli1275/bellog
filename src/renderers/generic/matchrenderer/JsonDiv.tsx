import * as React from "react";
// @ts-ignore
import FormatHighlight from 'json-format-highlight';
import Parser from 'html-react-parser';

import "./JsonDiv.scss"
import stringify from "json-stringify-pretty-compact";
import {ReactNode, useMemo} from "react";
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from "@codemirror/lang-javascript";

interface JsonDivProperties {
    title: string | ((jsonObj: object, matches: string | string[], state: any) => string),
    matches: string[]
    children: React.ReactNode
}

const state = {}

function buf2hex(buffer) { // buffer is an ArrayBuffer
    return buffer
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

function my_replacer(key, value) {
    if (value instanceof Uint8Array) {
        return buf2hex(value);
    }
    return value;
}

function getNiceJson(obj) {
    return stringify(obj, {
        replacer: my_replacer
    })
}

export const JsonDiv = (props : JsonDivProperties) => {

    const jsonObj : object = (() => {
        if(typeof props.children === "string")
            return JSON.parse(props.children)
        else
            return props.children
    })();

    let headerContent = useMemo<ReactNode>(() => {
        let content
        try {
            if (typeof props.title === "string") {
                content = props.title
            }
            else {
                content = props.title(jsonObj, props.matches, state)
            }
        }
        catch (e)
        {
            content = "headerContent exception " + e.message;
            console.error(e)
        }
        return content
    },  [])

    return (
        <div className="jsondiv_container">
            <div className="jsondiv_containerHeader">
                {headerContent}
            </div>
            <div className="jsondiv_containerJson">
                {Parser(FormatHighlight(getNiceJson(jsonObj)))}
            </div>
        </div>
    );

};

export const JsonDivSetup = (props : any) => {

    return (
        <React.Fragment>
            <div>Title</div>
            <CodeMirror
                value="//json div setup"
                height="200px"
                extensions={[javascript({ jsx: false })]}
                onChange={(value, viewUpdate) => {
                    console.log('value:', value);
                }}  />
        </React.Fragment>
    )
}