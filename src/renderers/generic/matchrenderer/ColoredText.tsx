import * as React from "react";
import {Property} from "csstype";
import CodeMirror from "@uiw/react-codemirror/esm";
import {javascript} from "@codemirror/lang-javascript";
import {useState} from "react";

interface ColoredTextProperties {
    color: Property.Color
    children: React.ReactNode
}

export const ColoredText = (props : ColoredTextProperties) => {
    return (
        <div style={{color: props.color}}>
            {props.children}
        </div>
    );
};

export const ColoredTextSetup = (props : any) => {

    const [initial, setInitial] = useState('#5e72e4');
    const [color, setColor] = useState<any>({});

    return (
        <div className="row gap1">
            <div>Color</div>
            <input
                type="color"
                value={color.hex}
                onChange={e => setInitial(e.target.value)}
            />
        </div>
    )
}