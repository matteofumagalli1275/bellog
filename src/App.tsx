
import * as React from 'react';
import {useEffect, useRef, useState} from "react";

import {DriverStatus} from "./drivers/driver";
import {LineParser} from "./parsers/lineparser";
import {Property} from "csstype";
import {IconContext} from "react-icons";
import { FaBars } from 'react-icons/fa';
import { useLocation } from 'react-router-dom'

import * as SKMatcher from './renderers/SK9072C'
import {DriverClipboard} from "./drivers/clipboard";

import './App.scss'
import {ImFloppyDisk, ImStop2} from "react-icons/im";
import {ImPlay3} from "react-icons/im";
import {ImBin2} from "react-icons/im";
import {RiSettings5Fill} from "react-icons/ri";
import {DriverSerialPortWebSerial} from "./drivers/serialport-webserial";


let enableAutoScrollBottom = true
const parser = new LineParser()

const App = () => {
    const location = useLocation();
    const [obj, setObj] = useState([]);
    const [objIdx, setObjIdx] = useState(-1);
    const [driverStatus, setDriverStatus] = useState<DriverStatus>(DriverStatus.CLOSE);
    const divRef = React.useRef(null);
    const rendererRef = useRef();

    let driver = useRef(null);

    const matcher = SKMatcher.default.build()

    function styleObj(setter : any, line: any) {
        var matches = matcher.filter(
            val => !!line.match(val.regex)
        )

        if (matches.length > 0) {
            matches.forEach(element => {
                setter((oldArray: any) => [...oldArray, element.build(line)]);
            });
        } else {
            setter((oldArray: any) => [...oldArray, (<div key={oldArray.length}>{line}</div>)]);
        }
    }

    function newLine(line: string) {
      try
      {
        var matches = matcher.filter(
            val => !!line.match(val.regex) && val.groupup
        )

        if (matches.length > 0) {
          matches.forEach(element => {
            const [st, setSt] = element.groupstate
            styleObj(setSt, line)
          });
          styleObj(setObj, line)
        } else {
          styleObj(setObj, line)
        }
      }
      catch (e)
      {
        console.error("Error line " + line)
        console.error(e)
      }
    }

    function clearLog() {
        matcher.forEach(element => {
            if (element.groupstate !== undefined && element.groupstate !== null) {
                const [st, setSt] = element.groupstate
                setSt([])
            }
        });
        setObj([])
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
            parser.put(_data)
        })

        parser.onParsed((data) => {
            newLine(data as string)
        })
    }, [])


    useEffect(() => {
        if(enableAutoScrollBottom) {
            divRef.current.scrollIntoView()
        }
    }, [obj]);

    var lastScrollTop = 0;

    document.addEventListener('scroll', function (e) {
        var st = document.documentElement.scrollTop
        if (st > lastScrollTop){
            // downscroll code
            if ((document.documentElement.scrollTop + 50) >= (document.documentElement.scrollHeight - document.documentElement.clientHeight)) {
                enableAutoScrollBottom = true
            }
        } else {
            // upscroll code
            enableAutoScrollBottom = false
        }
        lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
    });


    let body;

    if (objIdx >= 0 && objIdx < matcher.length) {
        body = matcher[objIdx].groupstate[0]
    } else {
        body = obj
    }
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
                    <div className="icon_container">
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

            <div className="bellog_below_navbar log_container">
                <div>
                    {body}
                </div>
                <div ref={divRef}></div>
            </div>
        </div>


    );
/*
childRef.current.doSomething(event);
 <Child ref={childRef} />
*/ 
};

export default App;