import {CustomPropertyType, IOParameterType} from "../../../model/profile/Common";
import {LayerEmbeddedNames, LayerProperty, LayerType} from "../../../model/profile/Layer";
import * as beautify from "js-beautify"

export const LineSerializer: LayerProperty = {
    id: 0,
    name: LayerEmbeddedNames.LineSerializer,
    type: LayerType.Layer,
    config: {
            code: beautify(function middleware(ctx, accumulator, input, next, throwException, props) {
                        // This is an example line serializer (appends newline separator to output)
                        // ctx: context information of type LayerEventCommonProperties. See doc
                        // accumulator: use it to keep state across invocations
                        // input: object with fields as defined in the layer's input parameters (e.g. {data: Uint8Array})
                        // next(accumulator, output, next.next, throwException): call this to emit output and proceed to the next layer
                        // throwException(message): call this to refuse the sequence
                        // props: properties configured in the layer that can be customized in GUI's setup
                        let _accumulator = (accumulator === null || accumulator === undefined) ? {data: "", nextAcc: undefined} : accumulator;
                        // Convert Uint8 to string if necessary
                        const _data = typeof input.data !== "string" ? String.fromCharCode.apply(null, input.data) : input.data;

                        props.newline = props.newline
                            .replace(/\\r/g, "\r")
                            .replace(/\\n/g, "\n")
                            .replace(/\\t/g, "\t");

                        _accumulator.nextAcc = next(_accumulator.nextAcc, {data: _data + props.newline}, next.next, throwException)

                        return _accumulator;
        }.toString()),
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
                    value: "\\r"
                }
            }
        ],
        testCode: beautify(function test(props) {
            return [
                {test: {data: new TextEncoder().encode("Hello World")}, expected: [{data: "Hello World\r"}]},
            ]
        }.toString()),
    },
    disabled: false,
    deterministic: true
}