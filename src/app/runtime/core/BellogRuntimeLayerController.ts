import {InterfacesProperty} from "../../common/model/profile/Interface";
import {
    LayerEventCommonProperties,
    LayerProperty,
    LayerSourceType
} from "../../common/model/profile/Layer";
import {ChannelEdge, ChannelNode, ChannelProperty, ChannelType} from "../../common/model/profile/Channel";
import {getElementFromRef} from "../../setup/components/Utils";
import {resolveCustomProperty} from "./BellogRuntimeUtils";
import {bellogRuntimeDataBus} from "./BellogRuntimeDataBus";
import {CompareDataType} from "../../common/model/profile/Common";
import {bellogRuntimeDebug} from "./BellogRuntimeDebug";

/**
 * Pre-computed adjacency list for a channel graph.
 * Maps source node ID → list of outgoing edges.
 */
type AdjacencyMap = Map<string, ChannelEdge[]>;

/**
 * Compiled route condition function.
 * Returns true if the edge should be taken given the output data and context.
 */
type RouteConditionFn = (output: any, ctx: LayerEventCommonProperties) => boolean;

class BellogRuntimeLayerController {

    private layers: LayerProperty[] = [];
    private channels: ChannelProperty[] = [];

    /** Compiled layer functions keyed by layer refId + refType + refName */
    private layerFuncCache: Map<string, Function> = new Map();

    /** Per-channel adjacency maps, built once on setChannels */
    private adjacencyMaps: Map<number, AdjacencyMap> = new Map();

    /** Per-channel node lookup maps */
    private nodeMaps: Map<number, Map<string, ChannelNode>> = new Map();

    /** Reverse adjacency: target → edges (for output channels, data flows leaf → root) */
    private reverseAdjacencyMaps: Map<number, AdjacencyMap> = new Map();

    /** Compiled route condition functions keyed by edge ID */
    private routeConditionCache: Map<string, RouteConditionFn> = new Map();

    /** Per-channel per-node accumulator state (survives across packets) */
    private accumulators: Map<string, any> = new Map();

    /** Unsubscribe handle for the DataBus reset listener */
    private unsubReset: (() => void) | null = null;

    setLayers(layers: LayerProperty[]) {
        this.layers = layers;
        this.layerFuncCache.clear();
    }

    setChannels(channels: ChannelProperty[]) {
        this.channels = channels;
        this.adjacencyMaps.clear();
        this.nodeMaps.clear();
        this.reverseAdjacencyMaps.clear();
        this.routeConditionCache.clear();
        this.accumulators.clear();

        // Reset listener: clear accumulator state when playback seeks
        if (this.unsubReset) this.unsubReset();
        this.unsubReset = bellogRuntimeDataBus.onReset(() => {
            this.accumulators.clear();
        });

        // Pre-compute adjacency lists and node maps
        for (const channel of channels) {
            const adj: AdjacencyMap = new Map();
            const nodeMap = new Map<string, ChannelNode>();

            for (const node of channel.config.nodes) {
                nodeMap.set(node.id, node);
                adj.set(node.id, []);
            }

            for (const edge of channel.config.edges) {
                const list = adj.get(edge.source);
                if (list) list.push(edge);
            }

            this.adjacencyMaps.set(channel.id, adj);
            this.nodeMaps.set(channel.id, nodeMap);

            // Build reverse adjacency for output channels (target → edges)
            const revAdj: AdjacencyMap = new Map();
            for (const node of channel.config.nodes) {
                revAdj.set(node.id, []);
            }
            for (const edge of channel.config.edges) {
                const list = revAdj.get(edge.target);
                if (list) list.push(edge);
            }
            this.reverseAdjacencyMaps.set(channel.id, revAdj);

            // Pre-compile route conditions
            for (const edge of channel.config.edges) {
                const type = edge.routeConditionType ?? CompareDataType.Code;
                const settings = edge.routeConditionSettings;
                if (!settings) continue;

                const cacheKey = `${channel.id}:${edge.id}`;

                try {
                    if (type === CompareDataType.Code) {
                        const code = (settings as any).code;
                        if (code && code.trim().length > 0) {
                            // Wrap as function call: the user writes function(output, ctx){...}
                            const fn = eval(`(${code})`) as RouteConditionFn;
                            this.routeConditionCache.set(cacheKey, fn);
                        }
                    } else if (type === CompareDataType.Query) {
                        const query = (settings as any).query;
                        if (query && query.trim().length > 0) {
                            // CEL expression — compile as a JS expression over output fields
                            const fn = new Function('output', 'ctx', 'return ' + query) as RouteConditionFn;
                            this.routeConditionCache.set(cacheKey, fn);
                        }
                    }
                } catch (e) {
                    console.error(`[BellogRuntime] Failed to compile route condition for edge ${edge.id}: ${e}`);
                }
            }
        }
    }

