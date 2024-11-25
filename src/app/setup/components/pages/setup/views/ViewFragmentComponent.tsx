import * as React from "react";
import {useDispatch, useSelector} from 'react-redux';
import {
    ViewFragment,
    ViewFragmentAppend,
    ViewFragmentFixed,
    ViewFragmentType
} from "../../../../../common/model/profile/View";
import {profileViewsActions} from "../../../../store/profile/ProfileViewsSlice";
import {ElementReference} from "../../../../../common/model/profile/Common";
import {ElementReferenceComponent} from "../ElementReferenceComponent";
import {RootState} from "../../../../store/AppStore";
import {profileSelectViewFragmentById} from "../../../../store/profile/ProfileSelectors";
import {ViewFragmentAppendComponent} from "./ViewFragmentAppendComponent";
import {ViewFragmentFixedComponent} from "./ViewFragmentFixedComponent";

export const ViewFragmentComponent = (props: { fragmentId: number, viewId: number }) => {
    const dispatch = useDispatch();

    const viewId = props.viewId;

    const fragment = useSelector((state: RootState) => profileSelectViewFragmentById(state, props.viewId, props.fragmentId))

    function update(key: keyof ViewFragment, name: any) {
        dispatch(profileViewsActions.viewUpdateFragment({
            viewId: viewId,
            fragmentId: props.fragmentId,
            changes: {
                [key]: name,
            }
        }))
    }

    return (
        <React.Fragment>

            <div className="field">
                <label className="label">Fragment Name</label>
                <div className="control">
                    <input
                        className="input"
                        type="text"
                        placeholder="View Name"
                        value={fragment.name}
                        onChange={(evt) => update("name", evt.target.value)}
                    />
                </div>
            </div>

            <div className="field is-grouped">

                <div className="field">
                    <label className="label">Type</label>
                    <div className="control">
                        <div className="select">
                            <select value={fragment.type}
                                    onChange={(evt) => {
                                        update("type", evt.target.value as ViewFragmentType)
                                    }}>
                                {
                                    Object.values(ViewFragmentType).map((it) =>
                                        <option key={it}>{it}</option>
                                    )
                                }
                            </select>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <label className="label">Size (%)</label>
                    <div className="control">
                        <input
                            className="input"
                            type="number"
                            size={2}
                            placeholder="Size (%)"
                            value={fragment.percent}
                            onChange={(e) => update("percent", parseInt(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            {fragment.type === ViewFragmentType.Append ?
                <ViewFragmentAppendComponent fragmentId={props.fragmentId} viewId={props.viewId}/> : ""
            }
            {fragment.type === ViewFragmentType.Fixed ?
                <ViewFragmentFixedComponent fragmentId={props.fragmentId} viewId={props.viewId}/> : ""
            }
        </React.Fragment>
    )
};