import * as React from "react";
import {Property} from "csstype";
import {DriverList} from "../../drivers/driverlist";
import {RendererList} from "../../renderers/rendererslist";
import {
    createContext,
    Dispatch,
    forwardRef,
    SetStateAction,
    useImperativeHandle,
    useMemo,
    useReducer,
    useRef,
    useState
} from "react";
import {GenericRendererPropertiesSetup, GenericRendererSetup, MatchEntry} from "../../renderers/generic/Generic";
import {IProfile, ContextWithSetter} from "../../app/ProfileContext";
import {useStateWithCallback} from "../../utility/customHooks";
import {ViewSetup} from "./ViewSetup";
import {ScriptSetup} from "./ScriptSetup";
import {CustomParsersSetup} from "./CustomParsersSetup";
import {CollapseCard} from "../CollapseCard";
import {buildDefaultGlobalScript} from "../../app/setup/SetupFactories";


export const ProfileContext = createContext<ContextWithSetter<IProfile>>(undefined);
export const ViewContext = createContext<ContextWithSetter<any[]>>(undefined);

const ProfileSetup = forwardRef((props : {profile: IProfile, onConfigUpdate: any}, ref) => {

    const [profileName, setProfileName] = useStateWithCallback(props.profile.profileName, () => {
        props.onConfigUpdate({profileName: profileName})
    })

    const [driverName, setDriverName] =  useStateWithCallback(props.profile.driverName, () => {
        props.onConfigUpdate({driverName: driverName})
    })

    const [scripts, setScripts] = useStateWithCallback(props.profile.scripts ?? [], () => {
        props.onConfigUpdate({scripts: scripts})
    })

    const [parsers, setParsers] = useStateWithCallback(props.profile.parsers ?? [], () => {
        props.onConfigUpdate({parsers: parsers})
    })

    const [views, setViews] = useStateWithCallback(props.profile.views ?? [], () => {
        props.onConfigUpdate({views: views})
    })

    function addNewGlobalScript() {
        setScripts([...scripts, buildDefaultGlobalScript()])
    }

    return (
        <div>
            <h2>Setup Profile</h2>
            <div className="row gap1">
                <div>Profile name: </div>
                <input type="text" id="profilename" value={profileName}
                       onChange={(evt) => setProfileName(evt.target.value)}></input>
            </div>
            <div className="row gap1">
                <div>Driver: </div>
                <select name="cars" id="cars">
                    {
                        DriverList.map(
                            driver => {
                                return <option value={driver.name}>{driver.name}</option>
                            }
                        )
                    }
                </select>
            </div>

            <CollapseCard title="Global scripts">
                {
                    scripts.map(
                        (gscript, index) => {
                            return (
                                <ScriptSetup
                                    cfg={gscript}
                                    onConfigChange={(newScript) =>
                                        setScripts(
                                            views.map((n_script, n_index) => {
                                                if(n_index == index)
                                                    return newScript
                                                else
                                                    return n_script
                                            }), false)}
                                />
                            )

                        }
                    )
                }
                <button className="button is-primary" onClick={() => addNewGlobalScript()}>Add New</button>
            </CollapseCard>

            <CollapseCard title="Custom parsers">
                {
                    parsers.map(
                        (parser, index) => {
                            return (
                                <CustomParsersSetup
                                    cfg={parser}
                                    onConfigChange={(newScript) =>
                                        setScripts(
                                            views.map((n_parser, n_index) => {
                                                if(n_index == index)
                                                    return newScript
                                                else
                                                    return n_parser
                                            }), false)}
                                />
                            )

                        }
                    )
                }
                <button className="button is-primary">Add New</button>
            </CollapseCard>

            <div className="row gap1">
                <div>Views</div>
                {
                    views.map(
                        (view, index) => {
                            return (
                                <ViewSetup
                                    cfg={view}
                                    onConfigChange={(newView) =>
                                        setViews(
                                        views.map((n_view, n_index) => {
                                            if(n_index == index)
                                                return newView
                                            else
                                                return n_view
                                        }), false)}
                                />
                            )

                        }
                    )
                }
            </div>
        </div>
    );
})

export default ProfileSetup;