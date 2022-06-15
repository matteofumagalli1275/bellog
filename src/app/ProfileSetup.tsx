import * as React from "react";
import {Property} from "csstype";
import {DriverList} from "../drivers/driverlist";
import {RendererList} from "../renderers/rendererslist";
import {createContext, forwardRef, useImperativeHandle, useReducer, useRef, useState} from "react";
import {GenericRendererPropertiesSetup, GenericRendererSetup, MatchEntry} from "../renderers/generic/Generic";
import {IProfile} from "./ProfileContext";

interface ContextWithSetter {
    profile: IProfile;
    setProfile: (value: IProfile) => void;
}

export const ProfileContext = createContext<ContextWithSetter>(undefined);

function reducer(state, item): IProfile
{
    return {...state, ...item}
}

const ProfileSetup = forwardRef((props : {profile: IProfile}, ref) => {

    const [profile, setProfile] = useReducer(reducer, props.profile);

    return (
        <div>
            <ProfileContext.Provider value={{profile, setProfile}}>
            <h2>Setup Profile</h2>
            <div className="row gap1">
                <div>Profile name: </div>
                <input type="text" id="profilename" value={profile.profileName}
                       onChange={(evt) => {setProfile({profileName: evt.target.value})}}></input>
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
            <h3>Renderer configuration</h3>
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
            </ProfileContext.Provider>
        </div>
    );
})

export default ProfileSetup;