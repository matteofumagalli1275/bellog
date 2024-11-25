import {
    HtmlProperty,
    HtmlComponentDefinitionFramework,
    HtmlEmbeddedComponentNames
} from "../../../model/profile/Html";
import {CustomPropertyType} from "../../../model/profile/Common";

export const HtmlComponentButton:HtmlProperty = {
    id: 0,
    name: HtmlEmbeddedComponentNames.Button,
    type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
    config: {
        code: "<button data-iwclick='buttonClick' class='button is-primary' onClick=${buttonClick}>${text}</button>",
        properties: [
            {
                id: 1,
                name: "text",
                safeHtml: true,
                type: CustomPropertyType.Text,
                default: {
                    bind: false,
                    value: "Button"
                }
            },
            {
                id: 2,
                name: "buttonClick",
                safeHtml: true,
                type: CustomPropertyType.Function,
                default: {
                    bind: false,
                    value: null
                }
            }
        ]
    },
    deleted: false
}