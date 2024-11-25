import * as React from "react";
import {useCallback} from "react";
import {createPortal} from "react-dom";
import {ChannelEdge, ChannelNode, ChannelNodeLayerData} from "../../../../common/model/profile/Channel";
import ReactFlow, {Background, Controls, MiniMap, Node} from "reactflow";

export const LayerTreeNodeSelectDialog: React.FC<{
    nodes: ChannelNode[];
    edges: ChannelEdge[];
    onSelect: (layerId: string, node: ChannelNodeLayerData) => void;
    onClose: () => void;
}> = (props) => {

    const {nodes, edges, onSelect, onClose} = props;

    const rfEdges = edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || undefined,
        animated: !!(e.routeConditionSettings && (
            ('code' in e.routeConditionSettings && e.routeConditionSettings.code.trim().length > 0) ||
            ('query' in e.routeConditionSettings && e.routeConditionSettings.query.trim().length > 0)
        )),
    }));

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node<ChannelNodeLayerData>) => {
        onSelect(node.id, node.data);
    }, [onSelect]);

    return createPortal(
        <div className="modal is-active">
            <div className="modal-background" onClick={onClose} />
            <div className="modal-card" style={{ width: "80%", height: "90%" }}>
                <header className="modal-card-head has-background-info">
                    <p className="modal-card-title has-text-weight-semibold">Select Layer</p>
                    <button
                        className="delete"
                        aria-label="close"
                        onClick={onClose}
                    />
                </header>
                <section className="modal-card-body is-full" style={{padding: '1rem'}}>
                    <div style={{height: '100%', border: '1px solid #ddd'}}>
                        <ReactFlow
                            nodes={nodes as Node[]}
                            edges={rfEdges}
                            onNodeClick={onNodeClick}
                            fitView
                        >
                            <Background/>
                            <Controls/>
                            <MiniMap/>
                        </ReactFlow>
                    </div>
                </section>
                <footer className="modal-card-foot" style={{padding: '0.75rem'}}>
                    <button
                        className="button is-small is-outlined"
                        onClick={onClose}
                        style={{marginLeft: 'auto'}}
                    >
                        Cancel
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
};