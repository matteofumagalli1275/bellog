import * as React from "react";
// @ts-ignore
import FormatHighlight from 'json-format-highlight';
import Parser from 'html-react-parser';

import "./JsonDiv.scss"

const JsonDiv = (props : any) => {


    return (
        <div className="jsondiv_container">
            <div  className="jsondiv_containerHeader">
                {props.title}
            </div>
            <div className="jsondiv_containerJson">
                {Parser(FormatHighlight(props.jsonString))}
            </div>
        </div>
    );

};

export default JsonDiv;