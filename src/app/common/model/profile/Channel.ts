import {CompareDataSettings, CompareDataType, ElementReference} from "./Common";
import {ElementProperty} from "./Element";

/**
 * Data attached to each node in the channel graph.
 * The root node (type='input') has no layerRef — it represents the interface entry point.
 * All other nodes reference a layer that processes data.
 */
export interface ChannelNodeLayerData {
    label: string;
    layerRef?: ElementReference;
    hidden: boolean;
    bindings: ChannelLayerBinding[];
}

/**
 * A node in the channel's flat graph. Maps 1:1 to a ReactFlow Node.
 * - type='input': the root/interface node (exactly one per channel)
 * - type='default': a layer processing node
 */
export interface ChannelNode {
    id: string;
    type?: string;
    data: ChannelNodeLayerData;
    position: { x: number; y: number };
}

/**
 * A directed edge in the channel graph. Maps 1:1 to a ReactFlow Edge.
 * Data flows from source → target. If the route condition is non-empty,
 * the edge is only followed when the condition evaluates to true at runtime.
 *
 * Conditions can be expressed in three modes (routeConditionType):
 * - Code:  a JS function string evaluated as `fn(output, ctx)`
 * - Query: a CEL expression built via the guided query builder
 * - Regex: a regex pattern tested against a stringified output
 *
 * Empty / default settings = unconditional (always taken).
 */
export interface ChannelEdge {
    id: string;
    source: string;
    target: string;
    /** How the route condition is expressed. Defaults to Code. */
    routeConditionType: CompareDataType;
    /** Structured condition data matching routeConditionType. */
    routeConditionSettings: CompareDataSettings;
    /** Human-readable label shown on the edge in the graph editor. */
    label: string;
}

export enum ChannelType {
    Input = 'Input',
    Output = 'Output',
}

export interface ChannelLayerBinding {
    iParamName: string;
    oParamName: string;
}

// Backward compatibility alias
export type ChannelMiddlewareBinding = ChannelLayerBinding;

/** @deprecated Use ChannelNode instead */
export type ChannelLayerTree = ChannelNode & { children?: ChannelLayerTree[] };

export interface ChannelProperties {
    interfaceRefs: ElementReference[];
    nodes: ChannelNode[];
    edges: ChannelEdge[];
}

export interface ChannelProperty extends ElementProperty {
    id: number;
    name: string;
    type: ChannelType;
    config: ChannelProperties;
    deleted: boolean;
}