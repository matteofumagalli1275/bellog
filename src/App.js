import React from "react";
import { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Form from 'react-bootstrap/Form';
import SKMatcher from './profiles/SK9072C.js'

const { SerialPort, ReadlineParser } = eval(`require('serialport')`)

var enableAutoScrollBottom = true

var port = null

const App = () => {

  //const socket = io.connect('ws://127.0.0.1:5000');
  const [obj, setObj] = useState([]);
  const [count, setCount] = useState(0);
  const [objIdx, setObjIdx] = useState(-1);
  const [portButtonStatus, setPortButtonStatus] = useState("Open");
  const [portName, setPortName] = useState("")
  const [baudRate, setBaudRate] = useState(921600)

  const matcher = SKMatcher.build()

  //socket.on('stream', function (data) {

  //});

  function styleObj(setter, line) {
    var matches = matcher.filter(
      val => !!line.match(val.regex)
    )

    if (matches.length > 0) {
      matches.forEach(element => {
        setter(oldArray => [...oldArray, element.build(line)]);
      });
    }
    else {
      setter(oldArray => [...oldArray, (<div key={oldArray.length}>{line}</div>)]);
    }
  }

  function newLine(line) {
    var matches = matcher.filter(
      val => !!line.match(val.regex) && val.groupup
    )

    if (matches.length > 0) {
      matches.forEach(element => {
        const [st, setSt] = element.groupstate
        styleObj(setSt, line)
      });
      styleObj(setObj, line)
    }
    else {
      styleObj(setObj, line)
    }
  }

  var buff = ""
  function newData(data, len) {
    for (var i = 0; i < len; i++) {
      if (data[i] == '\r' || data[i] == '\n') {
        if (buff.length > 0) {
          newLine(buff)
          buff = ""
        }
      }
      else {
        buff += data[i]
      }
    }
  }

  function togglePort() {

    function dataclbk(data) {
      var str = String.fromCharCode.apply(null, data);
      newData(str, str.length)
    }

    function openclbk(data) {
      setPortButtonStatus("Close")
    }

    function closeclbk(data) {
      setPortButtonStatus("Open")
    }


    if (port != null)
    {
      port.close()

      port.removeListener('data', dataclbk)
      port.removeListener('open', openclbk)
      port.removeListener('close', closeclbk)
    }

    port = new SerialPort(
      {
        path: portName,
        baudRate: baudRate,
        autoOpen: false
      }
    )

    if (port.isOpen)
      setPortButtonStatus("Close")
    else
      setPortButtonStatus("Open")

    port.on('data', dataclbk)
    port.on('open', openclbk)
    port.on('close', closeclbk)

    if (portButtonStatus == "Open")
      port.open()
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

  useEffect(() => {

  }, [])


  useEffect(() => {

    if (enableAutoScrollBottom)
      window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: "instant" })

  }, [obj]);

  document.addEventListener('scroll', function (e) {
    if ((document.documentElement.scrollTop + 50) >= (document.documentElement.scrollHeight - document.documentElement.clientHeight)) {
      enableAutoScrollBottom = true
    }
    else {
      enableAutoScrollBottom = false
    }
  });

  let body;

  if (objIdx >= 0 && objIdx < matcher.length) {
    body = matcher[objIdx].groupstate[0]
  }
  else {
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
                return <Nav.Link onClick={() => setObjIdx(matcher.findIndex(elem => elem.name === object.name))}>{object.name}</Nav.Link>;
              })}
          </Nav>
        </Container>
      </Navbar>

      <Container>
        <Row className="align-items-center">
          <Col xs="auto">
            <Button style={{ margin: "8px" }} onClick={() => { togglePort() }}>{portButtonStatus}</Button>
          </Col>
          <Col xs="auto">
            <Button style={{ margin: "8px" }} onClick={() => { clearLog() }}>Clear</Button>
          </Col>
          <Col>
            <Form.Control placeholder="COM" value={portName} onChange={event => setPortName(event.target.value)}/>
          </Col>
          <Col>
            <Form.Control placeholder="BaudRate" value={baudRate} onChange={event => setBaudRate(event.target.value)}/>
          </Col>
        </Row>
      </Container>

      <Row>
        {body}
      </Row>
    </Container>
  );

};

console.log("AOOO")

export default App;