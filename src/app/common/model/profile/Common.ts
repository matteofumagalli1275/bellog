import {ActionParamMapping} from "./Actions";

export interface CodeProperty {
    id: number,
    name: string,
    code: string
}

export const ExportableSymbolPrefix = "bellog.symbols."

export type ScriptExportedSymbols = {
    id: number,
    name: string,
    defaultValue: string,
    public: boolean,
    persistent: boolean,
    description: string,
}

export enum HtmlBindingType {
    Gui = "Gui",
    Code = "Code"
}

export enum IOParameterType {
    Uint8Array = "Uint8Array",
    String = "String",
    Number = "Number",
    Array = "Array",
    Object = "Object"
}

export enum CustomPropertyType {
    Text = "Text",
    Number = "Number",
    Color = "Color",
    Function = "Function"
}

export interface CustomProperty {
    id: number,
    name: string,
    type: CustomPropertyType,
    safeHtml: boolean,
    default: BindableVariable<string | number>
}

export enum ElementType {
    Interface = 'Interface',
    Html = 'Html',
    Layer = 'Middleware',
    Channel = 'Channel',
    View = 'View',
    Action = 'Action',
    ConditionalRendering = 'ConditionalRendering'
}

export enum ElementReferenceType {
    LocalReference = 'LocalReference',
    LibraryReference = 'LibraryReference',
    EmbeddedReference = 'EmbeddedReference',
}

export interface ElementReference {
    type: ElementType,
    refType: ElementReferenceType,
    libraryRdnId: string,
    refName: string,
    refId: number
}

export type BindableSymbol = {
    name: string,
    libraryRdnId: string,
}

export type BindableViewHtmlProp = {
    viewRef: ElementReference,
    fragmentId: number,
    fragmentName: string,
    propName: string,
}

export type BindableVariable<T> = {
    bind: boolean,
    htmlProp?: BindableViewHtmlProp,
    symbol?: BindableSymbol,
    // Parameter provided by the event that called the action
    paramFromSource?: string,
    // If bind false
    value?: T
}

export enum CompareDataType {
    Code = "Code",
    Query = "Query",
    Regex = "Regex"
}

export type CompareDataSettings = CompareDataCode | CompareDataQuery | CompareDataRegex

export type CompareDataCode = {
    code: string
}

export type CompareDataQuery = {
    query: string
}

export type CompareDataRegex = {
    regex: string
}

export enum RenderModeType {
    Code = "Code",
    Gui = "Gui",
}

export type RenderModeSettings = RenderModeCode | RenderModeGui

export type RenderModeCode = {
    code: string
}

export type RenderModeGui = {
    mappings: ActionParamMapping[]
}