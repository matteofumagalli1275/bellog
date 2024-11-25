import {
    HtmlProperty,
    HtmlComponentDefinitionFramework,
    HtmlEmbeddedComponentNames
} from "../../../model/profile/Html";
import {CustomPropertyType} from "../../../model/profile/Common";

export const HtmlComponentDiv:HtmlProperty = {
    id: 0,
    name: HtmlEmbeddedComponentNames.Div,
    type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
    config: {
        code: "<div style='color: ${color}'>${content}</div>",
        properties: [
            {
                id: 1,
                name: "color",
                safeHtml: true,
                type: CustomPropertyType.Color,
                default: {
                    bind: false,
                    value: "#000000"
                }
            },
            {
                id: 2,
                name: "content",
                safeHtml: true,
                type: CustomPropertyType.Text,
                default: {
                    bind: false,
                    value: "Default"
                }
            }
        ]
    },
    deleted: false
}