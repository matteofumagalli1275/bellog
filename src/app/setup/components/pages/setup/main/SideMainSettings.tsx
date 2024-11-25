import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    profileGlobalSettingsActions
} from "../../../../store/profile/ProfileGlobalSettingsSlice";
import {
     profileSelectChannelById, profileSelectChannelsIds, profileSelectInterfaceById,
    profileSelectInterfacesIds, profileSelectName
} from "../../../../store/profile/ProfileSelectors";
import {InterfaceSetup} from "../interfaces/InterfaceSetup";
import {profileInterfacesActions, profileInterfacesSelectors} from "../../../../store/profile/ProfileInterfacesSlice";
import {profileNameActions} from "../../../../store/profile/ProfileNameSlice";
import {CollapseCard} from "../../../CollapseCard";
import {CollpaseGroupRedux} from "../../../CollapseGroupRedux";
import {ChannelComponentSetup} from "./ChannelComponentSetup";
import {profileChannelsActions, profileChannelSelectors} from "../../../../store/profile/ProfileChannelsSlice";
import {ChannelType} from "../../../../../common/model/profile/Channel";
import {DragDropContext, Draggable, Droppable} from "@hello-pangea/dnd";
import {useEffect, useMemo, useState} from "react";
import {ViewSettings} from "../../../../../common/model/profile/View";
import {profileViewsActions} from "../../../../store/profile/ProfileViewsSlice";


