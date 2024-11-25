import {CompareDataSettings, CompareDataType, ElementReference, ElementType} from "../common/model/profile/Common";
import {generateUniqueName} from "../common/utility/JSUtils";
import {ChannelEdge, ChannelNode, ChannelProperty, ChannelType,} from "../common/model/profile/Channel";
import {getEmbeddedRefFromElement} from "./components/Utils";
import {LineDeserializer} from "../common/res/embeddedSetupObjects/layer/LineDeserializer";
import {IOParameter} from "../common/model/profile/Layer";
import * as beautify from "js-beautify";

export function buildDefaultChannel(values: ChannelProperty[], direction: ChannelType = ChannelType.Input): [number, ChannelProperty] {

    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    const prefix = direction === ChannelType.Input ? 'Input Channel' : 'Output Channel'
    const newName = generateUniqueName(prefix, values.map((it) => it.name))

    const {nodes, edges} = buildDefaultChannelGraph([], direction)
    return [
        maxId + 1, {
            id: maxId + 1,
            name: newName,
            type: direction,
            config: {
                interfaceRefs: [],
                nodes,
                edges,
            },
            deleted: false
        }
    ]
}


export function buildDefaultChannelGraph(rootRefs: ElementReference[], direction: ChannelType = ChannelType.Input): { nodes: ChannelNode[]; edges: ChannelEdge[] } {
    let label = 'Interface'
    if (rootRefs.length === 1) {
        label = rootRefs[0].refName
    }
    // ReactFlow node type: 'input' = source-only handle (bottom), 'output' = target-only handle (top)
    const rootType = direction === ChannelType.Input ? 'input' : 'output';
    return {
        nodes: [
            {
                id: '0',
                type: rootType,
                data: {
                    label: label,
                    bindings: [],
                    layerRef: null,
                    hidden: false,
                },
                position: {x: 250, y: 250},
            }
        ],
        edges: [],
    }
}

/**
 * Build appropriate default CompareDataSettings for an edge route condition
 * when the user switches between condition modes.
 */
export function buildDefaultRouteConditionSettings(type: CompareDataType, availableParams: IOParameter[]): CompareDataSettings {
    switch (type) {
        case CompareDataType.Code:
            return {
                code: beautify(`function(output, ctx) {
                    //${availableParams.map((it) => "output." + it.name).join(', ')}
                    // ctx.interfaceType, ctx.interfaceId, ctx.direction
                    /* Return true to follow this edge, false to skip */
                    return true
                }`)
            }
        case CompareDataType.Query:
            return {query: ""}
    }
}

