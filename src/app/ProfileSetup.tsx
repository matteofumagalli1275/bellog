import * as React from "react";
import {Property} from "csstype";
import {DriverList} from "../drivers/driverlist";
import {RendererList} from "../renderers/rendererslist";
import {useState} from "react";
import {GenericRendererSetup} from "../renderers/generic/Generic";

interface ProfileSetupProperties {

}

const ProfileSetup = (props : ProfileSetupProperties) => {

    const [profileName, setPorileName] = useState("New Profile")
    const [driverName, setDriverName] = useState(DriverList[0].name)
    const [renderName, setRenderName] = useState<string>(RendererList[0].name)

    return (
        <div>
            <h2>Setup Profile</h2>
            <div className="row gap1">
                <div>Profile name: </div>
                <input type="text" id="myText" value="Some text..."></input>
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
                                    <GenericRendererSetup renderConfig=""/>
                                )
                            }
                        }
                    )
                }
            </div>
        </div>
    );
};

export default ProfileSetup;