import {useStateWithCallback} from "../../utility/customHooks";
import * as React from "react";

export interface ViewPropertiesSetup {
    name: string,
    parser: string
}

export const ViewSetup = (props : {cfg: ViewPropertiesSetup, onConfigChange: any}) => {

    const [name, setName] = useStateWithCallback(props.cfg.name, () => {
        props.onConfigChange({name: name})
    })

    const [parser, setParser] = useStateWithCallback(props.cfg.parser, () => {
        props.onConfigChange({parser: parser})
    })

    return (
        <React.Fragment>
        </React.Fragment>
    )
}