import * as React from "react";
import {
    useEffect,
    useState
} from "react";
import {Outlet, useParams} from "react-router-dom";
import { SetupSideBarItems, SetupSiedBar } from "../../SetupSideBar";
import {appStore, RootState} from "../../../store/AppStore";
import {attachProfileDb, loadProfileDb, saveProfileDb} from "../../../store/Middleware";
import {useSelector} from "react-redux";
import {useDialogHelper} from "../../dialogs/DialogHelper";
import {DialogMessageProps} from "../../dialogs/DialogMessage";

export const SetupNav = () => {

    const { profileId } = useParams()
    const storeMessage = useSelector((state: RootState) => state.messageSlice)
    const {dialogMessage} = useDialogHelper()

    const notificationRef = React.useRef(null)

    useEffect(() => {

        /* Load profile object into store */
        appStore.dispatch(attachProfileDb(parseInt(profileId)))

        notificationRef.current.style.animationName = "none";

        const saveShortcutListener = async (evt) => {
            if ((evt.key === 's' || evt.key === 'S') && evt.ctrlKey) {
                saveProfile()
                evt.preventDefault()
            }
        }
        window.addEventListener('keydown', saveShortcutListener);

        return () => {
            window.removeEventListener('keydown', saveShortcutListener)
        }
    }, []);

    useEffect(() => {
        if(storeMessage.visible) {
                dialogMessage.show(
                {
                    title: "Store Error",
                    message: storeMessage.message,
                    severity: storeMessage.type
                }
            )
        }
    }, [storeMessage]);

    async function saveProfile() {
        try {
            appStore.dispatch(saveProfileDb())

            if (notificationRef.current) {
                notificationRef.current.style.animationName = "none";

                requestAnimationFrame(() => {
                    setTimeout(() => {
                        notificationRef.current.style.animationName = ""
                    }, 0);
                })
            }

        } catch (e) {
            console.log(`Failed to save profile`);
        }
    }

    return (
        <div className="columns is-gapless" style={{height: "100%", overflow: "hidden"}}>
            <SetupSiedBar/>
            <div className="column m-2" style={{overflow: "auto"}}>
                <Outlet/>
            </div>
            <div ref={notificationRef} className="fadeNotification notification is-success">
                Profile updated successfully!
            </div>
        </div>
    )
}