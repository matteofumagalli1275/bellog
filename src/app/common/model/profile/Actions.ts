import {BindableVariable, ElementReference, RenderModeType} from "./Common";
import {ElementProperty} from "./Element";

export enum ActionType {
    SendData = "SendData",
    ReplaceHtmlProperties = "ReplaceHtmlProperties",
    Custom = "Custom",
}


export enum BindType {
    ChannelParam = "ChannelParam"
}

export type ActionSettings = ActionCustomSettings | ActionRenderSettings | ActionSendDataSettings

export type ActionParamMapping = {
    destParamName: string,
    sourceParam: BindableVariable<any>,
    functionAction?: FunctionActionConfig,
}

export enum FunctionActionMode {
    SendData = "SendData",
    Code = "Code",
}

export type FunctionActionConfig = {
    mode: FunctionActionMode,
    code: string,
    sendDataConfig: {
        channelRef: ElementReference,
        nodeId: number,
        mappings: { destParamName: string, sourceParam: BindableVariable<any> }[],
    },
}

export type ActionRenderSettingsBinding = {
    htmlRef: ElementReference,
    mode: RenderModeType,
    code: string,
    mappings: ActionParamMapping[]
}

export interface ActionCustomSettings {
    code: string
}

export interface ActionRenderSettings {
    viewRef: ElementReference,
    elementToRender: ActionRenderSettingsBinding
}

export interface ActionSendDataSettings {
    channelRef: ElementReference,
    nodeId: number,
    mode: RenderModeType,
    code: string,
    mappings: ActionParamMapping[]
}

export interface ActionProperty extends ElementProperty {
    type: ActionType,
    config: ActionSettings
}