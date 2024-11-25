import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import {
    BindableVariable,
    ScriptExportedSymbols
} from "../../../../common/model/profile/Common";
import {profileSelectEventDeps} from "../../../store/profile/ProfileSelectors";
import {useSelector} from "react-redux";
import {appStore} from "../../../store/AppStore";

enum Category {
    SourceParams,
    GlobalSymbols,
}

export interface AvailableProfileVariablesProps<T> {
    open: boolean;
    onClose: () => void;
    onSelected: (variable: BindableVariable<T>) => void;
    paramsFromSource: string[]
}

export const AvailableProfileVariables: React.FC<AvailableProfileVariablesProps<any>> = ({
                                                                                        open,
                                                                                        onClose,
                                                                                        onSelected,
                                                                                        paramsFromSource,
                                                                                    }) => {
    const deps = useSelector(profileSelectEventDeps);
    const [exportedSymbols, setExportedSymbols] = useState<ScriptExportedSymbols[]>([]);
    const [category, setCategory] = useState(Category.SourceParams);
    const [librarySelected, setLibrarySelected] = useState("");
    const [originExpanded, setOriginExpanded] = useState(false);
    const [symbolFilter, setSymbolFilter] = useState("");

    const regularParams = useMemo(() => paramsFromSource.filter(p => !p.startsWith("_origin")), [paramsFromSource]);
    const originParams = useMemo(() => paramsFromSource.filter(p => p.startsWith("_origin")), [paramsFromSource]);

    useEffect(() => {
        if (!librarySelected) {
            const currentProfileExportedSymbols = Object.values(appStore.getState().profile.scriptsExportedSymbols.entities)
                .filter((symbol) => symbol.name.length > 0);
            setExportedSymbols(currentProfileExportedSymbols);
        } else {
            const library = deps.libraries.find((lib) => lib.rdnId === librarySelected);
            if (library) {
                const libExportedSymbols = Object.values(library.setup.scriptsExportedSymbols.entities)
                    .filter((symbol) => symbol.name.length > 0);
                setExportedSymbols(libExportedSymbols);
            }
        }
    }, [librarySelected, deps]);

    const handleSelectActionParams = (param: string) => {
        onSelected({ bind: true, paramFromSource: param });
        onClose();
    };

    const handleSelectGlobalVariables = (symbol: ScriptExportedSymbols) => {
        onSelected({ bind: true, symbol: { libraryRdnId: librarySelected, name: symbol.name } });
        onClose();
    };

    const handleUnbind = () => {
        onSelected({ bind: false, value: "" });
        onClose();
    };

    if (!open) return null;

    return (
        <div className="modal is-active">
            <div className="modal-background" onClick={onClose} />
            <div className="modal-card" style={{ maxWidth: "500px" }}>
                <header className="modal-card-head has-background-info" style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        <div className="select">
                            <select value={librarySelected} onChange={(e) => setLibrarySelected(e.target.value)}>
                                <option value="">Current Profile</option>
                                {deps.libraries.map((lib) => (
                                    <option key={lib.rdnId} value={lib.rdnId}>
                                        {lib.rdnId}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className="delete" aria-label="close" onClick={onClose} />
                </header>
                <section className="modal-card-body" style={{ padding: "1rem" }}>
                    <p className="panel-tabs">
                        <a
                            className={category === Category.SourceParams ? "is-active" : ""}
                            onClick={() => setCategory(Category.SourceParams)}
                        >
                            Source Params
                        </a>
                        <a
                            className={category === Category.GlobalSymbols ? "is-active" : ""}
                            onClick={() => setCategory(Category.GlobalSymbols)}
                        >
                            Global Variables
                        </a>
                    </p>

                    {category === Category.SourceParams && (
                        <div>
                            {!paramsFromSource.length ? (
                                <i className="panel-block">No items</i>
                            ) : (
                                <>
                                    {regularParams.map((param, idx) => (
                                        <a key={idx} className="panel-block" onClick={() => handleSelectActionParams(param)}>
                                            {param}
                                        </a>
                                    ))}
                                    {originParams.length > 0 && (
                                        <>
                                            <a
                                                className="panel-block has-text-grey"
                                                onClick={() => setOriginExpanded(!originExpanded)}
                                                style={{ fontStyle: "italic" }}
                                            >
                                                <span className="panel-icon">
                                                    <i className={`fas fa-angle-${originExpanded ? "down" : "right"}`} />
                                                </span>
                                                _origin
                                            </a>
                                            {originExpanded && originParams.map((param, idx) => (
                                                <a
                                                    key={idx}
                                                    className="panel-block"
                                                    style={{ paddingLeft: "2.5em" }}
                                                    onClick={() => handleSelectActionParams(param)}
                                                >
                                                    {param}
                                                </a>
                                            ))}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {category === Category.GlobalSymbols && (
                        <div>
                            <div className="panel-block">
                                <input
                                    className="input is-small"
                                    type="text"
                                    placeholder="Filter..."
                                    value={symbolFilter}
                                    onChange={(e) => setSymbolFilter(e.target.value)}
                                />
                            </div>
                            {!exportedSymbols.length ? (
                                <i className="panel-block">No items</i>
                            ) : (
                                exportedSymbols
                                    .filter((s) => s.name.toLowerCase().includes(symbolFilter.toLowerCase()))
                                    .map((symbol) => (
                                        <a
                                            key={symbol.id || symbol.name}
                                            className="panel-block"
                                            onClick={() => handleSelectGlobalVariables(symbol)}
                                        >
                                            {symbol.name}
                                        </a>
                                    ))
                            )}
                        </div>
                    )}

                </section>

                <footer className="modal-card-foot" style={{ padding: "0.75rem" }}>
                    <button className="button is-danger ml-auto" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="button is-info ml-1 mr-auto" onClick={handleUnbind}>
                        UnBind
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AvailableProfileVariables;