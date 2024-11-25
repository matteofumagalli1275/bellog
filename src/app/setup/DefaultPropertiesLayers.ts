import {generateUniqueName} from "../common/utility/JSUtils";
import {IOParameter, LayerProperty} from "../common/model/profile/Layer";
import {LineDeserializer} from "../common/res/embeddedSetupObjects/layer/LineDeserializer";
import {IOParameterType} from "../common/model/profile/Common";

export function buildDefaultLayer(values: LayerProperty[]): LayerProperty {

    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    const newName = generateUniqueName("New Layer", values.map((it) => it.name))

    return {
        ...LineDeserializer,
        ...{
            id: maxId + 1,
            name: newName
        }
    }
}

export function buildDefaultCustomIOParam(values: IOParameter[]): IOParameter {

    let maxId = Math.max(...values.map((it) => it.id))
    maxId = maxId < 0 ? 0 : maxId

    const newName = generateUniqueName("Param", values.map((it) => it.name))

    return {
        id: maxId + 1,
        name: newName,
        type: IOParameterType.String,
    }

}