import * as React from "react";
import {appStore} from "../../../store/AppStore";
import {deepMerge, generateUniqueName} from "../../../../common/utility/JSUtils";
import {useDialogHelper} from "../../dialogs/DialogHelper";
import {DialogMessageSeverity} from "../../dialogs/DialogMessage";
import {useDispatch} from "react-redux";
import {createProfileDb, deleteProfileDb, moveProfileToWorkspaceDb} from "../../../store/Middleware";
import {UserDataFolder, UserDataProfileMeta} from "../../../../common/model/UserData";
import {HistoryList} from "./HistoryList";
import {SAMPLE_PROFILES} from "../../../../common/res/sampleProfiles/SampleProfiles";

export const ProfileList = (
    props: {
        profiles: Required<UserDataProfileMeta>[],
        workspaces: Required<UserDataFolder>[]
    }
) => {

    const {dialogMessage, dialogImportList} = useDialogHelper()
    const dispatch = useDispatch()

    const {profiles, workspaces} = props;

    function createProfile() {
        const uniqueName = generateUniqueName("New Profile", profiles.map((it) => it.name))

        dispatch(createProfileDb({name: uniqueName}))
    }

    function deleteProfile(id: number) {
        dispatch(deleteProfileDb({id: id}))
    }

    async function loadProfile(e: React.ChangeEvent<HTMLInputElement>) {
        let fileInput = e.target
        let file = fileInput.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = async function () {
                let newProfile = JSON.parse(reader.result as string)
                dispatch(createProfileDb({
                    name: newProfile.profileName,
                    profile: newProfile
                }))
            }
            reader.readAsText(file);
            fileInput.value = ""
        } else {
            dialogMessage.show({
                title: "Load Failed",
                severity: DialogMessageSeverity.ERROR,
                message: "Cannot Read File"
            })
        }
    }

    function triggerImportProfilesPopup() {
        dialogImportList.show({
            title: "Select item to import",
            message: "",
            items: SAMPLE_PROFILES.map(s => ({name: s.name, description: s.description})),
            onConfirmSelection: async (_item, index: number) => {
                const sample = SAMPLE_PROFILES[index];
                if (sample) {
                    dispatch(createProfileDb({
                        name: sample.name,
                        profile: sample.profile
                    }))
                    dialogImportList.close()
                }
            }
        })
    }

    function triggerMoveToWorkspaceDialog(profileId: number) {
        dialogImportList.show({
            title: "Select workspace to move profile",
            message: "",
            items: workspaces,
            onConfirmSelection: async (item, _index: number) => {
                dispatch(moveProfileToWorkspaceDb({
                    id: profileId,
                    name: item.name
                }))
                dialogImportList.close()
            }
        })
    }

    return (
        <div className="box">
            <div className="level">
                <div className="level-left">
                    <h2 className="title is-4">Profiles</h2>
                </div>
                <div className="level-right">
                    <button className="button is-primary" onClick={createProfile}>Create
                    </button>
                    <input type="file" name="import" accept=".bll" style={{display: 'none'}}
                           onChange={loadProfile}/>
                    <button className="button is-info" id="importButton"
                            onClick={(e) => {
                                (e.currentTarget.previousSibling as HTMLInputElement).click()
                            }}>
                        <span className="icon"><i className="fas fa-file-import"></i></span>
                        <span>Import by From PC</span>
                    </button>
                    <button className="button is-link" onClick={triggerImportProfilesPopup}>Import by Example
                    </button>
                    <a className="button is-dark"
                       href="vscode://vscode.git/clone?url=https://github.com/bel-log/vscode-sample">
                        <span className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.583.063a1.5 1.5 0 00-1.032.392 1.5 1.5 0 00-.001 0L7.05 9.6 2.856 6.322a1 1 0 00-1.274.073L.255 7.722a1 1 0 000 1.499l3.651 3.315-3.651 3.315a1 1 0 000 1.499l1.327 1.327a1 1 0 001.274.073L7.05 15.373l9.5 9.144a1.5 1.5 0 001.033.392c.058 0 .116-.003.175-.01A1.5 1.5 0 0019 23.4V1.573A1.5 1.5 0 0017.583.063zM17 18.4l-6.39-5.937L17 6.527z"/>
                            </svg>
                        </span>
                        <span>Create in VSCode</span>
                    </a>
                </div>
            </div>
            <table className="table is-fullwidth is-striped">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {
                    profiles?.length <= 0 ? <tr>
                            <td>No Profile Available</td>
                            <td></td>
                        </tr> :
                        profiles?.map((profile, index) => {
                            return (
                                <React.Fragment key={index}>
                                    <tr>
                                        <td>{profile.name}</td>
                                        <td>
                                            <div className="is-flex is-flex-wrap-wrap is-align-items-center" style={{gap: "0.5rem"}}>
                                                <a className="button is-small is-success"
                                                   href={`/runtime.html#/${profile.id}`}
                                                   target="_blank"
                                                   rel="noopener noreferrer">Run</a>

                                                <a className="button is-small is-info"
                                                   href={`#/profile/${profile.id}/setup`}>Edit</a>

                                                {workspaces.length > 0 && <button
                                                    className="button is-small is-warning"
                                                    onClick={() => triggerMoveToWorkspaceDialog(profile.id)}
                                                >
                                                    Move
                                                </button>}

                                                <button
                                                    className="button is-small is-danger"
                                                    onClick={() => deleteProfile(profile.id)}
                                                >
                                                    Delete
                                                </button>
                                                <HistoryList profileId={profile.id} />
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            )
                        })
                }
                </tbody>
            </table>
        </div>
    );
};
