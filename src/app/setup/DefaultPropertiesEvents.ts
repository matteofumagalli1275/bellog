import {EventProperty, EventType} from "../common/model/profile/Event";
import {ChannelType} from "../common/model/profile/Channel";
import {IOParameter} from "../common/model/profile/Layer";
import {generateUniqueName} from "../common/utility/JSUtils";
import {CompareDataSettings, CompareDataType, ElementReferenceType, ElementType} from "../common/model/profile/Common";
import * as beautify from "js-beautify"
import {ActionProperty} from "../common/model/profile/Actions";
import {getLocalRefFromElement} from "./components/Utils";
import {ProfilesDeps} from "./store/profile/Profile";


export function buildDefaultEventChannelUpdate(values: EventProperty[], action: ActionProperty, deps: ProfilesDeps): [number, EventProperty] {
    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    const newName = generateUniqueName("Event", values.map((it) => it.name))

    const inputChannels = deps.channels.filter(ch => ch.type === ChannelType.Input)
    if(inputChannels.length <= 0) {
        throw new Error("Cannot create event without an existing Input channel")
    }

    return [
        maxId + 1, {
            id: maxId + 1,
            name: newName,
            type: EventType.ChannelUpdate,
            config: {
                channelRef: getLocalRefFromElement(inputChannels[0], ElementType.Channel),
                compareType: CompareDataType.Query,
                compareDataSettings: buildDefaultEventChannelUpdateCompareSettings(CompareDataType.Query, []),
                layerId: -1,
                applyToEquivalentLayersInOtherChannels: false,
                actionRef: {
                    refId: action.id,
                    refName: "",
                    refType: ElementReferenceType.LocalReference,
                    type: ElementType.Action,
                    libraryRdnId: "",
                }
            },
            deleted: false
        }]
}

export function buildDefaultEventChannelUpdateCompareSettings(type: CompareDataType, availableParams: IOParameter[]): CompareDataSettings {
    switch (type) {
        case CompareDataType.Code:
            return {code: beautify(`function(params) {
                //${availableParams.map((it) => "params." + it.name).join(', ')}
                /* Return true to accept the data, false otherwise */
                return true
            }`),}
        case CompareDataType.Query:
            return {query: ""}
        case CompareDataType.Regex:
            return {regex: ""}
    }
}