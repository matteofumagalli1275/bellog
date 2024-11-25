import * as React from 'react';
import {createContext, Dispatch, SetStateAction, useEffect, useMemo, useRef, useState} from 'react';

import { Route, useLocation, Routes, Link } from 'react-router-dom'

import { SetupNav } from "./setup/components/pages/setup/SetupNav";
import Toolbar from "./setup/components/Toolbar";
import PageDisclaimer from './setup/components/pages/PageDisclaimer';
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "./common/providers/indexedDb/db";
import {DialogMessage, DialogMessageProps} from "./setup/components/dialogs/DialogMessage";
import {DialogImportList} from "./setup/components/dialogs/DialogImportList";
import {Provider, useDispatch, useSelector} from "react-redux";
import HomeNav from "./setup/components/pages/home/HomeNav";
import HomeOutlet from "./setup/components/pages/home/HomeOutlet";
import WorkspacesOutlet from "./setup/components/pages/home/WorkspacesOutlet";
import WorkspaceSelectedOutlet from "./setup/components/pages/home/WorkspaceSelectedOutlet";
import SettingsOutlet from "./setup/components/pages/home/SettingsOutlet";
import {ToolbarInterface} from "./setup/ToolbarInterface";
import {defaultDialogState, DialogInterface, useDialogHelper} from "./setup/components/dialogs/DialogHelper";
import {DialogInputText} from "./setup/components/dialogs/DialogInputText";
import {DialogYesNoConfirm} from "./setup/components/dialogs/DialogYesNoConfirm";
import {attachDb, detachDb} from "./setup/store/Middleware";
import {SideCustomScriptsSettings} from "./setup/components/pages/setup/scripts/SideCustomScriptsSettings";
import {SideCustomHtmlComponents} from "./setup/components/pages/setup/htmls/SideCustomHtmlComponents";
import {SideMainSettings} from "./setup/components/pages/setup/main/SideMainSettings";
import {SideOtherSettings} from "./setup/components/pages/setup/advancedSettings/SideOtherSettings";
import {SideCustomLayers} from "./setup/components/pages/setup/layers/SideCustomLayers";
import {SideCustomViewComponents} from "./setup/components/pages/setup/views/SideCustomViewComponents";
import {SideCustomEventsComponents} from "./setup/components/pages/setup/events/SideCustomEventsComponents";
import {RootState} from "./setup/store/AppStore";

export const DialogContext = createContext<[DialogInterface, Dispatch<SetStateAction<DialogInterface>>]>(null)

const App = () => {

    const disclaimerKey = "disclaimerAccepted"
    const [disclaimerAccepted, setDisclaimer] = React.useState<boolean>(null)
    const [dialogState, setDialogState] = useState<DialogInterface>(defaultDialogState)
    const dispatch = useDispatch()


    useEffect(() => {
        try {
            db.flags.add({
                name: disclaimerKey,
                value: false
            }, disclaimerKey)
        } catch (ex) {}

        try {
            db.flags.add({
                name: "websocketToken",
                value: crypto.randomUUID()
            }, "websocketToken")
        } catch (ex) {}

        dispatch(attachDb())

        return () => {
            dispatch(detachDb())
        }

    }, []);

    useLiveQuery(async () => {
        const disclaimerAccepted = await db.flags.get(disclaimerKey)
        setDisclaimer(disclaimerAccepted.value as boolean)
    });

    function updateDisclaimer(value: boolean)
    {
        db.flags.update(disclaimerKey, {
          value: value
        })
        setDisclaimer(value)
    }

    return (
        <div className='is-flex is-flex-direction-column' style={{ height: "100%" }}>

            <DialogContext.Provider value={[dialogState, setDialogState]}>
                {dialogState.dialogMessage.open && <DialogMessage {...dialogState.dialogMessage.opts}/>}
                {dialogState.dialogYesNoConfirm.open && <DialogYesNoConfirm {...dialogState.dialogYesNoConfirm.opts}/>}
                {dialogState.dialogImportList.open && <DialogImportList {...dialogState.dialogImportList.opts}/>}
                {dialogState.dialogInputText.open && <DialogInputText {...dialogState.dialogInputText.opts}/>}
                {disclaimerAccepted === false ?
                    <PageDisclaimer onDisclaimer={updateDisclaimer} />
                    :
                    <>
                        <Toolbar/>
                        <Routes >
                            <Route path="/" element={
                                <HomeNav/>
                            } >
                                <Route index element={
                                    <HomeOutlet/>
                                } />

                                <Route path="/workspaces" element={
                                    <WorkspacesOutlet/>
                                } />

                                <Route path="/workspace/:workspaceId" element={
                                    <WorkspaceSelectedOutlet/>
                                } />

                                <Route path="/settings" element={
                                    <SettingsOutlet/>
                                } />

                            </Route>

                            <Route path={`/profile/:profileId/setup`} element={
                                <SetupNav />
                            } >
                                <Route index element={
                                    <SideMainSettings

                                    />
                                } />

                                <Route path="layers" element={
                                    <SideCustomLayers/>
                                } />

                                <Route path="htmls" element={
                                    <SideCustomHtmlComponents/>
                                } />

                                <Route path="views" element={
                                    <SideCustomViewComponents/>
                                } />

                                <Route path="events" element={
                                    <SideCustomEventsComponents/>
                                } />

                                <Route path="scripts" element={
                                    <SideCustomScriptsSettings/>
                                } />

                                <Route path="settings" element={
                                    <SideOtherSettings/>
                                } />
                            </Route>

                            { /*
                                <Route path={`/profile/:profileId/runtime`} element={
                                    <PageProfileRuntime />
                                } /> */}

                            <Route path="*" element={<div>404</div>} />
                        </Routes >
                    </>
            }
            </DialogContext.Provider>
        </div>
    );
};

export default App;