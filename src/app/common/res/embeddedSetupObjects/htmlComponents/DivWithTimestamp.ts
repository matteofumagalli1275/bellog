import {
    HtmlProperty,
    HtmlComponentDefinitionFramework,
    HtmlEmbeddedComponentNames
} from "../../../model/profile/Html";
import {CustomPropertyType} from "../../../model/profile/Common";

export const HtmlComponentDivWithTimestamp:HtmlProperty = {
    id: 0,
    name: HtmlEmbeddedComponentNames.DivWithTimestamp,
    type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
    config: {
        code: "<div>\n" +
            "  <span style='color: ${color}'>${new Date(timestamp).toLocaleString()}.${new Date(timestamp).getMilliseconds()}</span> <span>${content}</span>\n" +
            "</div>",
        properties: [
            {
                id: 1,
                name: "color",
                safeHtml: true,
                type: CustomPropertyType.Color,
                default: {
                    bind: false,
                    value: "#aa0000"
                }
            },
            {
                id: 2,
                name: "timestamp",
                safeHtml: true,
                type: CustomPropertyType.Number,
                default: {
                    bind: false,
                    value: 1737653578000
                }
            },
            {
                id: 3,
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