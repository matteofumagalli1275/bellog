import React, {useCallback, useMemo, useState} from 'react';
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    Connection,
    Controls,
    EdgeChange,
    MiniMap,
    Node,
    NodeChange,
    OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {ElementReferenceComponent} from "../ElementReferenceComponent";
import {getEmbeddedRefFromElement} from "../../../Utils";
import {LineDeserializer} from "../../../../../common/res/embeddedSetupObjects/layer/LineDeserializer";
import {
    CompareDataCode,
    CompareDataQuery,
    CompareDataSettings,
    CompareDataType,
    ElementReference,
    ElementType,
    IOParameterType,
} from "../../../../../common/model/profile/Common";
import {
    ChannelEdge,
    ChannelNode,
    ChannelNodeLayerData,
    ChannelType,
} from "../../../../../common/model/profile/Channel";
import {ProfilesDeps} from "../../../../store/profile/Profile";
import {getExpectedNodeOutputParams} from "../../../../../common/utility/CommonUtil";
import {IOParameter} from "../../../../../common/model/profile/Layer";
import {ORIGIN_PARAMS, InterfaceType} from "../../../../../common/model/profile/Interface";
import {QueryComponent} from "../../../QueryComponent";
import {CodeComponent} from "../CodeComponent";
import {buildDefaultRouteConditionSettings} from "../../../../DefaultPropertiesChannels";

export interface TreeBuilderProps {
    nodes: ChannelNode[];
    edges: ChannelEdge[];
    deps: ProfilesDeps;
    channelType: ChannelType;
    onNodesUpdate: (nodes: ChannelNode[]) => void;
    onEdgesUpdate: (edges: ChannelEdge[]) => void;
}