    /**
     * Called when an interface receives data. Routes through all matching channels.
     */
    outputFromIfc(ifcProps: InterfacesProperty, timestamp: number, output: any) {
        const ctx: LayerEventCommonProperties = {
            interfaceId: ifcProps.id,
            interfaceName: ifcProps.name,
            interfaceType: ifcProps.type,
            direction: "down",
            streamSourceId: ifcProps.id,
            streamSourceType: LayerSourceType.Interface,
        };

        for (const channel of this.channels) {
            // Only input channels receive data from interfaces
            if (channel.type !== ChannelType.Input) continue;

            // Find the root node (type='input' for Input channels)
            const nodeMap = this.nodeMaps.get(channel.id);
            const adj = this.adjacencyMaps.get(channel.id);
            if (!nodeMap || !adj) continue;

            let rootNode: ChannelNode | undefined;
            for (const node of nodeMap.values()) {
                if (node.type === 'input' || node.type === 'output') {
                    rootNode = node;
                    break;
                }
            }
            if (!rootNode) continue;

            // Log at the root (interface) node
            if (!rootNode.data.hidden) {
                bellogRuntimeDataBus.publish(channel.id, rootNode.id, timestamp, ctx.direction, output);
            }

            // Process children of root
            const rootEdges = adj.get(rootNode.id) || [];
            for (const edge of rootEdges) {
                if (this.evaluateRouteCondition(channel.id, edge, output, ctx)) {
                    this.processNode(edge.target, output, ctx, channel.id, nodeMap, adj, timestamp);
                }
            }
        }
    }

    /**
     * Send data through an Output channel. Data flows from leaf nodes toward the
     * root (interface). Layers encode the data in reverse order. Returns the final
     * encoded data that should be written to the interface, or undefined on failure.
     */
    sendToOutputChannel(channelId: number, timestamp: number, data: any): any {
        const channel = this.channels.find(ch => ch.id === channelId);
        if (!channel || channel.type !== ChannelType.Output) return undefined;

        const nodeMap = this.nodeMaps.get(channelId);
        const adj = this.adjacencyMaps.get(channelId);
        if (!nodeMap || !adj) return undefined;

        // Find leaf nodes (no outgoing edges) — these are the entry points for output
        const leafNodes: ChannelNode[] = [];
        for (const node of nodeMap.values()) {
            const outEdges = adj.get(node.id) || [];
            if (outEdges.length === 0 && node.type !== 'input' && node.type !== 'output') {
                leafNodes.push(node);
            }
        }

        // If no layer nodes, the root is the only node — pass data straight through
        if (leafNodes.length === 0) return data;

        if (leafNodes.length > 1) {
            console.warn(`[LayerCtrl] Output channel ${channel.name} (id=${channelId}) has ${leafNodes.length} leaf nodes — only the first will be used`);
        }

        const ctx: LayerEventCommonProperties = {
            interfaceId: 0,
            interfaceName: '',
            interfaceType: '' as any,
            direction: "up",
            streamSourceId: channelId,
            streamSourceType: LayerSourceType.Layer,
        };

        // Process from the first leaf toward root.
        let result = data;
        result = this.processOutputNode(leafNodes[0].id, data, ctx, channelId, nodeMap, adj, timestamp);
        return result;
    }

