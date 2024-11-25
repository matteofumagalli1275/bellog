// ExternalSymbolsTable.tsx
import * as React from "react";
import {
    profileExportedSymbolsAdapterActions,
    profileExportedSymbolsAdapterSelectors
} from "../../../store/profile/ProfileScriptsExportedSymbolsSlice";
import {useDispatch, useSelector} from "react-redux";
import {ExportableSymbolPrefix, ScriptExportedSymbols} from "../../../../common/model/profile/Common";

const ExternalSymbolsTable  = () => {

    const dispatch = useDispatch()
    const exports = useSelector(profileExportedSymbolsAdapterSelectors.selectAll)

    const addRow = () => {
        dispatch(profileExportedSymbolsAdapterActions.addOne())
    };

    const deleteRow = (id: number) => {
        dispatch(profileExportedSymbolsAdapterActions.scriptRemove({id: id}))
    };

    const moveUp = (id: number) => {
        dispatch(profileExportedSymbolsAdapterActions.moveUp({id}))
    };

    const moveDown = (id: number) => {
        dispatch(profileExportedSymbolsAdapterActions.moveDown({id}))
    };

    const updateCell = (rowId: number, key: keyof ScriptExportedSymbols, value: any) => {
        dispatch(profileExportedSymbolsAdapterActions.updateOne({id: rowId, changes: {[key]: value}}))
    };

    return (
        <div style={{maxWidth: "80%", minWidth: "600px"}}>
            <h2 className="title is-5 has-text-centered is-fullwidth">Exported Symbols
            <span className={`ml-2 has-text-info has-tooltip-right icon is-large}`}
                  data-tooltip="You can read/write globally to this variables and bind other visual objects">
                                <i className={`fas fa-sm fa-circle-info`}></i>
                    </span>
            </h2>
            <table className="table is-striped is-hoverable is-fullwidth">
                <thead>
                <tr>
                    <th className="has-text-centered">Name</th>
                    <th className="has-text-centered">Variable</th>
                    <th className="has-text-centered">Default Value</th>
                    <th className="has-text-centered">Description</th>
                    <th className="has-text-centered">Public</th>
                    <th className="has-text-centered">Persistent</th>
                    <th className="has-text-centered">Actions</th>
                </tr>
                </thead>
                <tbody>
                {exports.map((row, index) => (
                    <tr key={row.id}>
                        <td>
                            <input
                                className="input is-small"
                                type="text"
                                value={row.name}
                                onChange={(e) => updateCell(row.id, "name", e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                className="input is-small is-disabled"
                                disabled
                                type="text"
                                value={ExportableSymbolPrefix + row.name}
                                onChange={() => {
                                }}
                            />
                        </td>
                        <td>
                            <input
                                className="input is-small"
                                type="text"
                                value={row.defaultValue ?? ""}
                                onChange={(e) => updateCell(row.id, "defaultValue", e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                className="input is-small"
                                type="text"
                                value={row.description}
                                onChange={(e) => updateCell(row.id, "description", e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                className="checkbox is-small" style={{width: "100%"}}
                                type="checkbox"
                                checked={row.public}
                                onChange={(e) => updateCell(row.id, "public", e.target.checked)}
                            />
                        </td>
                        <td>
                            <input
                                className="checkbox is-small" style={{width: "100%"}}
                                type="checkbox"
                                checked={row.persistent}
                                onChange={(e) => updateCell(row.id, "persistent", e.target.checked)}
                            />
                        </td>
                        <td className="has-text-centered">
                            <button
                                className="button is-small mr-1"
                                disabled={index === 0}
                                onClick={() => moveUp(row.id)}
                                title="Move up"
                            >
                                <span className="icon is-small"><i className="fas fa-arrow-up"></i></span>
                            </button>
                            <button
                                className="button is-small mr-1"
                                disabled={index === exports.length - 1}
                                onClick={() => moveDown(row.id)}
                                title="Move down"
                            >
                                <span className="icon is-small"><i className="fas fa-arrow-down"></i></span>
                            </button>
                            <button
                                className="button is-danger is-small"
                                onClick={() => deleteRow(row.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <button className="button is-success" onClick={addRow}>Add New</button>
        </div>
    );
};

export default ExternalSymbolsTable;