import * as React from "react";
import {ElementReference} from "../../../../../common/model/profile/Common";
import 'react-querybuilder/dist/query-builder.css';
import "../../../../../../myquerystyles.css"
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../../../store/AppStore";
import {profileSelectEventById, profileSelectEventDeps} from "../../../../store/profile/ProfileSelectors";
import {ActionAppendHtmlComponent} from "./ActionAppendHtmlComponent";
import {profileActionsActions} from "../../../../store/profile/ProfileActionsSlice";
import {ActionType} from "../../../../../common/model/profile/Actions";
import {useMemo} from "react";
import {getElementFromRef} from "../../../Utils";
import {getExpectedChannelOutputParams} from "../../../../../common/utility/CommonUtil";
import {IOParameter} from "../../../../../common/model/profile/Layer";
import {ActionReplaceHtmlProperties} from "./ActionReplaceHtmlProperties";
import {ActionSendDataComponent} from "./ActionSendDataComponent";
import {ActionCustomComponent} from "./ActionCustomComponent";

export const ActionComponent = (props: {
    id: number,
    availableProps: IOParameter[]
}) => {

    const dispatch = useDispatch();
    const deps = useSelector(profileSelectEventDeps)
    const action = useSelector((state:RootState) => state.profile.actions.entities[props.id])
    const type = action.type
    const settings = action.config

    function setActionType(actionType: ActionType) {
        dispatch(profileActionsActions.updateActionType({id: props.id, actionType: actionType, deps: deps, availableParams: props.availableProps}))
    }

    return (
        <div>

            <div className="control mb-2">
                <div className="field">
                    <label className="label">Action Type</label>
                    <div className="select">
                        <div className="select">
                            <select value={type}
                                    onChange={(evt) => {
                                        setActionType(evt.target.value as ActionType)
                                    }}>
                                {
                                    Object.values(ActionType).map((it) =>
                                        <option key={it}>{it}</option>
                                    )
                                }
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <fieldset className="fieldset">
                <legend>Action Settings</legend>
                {type === ActionType.ReplaceHtmlProperties && <ActionReplaceHtmlProperties
                    id={props.id}
                    availableParams={props.availableProps}
                />}
                {type === ActionType.SendData && <ActionSendDataComponent
                    id={props.id}
                    availableParams={props.availableProps}
                />}
                {type === ActionType.Custom && <ActionCustomComponent
                    id={props.id}
                    availableParams={props.availableProps}
                />}
            </fieldset>
        </div>
    );
}