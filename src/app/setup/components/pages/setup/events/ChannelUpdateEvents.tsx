import * as React from "react";
import {RuleGroupType} from "react-querybuilder";
import 'react-querybuilder/dist/query-builder.css';
import "../../../../../../myquerystyles.css"
import {useDispatch, useSelector} from "react-redux";
import {appStore, RootState} from "../../../../store/AppStore";
import {
    profileSelectEventById,
    profileSelectEventDeps,
    profileSelectEventIds,
    profileSelectLayerById
} from "../../../../store/profile/ProfileSelectors";
import {EventType} from "../../../../../common/model/profile/Event";
import {ChannelUpdateEvent} from "./ChannelUpdateEvent";
import {profileEventsActions} from "../../../../store/profile/ProfileEventsSlice";
import {createSelector} from "@reduxjs/toolkit";
import {CollapseCard} from "../../../CollapseCard";
import {CollpaseGroupRedux} from "../../../CollapseGroupRedux";
import {LayerComponentSetup} from "../layers/LayerComponentSetup";
import {profileLayersActions} from "../../../../store/profile/ProfileLayersSlice";
import {profileChannelSelectors} from "../../../../store/profile/ProfileChannelsSlice";
import {ChannelType} from "../../../../../common/model/profile/Channel";

export const ChannelUpdateEvents = () => {
    const dispatch = useDispatch();

    const deps = useSelector(profileSelectEventDeps)
    const eventIds = useSelector((state:RootState) => profileSelectEventIds(state, EventType.ChannelUpdate))
    const allChannels = useSelector(profileChannelSelectors.selectAll)
    const hasInputChannels = allChannels.some(ch => ch.type === ChannelType.Input)

    function addEvent() {
        appStore.dispatch(profileEventsActions.addOne({type: EventType.ChannelUpdate, deps: deps}));
    }

    function setEventElements(ids: number[]) {
        dispatch(profileEventsActions.eventUpdateArray({ids: ids, type: EventType.ChannelUpdate}))
    }

    return (
        <>
            <CollpaseGroupRedux arrayIds={eventIds} deleteIcon
                                selector={(state: RootState, id: number) => profileSelectEventById(state, id)}
                                setNewArray={(array) => {
                                    setEventElements(array)
                                }}
            >
                {
                    (element, _) => (
                        <ChannelUpdateEvent
                            key={element}
                            id={element}
                        />
                    )
                }
            </CollpaseGroupRedux>
            <button className="button is-success" onClick={addEvent} disabled={!hasInputChannels}
                    title={!hasInputChannels ? "Create an Input channel first" : ""}>Add Event</button>
        </>
    );
}