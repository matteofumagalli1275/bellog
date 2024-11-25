import {
    HtmlProperty,
    HtmlComponentDefinitionFramework,
    HtmlEmbeddedComponentNames
} from "../../../model/profile/Html";
import {CustomPropertyType} from "../../../model/profile/Common";

export const HtmlComponentSpan:HtmlProperty = {
    id: 0,
    name: HtmlEmbeddedComponentNames.Span,
    type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
    config: {
        code: "<span style='color: ${color}'>${content}</span>",
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
                    value: "Text"
                }
            }
        ]
    },
    deleted: false
}