import * as React from "react"; 
import {useParams} from "react-router-dom";
import {LibraryList} from "./LibraryList";
import {ProfileList} from "./ProfileList";
import {useSelector} from "react-redux";
import {
    dbEntriesSelectors,
    dbEntriesSelectorsWithParams,
    dbEntriesType,
} from "../../../store/dbEntries/dbEntries";
import {appStore} from "../../../store/AppStore";
import {DbProfileMeta} from "../../../../common/providers/indexedDb/db";
import {UserDataProfileMeta} from "../../../../common/model/UserData";


export const WorkspaceSelectedOutlet = () => {

    const {workspaceId} = useParams()
    const profiles: Required<UserDataProfileMeta>[] = useSelector((state:{ dbEntries: dbEntriesType }) =>
        dbEntriesSelectorsWithParams.selectProfilesByWorkspaceId(state.dbEntries, parseInt(workspaceId)))
    const libraries = useSelector((state:{ dbEntries: dbEntriesType }) =>
        dbEntriesSelectorsWithParams.selectLibrariesByWorkspaceId(state.dbEntries, parseInt(workspaceId)))
    const workspaces = useSelector(dbEntriesSelectors.selectWorkspaces)

    return(
            <div className="column">
                <ProfileList profiles={profiles} workspaces={workspaces}/>
                <LibraryList libraries={libraries} workspaces={workspaces}/>
            </div>
    )
}

export default WorkspaceSelectedOutlet;