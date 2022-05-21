import React from "react";
import FormatHighlight from 'json-format-highlight';
import Accordion from 'react-bootstrap/Accordion';
import Parser from 'html-react-parser';

const JsonDiv = (props) => {

    return (
        <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey="0">
            <Accordion.Header  variant="success">{props.title}</Accordion.Header>
            <Accordion.Body style={{whiteSpace: "pre-wrap"}}>
            {Parser(FormatHighlight(props.jsonString))}
            </Accordion.Body>
        </Accordion.Item>
        </Accordion>
    );
  
  };
  
  export default JsonDiv;