import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    profileSelectScriptIds, profileSelectStyleIds
} from "../../../../store/profile/ProfileSelectors";
import {appStore, RootState} from "../../../../store/AppStore";
import {CollapseCard} from "../../../CollapseCard";
import {ScriptSetup} from "./ScriptSetup";
import {profileScriptsActions} from "../../../../store/profile/ProfileScriptsSlice";
import {profileStylesActions} from "../../../../store/profile/ProfileStylesSlice";
import {StyleSetup} from "./StyleSetup";
import {useEffect, useState} from "react";
import LibraryCDNSearchDialog from "../../../dialogs/special/LibraryCDNSearchDialog";
import {Identifier, parse} from "acorn";
import * as acornWalk from 'acorn-walk';
import {CompletionContext, CompletionResult, Completion} from "@codemirror/autocomplete";
import app from "../../../../../App";
import ExternalSymbolsTable from "../ExternalSymbolsTable";

export const SideCustomScriptsSettings = () => {
    const dispatch = useDispatch();

    const [librarySearchOpen, setLibrarySearchOpen] = useState(false)
    const scriptsIds = useSelector((state:RootState) => profileSelectScriptIds(state))
    const stylesIds = useSelector((state:RootState) => profileSelectStyleIds(state))

    function addNewGlobalStyle() {
        dispatch(profileStylesActions.styleAdd())
    }

    function addNewGlobalScript() {
        dispatch(profileScriptsActions.scriptAdd())
    }

    function addNewGlobalScriptImported(name: string, code: string) {
        dispatch(profileScriptsActions.scriptAddWithData({name: name, code: code}))
    }

    function addNewGlobalStyleImported(name: string, code: string) {
        dispatch(profileStylesActions.styleAddWithData({name: name, code: code}))
    }

    return (
        <div>
            <div className="title is-4">Custom Code and Styles</div>
            <p>You can add .js scripts or .css styles that will be accessible globally <br />
                They are useful to customize html components or to add code or libraries used to parse a protocol. <br />
                All scripts and style will be injected inside the head tag of the page. <br/>
                You can import libraries by pasting the minified js code inside a custom script, however beware that some libraries are written for
                NodeJS (CommonJS) or are in ESM format and those would not work right now. <br/>
                To support such library it has to be compiled into a UMD bundle, you can do this with a tool such as Browserify but often
                developers provide both versions.
            </p>
            <br />

            <LibraryCDNSearchDialog
                open={librarySearchOpen}
                scriptType={"css"}
                onSelected={(libraryName, libraryCode) => {addNewGlobalStyleImported(libraryName, libraryCode)}}
                onClose={() => setLibrarySearchOpen(false)}
            />
            <CollapseCard title="Global styles">
                {
                    stylesIds.map(
                        (id) => {
                            return (
                                <StyleSetup
                                    key={id}
                                    id={id}
                                />
                            )
                        }
                    )
                }
                <button className="button is-primary mt-4" onClick={() => addNewGlobalStyle()}>Add New</button>
                <button className="button is-info mt-4 ml-4" onClick={() => setLibrarySearchOpen(true)}>
                    <span className="icon is-small">
                        <i className="fas fa-cloud-arrow-up"></i>
                    </span>
                    <span>Import From UNPKG</span>
                </button>
            </CollapseCard>

            <CollapseCard title="Global scripts">
                {
                    scriptsIds.map(
                        (id) => {
                            return (
                                <ScriptSetup
                                    key={id}
                                    id={id}
                                />
                            )
                        }
                    )
                }
                <button className="button is-primary mt-4" onClick={() => addNewGlobalScript()}>Add New</button>
                <ExternalSymbolsTable/>
            </CollapseCard>
        </div>
    )
}
