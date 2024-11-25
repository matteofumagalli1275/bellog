// ExternalSymbolsTable.tsx
import * as React from "react";
import {useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    profileDependenciesActions,
    profileDependenciesSelectors
} from "../../../../store/profile/ProfileDependenciesSlice";
import {DependencyProperty, DependencyRule} from "../../../../../common/model/profile/Dependency";
import SelectLibrary from "../../../dialogs/special/SelectLibrary";
import {UserDataProfileMeta} from "../../../../../common/model/UserData";
import {librariesExportsActions} from "../../../../store/dependencies/dependencies";
import {loadLibrariesDb} from "../../../../store/Middleware";


const DependenciesTable  = () => {

    const dispatch = useDispatch()
    const dependenciesOriginal = useSelector(profileDependenciesSelectors.selectAll)
    const [openAddLibrary, setOpenAddLibrary] = useState<boolean>(false)

    const dependencies: DependencyProperty[] = useMemo(() => {
        return [
            ...dependenciesOriginal,
            {id: -1, name: "", rdnId: "", version: "", rule: DependencyRule.EQUAL, deleted: false}
        ]
    }, [dependenciesOriginal]);

    const addLibrary = async (library: UserDataProfileMeta) => {
        dispatch(profileDependenciesActions.addOne({
            id: library.id,
            name: library.name,
            rdnId: library.rdnId,
            version: library.version,
            rule: DependencyRule.GREATER_EQUAL,
            deleted: false
        }))
        setOpenAddLibrary(false)
        dispatch(loadLibrariesDb([{rdnId: library.rdnId, version: library.version, rule: DependencyRule.GREATER_EQUAL}]))
    };

    const deleteRow = (item: DependencyProperty) => {
        if(item.id !== -1) {
            dispatch(profileDependenciesActions.removeOne(item.id))
            dispatch(librariesExportsActions.removeOne(item.rdnId))
        }
    };

    const updateCell = (id: number, key: keyof DependencyProperty, value: any) => {
        if(id !== -1)
            dispatch(profileDependenciesActions.updateOne({id: id, changes: {[key]: value}}))
    };


    return (
        <div style={{maxWidth: "80%", minWidth: "600px"}}>
            <h2 className="title is-5 has-text-centered is-fullwidth">Dependencies</h2>
            <table className="table is-striped is-hoverable is-fullwidth">
                <thead>
                <tr>
                    <th className="has-text-centered">Name</th>
                    <th className="has-text-centered">RDN</th>
                    <th className="has-text-centered">Version</th>
                    <th className="has-text-centered">Rule</th>
                    <th className="has-text-centered">Actions</th>
                </tr>
                </thead>
                <tbody>
                {dependencies.map(item => (
                    <tr key={item.id}>
                        <td>
                            <input
                                className="input is-small is-disabled"
                                disabled
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                }}
                            />
                        </td>
                        <td>
                            <input
                                className="input is-small is-disabled"
                                disabled
                                type="text"
                                value={item.rdnId}
                                onChange={() => {
                                }}
                            />
                        </td>
                        <td>
                            <input
                                className="input is-small is-disabled"
                                disabled
                                type="text"
                                value={item.version}
                                onChange={(e) => {
                                }}
                            />
                        </td>
                        <td className="has-text-centered">
                            <div className="select is-small">
                                <select value={item.rule}
                                        onChange={(e) => {
                                            updateCell(item.id, "rule", e.target.value)
                                        }}>
                                    {
                                        Object.values(DependencyRule).map((it) =>
                                            <option key={it}>{it}</option>
                                        )
                                    }
                                </select>
                            </div>
                        </td>
                        <td className="has-text-centered">
                            <button
                                className="button is-danger is-small"
                                onClick={() => deleteRow(item)}
                            >
                                Remove
                            </button>
                            <button
                                className="button is-info is-small ml-2"
                                onClick={() => setOpenAddLibrary(true)}
                            >
                                Add Library
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {openAddLibrary && <SelectLibrary
                open={openAddLibrary}
                onClose={() => {setOpenAddLibrary(false)}}
                onSelected={addLibrary}
            />}
        </div>
    );
};

export default DependenciesTable;