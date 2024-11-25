import * as React from "react";
import {useMemo} from "react";
import 'react-querybuilder/dist/query-builder.css';
import {useDispatch, useSelector} from "react-redux";
import {profileSelectEventDeps} from "../../../../store/profile/ProfileSelectors";
import {RootState} from "../../../../store/AppStore";
import {IOParameter} from "../../../../../common/model/profile/Layer";
import {profileActionsActions} from "../../../../store/profile/ProfileActionsSlice";
import {
    ActionCustomSettings,
} from "../../../../../common/model/profile/Actions";
import {CodeComponent} from "../CodeComponent";


export const ActionCustomComponent = (props: {
    id: number,
    availableParams: IOParameter[]
}) => {

    const dispatch = useDispatch();

    const action = useSelector((state:RootState) => state.profile.actions.entities[props.id])
    const settings = action.config as ActionCustomSettings

    const initialCode = useMemo(() => {
        return settings.code
    }, [])

    function updateCode(code: string) {
        dispatch(profileActionsActions.updateActionCustom(
            {
                id: props.id,
                key: "code",
                value: code
            }
        ))
    }


    return (
        <div>
            <CodeComponent code={initialCode} onCodeUpdate={updateCode}/>
        </div>
    );
}