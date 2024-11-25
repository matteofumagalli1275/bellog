import * as React from "react";
import {ElementReferenceComponent} from "../ElementReferenceComponent";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../../../store/AppStore";
import {profileSelectViewFragmentById} from "../../../../store/profile/ProfileSelectors";
import {ViewFragmentAppend, ViewFragmentFixed} from "../../../../../common/model/profile/View";
import {ElementReference} from "../../../../../common/model/profile/Common";
import {profileViewsActions} from "../../../../store/profile/ProfileViewsSlice";

export const ViewFragmentFixedComponent = (props: { fragmentId: number, viewId: number }) => {
    const dispatch = useDispatch();

    const fragment = useSelector((state: RootState) => profileSelectViewFragmentById(state, props.viewId, props.fragmentId))
    const htmlRef = (fragment.config as ViewFragmentFixed).ui


    function setHtmlRef(htmlReference: ElementReference) {
        dispatch(profileViewsActions.viewUpdateFragmentFixedConfig({
            viewId: props.viewId,
            fragmentId: props.fragmentId,
            changes: {
                ui: htmlReference
            }
        }))
    }

    return (
        <React.Fragment>
            <ElementReferenceComponent
                title={"UI"}
                elementReference={htmlRef}
                onUpdate={setHtmlRef}
            />
        </React.Fragment>
    )
};