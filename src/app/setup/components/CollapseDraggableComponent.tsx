import * as React from "react";
import {useLayoutEffect, useState} from "react";
import {DraggableProvided, DraggableProvidedDragHandleProps} from "@hello-pangea/dnd";

export const CollapseDraggableComponent =  (props : {
    title: string, expanded?: boolean,
    dragHandleProps: DraggableProvidedDragHandleProps
    eyeIcon?:boolean, eyeOff?:boolean, 
    eyeClick?:(eyeOff: boolean) => void,
    deleteIcon?: boolean,
    deleteClick?:() => void,
    duplicateIcon?: boolean,
    duplicateClick?:() => void,
    dragging: boolean,
    children: React.ReactNode}) => {

    const ref = React.useRef<HTMLDivElement>()

    useLayoutEffect(() => {
        if(ref.current) {
            ref.current.getAnimations().forEach((anim) => {
                anim.cancel()
            })
        }
    })

    const [isExpanded, setIsExpanded] = useState(props.expanded ?? false)

    function expand() {
        if(!props.dragging)
            setIsExpanded(!isExpanded)
    }

    return (
        <div ref={ref} className="card is-fullwidth">
            <header className="card-header is-clickable is-shadowless component-card-header" {...props.dragHandleProps}
                    onClick={() => expand()}>
                <p className="card-header-title">{props.title}</p>
                {
                    props.duplicateIcon ? <a className="card-header-icon is-clickable"
                    onClick={(e) => {e.stopPropagation(); props?.duplicateClick()}}>
                        <i className={`fa fa-copy`} ></i> </a> : ""
                }
                {
                    props.eyeIcon ? <a className="card-header-icon is-clickable"
                    onClick={(e) => {e.stopPropagation(); props?.eyeClick(props.eyeOff ?? false)}}>
                        <i className={`fa ${(props.eyeOff) ? "fa-eye-slash" : "fa-eye" }`} ></i> </a> : ""
                }
                {
                    props.deleteIcon ? <a className="card-header-icon is-clickable has-text-danger"
                    onClick={(e) => {e.stopPropagation(); props?.deleteClick()}}>
                        <i className={`fa fa-trash`} ></i> </a> : ""
                }
                <a className="card-header-icon card-toggle">
                    <i className="fa fa-angle-down" ></i>
                </a>
            </header>
            {
                isExpanded && <div className={`card-content ${isExpanded ? "": "is-hidden"}`} style={{cursor: "auto"}}>
                    <div>
                        {props.children}
                    </div>
                </div>
            }
        </div>
    )
}