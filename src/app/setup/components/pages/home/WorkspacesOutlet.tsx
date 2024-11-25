import * as React from "react";
import {useState} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../../../../common/providers/indexedDb/db";
import {WorkspaceList} from "./WorkspaceList";
import {useSelector} from "react-redux";
import {dbEntriesSelectors} from "../../../store/dbEntries/dbEntries";


export const WorkspacesOutlet = () => {

    const workspaces = useSelector(dbEntriesSelectors.selectWorkspaces)

    return(
            <div className="column">
                <WorkspaceList workspaces={workspaces}/>
            </div>
    )
}

export default WorkspacesOutlet;