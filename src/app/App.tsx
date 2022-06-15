import * as React from 'react';
import {useEffect, useMemo, useRef, useState} from 'react';

import {DriverStatus} from "../drivers/driver";
import {IconContext} from "react-icons";
import {FaBars} from 'react-icons/fa';
import {Route, useLocation, Routes} from 'react-router-dom'

import * as SKMatcher from '../renderers/SK9072C'
import {DriverClipboard} from "../drivers/clipboard";

import './App.scss'
import {ImBin2, ImFloppyDisk, ImPlay3, ImStop2} from "react-icons/im";
import {RiSettings5Fill} from "react-icons/ri";
import {DriverSerialPortWebSerial} from "../drivers/serialport-webserial";
import {GenericRenderer, GenericRendererProperties} from "../renderers/generic/Generic";
import {JsonDiv} from "../renderers/generic/matchrenderer/JsonDiv";
import * as serialize from "serialize-javascript"
import {ColoredText} from "../renderers/generic/matchrenderer/ColoredText";
import ProfileSetup from "./ProfileSetup";
import {DriverList} from "../drivers/driverlist";
import {RendererList} from "../renderers/rendererslist";

class GenericRendererParams implements GenericRendererProperties {
    items = [
        {
            regex: /^(FILE CCAPI SEND: )(.*)$|^(FILE CCAPI RECV: )(.*)$/gm,
            transformExp: function transform(matches) {
                function hexStringToByteArray(hexString) {
                    if (hexString.length % 2 !== 0) {
                        throw "Must have an even number of hex digits to convert to bytes";
                    }
                    const numBytes = hexString.length / 2;
                    const byteArray = new Uint8Array(numBytes);
                    for (let i = 0; i < numBytes; i++) {
                        byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
                    }
                    return byteArray;
                }

                let cborarray = hexStringToByteArray(matches[2])
                return eval("CBOR.decode(new Uint8Array(cborarray).buffer)")
            },
            matchRenderer: JsonDiv.prototype.constructor.name,
            matchRendererProperties: {
                title: function setTitle(jsonObj, matches, state: any) {
                    let title = matches[1]
                    let cache = state.cache ?? []

                    let associatedMSG = cache.find(
                        elem => elem.ruid == jsonObj.ruid
                    )
                    let svcName
                    if(associatedMSG === undefined || associatedMSG === null)
                    {
                        if(jsonObj.svc !== undefined && jsonObj.svc !== null)
                        {
                            svcName = jsonObj.svc

                            cache.push(
                                {
                                    svc: jsonObj.svc,
                                    ruid: jsonObj.ruid
                                }
                            )
                        }
                        else
                        {
                            svcName = "RUID not found"
                        }
                    }
                    else
                    {
                        cache = cache.filter( elem => elem.ruid != jsonObj.ruid)
                        svcName = associatedMSG.svc
                    }

                    state.cache = cache

                    return title + svcName

                }
            },
        },
        {
            regex: /^(?!.*CCAPI_ERR_CODE_NO_ERROR).*ERROR.*$/gmi,
            transformExp: function transform(matches) {
                return matches[0]
            },
            matchRenderer: ColoredText.prototype.constructor.name,
            matchRendererProperties: {
                color: "green"
            }
        }
    ]
}




const App = () => {
    const location = useLocation();

    const [driverStatus, setDriverStatus] = useState<DriverStatus>(DriverStatus.CLOSE);
    const rendererRef = useRef<any>();

    let driver = useRef(null);

    function clearLog() {
        rendererRef.current.clear()
    }

    function saveButton() {
        let cfg = rendererRef.current.getConfig()
        console.log(cfg)
    }

    useEffect( () => {

        if(location.pathname.endsWith("/SK9072C") )
        {
            driver.current = new DriverSerialPortWebSerial(0, 0, {
                baudRate: 921600
            })
        }
        else if(location.pathname.endsWith("/PCAL"))
        {
            driver.current = new DriverSerialPortWebSerial(0, 0, {
                baudRate: 115200
            })
        }
        else
        {
            driver.current = new DriverClipboard()
        }

        driver.current.onStatusChange((status) => {
            setDriverStatus(status)
        })

        driver.current.onReceive((_data) => {
            rendererRef.current.render(_data)
        })
    }, [])

/*
            <Navbar bg="primary" variant="dark">
                <Container fluid>
                    <Navbar.Brand onClick={() => setObjIdx(-1)}>App</Navbar.Brand>
                    <Nav className="me-auto">
                        {matcher
                            .filter(object => object.groupup)
                            .map((object) => {
                                return <Nav.Link
                                    onClick={() => setObjIdx(matcher.findIndex(elem => elem.name === object.name))}>{object.name}</Nav.Link>;
                            })}
                    </Nav>
                </Container>
            </Navbar>
 */
    return (
        <div>
            <div className="bellog_navbar">
                <div className="left">
                    <div className="icon_container">
                        <IconContext.Provider value={{className: "bellog_navbar_icon"}}>
                            <FaBars/>
                        </IconContext.Provider>
                    </div>
                    <div>SK9072C</div>
                </div>
                <div className="center">
                    <div className="icon_container" onClick={() => {
                        driverStatus == DriverStatus.CLOSE ?
                            driver.current.open() :
                            driver.current.close()
                    }}>
                    <IconContext.Provider value={{className: "bellog_navbar_icon"}}>
                        {
                            driverStatus == DriverStatus.CLOSE ? (
                                <ImPlay3/>
                            ) : (
                                <ImStop2/>
                            )
                        }

                    </IconContext.Provider>
                    </div>
                    <div className="icon_container" onClick={() => {clearLog()}}>
                    <IconContext.Provider value={{className: "bellog_navbar_icon"}}>
                        <ImBin2/>
                    </IconContext.Provider>
                    </div>
                    <div className="icon_container"  onClick={() => saveButton()}>
                    <IconContext.Provider value={{className: "bellog_navbar_icon"}}>
                        <ImFloppyDisk/>
                    </IconContext.Provider>
                    </div>
                </div>
                <div className="right">
                    <div className="icon_container">
                        <IconContext.Provider value={{className: "bellog_navbar_icon"}}>
                            <RiSettings5Fill/>
                        </IconContext.Provider>
                    </div>
                </div>
            </div>

            <div className="bellog_below_navbar">
                <Routes >
                    <Route path="/" element={<div>HELLO</div>}/>
                    <Route path="/profile" element={<ProfileSetup ref={rendererRef} profile={{
                        profileName: "New Profile",
                        renderName: RendererList[0].name,
                        driverName: DriverList[0].name,
                        items: []
                    }}/>}/>
                    <Route path="/device" element={<GenericRenderer ref={rendererRef} items={[]/*serialize(new GenericRendererParams())*/} />}/>
                    <Route path="*" element={<div>404</div>}/>
                </Routes >

            </div>
        </div>


    );
/*
childRef.current.doSomething(event);
 <Child ref={childRef} />
*/ 
};

export default App;