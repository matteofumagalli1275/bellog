import {
    HtmlProperty,
    HtmlComponentDefinitionFramework,
    HtmlEmbeddedComponentNames
} from "../../../model/profile/Html";
import {CustomPropertyType} from "../../../model/profile/Common";
import * as beautify from "js-beautify"

export const HtmlComponentRaw:HtmlProperty = {
    id: 0,
    name: HtmlEmbeddedComponentNames.Raw,
    type: HtmlComponentDefinitionFramework.JavascriptHook,
    config: {
        code: beautify(`this.innerHTML += content`),
        properties: [
            {
                id: 1,
                name: "content",
                safeHtml: true,
                type: CustomPropertyType.Text,
                default: {
                    bind: false,
                    value: "Text"
                }
            }
        ]
    },
    deleted: false
}