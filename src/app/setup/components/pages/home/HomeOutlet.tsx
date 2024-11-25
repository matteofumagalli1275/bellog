import * as React from "react";
import {useState} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../../../../common/providers/indexedDb/db";
import {LibraryList} from "./LibraryList";
import {ProfileList} from "./ProfileList";
import {useSelector} from "react-redux";
import {dbEntriesSelectors} from "../../../store/dbEntries/dbEntries";


export const HomeOutlet = () => {

    const profiles = useSelector(dbEntriesSelectors.selectProfiles)
    const libraries = useSelector(dbEntriesSelectors.selectLibraries)
    const workspaces = useSelector(dbEntriesSelectors.selectWorkspaces)

    return(
            <div className="column">
                <ProfileList profiles={profiles} workspaces={workspaces}/>
                <LibraryList libraries={libraries} workspaces={workspaces}/>
            </div>
    )
}

export default HomeOutlet;