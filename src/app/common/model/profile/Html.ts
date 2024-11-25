import {CustomProperty} from "./Common";
import {ElementProperty} from "./Element";

export enum HtmlEmbeddedComponentNames {
    Div = "Div",
    DivWithTimestamp = "DivWithTimestamp",
    Span = "Span",
    Raw = "Raw",
    Button = "Button"
}

export enum HtmlComponentDefinitionFramework {
    SimpleTemplateLiteral = "SimpleTemplateLiteral",
    JavascriptHook = "JavascriptHook",
    // In the future maybe lit-html ?
}

export interface HtmlSimpleTemplateLiteralConfig {
    code: string,
    properties: CustomProperty[]
}

export interface HtmlJavascriptHookConfig {
    code: string,
    properties: CustomProperty[]
}

export interface HtmlProperty extends ElementProperty {
    type: HtmlComponentDefinitionFramework,
    config: HtmlSimpleTemplateLiteralConfig | HtmlJavascriptHookConfig,
    deleted: boolean
}