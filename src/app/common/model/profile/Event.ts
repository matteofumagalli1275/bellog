

import {CompareDataSettings, CompareDataType, ElementReference, HtmlBindingType} from "./Common";
import {ElementProperty} from "./Element";

export enum EventType {
    ChannelUpdate = "ChannelUpdate",
}

export type EventSettings = EventChannelUpdate


export interface EventChannelUpdate {
    channelRef: ElementReference,
    layerId: number,
    compareType: CompareDataType,
    compareDataSettings: CompareDataSettings,
    actionRef: ElementReference
}

export interface EventProperty extends ElementProperty {
    type: EventType,
    config: EventSettings,
    deleted: boolean
}