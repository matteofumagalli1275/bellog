import {ChannelNode, ChannelProperty} from "../model/profile/Channel";
import {IOParameter} from "../model/profile/Layer";
import {getInterfaceInput, getInterfaceOutput, ORIGIN_PARAMS} from "../model/profile/Interface";
import {getElementFromRef} from "../../setup/components/Utils";
import {ProfilesDeps} from "../../setup/store/profile/Profile";
import {ElementReference, ElementType, IOParameterType} from "../model/profile/Common";

/**
 * Given a channel, find the leaf nodes (nodes with no outgoing edges) and return
 * their output parameters. These are the params available to event handlers.
 * If the leaf is the root (input) node, return the interface output params.
 */
export function getExpectedChannelOutputParams(channel: ChannelProperty,
                                               deps: ProfilesDeps): IOParameter[] {
    if (!channel?.config) return [];
    const {nodes, edges} = channel.config;
    // Find nodes that have no outgoing edges (leaf nodes)
    const sourcesWithOutgoing = new Set(edges.map(e => e.source));
    const leafNodes = nodes.filter(n => !sourcesWithOutgoing.has(n.id));

    if (leafNodes.length === 0) return [];

    // Use the first leaf node to determine output params
    const leaf = leafNodes[0];
    if (!leaf.data.layerRef) {
        // Root/interface node — return interface output
        if (deps.interfaces.length > 0) {
            const ifc = deps.interfaces[0];
            if (ifc) return getInterfaceOutput(ifc.type);
        }
        return [{id: 0, name: "data", type: IOParameterType.Uint8Array}];
    }

    const layer = getElementFromRef(leaf.data.layerRef, deps.layers, deps.libraries);
    if (layer) return layer.config.output;

    return [];
}

/**
 * Given a channel, find the root nodes (nodes with no incoming edges) and return
 * their input parameters. These are the params that must be provided when sending
 * data INTO the channel (e.g. for a SendData action targeting an output channel).
 * If the root is an interface node, return the interface input params.
 */
export function getExpectedChannelInputParams(channel: ChannelProperty,
                                              deps: ProfilesDeps): IOParameter[] {
    if (!channel?.config) return [];
    const {nodes, edges} = channel.config;
    // Find nodes that have no incoming edges (root / entry-point nodes)
    const targetsWithIncoming = new Set(edges.map(e => e.target));
    const rootNodes = nodes.filter(n => !targetsWithIncoming.has(n.id));

    if (rootNodes.length === 0) return [];

    // Use the first root node to determine input params
    const root = rootNodes[0];
    if (!root.data.layerRef) {
        // Interface node — return interface input
        if (deps.interfaces.length > 0) {
            const ifc = deps.interfaces[0];
            if (ifc) return getInterfaceInput(ifc.type);
        }
        return [{id: 0, name: "data", type: IOParameterType.Uint8Array}];
    }

    const layer = getElementFromRef(root.data.layerRef, deps.layers, deps.libraries);
    if (layer) return layer.config.input;

    return [];
}

export function getExpectedNodeInputParams(element: ElementReference,
                                              deps: ProfilesDeps): IOParameter[] {
    if (!element) {
        return [{id: 0, name: "data", type: IOParameterType.Uint8Array}]
    }
    if (element.type === ElementType.Interface) {
        return getInterfaceInput(deps.interfaces.find((it) => it.id === element.refId)?.type)
    }

    const layer = getElementFromRef(element, deps.layers, deps.libraries)
    return layer?.config?.input ?? []
}

export function getExpectedNodeOutputParams(element: ElementReference,
                                               deps: ProfilesDeps): IOParameter[] {
    if(!element) {
        //TODO Temporary workaround
        return [{id:0, name:"data", type: IOParameterType.Uint8Array}, ...ORIGIN_PARAMS]
    }
    if(element.type === ElementType.Interface) {
        return getInterfaceOutput(deps.interfaces.find((it) => it.id === element.refId).type)
    }

    const layer = getElementFromRef(element, deps.layers, deps.libraries)
    const layerParams = layer?.config?.output ?? []
    // Always include _origin params — the runtime auto-propagates them through layers
    return [...layerParams, ...ORIGIN_PARAMS.filter(op => !layerParams.some(lp => lp.name === op.name))]
}

/**
 * Walk the channel graph upward from a given node, collecting output parameters
 * from the node itself and every ancestor. This gives the full set of params
 * available at that point in the pipeline (own + inherited from parents).
 */
export function getNodeOutputParamsWithAncestors(
    nodeId: string,
    nodes: ChannelNode[],
    edges: {source: string; target: string}[],
    deps: ProfilesDeps
): IOParameter[] {
    const collected = new Map<string, IOParameter>(); // keyed by name to deduplicate
    const visited = new Set<string>();

    function walk(id: string) {
        if (visited.has(id)) return;
        visited.add(id);

        const node = nodes.find(n => n.id === id);
        if (!node) return;

        // Collect this node's output params
        const params = node.data.layerRef
            ? getExpectedNodeOutputParams(node.data.layerRef, deps)
            : [{id: 0, name: "data", type: IOParameterType.Uint8Array}];

        for (const p of params) {
            if (!collected.has(p.name)) {
                collected.set(p.name, p);
            }
        }

        // Walk to parent nodes (edges where this node is the target)
        for (const edge of edges) {
            if (edge.target === id) {
                walk(edge.source);
            }
        }
    }

    walk(nodeId);
    return Array.from(collected.values());
}

export function getElementRefString(element: ElementReference) {
    return `${element.type}#${element.libraryRdnId}#${element.refType}#${element.refId}`
}