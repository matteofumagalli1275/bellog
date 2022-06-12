import * as React from 'react';
import {
    useEffect,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
    useMemo,
    DetailedReactHTMLElement,
    InputHTMLAttributes
} from "react";
import {LineParser} from "../../parsers/lineparser";
import {JsonDiv} from "./matchrenderer/JsonDiv";
import {ColoredText} from "./matchrenderer/ColoredText";
import AutoScroller from "../../AutoScroller";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import './Generic.scss'
import {RendererList} from "../rendererslist";
import {MatchRenderersList} from "./matchrenderer/matchrendererslist";
import {FaBars} from "react-icons/fa";
import {RiAddFill} from "react-icons/ri";
import {IconContext} from "react-icons";

const supportedMatchRenderers = [
    JsonDiv.prototype.className,
    ColoredText.prototype.className
]


export interface MatchEntry {
    regex: any
    // Transforms text into object compatible with match renderer component
    transformExp?: ((string) => string)
    // Called when regex matches to render correspoding element
    matchRenderer: string
    matchRendererProperties: any
    // Create an option to show only data matching this
    fiterable?: boolean
    sticky?: boolean
}

export interface IGenericRendererParams {
    entries: Array<MatchEntry>
}

export interface GenericRendererProperties {
    renderConfig: string
}

let keyId = 0

export const GenericRenderer = forwardRef((props : GenericRendererProperties, ref) => {

    const [obj, setObj] = useState([]);
    const params = useMemo<IGenericRendererParams>(() => eval('(' + props.renderConfig + ')'), []);
    const parser = useMemo(() => new LineParser(), []);


    function renderElem(element: any, matches: string[])
    {
        keyId++

        let content
        try {
            if (typeof element.transformExp === "string") {
                content = element.transformExp
            }
            else {
                content = element.transformExp(matches.length > 0 ? matches : matches[0])
            }

            switch (element.matchRenderer)
            {
                case JsonDiv.prototype.constructor.name:
                    return (
                        <JsonDiv key={keyId} {...element.matchRendererProperties} matches={matches}>
                            {content}
                        </JsonDiv>
                    )
                case ColoredText.prototype.constructor.name:
                    return (
                        <ColoredText key={keyId} {...element.matchRendererProperties} matches={matches} >
                            {content}
                        </ColoredText>
                    )
            }
        } catch (e)
        {
            console.error(e)
            return (
                <ColoredText key={keyId} color="red" >
                    {"transformExpException" + e.message}
                </ColoredText>
            )
        }
    }

    function styleObj(setter : any, line: string) {
        let matches = params.entries.map(
            element => {
                let match = line.match(new RegExp(element.regex, 'i'))
                if(!!match)
                {
                    setter((oldArray: any) => [...oldArray,
                        renderElem(element, match)
                    ]);
                }
                return !!match
            }
        )

        let noMatch = matches.every((val) => val === false)
        if (noMatch) {
            setter((oldArray: any) => [...oldArray, (<div key={oldArray.length}>{line}</div>)]);
        }
    }

    function onNewData(line: string)
    {
        try
        {
            /*
            var matches = params.entries.filter(
                val => !!line.match(val.regex)// && val.groupup
            )

            if (matches.length > 0) {
                matches.forEach(element => {
                    const [st, setSt] = element.groupstate
                    styleObj(setSt, line)
                });
                styleObj(setObj, line)
            } else {
                styleObj(setObj, line)
            }*/
            styleObj(setObj, line)
        }
        catch (e)
        {
            console.error("Error line " + line)
            console.error(e)
        }
    }

    useImperativeHandle(ref, () => ({
        // Receive data from driver (ex. data from serial)
        render: (data: Uint8Array) => {
            parser.put(data)
        },

        clear:() => {
            /*
            matcher.forEach(element => {
                if (element.groupstate !== undefined && element.groupstate !== null) {
                    const [st, setSt] = element.groupstate
                    setSt([])
                }
            });*/
            setObj([])
        }
     }));

    useEffect(() => {
        parser.onParsed((data: string) => {
            onNewData(data)
        })
    })



    let body;

    /*
    if (objIdx >= 0 && objIdx < matcher.length) {
        body = matcher[objIdx].groupstate[0]
    } else {
        body = obj
    }*/
    return (
        <React.Fragment>
            <div className="generic_renderer_container">
                {obj}
            </div>
            <AutoScroller deps={obj}/>
        </React.Fragment>
    );

});

export const GenericRendererSetup = (props : GenericRendererProperties) => {


    const [items, setItems] = useState<MatchEntry[]>([])

    function addItem()
    {
        setItems(
            [...items,
                {
                    fiterable: false,
                    matchRendererProperties: {},
                    sticky: false,
                    regex: /s/,
                    matchRenderer: "Colored Text"
                }
            ]
        )
    }

    function deleteItem(item)
    {
        setItems(
            items.filter(
                it => it !== item
            )
        )
    }

    function onMatchRendererSelect(item: MatchEntry, value:string)
    {
        setItems(
            items.map(
                it => {
                    if(it === item)
                    {
                        it.matchRenderer = value
                    }
                    return it
                }
            )
        )

    }

    function onRegexChange(item: MatchEntry, value:string)
    {
        item.regex = value
        setItems([...items])
    }

    return (
        <React.Fragment>
            {
                items.map(
                    item => {
                        return (
                            <div>
                                <div className="divider"/>
                                <div className="row gap1">
                                    <div>Regex: </div>
                                    <input type="text" id="regex" value={item.regex} onChange={(evt) => onRegexChange(item, evt.target.value)}/>
                                </div>
                                <div>
                                    <div>Content transform: </div>
                                    <CodeMirror
                                        value="console.log('hello world!');"
                                        height="200px"
                                        extensions={[javascript({ jsx: false })]}
                                        onChange={(value, viewUpdate) => {
                                            console.log('value:', value);
                                        }}
                                    />
                                </div>
                                <div className="row gap1">
                                    <div>Render into: </div>
                                    <select name="march_renderer" id="march_renderer"
                                            value={item.matchRenderer}
                                            onChange={(evt) => {onMatchRendererSelect(item, evt.target.value)}}
                                    >
                                        {
                                            MatchRenderersList.map(
                                                matchrenderer => {
                                                    return <option value={matchrenderer.name}>{matchrenderer.name}</option>
                                                }
                                            )
                                        }
                                    </select>
                                </div>
                                <div>
                                    <h4>Match renderer configuration:</h4>
                                    {
                                        MatchRenderersList.map(
                                            matchrenderer => {
                                                if(item.matchRenderer === matchrenderer.name)
                                                {
                                                    return matchrenderer.setup()
                                                }
                                            }
                                        )
                                    }
                                </div>
                                <div className="button redbk" onClick={() => deleteItem(item)}>
                                    Delete
                                </div>
                            </div>
                        )
                    }
                )
            }
            <div>
                <IconContext.Provider value={{className: "button_icon"}}>
                    <RiAddFill onClick={() => addItem()} />
                </IconContext.Provider>
            </div>
        </React.Fragment>
    )
}