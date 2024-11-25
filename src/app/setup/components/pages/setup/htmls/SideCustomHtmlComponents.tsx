import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    profileSelectHtmlById,
    profileSelectHtmlIds,
} from "../../../../store/profile/ProfileSelectors";
import {RootState} from "../../../../store/AppStore";
import {CollapseCard} from "../../../CollapseCard";
import {HtmlComponentSetup} from "./HtmlComponentSetup";
import {profileHtmlsActions, profileHtmlsSelectors} from "../../../../store/profile/ProfileHtmlsSlice";
import {CollpaseGroupRedux} from "../../../CollapseGroupRedux";
import {CollpaseGroup} from "../../../CollapseGroup";
import {HtmlProperty} from "../../../../../common/model/profile/Html";
import {buildDefaultCustomHtmlElem} from "../../../../DefaultPropertiesHtmls";


export const SideCustomHtmlComponents = () => {
    const dispatch = useDispatch();

    const htmls = useSelector(profileHtmlsSelectors.selectAll)

    function addNewCustomHtmlComponent() {
        dispatch(profileHtmlsActions.htmlAddOne(buildDefaultCustomHtmlElem(htmls)))
    }

    function setHtmlElems(htmls: HtmlProperty[]) {
        dispatch(profileHtmlsActions.htmlRemoveAll())
        dispatch(profileHtmlsActions.htmlSetMany(htmls))
    }

    return (
        <React.Fragment>
            <h1 className="title is-4">Html Components</h1>
            <CollpaseGroup array={htmls} deleteIcon
                               setNewArray={(array) => {
                                   setHtmlElems(array as HtmlProperty[])
                               }}
            >
                {
                    (element, _) => (
                        <HtmlComponentSetup
                            key={element}
                            id={element}
                        />
                    )
                }
            </CollpaseGroup>
            <button className="button is-primary mt-4" onClick={() => addNewCustomHtmlComponent()}>Add New</button>

        </React.Fragment>
    )
}
