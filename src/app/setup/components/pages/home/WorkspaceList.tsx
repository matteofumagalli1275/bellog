import * as React from "react";
import {DbFolder} from "../../../../common/providers/indexedDb/db";
import {useDialogHelper} from "../../dialogs/DialogHelper";
import {DialogMessageSeverity} from "../../dialogs/DialogMessage";
import {generateUniqueName} from "../../../../common/utility/JSUtils";
import {useDispatch} from "react-redux";
import {createWorkspaceDb, deleteWorkspaceDb, renameWorkspaceDb} from "../../../store/Middleware";

export const WorkspaceList = (
    props: {
        workspaces: Required<DbFolder>[]
    }
) => {

    const {dialogMessage, dialogYesNoConfirm, dialogInputText} = useDialogHelper()
    const dispatch = useDispatch()

    const workspaces = props.workspaces;

    function createWorkspace() {
        const uniqueName = generateUniqueName("New Workspace", workspaces.map((it) => it.name))

        dispatch(createWorkspaceDb({name: uniqueName}))
    }

    function renameWorkspace(item: DbFolder) {
        dialogInputText.show({
            title: "Rename Workspace",
            message: "New name: ",
            notValidMessage: "Cannot insert special characters",
            initialText: item.name,
            onValidTextCheck: (text:string) => {
                return (!(/[^a-zA-Z0-9\s]/).test(text)) && text.length > 0
            },
            onConfirm: (text:string) => {
                const sameNameWorkspaces = workspaces.filter((it) => it.name.toLowerCase() === text.toLowerCase()
                    && it.id != item.id)
                if(sameNameWorkspaces.length > 0) {
                    dialogMessage.show({
                        title: "Rename invalid",
                        severity: DialogMessageSeverity.ERROR,
                        message: "Existing workspace with same name"
                    })
                } else {
                    dispatch(renameWorkspaceDb({
                        name: text,
                        id: item.id,
                    }))
                    dialogInputText.close()
                }
            }
        })
    }

    function deleteWorkspace(item: DbFolder) {
        dialogYesNoConfirm.show({
            title: "Delete Workspace",
            message: "This will delete all associated profiles. Continue?",
            onConfirm: () => {
                dispatch(deleteWorkspaceDb({id: item.id}))
                dialogYesNoConfirm.close();
            }
        })
    }

    return (
        <div className="box">
            <div className="level">
                <div className="level-left">
                    <h2 className="title is-4">Workspaces</h2>
                </div>
                <div className="level-right">
                    <button className="button is-primary" onClick={createWorkspace}>Create
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
                    workspaces?.length <= 0 ? <tr>
                            <td>No Workspace Available</td>
                            <td></td>
                        </tr> :
                        workspaces?.map((workspace, index) => {
                            return (
                                <tr key={index}>
                                    <td>{workspace.name}</td>
                                    <td>
                                        <div className="is-flex is-align-items-center" style={{gap: "0.5rem"}}>
                                            <button
                                                className="button is-small info"
                                                onClick={() => renameWorkspace(workspace)}
                                            >
                                                Rename
                                            </button>
                                            <button
                                                className="button is-small is-danger"
                                                onClick={() => deleteWorkspace(workspace)}
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
