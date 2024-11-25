import * as React from "react";
import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";
import {profileSelectChannelById, profileSelectEventDeps} from "../../../../store/profile/ProfileSelectors";
import {RootState} from "../../../../store/AppStore";
import {profileChannelsActions} from "../../../../store/profile/ProfileChannelsSlice";
import {
    ChannelEdge,
    ChannelNode,
    ChannelProperties,
    ChannelProperty,
    ChannelType
} from "../../../../../common/model/profile/Channel";
import TreeBuilder from "./TreeBuilder";

export const ChannelComponentSetup = (props: {
        id: number
    }) => {

    const dispatch = useDispatch();

    const deps = useSelector(profileSelectEventDeps)
    const channel = useSelector((state:RootState) => profileSelectChannelById(state, props.id))

    const name = channel.name;
    const properties = channel.config;

    function update(key: keyof ChannelProperty, value: any){
        dispatch(profileChannelsActions.channelUpdate({id:props.id, changes: {[key]: value}}))
    }

    function updateConfig(key: keyof ChannelProperties, value: any){
        dispatch(profileChannelsActions.channelUpdateConfig({id:props.id, changes: {[key]: value}}))
    }

    const updateNodes = useCallback(
        (nodes: ChannelNode[]) => updateConfig("nodes", nodes),
        [props.id]
    );

    const updateEdges = useCallback(
        (edges: ChannelEdge[]) => updateConfig("edges", edges),
        [props.id]
    );

    return (
        <React.Fragment>

            <div className="field is-grouped">
                <div className="control is-expanded">
                    <input className="input" type="text" placeholder="Text input" value={name}
                           onChange={(evt) => update("name", evt.target.value)}/>
                </div>
                <div className="control">
                    <span className={`tag is-medium ${channel.type === ChannelType.Input ? 'is-info' : 'is-warning'}`}>
                        {channel.type === ChannelType.Input ? 'Input' : 'Output'}
                    </span>
                </div>
            </div>

            <div className="title is-5 mt-5">Layer Graph</div>
            <TreeBuilder
                nodes={properties.nodes}
                edges={properties.edges}
                deps={deps}
                channelType={channel.type}
                onNodesUpdate={updateNodes}
                onEdgesUpdate={updateEdges}
            />

        </React.Fragment>
    )
}