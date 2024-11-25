import * as React from "react";
import {appStore} from "../../../store/AppStore";
import {deepMerge, generateUniqueName} from "../../../../common/utility/JSUtils";
import {DialogMessageSeverity} from "../../dialogs/DialogMessage";
import {DbFolder} from "../../../../common/providers/indexedDb/db";
import {useDialogHelper} from "../../dialogs/DialogHelper";
import {useDispatch} from "react-redux";
import {UserDataFolder, UserDataProfileMeta} from "../../../../common/model/UserData";
import {createProfileDb, deleteProfileDb, moveProfileToWorkspaceDb} from "../../../store/Middleware";
import {getDefaultProfileDbFormat} from "../../../DefaultProperties";
import {SAMPLE_LIBRARIES} from "../../../../common/res/sampleProfiles/SampleProfiles";

export const LibraryList = (
    props: {
        libraries: Required<UserDataProfileMeta>[],
        workspaces: Required<UserDataFolder>[]
    }
) => {

    const {dialogMessage, dialogImportList} = useDialogHelper()
    const dispatch = useDispatch()

    const {libraries, workspaces} = props;

    function createLibrary() {
        const uniqueName = generateUniqueName("New Library", libraries.map((it) => it.name))
        const profileToSave = getDefaultProfileDbFormat()
        profileToSave.settings.isLibrary = true;
        dispatch(createProfileDb({name: uniqueName, profile: profileToSave}))
    }

    function deleteLibrary(id: number) {
        dispatch(deleteProfileDb({id: id}))
    }

    async function loadLibrary(e: React.ChangeEvent<HTMLInputElement>) {
        let fileInput = e.target
        let file = fileInput.files[0];
        if (file) {
            let reader = new FileReader();
            let newProfile = JSON.parse(reader.result as string)
            deepMerge(newProfile, appStore.getState());
            reader.onload = async function () {
                dispatch(createProfileDb({name: newProfile.profileName, profile: newProfile}))
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

    function triggerImportLibrariesPopup() {
        dialogImportList.show({
            title: "Select library to import",
            message: "",
            items: SAMPLE_LIBRARIES.map(s => ({name: s.name, description: s.description})),
            onConfirmSelection: async (_item, index: number) => {
                const sample = SAMPLE_LIBRARIES[index];
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

    function triggerMoveToWorkspaceDialog(libraryId: number) {
        dialogImportList.show({
            title: "Select workspace to move profile",
            message: "",
            items: workspaces,
            onConfirmSelection: async (item, _index: number) => {
                dispatch(moveProfileToWorkspaceDb({
                    id: libraryId,
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
                    <h2 className="title is-4">Libraries</h2>
                </div>
                <div className="level-right">
                    <button className="button is-primary" onClick={createLibrary}>Create
                    </button>
                    <input type="file" name="import" accept=".bll" style={{display: 'none'}}
                           onChange={loadLibrary}/>
                    <button className="button is-info" id="importButton"
                            onClick={(e) => {
                                (e.currentTarget.previousSibling as HTMLInputElement).click()
                            }}>
                        <span className="icon"><i className="fas fa-file-import"></i></span>
                        <span>Import by From PC</span>
                    </button>
                    <button className="button is-link" onClick={triggerImportLibrariesPopup}>Import by Example
                    </button>
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
                    libraries?.length <= 0 ? <tr>
                            <td>No Library Available</td>
                            <td></td>
                        </tr> :
                        libraries?.map((library, index) => {
                            return (
                                <tr key={index}>
                                    <td>{library.name}</td>
                                    <td>
                                        <div className="is-flex is-align-items-center" style={{gap: "0.5rem"}}>
                                            <a className="button is-small is-success"
                                               href={`/runtime.html#/${library.id}`}
                                               target="_blank"
                                               rel="noopener noreferrer">Run</a>

                                            <a className="button is-small is-info"
                                               href={`#/profile/${library.id}/setup`}>Edit</a>

                                            {workspaces.length > 0 && <button
                                                className="button is-small is-warning"
                                                onClick={() => triggerMoveToWorkspaceDialog(library.id)}
                                            >
                                                Move
                                            </button>}

                                            <button
                                                className="button is-small is-danger"
                                                onClick={() => deleteLibrary(library.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                }
                </tbody>
            </table>
        </div>
    );
};
