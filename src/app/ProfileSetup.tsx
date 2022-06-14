import * as React from "react";
import {Property} from "csstype";
import {DriverList} from "../drivers/driverlist";
import {RendererList} from "../renderers/rendererslist";
import {forwardRef, useImperativeHandle, useRef, useState} from "react";
import {GenericRendererPropertiesSetup, GenericRendererSetup, MatchEntry} from "../renderers/generic/Generic";
import {ProfileSetupComponentCapability} from "./ProfileSetupComponentCapability";

interface ProfileSetupProperties {
    profileName?: string
    driverName?: string
    renderName?: string
    items?: object[]
}

const ProfileSetup = forwardRef((props : ProfileSetupProperties, ref) => {

    const [profileName, setProfileName] = useState(props.profileName ?? "New Profile")
    const [driverName, setDriverName] = useState(props.driverName ?? DriverList[0].name)
    const [renderName, setRenderName] = useState(props.renderName ?? RendererList[0].name)
    const items = props.items ?? []
    const childRef = useRef<ProfileSetupComponentCapability>();

    useImperativeHandle(ref, () => ({

        getConfig() {
            let config = {
                profileName: profileName,
                driverName: driverName,
                renderName: renderName
            }
            //config.items = childRef.current.getConfig()
            return config
        }

    }));

    return (
        <div>
            <h2>Setup Profile</h2>
            <div className="row gap1">
                <div>Profile name: </div>
                <input type="text" id="profilename" value={profileName} onChange={(evt) => {setProfileName(evt.target.value)}}></input>
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
                            if(render.name === renderName)
                            {
                                return (
                                    <GenericRendererSetup ref={childRef} items={items as MatchEntry[]}/>
                                )
                            }
                        }
                    )
                }
            </div>
        </div>
    );
})

export default ProfileSetup;