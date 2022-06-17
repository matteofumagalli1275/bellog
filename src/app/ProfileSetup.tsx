import * as React from "react";
import {Property} from "csstype";
import {DriverList} from "../drivers/driverlist";
import {RendererList} from "../renderers/rendererslist";
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
import {GenericRendererPropertiesSetup, GenericRendererSetup, MatchEntry} from "../renderers/generic/Generic";
import {IProfile, ContextWithSetter} from "./ProfileContext";


export const ProfileContext = createContext<ContextWithSetter<IProfile>>(undefined);
export const ViewContext = createContext<ContextWithSetter<any[]>>(undefined);

function useStateWithCallback<T>(initialValue: T, onUpdate: (T) => void):  [T, ((newValue: T, propagateState?: boolean) => void)] {

    const [state, _setState] = useState<T>(initialValue)
    //this logic is up to you
    const setState = (newState, propagateState: boolean = true) => {
        if(propagateState)
            _setState(newState)
        onUpdate(newState)
    }
    return [state, setState]
}

const ProfileSetup = forwardRef((props : {profile: IProfile, onConfigUpdate: any}, ref) => {

    const [profileName, setProfileName] = useStateWithCallback(props.profile.profileName, () => {
        props.onConfigUpdate({profileName: profileName})
    })

    const [driverName, setDriverName] =  useStateWithCallback(props.profile.driverName, () => {
        props.onConfigUpdate({driverName: driverName})
    })

    const [views, setViews] = useStateWithCallback<any[]>(props.profile.views ?? [], () => {
        props.onConfigUpdate({views: views})
    })

    function setViewConfig(view: any, cfg: any)
    {

        //views[views.indexOf(view)] = cfg
    }

    function setProfileViews(views: any[])
    {
        profile.views = views
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
            {
                views.map(
                    (view, index) => {
                        return (
                            <React.Fragment>
                                {
                                    RendererList.map(
                                        renderer => {
                                            return <option value={renderer.name}>{renderer.name}</option>
                                        }
                                    )
                                }
                                {
                                    RendererList.map(
                                        render => {
                                            if(render.name === view.name)
                                            {
                                                return (
                                                    <GenericRendererSetup config={view}
                                                                          onConfigChange={(newView) =>
                                                                              setViews(
                                                                                  views.map((n_view, n_index) => {
                                                                                      if(n_index == index)
                                                                                          return newView
                                                                                      else
                                                                                          return n_view
                                                                                  }), false)
                                                                          }/>
                                                )
                                            }
                                        }
                                    )
                                }
                            </React.Fragment>
                        )

                    }
                )
            }
            <div className="row gap1">
                <div>Renderer: </div>
                <select name="cars" id="cars">
                    {
                        RendererList.map(
                            renderer => {
                                return <option value={renderer.name}>{renderer.name}</option>
                            }
                        )
                    }
                </select>
            </div>
            <h3>View configuration</h3>
            <ViewContext.Provider value={[views, setProfileViews]}>
            <div className="profile_setup_row">
                {
                    RendererList.map(
                        render => {
                            if(render.name === profile.renderName)
                            {
                                return (
                                    <GenericRendererSetup/>
                                )
                            }
                        }
                    )
                }
            </div>
            </ViewContext.Provider>
        </div>
    );
})

export default ProfileSetup;