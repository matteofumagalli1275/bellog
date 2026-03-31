import * as React from "react";
import {
    CompareDataCode,
    CompareDataQuery, CompareDataRegex,
    CompareDataType,
    ElementReference, ElementReferenceType, ElementType
} from "../../../../../common/model/profile/Common";
import 'react-querybuilder/dist/query-builder.css';
import "../../../../../../myquerystyles.css"
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../../../store/AppStore";
import {profileSelectEventById, profileSelectEventDeps} from "../../../../store/profile/ProfileSelectors";
import {profileEventsActions} from "../../../../store/profile/ProfileEventsSlice";
import {ActionComponent} from "../actions/ActionComponent";
import {useMemo, useState} from "react";
import {getElementFromRef, getLocalRefFromElement} from "../../../Utils";
import {getExpectedChannelOutputParams, getExpectedNodeOutputParams} from "../../../../../common/utility/CommonUtil";
import {librariesExportsSelectors} from "../../../../store/dependencies/dependencies";
import {ChannelNodeLayerData, ChannelType} from "../../../../../common/model/profile/Channel";
import {LayerTreeNodeSelectDialog} from "../../../dialogs/special/LayerTreeNodeSelectDialog";
import {EventChannelUpdate, EventProperty} from "../../../../../common/model/profile/Event";
import {QueryComponent} from "../../../QueryComponent";
import {CodeComponent} from "../CodeComponent";
import {RegexComponent} from "../../../RegexComponent";
import {buildDefaultEventChannelUpdateCompareSettings} from "../../../../DefaultPropertiesEvents";
import {profileChannelSelectors} from "../../../../store/profile/ProfileChannelsSlice";

export const ChannelUpdateEvent = (props: {id: number}) => {

    const dispatch = useDispatch();
    const [layerSelectDialogOpen, setLayerSelectDialogOpen] = useState(false);

    const libraries = useSelector(librariesExportsSelectors.selectAll)
    const deps = useSelector(profileSelectEventDeps)
    const allChannels = useSelector(profileChannelSelectors.selectAll)
    const inputChannels = allChannels.filter(ch => ch.type === ChannelType.Input)
    const event = useSelector((state:RootState) => profileSelectEventById(state, props.id))
    const name = event.name
    const settings = event.config as EventChannelUpdate
    const compareType = settings.compareType
    const compareDataSettings = settings.compareDataSettings
    const channel = getElementFromRef(settings.channelRef, deps.channels, libraries)
    let selectedLayerLabelName = ""
    let selectedLayer: ChannelNodeLayerData | undefined

    if (channel) {
        const found = channel.config.nodes.find(n => n.id === settings.layerId.toString());
        if (found) {
            selectedLayerLabelName = found.data.label;
            selectedLayer = found.data;
        }
    }

    const availableParams = selectedLayer ? getExpectedNodeOutputParams(selectedLayer.layerRef, deps) : []
    selectedLayerLabelName = selectedLayerLabelName === "" ? "Unknown" : selectedLayerLabelName

    function update(key: keyof EventProperty, value: any) {
        dispatch(profileEventsActions.updateOne({
            id: props.id,
            changes: {[key]: value}
        }))
    }

    function updateChannelUpdateSettings(key: keyof EventChannelUpdate, value: any) {
        dispatch(profileEventsActions.eventUpdateChannelUpdateSettings({
            id: props.id,
            key: key,
            value: value
        }))
    }

    return (
        <div>

            <div className="field is-grouped">
                <div className="control is-expanded">
                    <input className="input" type="text" placeholder="Text input" value={name}
                           onChange={(evt) => update("name", evt.target.value)}/>
                </div>
            </div>

            {
                layerSelectDialogOpen && channel &&
                <LayerTreeNodeSelectDialog
                    nodes={channel.config.nodes}
                    edges={channel.config.edges}
                    onSelect={(id, node) => {
                        updateChannelUpdateSettings("layerId", parseInt(id))
                        setLayerSelectDialogOpen(false)
                    }}
                    onClose={() => setLayerSelectDialogOpen(false)}
                />
            }
            <div className="field">
                <label className="label">Select Channel (Input)</label>
                <div className="control">
                    {inputChannels.length === 0 ? (
                        <div className="notification is-warning is-light">No Input channels available. Create an Input channel first.</div>
                    ) : (
                        <div className="select">
                            <select
                                value={settings.channelRef?.refId ?? ""}
                                onChange={(evt) => {
                                    const ch = inputChannels.find(c => c.id === parseInt(evt.target.value))
                                    if (ch) {
                                        dispatch(profileEventsActions.updateOne({id: props.id, changes: {
                                            config: {...settings, channelRef: getLocalRefFromElement(ch, ElementType.Channel), layerId: 0}
                                        }}))
                                    }
                                }}>
                                <option value="" disabled>-- Select Input Channel --</option>
                                {inputChannels.map(ch => (
                                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
            <div className="field is-grouped">
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
            </div>

            <div className="control mb-2">
                <div className="field">
                    <label className="label">Compare Type</label>
                    <div className="select">
                        <div className="select">
                            <select value={compareType}
                                    onChange={(evt) => {
                                        const newType = evt.target.value as CompareDataType;
                                        dispatch(profileEventsActions.updateOne({id: props.id, changes: {
                                            config: {...settings, compareType: newType, compareDataSettings: buildDefaultEventChannelUpdateCompareSettings(newType, availableParams)}
                                        }}))
                                    }}>
                                {
                                    Object.values(CompareDataType).map((it) =>
                                        <option key={it}>{it}</option>
                                    )
                                }
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {compareType === CompareDataType.Query && selectedLayer &&
                <QueryComponent
                    query={(compareDataSettings as CompareDataQuery).query}
                    params={availableParams}
                    onQueryUpdate={(query) => {
                        updateChannelUpdateSettings("compareDataSettings", {query: query})
                    }}
                />
            }
            {compareType === CompareDataType.Code &&
                <CodeComponent
                    code={(compareDataSettings as CompareDataCode).code}
                    onCodeUpdate={(code) => updateChannelUpdateSettings("compareDataSettings", {code: code})}
                />
            }
            {compareType === CompareDataType.Regex &&
                <RegexComponent
                    regex={(compareDataSettings as CompareDataRegex).regex}
                    onRegexUpdate={(regex) => updateChannelUpdateSettings("compareDataSettings", {regex: regex})}
                />
            }

            <ActionComponent
                id={settings.actionRef.refId}
                availableProps={availableParams}
            />

        </div>
    );
}