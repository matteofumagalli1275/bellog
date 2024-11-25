import {LayoutType, ViewFragmentType, ViewProperty, ViewType} from "../common/model/profile/View";
import {generateUniqueName} from "../common/utility/JSUtils";
import {buildDefaultViewFragment} from "./DefaultProperties";
import {CustomProperty, CustomPropertyType} from "../common/model/profile/Common";
import {HtmlProperty} from "../common/model/profile/Html";
import {HtmlComponentDiv} from "../common/res/embeddedSetupObjects/htmlComponents/Div";


export function buildDefaultHtmlParameterDefaultValue(type: CustomPropertyType): any {

    switch (type) {
        case CustomPropertyType.Text:
            return "Default";
        case CustomPropertyType.Number:
            return 1;
        case CustomPropertyType.Color:
            return "#FF0000"
        case CustomPropertyType.Function:
            return null;
    }
}


export function buildDefaultCustomProperty(values: CustomProperty[]): CustomProperty {

    let maxId = Math.max(...values.map((it) => it.id))
    maxId = maxId < 0 ? 0 : maxId

    const newName = generateUniqueName("Prop", values.map((it) => it.name))

    return {
        id: maxId + 1,
        safeHtml: true,
        name: newName,
        type: CustomPropertyType.Text,
        default: {
            bind: false,
            value: "Default"
        }
    }

}

export function buildDefaultCustomHtmlElem(values: HtmlProperty[]): HtmlProperty {

    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    const newName = generateUniqueName("New Html", values.map((it) => it.name))

    return {
        ...HtmlComponentDiv,
        ...{
            id: maxId + 1,
            name: newName
        }
    }
}