
import * as React from 'react';
import {useEffect, useState} from "react";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import {DriverSerialPortWebSerial} from './drivers/serialport-webserial'
import {DriverStatus} from "./drivers/driver";
import {LineParser} from "./parsers/lineparser";
import {Property} from "csstype";
import JsonDiv from "./JsonDiv"
import stringify from "json-stringify-pretty-compact";

import * as SKMatcher from './renderers/SK9072C'
import {DriverClipboard} from "./drivers/clipboard";

let driver = new DriverClipboard() /*new DriverSerialPortWebSerial(0, 0, {
    baudRate: 115200
})*/

var enableAutoScrollBottom = true
let parser = new LineParser()

const App = () => {

    const [obj, setObj] = useState([]);
    const [objIdx, setObjIdx] = useState(-1);
    const [portButtonStatus, setPortButtonStatus] = useState<string>("Open");
    const divRef = React.useRef(null);
    const [flexDirection, setFlexDirection] = useState<Property.FlexDirection>("column-reverse")

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
        driver.onStatusChange((status) => {
            setPortButtonStatus(
                driver.status == DriverStatus.OPEN ? "Close" : "Open"
            )
        })

        driver.onReceive((_data) => {
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

    return (
        <Container fluid>
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

            <Container>
                <Row className="align-items-center">
                    <Col xs="auto">
                        <Button style={{margin: "8px"}} onClick={() => {
                            driver.status == DriverStatus.OPEN ?
                                driver.close() :
                                driver.open()
                        }}>{portButtonStatus}</Button>
                    </Col>
                    <Col xs="auto">
                        <Button style={{margin: "8px"}} onClick={() => {
                            clearLog()
                        }}>Clear</Button>
                    </Col>
                </Row>
            </Container>
            <Row ref={divRef} /*style={
                {overflow: "auto",
                    display: "flex",
                    flexDirection: flexDirection }}*/>
                {body}
            </Row>
            <div ref={divRef}></div>
        </Container>
    );

};

export default App;