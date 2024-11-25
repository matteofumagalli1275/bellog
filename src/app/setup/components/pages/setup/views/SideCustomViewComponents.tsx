import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    profileSelectHtmlById,
    profileSelectHtmlIds, profileSelectViewById, profileSelectViewIds,
} from "../../../../store/profile/ProfileSelectors";
import {RootState} from "../../../../store/AppStore";
import {CollapseCard} from "../../../CollapseCard";
import {HtmlComponentSetup} from "../htmls/HtmlComponentSetup";
import {profileHtmlsActions} from "../../../../store/profile/ProfileHtmlsSlice";
import {CollpaseGroupRedux} from "../../../CollapseGroupRedux";
import {ViewComponentSetup} from "./ViewComponentSetup";
import {profileViewsActions} from "../../../../store/profile/ProfileViewsSlice";


export const SideCustomViewComponents = () => {
    const dispatch = useDispatch();

    const viewsIds = useSelector((state:RootState) => profileSelectViewIds(state))

    function addNewCustomHtmlComponent() {
        dispatch(profileViewsActions.viewAdd())
    }

    function setViews(ids: number[]) {
        dispatch(profileViewsActions.viewUpdateArray({ids: ids}))
    }

    return (
        <React.Fragment>
            <div className="title is-4">Views</div>
            <p>Create a view to render received data or custom html elements</p>
            <br/>
            <CollapseCard title="Views">
                <CollpaseGroupRedux arrayIds={viewsIds} deleteIcon
                                    selector={(state:RootState, id: number) => profileSelectViewById(state, id)}
                                   setNewArray={(array) => {
                                       setViews(array)
                                   }}
                >
                    {
                        (element, _) => (
                            <ViewComponentSetup
                                key={element}
                                id={element}
                            />
                        )
                    }
                </CollpaseGroupRedux>
                <button className="button is-primary mt-4" onClick={() => addNewCustomHtmlComponent()}>Add New</button>
            </CollapseCard>
        </React.Fragment>
    )
}