    /**
     * Process a node in an Output channel, then propagate toward root (source of incoming edges).
     */
    private processOutputNode(
        nodeId: string,
        input: any,
        ctx: LayerEventCommonProperties,
        channelId: number,
        nodeMap: Map<string, ChannelNode>,
        adj: AdjacencyMap,
        timestamp: number,
    ): any {
        const node = nodeMap.get(nodeId);
        if (!node) return input;

        // If this is the root (interface node), just return — data has reached the interface
        if (node.type === 'input' || node.type === 'output') {
            if (!node.data.hidden) {
                bellogRuntimeDataBus.publish(channelId, nodeId, timestamp, ctx.direction, input);
            }
            return input;
        }

        if (!node.data.layerRef) return input;

        const layer = getElementFromRef(node.data.layerRef, this.layers, []);
        if (!layer) return input;

        const layerFunc = this.getLayerFunc(layer);
        if (!layerFunc) return input;

        const layerProps = layer.config.properties.reduce((acc, prop) => {
            acc[prop.name] = resolveCustomProperty(prop);
            return acc;
        }, {} as Record<string, any>);

        const accKey = `${channelId}:${nodeId}`;
        let outputResult = input;

        const channelName = this.channels.find(c => c.id === channelId)?.name ?? String(channelId);
        const nextFunc = (accumulator: any, output: any) => {
            // Automatically carry _origin from input to output if not already present
            if (input && typeof input === 'object' && input._origin
                && output && typeof output === 'object' && !output._origin) {
                output._origin = input._origin;
            }

            // Skip logging for deterministic layers — their output can be
            // derived from the input, so recording it is redundant.
            if (!node.data.hidden && layer.deterministic !== true) {
                bellogRuntimeDataBus.publish(channelId, nodeId, timestamp, ctx.direction, output);
            }
            outputResult = output;
            return accumulator;
        };

        const throwException = (message: any) => {
            bellogRuntimeDataBus.publishError(channelId, nodeId, timestamp, ctx.direction,
                typeof message === 'string' ? message : JSON.stringify(message));
        };

        try {
            const prevAccumulator = this.accumulators.get(accKey) ?? null;
            bellogRuntimeDebug.log(`[CH OUT] "${channelName}" → "${layer.name}"`, input);
            const newAccumulator = layerFunc(ctx, prevAccumulator, input, nextFunc, throwException, layerProps);
            this.accumulators.set(accKey, newAccumulator);
        } catch (e) {
            bellogRuntimeDataBus.publishError(channelId, nodeId, timestamp, ctx.direction,
                `Layer execution error: ${e}`);
            return input;
        }

        // Walk toward root: find edges where this node is the target → process the source node
        const reverseAdj = this.reverseAdjacencyMaps.get(channelId);
        if (reverseAdj) {
            const parentEdges = reverseAdj.get(nodeId) || [];
            for (const edge of parentEdges) {
                outputResult = this.processOutputNode(edge.source, outputResult, ctx, channelId, nodeMap, adj, timestamp);
            }
        }

        return outputResult;
    }

