import {LayerEmbeddedNames, LayerProperty, LayerType} from "../../../model/profile/Layer";
import {CustomPropertyType, IOParameterType} from "../../../model/profile/Common";
import * as beautify from "js-beautify"

export const LineDeserializer: LayerProperty = {
    id: 0,
    name: LayerEmbeddedNames.LineDeserializer,
    type: LayerType.Layer,
    config: {
        code: beautify(`function middleware(ctx, accumulator, input, next, throwException, props) {
            // This is an example line deserializer (splits data into lines when newline characters are found)
            // ctx: context information of type LayerEventCommonProperties. See doc
            // accumulator: use it to keep state across invocations
            // input: object with fields as defined in the layer's input parameters (e.g. {data: Uint8Array})
            // next(accumulator, output, next.next, throwException): call this to emit output and proceed to the next layer
            // throwException(message): call this to refuse the sequence. Content may be displayed anyway according to view configuration
            // props: properties configured in the layer that can be customized in GUI's setup
            // Note that 'input' and 'output' follow the format provided in the layer's IO parameters
            let _accumulator = (accumulator === null || accumulator === undefined) ? {data: "", nextAcc: undefined} : accumulator;

            // Convert Uint8 to string if necessary
            let _data = typeof input.data !== "string" ? String.fromCharCode.apply(null, input.data) : input.data;

            props.newline = props.newline
                .replace(/\\\\r/g, "\\r") // Convert \\r to actual \\r
                .replace(/\\\\n/g, "\\n") // Convert \\n to actual \\n
                .replace(/\\\\t/g, "\\t"); // Convert \\t to actual \\t
            props.discard = props.discard
                .replace(/\\\\r/g, "\\r") // Convert \\r to actual \\r
                .replace(/\\\\n/g, "\\n") // Convert \\n to actual \\n
                .replace(/\\\\t/g, "\\t"); // Convert \\t to actual \\t

            for (let i = 0; i < _data.length; i++) {
                if (props.newline.indexOf(_data[i]) >= 0) {
                    if (_accumulator.data.length > 0) {
                        _accumulator.nextAcc = next(_accumulator.nextAcc, {data: _accumulator.data}, next.next, throwException)
                        _accumulator.data = ""
                    }
                } else {
                    if(props.discard.indexOf(_data[i]) < 0) {
                        _accumulator.data += _data[i]
                    }
                }

                if(_accumulator.data.length > props.maxLineSize) {
                    throwException({data: "Line exceeded " + props.maxLineSize})
                    _accumulator.data = ""
                }
            }

            return _accumulator;
        }`),
        input: [
            {
                id: 0,
                name: "data",
                type: IOParameterType.Uint8Array
            }
        ],
        output: [
            {
                id: 0,
                name: "data",
                type: IOParameterType.String
            }
        ],
        properties: [
            {
                id: 1,
                name: "newline",
                safeHtml: true,
                type: CustomPropertyType.Text,
                default: {
                    bind: false,
                    value: "\\r\\n"
                }
            },
            {
                id: 2,
                name: "discard",
                safeHtml: true,
                type: CustomPropertyType.Text,
                default: {
                    bind: false,
                    value: "\\t"
                }
            },
            {
                id: 3,
                name: "maxLineSize",
                safeHtml: true,
                type: CustomPropertyType.Number,
                default: {
                    bind: false,
                    value: 8192
                }
            }
        ],
        testCode: beautify(`function test(props) {
            return [
                {test: {data: new TextEncoder().encode("Hello World\\r\\n")}, expected: [{data: "Hello World"}]},
                {test: {data: new TextEncoder().encode("Hello World\\r\\nABC\\r\\n")}, expected: [{data: "Hello World"}, {data: "ABC"}]},
                {test: {data: new Uint8Array(props.maxLineSize + 1).fill('A'.charCodeAt(0))}, exception: [{data: "Line exceeded " + props.maxLineSize}]},
            ]
        }`)
    },
    disabled: false,
    deterministic: true
}