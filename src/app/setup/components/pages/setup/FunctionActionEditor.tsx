import * as React from "react";
import {useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {FunctionActionConfig, FunctionActionMode} from "../../../../common/model/profile/Actions";
import {BindableVariable, ElementType} from "../../../../common/model/profile/Common";
import {IOParameter} from "../../../../common/model/profile/Layer";
import {profileChannelSelectors} from "../../../store/profile/ProfileChannelsSlice";
import {ChannelNodeLayerData, ChannelType} from "../../../../common/model/profile/Channel";
import {getLocalRefFromElement} from "../../Utils";
import {getExpectedNodeInputParams} from "../../../../common/utility/CommonUtil";
import {profileSelectEventDeps} from "../../../store/profile/ProfileSelectors";
import {BindableInput} from "./BindableInput";
import {CodeComponent} from "./CodeComponent";
import {LayerTreeNodeSelectDialog} from "../../dialogs/special/LayerTreeNodeSelectDialog";

export const FunctionActionEditor = (props: {
    config: FunctionActionConfig,
    availableParams: IOParameter[],
    onChange: (config: FunctionActionConfig) => void,
}) => {

    const config = props.config;
    const deps = useSelector(profileSelectEventDeps);
    const allChannels = useSelector(profileChannelSelectors.selectAll);
    const outputChannels = allChannels.filter(ch => ch.type === ChannelType.Output);
    const [layerSelectDialogOpen, setLayerSelectDialogOpen] = useState(false);

    // Resolve the selected channel directly from the selector list (avoids stale entity lookups)
    const selectedChannelId = config.sendDataConfig.channelRef?.refId;
    const channel = selectedChannelId != null && selectedChannelId >= 0
        ? allChannels.find(ch => ch.id === selectedChannelId)
        : undefined;

    let selectedLayerLabelName = ""
    let selectedLayer: ChannelNodeLayerData | undefined
    if (channel) {
        const found = channel.config.nodes.find(n => n.id === config.sendDataConfig.nodeId?.toString());
        if (found) {
            selectedLayerLabelName = found.data.label;
            selectedLayer = found.data;
        }
    }
    selectedLayerLabelName = selectedLayerLabelName === "" ? "Not selected" : selectedLayerLabelName

    const initialCode = useMemo(() => config.code, []);

    function updateMode(mode: FunctionActionMode) {
        props.onChange({...config, mode});
    }

    function onOutputChannelChange(channelId: number) {
        const ch = outputChannels.find(c => c.id === channelId);
        if (ch) {
            const ref = getLocalRefFromElement(ch, ElementType.Channel);
            props.onChange({
                ...config,
                sendDataConfig: {
                    channelRef: ref,
                    nodeId: -1,
                    mappings: []
                }
            });
        }
    }

    function onNodeSelected(nodeId: string, nodeData: ChannelNodeLayerData) {
        const nodeInputParams = nodeData.layerRef
            ? getExpectedNodeInputParams(nodeData.layerRef, deps)
            : [{id: 0, name: "data", type: "Uint8Array" as any}];
        props.onChange({
            ...config,
            sendDataConfig: {
                ...config.sendDataConfig,
                nodeId: parseInt(nodeId),
                mappings: nodeInputParams.map(p => ({
                    destParamName: p.name,
                    sourceParam: { bind: false, value: "" }
                }))
            }
        });
        setLayerSelectDialogOpen(false);
    }

    function setMappingSourceParam(index: number, elem: BindableVariable<any>) {
        const newMappings = config.sendDataConfig.mappings.map((m, i) => {
            if (i === index) return {...m, sourceParam: elem};
            return m;
        });
        props.onChange({
            ...config,
            sendDataConfig: {...config.sendDataConfig, mappings: newMappings}
        });
    }

    function updateCode(code: string) {
        props.onChange({...config, code});
    }

    return (
        <div className="box p-3 mt-2 mb-2" style={{backgroundColor: "hsl(0, 0%, 96%)"}}>
            <label className="label is-small has-text-info">
                <i className="fas fa-bolt mr-1"></i>Action
            </label>

            <div className="field">
                <label className="label is-small">Mode</label>
                <div className="control">
                    <div className="select is-small">
                        <select value={config.mode}
                                onChange={(evt) => updateMode(evt.target.value as FunctionActionMode)}>
                            {Object.values(FunctionActionMode).map((it) =>
                                <option key={it} value={it}>{it}</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {config.mode === FunctionActionMode.SendData && (
                <>
                    {
                        layerSelectDialogOpen && channel &&
                        <LayerTreeNodeSelectDialog
                            nodes={channel.config.nodes}
                            edges={channel.config.edges}
                            onSelect={(id, node) => onNodeSelected(id, node)}
                            onClose={() => setLayerSelectDialogOpen(false)}
                        />
                    }

                    <div className="field">
                        <label className="label is-small">Destination Channel (Output)</label>
                        <div className="control">
                            {outputChannels.length === 0 ? (
                                <p className="help is-warning">No Output channels available.</p>
                            ) : (
                                <div className="select is-small">
                                    <select
                                        value={config.sendDataConfig.channelRef?.refId ?? -1}
                                        onChange={(evt) => onOutputChannelChange(parseInt(evt.target.value))}>
                                        <option value={-1} disabled>-- Select Output Channel --</option>
                                        {outputChannels.map(ch => (
                                            <option key={ch.id} value={ch.id}>{ch.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {channel && (
                        <div className="field">
                            <label className="label is-small">Layer</label>
                            <div className="control">
                                <div className="field has-addons" style={{maxWidth: "350px"}}>
                                    <p className="control is-expanded">
                                        <input className="input is-small" type="text" disabled={true} value={selectedLayerLabelName}/>
                                    </p>
                                    <p className="control">
                                        <button className="button is-small" onClick={() => setLayerSelectDialogOpen(true)}>
                                            Select
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedLayer && config.sendDataConfig.mappings.length > 0 && (
                        <fieldset className="fieldset">
                            <legend className="is-size-7">Data Bindings</legend>
                            {config.sendDataConfig.mappings.map((mapping, index) => (
                                <div key={index} className="field is-grouped is-align-items-end">
                                    <div className="control">
                                        <div className="field">
                                            <label className="label is-small">Dest Param</label>
                                            <div className="select is-small">
                                                <select value={mapping.destParamName} disabled>
                                                    <option>{mapping.destParamName}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <BindableInput
                                        title={"Value"}
                                        small={true}
                                        availableParams={props.availableParams}
                                        bv={mapping.sourceParam}
                                        setBindableVariable={(elem) => setMappingSourceParam(index, elem)}
                                    />
                                </div>
                            ))}
                        </fieldset>
                    )}
                </>
            )}

            {config.mode === FunctionActionMode.Code && (
                <CodeComponent code={initialCode} onCodeUpdate={updateCode}/>
            )}
        </div>
    );
};
