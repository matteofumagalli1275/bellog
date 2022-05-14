import React from "react";
import { useState, useEffect } from 'react';
import * as cbor from './cbor.js';
import JsonDiv from "./JsonDiv.js";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';

const { SerialPort, ReadlineParser } = eval(`require('serialport')`)

var enableAutoScrollBottom = true

const port = new SerialPort(
  {
    path: 'COM3',
    baudRate: 921600,
    autoOpen: false
  }
)

const App = () => {

  //const socket = io.connect('ws://127.0.0.1:5000');
  const [obj, setObj] = useState([]);
  const [count, setCount] = useState(0);
  const [objIdx, setObjIdx] = useState(-1);
  const [portButtonStatus, setPortButtonStatus] = useState("Open");

  //socket.on('stream', function (data) {

  //});

  function hexStringToByteArray(hexString) {
    if (hexString.length % 2 !== 0) {
      throw "Must have an even number of hex digits to convert to bytes";
    }
    var numBytes = hexString.length / 2;
    var byteArray = new Uint8Array(numBytes);
    for (var i = 0; i < numBytes; i++) {
      byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return byteArray;
  }

  const matcher = [
    {
      regex: /RECEIVED:/gm,
      groupup: false,
      build: (data) => {
        try {
          var cborhexstr = data
            .replace("RECEIVED: ", "")
            .match(/[a-z0-9]+/img)[0]
          var cborarray = hexStringToByteArray(cborhexstr)
          var decode = cbor.decode(cborarray.buffer)
          return (
            <JsonDiv
              title={"RX MQTT"}
              jsonString={JSON.stringify(decode, null, 4)} />
          )
        }
        catch (e) {
          return (
            <div style={{ color: "red" }}>{data}</div>
          )
        }
      }
    }
    ,
    {
      regex: /PUBLISH:/gm,
      groupup: false,
      build: (data) => {
        try {
          var cborhexstr = data
            .replace("PUBLISH: ", "")
            .match(/[a-z0-9]+/img)[0]
          var cborarray = hexStringToByteArray(cborhexstr)
          var decode = cbor.decode(cborarray.buffer)
          return (
            <div>
              <JsonDiv
                title={"TX MQTT"}
                jsonString={JSON.stringify(decode, null, 4)} />
            </div>
          )
        }
        catch (e) {
          return (
            <div style={{ color: "red" }}>
              {data}
            </div>
          )
        }
      }
    },
    {
      regex: /^(?!.*CCAPI_ERR_CODE_NO_ERROR).*ERROR.*$/gmi,
      groupup: false,
      build: (data) => {
        return (
          <div style={{ color: "red" }}>
            {data}
          </div>
        )
      }
    },
    {
      name: "ccapi",
      regex: /ccapi\.c/gmi,
      groupup: true,
      groupstate: useState([]),
      build: (data) => {
        return (
          <div>
            {data}
          </div>
        )
      }
    },
    {
      name: "sys",
      regex: /sys\_task\.c/gmi,
      groupup: true,
      groupstate: useState([]),
      build: (data) => {
        return (
          <div style={{ color: "chocolate" }}>
            {data}
          </div>
        )
      }
    },
    {
      name: "port_firpol",
      regex: /ccapi_port_firpol\.c/gmi,
      groupup: true,
      groupstate: useState([]),
      build: (data) => {
        return (
          <div>
            {data}
          </div>
        )
      }
    },
    {
      name: "port_port_log",
      regex: /ccapi_port_log\.c/gmi,
      groupup: true,
      groupstate: useState([]),
      build: (data) => {
        return (
          <div>
            {data}
          </div>
        )
      }
    },
    {
      name: "teltonika",
      regex: /teltonika\.c/gmi,
      groupup: true,
      groupstate: useState([]),
      build: (data) => {
        return (
          <div>
            {data}
          </div>
        )
      }
    }
  ]

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
    if(portButtonStatus == "Open")
      port.open()
    else
      port.close()
  }

  function clearLog() {
    matcher.forEach(element => {
      if(element.groupstate !== undefined && element.groupstate !== null)
      {
        const [st, setSt] = element.groupstate
        setSt([])
      }
    });
    setObj([])
  }

  useEffect(() => {

    port.on('data', function (data) {
      var str = String.fromCharCode.apply(null, data);
      newData(str, str.length)
    })

    port.on('open', () => {
      setPortButtonStatus("Close")
    })

    port.on('close', () => {
      setPortButtonStatus("Open")
    })

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
        <Button style={{ margin: "8px" }} onClick={() => {togglePort()}}>{portButtonStatus}</Button>
        <Button style={{ margin: "8px" }} onClick={() => { clearLog() }}>Clear</Button>
      </Container>

      <Row>
        {body}
      </Row>
    </Container>
  );

};

console.log("AOOO")

export default App;