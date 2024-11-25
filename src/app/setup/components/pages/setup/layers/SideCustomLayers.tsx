import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {CollapseCard} from "../../../CollapseCard";
import {CollpaseGroupRedux} from "../../../CollapseGroupRedux";
import {RootState} from "../../../../store/AppStore";
import {
    profileSelectHtmlById,
    profileSelectHtmlIds, profileSelectLayerById,
    profileSelectLayersIds
} from "../../../../store/profile/ProfileSelectors";
import {HtmlComponentSetup} from "../htmls/HtmlComponentSetup";
import {
    profileLayersActions,
    profileLayersReducer,
    profileLayersSelector
} from "../../../../store/profile/ProfileLayersSlice";
import {LayerComponentSetup} from "./LayerComponentSetup";
import {HtmlProperty} from "../../../../../common/model/profile/Html";
import {CollpaseGroup} from "../../../CollapseGroup";
import {LayerProperty} from "../../../../../common/model/profile/Layer";

import {buildDefaultLayer} from "../../../../DefaultPropertiesLayers";

export const SideCustomLayers = () => {
    const dispatch = useDispatch();

    const layers = useSelector(profileLayersSelector.selectAll)

    function addNewLayer() {
        dispatch(profileLayersActions.layerAddOne(buildDefaultLayer(layers)))
    }

    function setLayerElements(array: LayerProperty[]) {
        dispatch(profileLayersActions.layerRemoveAll())
        dispatch(profileLayersActions.layerSetMany(array))
    }

    return (
        <React.Fragment>
            <div className="title is-4">Layers</div>
            <p>Transform stream of data from the interface or other layers<br/>
                The connection between I/Os is controlled by Channels that are defined elsewhere.<br/>
            </p>
            <br/>
            <CollpaseGroup array={layers} deleteIcon
                           setNewArray={(array) => {
                               setLayerElements(array as LayerProperty[])
                           }}
            >
                {
                    (element, _) => (
                        <LayerComponentSetup
                            key={element}
                            id={element}
                        />
                    )
                }
            </CollpaseGroup>
            <button className="button is-primary mt-4" onClick={() => addNewLayer()}>Add New</button>
        </React.Fragment>
    )
}