export const SideMainSettings = () => {
    const dispatch = useDispatch();

    const profileName = useSelector(profileSelectName)
    const interfaces = useSelector(profileInterfacesSelectors.selectAll)
    const channels = useSelector(profileChannelSelectors.selectAll)
    const [selectedInterfaceId, setSelectedInterfaceId] = useState(-1)
    const [selectedChannelId, setSelectedChannelId] = useState(-1)

    useMemo(() => {
        if(selectedInterfaceId === -1) {
            if(interfaces.length > 0)
                setSelectedInterfaceId(interfaces[0].id)
        }
    }, [selectedInterfaceId, interfaces]);

    useMemo(() => {
        if(selectedChannelId === -1) {
            if(channels.length > 0)
                setSelectedChannelId(channels[0].id)
        }
    }, [selectedChannelId, channels]);

    function setProfileName(name: string) {
        dispatch(profileNameActions.setProfileName(name))
    }

    function addInterface() {
        dispatch(profileInterfacesActions.interfaceAdd())
    }

    function addChannel(direction: ChannelType) {
        dispatch(profileChannelsActions.channelAdd({direction}))
    }

    function deleteSelectedInterface() {
        dispatch(profileInterfacesActions.interfaceRemove({id: selectedInterfaceId}))
        setSelectedInterfaceId(-1)
    }

    function deleteSelectedChannel() {
        dispatch(profileChannelsActions.channelRemove({id: selectedChannelId}))
        setSelectedChannelId(-1)
    }

    const onDragEndChannels = (result) => {
        if (!result.destination) return; // Dropped outside the list

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        const [reorderedItem] = channels.splice(sourceIndex, 1);
        channels.splice(destIndex, 0, reorderedItem);
        dispatch(profileChannelsActions.channelSetMany(channels))
    };

    const onDragEndInterfaces = (result) => {
        if (!result.destination) return; // Dropped outside the list

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        const [reorderedItem] = interfaces.splice(sourceIndex, 1);
        interfaces.splice(destIndex, 0, reorderedItem);
        dispatch(profileInterfacesActions.interfaceSetMany(interfaces))
    };

    return (
        <div>

            <h1 className="title is-4">Setup Profile</h1>

            <div className="field">
                <label className="label">Profile Name</label>
                <input className="input" type="text" placeholder="Text input" value={profileName}
                       onChange={(evt) => setProfileName(evt.target.value)}/>
            </div>

            <div className="field">
                <label className="label">
                    Interfaces
                    <span className={`ml-2 has-text-info has-tooltip-right icon is-large}`}
                          data-tooltip="Select how the data stream is retrieved or sent by the profile.">
                                <i className={`fas fa-lg fa-circle-info`}></i>
                    </span>
                </label>

                {selectedInterfaceId >= 0 &&
                    <DragDropContext onDragEnd={onDragEndInterfaces}>
                        <Droppable droppableId="fragments" direction="horizontal">
                            {(provided) => (
                                <div className="tabs is-boxed" {...provided.droppableProps} ref={provided.innerRef}>
                                    <ul>
                                        {interfaces.map((it, index) => (
                                            <Draggable key={it.id} draggableId={`${it.id}`} index={index}>
                                                {(provided) => (
                                                    <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={selectedInterfaceId === (it.id) ? 'is-active' : ''}
                                                    >
                                                        <a
                                                            onClick={() => setSelectedInterfaceId(it.id)}
                                                        >
                                                            {it.name}
                                                        </a>
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        <li>
                                            <button className="ml-2 button is-small is-success" onClick={addInterface}>
                                        <span className="icon is-small">
                                          <i className="fas fa-add"></i>
                                        </span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                }

                {selectedInterfaceId >= 0 ? <div className={"box"}>
                    <InterfaceSetup
                        id={selectedInterfaceId}
                    />
                    <button className="button is-danger mt-4" onClick={deleteSelectedInterface}>Delete
                    </button>
                </div> : <div className={"box"}>
                    <button className="button is-success" onClick={addInterface}>Add New</button>
                </div>
                }

            </div>


            <div className="field">
                <label className="label">
                    Channels
                    <span className={`ml-2 has-text-info has-tooltip-right icon is-large}`}
                          data-tooltip="Describes how the data from (or to) the interface is parsed (or builded)">
                                <i className={`fas fa-lg fa-circle-info`}></i>
                    </span>
                </label>

                {selectedChannelId >= 0 &&
                    <DragDropContext onDragEnd={onDragEndChannels}>
                        <Droppable droppableId="fragments" direction="horizontal">
                            {(provided) => (
                                <div className="tabs is-boxed" {...provided.droppableProps} ref={provided.innerRef}>
                                    <ul>
                                        {channels.map((it, index) => (
                                            <Draggable key={it.id} draggableId={`${it.id}`} index={index}>
                                                {(provided) => (
                                                    <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={selectedChannelId === (it.id) ? 'is-active' : ''}
                                                    >
                                                        <a
                                                            onClick={() => setSelectedChannelId(it.id)}
                                                        >
                                                            <span className={`tag is-small mr-2 ${it.type === ChannelType.Input ? 'is-info' : 'is-warning'}`}>
                                                                {it.type === ChannelType.Input ? 'IN' : 'OUT'}
                                                            </span>
                                                            {it.name}
                                                        </a>
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        <li>
                                            <button className="ml-2 button is-small is-info" onClick={() => addChannel(ChannelType.Input)}
                                                    title="Add Input Channel">
                                                <span className="icon is-small"><i className="fas fa-add"></i></span>
                                                <span>In</span>
                                            </button>
                                            <button className="ml-1 button is-small is-warning" onClick={() => addChannel(ChannelType.Output)}
                                                    title="Add Output Channel">
                                                <span className="icon is-small"><i className="fas fa-add"></i></span>
                                                <span>Out</span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                }

                {selectedChannelId >= 0 ? <div className={"box"}>
                    <ChannelComponentSetup
                        id={selectedChannelId}
                    />
                    <button className="button is-danger mt-4" onClick={deleteSelectedChannel}>Delete
                    </button>
                </div> : <div className={"box"}>
                    <button className="button is-info mr-2" onClick={() => addChannel(ChannelType.Input)}>Add Input Channel</button>
                    <button className="button is-warning" onClick={() => addChannel(ChannelType.Output)}>Add Output Channel</button>
                </div>
                }

            </div>
        </div>
    )
}