    /**
     * Process a single layer node: eval its code, then propagate to children.
     */
    private processNode(
        nodeId: string,
        input: any,
        ctx: LayerEventCommonProperties,
        channelId: number,
        nodeMap: Map<string, ChannelNode>,
        adj: AdjacencyMap,
        timestamp: number,
    ) {
        const node = nodeMap.get(nodeId);
        if (!node || !node.data.layerRef) return;

        // Resolve the layer definition
        const layer = getElementFromRef(node.data.layerRef, this.layers, []);
        if (!layer) return;

        // Get or compile the layer function
        const layerFunc = this.getLayerFunc(layer);
        if (!layerFunc) return;

        // Build resolved properties
        const layerProps = layer.config.properties.reduce((acc, prop) => {
            acc[prop.name] = resolveCustomProperty(prop);
            return acc;
        }, {} as Record<string, any>);

        // Accumulator key: channel + node
        const accKey = `${channelId}:${nodeId}`;

        // The next function: called by the layer to propagate output to children
        const outgoingEdges = adj.get(nodeId) || [];
        const channelName = this.channels.find(c => c.id === channelId)?.name ?? String(channelId);
        const nextFunc = (accumulator: any, output: any, next: any, throwException: any) => {
            // Automatically carry _origin from input to output if not already present
            if (input && typeof input === 'object' && input._origin
                && output && typeof output === 'object' && !output._origin) {
                output._origin = input._origin;
            }

            bellogRuntimeDebug.log(`[CH IN] "${channelName}" → "${layer.name}"`, output);

            // Propagate to children based on route conditions
            for (const edge of outgoingEdges) {
                if (this.evaluateRouteCondition(channelId, edge, output, ctx)) {
                    this.processNode(edge.target, output, ctx, channelId, nodeMap, adj, timestamp);
                }
            }

            // Log at this node after the layer produces output.
            if (!node.data.hidden) {
                bellogRuntimeDataBus.publish(channelId, nodeId, timestamp, ctx.direction, output);
            }

            return accumulator;
        };
        // Attach next chain info for layers that use next.next
        (nextFunc as any).next = null;

        const throwException = (message: any) => {
            bellogRuntimeDataBus.publishError(channelId, nodeId, timestamp, ctx.direction,
                typeof message === 'string' ? message : JSON.stringify(message));
        };

        try {
            const prevAccumulator = this.accumulators.get(accKey) ?? null;
            const newAccumulator = layerFunc(ctx, prevAccumulator, input, nextFunc, throwException, layerProps);
            this.accumulators.set(accKey, newAccumulator);
        } catch (e) {
            bellogRuntimeDataBus.publishError(channelId, nodeId, timestamp, ctx.direction,
                `Layer execution error: ${e}`);
        }
    }

    /**
     * Evaluate a route condition on an edge. Returns true if the edge should be followed.
     * Empty/missing condition = unconditional (always true).
     */
    private evaluateRouteCondition(
        channelId: number,
        edge: ChannelEdge,
        output: any,
        ctx: LayerEventCommonProperties
    ): boolean {
        // Check if conditions are empty — treat as unconditional
        const type = edge.routeConditionType ?? CompareDataType.Code;
        const settings = edge.routeConditionSettings;
        if (!settings) return true;

        const isEmpty = (
            (type === CompareDataType.Code && (!(settings as any).code || (settings as any).code.trim().length === 0)) ||
            (type === CompareDataType.Query && (!(settings as any).query || (settings as any).query.trim().length === 0))
        );
        if (isEmpty) return true;

        const cacheKey = `${channelId}:${edge.id}`;
        const fn = this.routeConditionCache.get(cacheKey);
        if (!fn) return true; // Couldn't compile — default to pass-through

        try {
            return !!fn(output, ctx);
        } catch (e) {
            console.warn(`[BellogRuntime] Route condition error on edge ${edge.id}: ${e}`);
            return false;
        }
    }

    /**
     * Get or compile a layer's code function. Cached by layer identity.
     */
    private getLayerFunc(layer: LayerProperty): Function | null {
        const key = `${layer.id}:${layer.name}`;
        let fn = this.layerFuncCache.get(key);
        if (!fn) {
            try {
                fn = eval(`(${layer.config.code})\n//# sourceURL=BellogLayer_${layer.name}.js`);
                this.layerFuncCache.set(key, fn);
            } catch (e) {
                console.error(`[BellogRuntime] Failed to compile layer "${layer.name}": ${e}`);
                return null;
            }
        }
        return fn;
    }
}

export const bellogRuntimeLayerController = new BellogRuntimeLayerController();