const TreeBuilder: React.FC<TreeBuilderProps> = (props) => {
    const {nodes, edges, deps, channelType, onNodesUpdate, onEdgesUpdate} = props;

    const [addLayerType, setAddLayerType] = useState<ElementReference>(
        getEmbeddedRefFromElement(LineDeserializer, ElementType.Layer)
    );
    const [selectedNode, setSelectedNode] = useState<Node<ChannelNodeLayerData> | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<ChannelEdge | null>(null);

    // Helper to check if an edge has a non-empty condition
    const hasCondition = (e: ChannelEdge): boolean => {
        const s = e.routeConditionSettings;
        if (!s) return false;
        if ('code' in s) return s.code.trim().length > 0;
        if ('query' in s) return s.query.trim().length > 0;
        return false;
    };

    // Map ChannelEdge[] to ReactFlow edges (add visual label and conditional animation)
    const rfEdges = edges.map(e => ({
        ...e,
        label: e.label || (hasCondition(e) ? '⚡ conditional' : undefined),
        animated: hasCondition(e),
    }));

    // --- Node changes (position drag, selection, removal) ---
    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        const updated = applyNodeChanges(changes, nodes as Node[]) as ChannelNode[];
        onNodesUpdate(updated);
    }, [nodes, onNodesUpdate]);

    // --- Edge changes (removal, selection) ---
    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
        const updated = applyEdgeChanges(changes, rfEdges);
        // Strip ReactFlow-only presentational fields, keep our model fields
        const clean: ChannelEdge[] = updated.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            routeConditionType: (e as any).routeConditionType ?? CompareDataType.Query,
            routeConditionSettings: (e as any).routeConditionSettings ?? {query: ''},
            label: typeof e.label === 'string' ? e.label : '',
        }));
        onEdgesUpdate(clean);
    }, [edges, rfEdges, onEdgesUpdate]);

    // --- Connect two nodes ---
    const onConnect: OnConnect = useCallback(
        (params: Connection) => {
            const newEdge: ChannelEdge = {
                id: `${params.source}-${params.target}`,
                source: params.source,
                target: params.target,
                routeConditionType: CompareDataType.Query,
                routeConditionSettings: {query: ''},
                label: '',
            };
            onEdgesUpdate([...edges, newEdge]);
        },
        [edges, onEdgesUpdate]
    );

    // --- Add a new layer node ---
    const onAddLayer = useCallback(() => {
        const maxId = nodes.length > 0
            ? Math.max(...nodes.map(n => parseInt(n.id)))
            : 0;
        const newNodeId = (maxId + 1).toString();
        const newNode: ChannelNode = {
            id: newNodeId,
            type: 'default',
            data: {
                label: addLayerType.refName,
                layerRef: addLayerType,
                hidden: false,
                bindings: [],
            },
            position: {x: Math.random() * 200 + 100, y: Math.random() * 200 + 100},
        };

        onNodesUpdate([...nodes, newNode]);

        // Auto-connect to selected node or root.
        // For Input channels: parent (source) → child (target) — data flows down from interface
        // For Output channels: child (source) → parent (target) — data flows up toward interface
        const parentId = selectedNode ? selectedNode.id : '0';
        const isOutput = channelType === ChannelType.Output;
        const newEdge: ChannelEdge = {
            id: isOutput ? `${newNodeId}-${parentId}` : `${parentId}-${newNodeId}`,
            source: isOutput ? newNodeId : parentId,
            target: isOutput ? parentId : newNodeId,
            routeConditionType: CompareDataType.Query,
            routeConditionSettings: {query: ''},
            label: '',
        };
        onEdgesUpdate([...edges, newEdge]);
    }, [nodes, edges, addLayerType, selectedNode, channelType, onNodesUpdate, onEdgesUpdate]);

    // --- Node click ---
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node<ChannelNodeLayerData>) => {
        setSelectedNode(node);
        setSelectedEdge(null);
    }, []);

    // --- Edge click ---
    const onEdgeClick = useCallback((_: React.MouseEvent, edge: any) => {
        const found = edges.find(e => e.id === edge.id);
        setSelectedEdge(found ?? null);
        setSelectedNode(null);
    }, [edges]);

    // --- Delete key handler ---
    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Delete') {
                if (selectedEdge) {
                    onEdgesUpdate(edges.filter(e => e.id !== selectedEdge.id));
                    setSelectedEdge(null);
                }
                if (selectedNode && selectedNode.type !== 'input' && selectedNode.type !== 'output') {
                    const nodeId = selectedNode.id;
                    onNodesUpdate(nodes.filter(n => n.id !== nodeId));
                    // Also remove orphaned edges
                    onEdgesUpdate(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
                    setSelectedNode(null);
                }
            }
        },
        [selectedEdge, selectedNode, nodes, edges, onNodesUpdate, onEdgesUpdate]
    );

    // --- Update selected node's hidden flag ---
    const updateHiddenFlag = useCallback((hidden: boolean) => {
        if (!selectedNode) return;
        const updated = nodes.map(n =>
            n.id === selectedNode.id
                ? {...n, data: {...n.data, hidden}}
                : n
        );
        onNodesUpdate(updated);
        // Keep selectedNode in sync so the checkbox reflects the change
        const freshNode = updated.find(n => n.id === selectedNode.id);
        if (freshNode) setSelectedNode(freshNode as Node<ChannelNodeLayerData>);
    }, [selectedNode, nodes, onNodesUpdate]);

    // --- Update selected edge's route condition type ---
    const updateEdgeRouteConditionType = useCallback((type: CompareDataType, availableParams: IOParameter[]) => {
        if (!selectedEdge) return;
        const settings = buildDefaultRouteConditionSettings(type, availableParams);
        const updated: ChannelEdge = {...selectedEdge, routeConditionType: type, routeConditionSettings: settings};
        onEdgesUpdate(edges.map(e => e.id === selectedEdge.id ? updated : e));
        setSelectedEdge(updated);
    }, [selectedEdge, edges, onEdgesUpdate]);

    // --- Update selected edge's route condition settings ---
    const updateEdgeRouteConditionSettings = useCallback((settings: CompareDataSettings) => {
        if (!selectedEdge) return;
        const updated: ChannelEdge = {...selectedEdge, routeConditionSettings: settings};
        onEdgesUpdate(edges.map(e => e.id === selectedEdge.id ? updated : e));
        setSelectedEdge(updated);
    }, [selectedEdge, edges, onEdgesUpdate]);

    // --- Update selected edge's label ---
    const updateEdgeLabel = useCallback((label: string) => {
        if (!selectedEdge) return;
        onEdgesUpdate(edges.map(e =>
            e.id === selectedEdge.id
                ? {...e, label}
                : e
        ));
        setSelectedEdge(prev => prev ? {...prev, label} : null);
    }, [selectedEdge, edges, onEdgesUpdate]);

    // Context params available on every edge (from the runtime ctx object)
    const CTX_PARAMS: IOParameter[] = useMemo(() => {
        const interfaceTypeValues = Object.values(InterfaceType).map(v => ({name: v, label: v}));
        const interfaceNameValues = deps.interfaces.map(i => ({name: i.name, label: i.name}));
        return [
            {id: -10, name: "ctx.interfaceName", type: IOParameterType.String, values: interfaceNameValues},
            {id: -11, name: "ctx.interfaceType", type: IOParameterType.String, values: interfaceTypeValues},
            {id: -12, name: "ctx.interfaceId", type: IOParameterType.Number},
            {id: -13, name: "ctx.direction", type: IOParameterType.String, values: [{name: "down", label: "down"}, {name: "up", label: "up"}]},
        ];
    }, [deps.interfaces]);

    // --- Resolve source node's output parameters for the selected edge ---
    const edgeSourceParams: IOParameter[] = useMemo(() => {
        if (!selectedEdge) return [];
        const sourceNode = nodes.find(n => n.id === selectedEdge.source);
        if (!sourceNode) return [];
        let outputParams: IOParameter[];
        if (!sourceNode.data.layerRef) {
            // Root/interface node — generic data param + _origin metadata
            outputParams = [{id: 0, name: "data", type: IOParameterType.Uint8Array}, ...ORIGIN_PARAMS];
        } else {
            try {
                outputParams = getExpectedNodeOutputParams(sourceNode.data.layerRef, deps);
            } catch {
                outputParams = [{id: 0, name: "data", type: IOParameterType.Uint8Array}];
            }
        }
        return [...outputParams, ...CTX_PARAMS];
    }, [selectedEdge, nodes, deps]);

    return (
        <div className="columns" onKeyDown={onKeyDown} tabIndex={0}>
            {/* Left Sidebar */}
            <div className="column is-4">
                <div className="box">
                    <ElementReferenceComponent
                        title="Available Layers"
                        elementReference={addLayerType}
                        onUpdate={(ref) => setAddLayerType(ref)}
                    />
                    <button className="button is-success is-fullwidth mt-4" onClick={onAddLayer}>
                        Add Layer
                    </button>

                    {/* Node editing panel */}
                    {selectedNode && (
                        <div className="mt-5">
                            <div className="field">
                                <div className="control">
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedNode.data.hidden}
                                            onChange={(evt) => updateHiddenFlag(evt.target.checked)}
                                        />
                                        &nbsp;Hide
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edge editing panel */}
                    {selectedEdge && (
                        <div className="mt-5">
                            <div className="title is-6">Edge Routing</div>
                            <div className="field">
                                <label className="label">Label</label>
                                <div className="control">
                                    <input
                                        className="input is-small"
                                        type="text"
                                        placeholder="e.g. HTTP traffic"
                                        value={selectedEdge.label}
                                        onChange={(e) => updateEdgeLabel(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Condition Type</label>
                                <div className="control">
                                    <div className="select">
                                        <select
                                            value={selectedEdge.routeConditionType ?? CompareDataType.Code}
                                            onChange={(evt) => {
                                                updateEdgeRouteConditionType(
                                                    evt.target.value as CompareDataType,
                                                    edgeSourceParams
                                                );
                                            }}
                                        >
                                            <option key={CompareDataType.Code}>{CompareDataType.Code}</option>
                                            <option key={CompareDataType.Query}>{CompareDataType.Query}</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="help">
                                    Leave empty for unconditional routing.
                                </p>
                            </div>

                            {selectedEdge.routeConditionType === CompareDataType.Query && (
                                <QueryComponent
                                    query={(selectedEdge.routeConditionSettings as CompareDataQuery)?.query ?? ''}
                                    params={edgeSourceParams}
                                    onQueryUpdate={(query) => {
                                        updateEdgeRouteConditionSettings({query});
                                    }}
                                />
                            )}
                            {selectedEdge.routeConditionType === CompareDataType.Code && (
                                <CodeComponent
                                    code={(selectedEdge.routeConditionSettings as CompareDataCode)?.code ?? ''}
                                    onCodeUpdate={(code) => {
                                        updateEdgeRouteConditionSettings({code});
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side — ReactFlow graph */}
            <div className="column is-8">
                {channelType === ChannelType.Output && (() => {
                    const targets = new Set(edges.map(e => e.target));
                    const sources = new Set(edges.map(e => e.source));
                    const leafCount = nodes.filter(n =>
                        n.type !== 'input' && n.type !== 'output' && !sources.has(n.id)
                    ).length;
                    return leafCount > 1 ? (
                        <div className="notification is-warning is-light py-2 mb-2" style={{fontSize: '0.85rem'}}>
                            <strong>Warning:</strong> Output channel has {leafCount} leaf nodes — only the first will be used at runtime.
                        </div>
                    ) : null;
                })()}
                <div style={{height: '80vh', border: '1px solid #ddd'}}>
                    <ReactFlow
                        nodes={nodes as Node[]}
                        edges={rfEdges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={handleEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onEdgeClick={onEdgeClick}
                        fitView
                    >
                        <Background/>
                        <Controls/>
                        <MiniMap/>
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
};

export default TreeBuilder;
