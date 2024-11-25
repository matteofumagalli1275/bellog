import * as React from "react";
import {useMemo, useState} from "react";
import 'react-querybuilder/dist/query-builder.css';
import {useDispatch, useSelector} from "react-redux";
import {profileSelectEventDeps} from "../../../../store/profile/ProfileSelectors";
import {RootState} from "../../../../store/AppStore";
import {
    ElementType,
    RenderModeType
} from "../../../../../common/model/profile/Common";
import {IOParameter} from "../../../../../common/model/profile/Layer";
import {profileActionsActions} from "../../../../store/profile/ProfileActionsSlice";
import {
    ActionParamMapping,
    ActionSendDataSettings
} from "../../../../../common/model/profile/Actions";
import {CodeComponent} from "../CodeComponent";
import {ActionSendMappings} from "./ActionSendMappings";
import {profileChannelSelectors} from "../../../../store/profile/ProfileChannelsSlice";
import {ChannelNodeLayerData, ChannelType} from "../../../../../common/model/profile/Channel";
import {getLocalRefFromElement} from "../../../Utils";
import {LayerTreeNodeSelectDialog} from "../../../dialogs/special/LayerTreeNodeSelectDialog";
import {getExpectedNodeInputParams} from "../../../../../common/utility/CommonUtil";

export const ActionSendDataComponent = (props: {
    id: number,
    availableParams: IOParameter[]
}) => {

    const dispatch = useDispatch();
    const [layerSelectDialogOpen, setLayerSelectDialogOpen] = useState(false);

    const deps = useSelector(profileSelectEventDeps)
    const action = useSelector((state:RootState) => state.profile.actions.entities[props.id])
    const allChannels = useSelector(profileChannelSelectors.selectAll)
    const outputChannels = allChannels.filter(ch => ch.type === ChannelType.Output)
    const settings = action.config as ActionSendDataSettings
    const channelRef = settings.channelRef

    const channel = channelRef?.refId != null && channelRef.refId >= 0
        ? allChannels.find(ch => ch.id === channelRef.refId)
        : undefined

    let selectedLayerLabelName = ""
    let selectedLayer: ChannelNodeLayerData | undefined
    if (channel) {
        const found = channel.config.nodes.find(n => n.id === settings.nodeId?.toString());
        if (found) {
            selectedLayerLabelName = found.data.label;
            selectedLayer = found.data;
        }
    }
    selectedLayerLabelName = selectedLayerLabelName === "" ? "Not selected" : selectedLayerLabelName

    const destinationParams = selectedLayer
        ? (selectedLayer.layerRef ? getExpectedNodeInputParams(selectedLayer.layerRef, deps) : [{id: 0, name: "data", type: "Uint8Array" as any}])
        : []

    const availableParams = props.availableParams

    const initialCode = useMemo(() => {
        return settings.code
    }, [])

    function onOutputChannelChange(channelId: number) {
        const ch = outputChannels.find(c => c.id === channelId)
        if (ch) {
            dispatch(profileActionsActions.updateActionSendDataChannelRef(
                {id: props.id, channelRef: getLocalRefFromElement(ch, ElementType.Channel)}))
        }
    }

    function onNodeSelected(nodeId: string) {
        dispatch(profileActionsActions.updateActionSendDataNodeId({
            id: props.id,
            nodeId: parseInt(nodeId),
            availableParams: availableParams,
            deps: deps
        }))
        setLayerSelectDialogOpen(false)
    }

    function updateMode(bindType: RenderModeType) {
        dispatch(profileActionsActions.updateActionSendData(
            {
                id: props.id,
                key: "mode",
                value: bindType
            }
        ))
    }

    function updateOValues(ovalues: ActionParamMapping[]) {
        dispatch(profileActionsActions.updateActionSendData(
            {
                id: props.id,
                key: "mappings",
                value: ovalues
            }
        ))
    }

    function updateCode(code: string) {
        dispatch(profileActionsActions.updateActionSendData(
            {
                id: props.id,
                key: "code",
                value: code
            }
        ))
    }

    function setOValue(index: number, key: keyof ActionParamMapping, value: any) {
        const newValues = settings.mappings.map((v, vindex) => {
            if (index === vindex)
                return {...v, [key]:value}
            return v
        })
        updateOValues(newValues)
    }

    return (
        <div>
            {
                layerSelectDialogOpen && channel &&
                <LayerTreeNodeSelectDialog
                    nodes={channel.config.nodes}
                    edges={channel.config.edges}
                    onSelect={(id, node) => onNodeSelected(id)}
                    onClose={() => setLayerSelectDialogOpen(false)}
                />
            }

            <div className="field">
                <label className="label">Select Destination Channel (Output only)</label>
                <div className="control select">
                    <select
                        value={channelRef?.refId ?? -1}
                        onChange={(e) => onOutputChannelChange(parseInt(e.target.value))}
                        disabled={outputChannels.length === 0}
                    >
                        <option value={-1} disabled>-- Select an Output Channel --</option>
                        {outputChannels.map(ch => (
                            <option key={ch.id} value={ch.id}>{ch.name}</option>
                        ))}
                    </select>
                </div>
                {outputChannels.length === 0 &&
                    <p className="help is-warning">No output channels available. Create an Output channel first.</p>
                }
            </div>

            {channel && (
                <div className="field">
                    <label className="label">Layer</label>
                    <div className="control">
                        <div className="field has-addons" style={{maxWidth: "400px"}}>
                            <p className="control is-expanded">
                                <input className="input" type="text" disabled={true} value={selectedLayerLabelName}/>
                            </p>
                            <p className="control">
                                <button className="button" onClick={() => setLayerSelectDialogOpen(true)}>
                                    Select
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {selectedLayer && (
                <div>
                    <div className="control mb-2">
                        <div className="field">
                            <label className="label">Mode</label>
                            <div className="select">
                                <div className="select">
                                    <select value={settings.mode}
                                            onChange={(evt) => {
                                                updateMode(evt.target.value as RenderModeType)
                                            }}>
                                        <option key={-1} defaultValue={-1} disabled>None</option>
                                        {
                                            Object.values(RenderModeType).map((it) =>
                                                <option key={it} value={it}>{it}</option>
                                            )
                                        }
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {
                        settings.mode === RenderModeType.Code &&
                        <CodeComponent code={initialCode} onCodeUpdate={updateCode}/>
                    }

                    {
                        settings.mode === RenderModeType.Gui &&
                        <>
                            <fieldset className="fieldset">
                                <legend className="ml-2">Bindings</legend>
                                <ActionSendMappings
                                    mappings={settings.mappings}
                                    availableParams={props.availableParams}
                                    setOValue={setOValue}
                                />
                            </fieldset>
                        </>
                    }
                </div>
            )}
        </div>
    );
}