import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {
    EventChannelUpdate,
    EventProperty,
    EventType
} from "../../../common/model/profile/Event";
import {
    CompareDataCode,
    CompareDataQuery,
    CompareDataType,
    ElementReference
} from "../../../common/model/profile/Common";
import {getElementFromRef} from "../../components/Utils";
import {getExpectedChannelOutputParams} from "../../../common/utility/CommonUtil";
import {RootState} from "../AppStore";
import {
    buildDefaultEventChannelUpdate,
    buildDefaultEventChannelUpdateCompareSettings
} from "../../DefaultPropertiesEvents";
import {buildDefaultAction} from "../../DefaultPropertiesActions";
import {profileActionsActions} from "./ProfileActionsSlice";
import {ProfilesDeps} from "./Profile";

const eventAdapter = createEntityAdapter({
    selectId: (event: EventProperty) => event.id,
})

const addOne = (payload: {type: EventType, deps: ProfilesDeps}) => (dispatch, getState: () => RootState) => {
    const events = getState().profile.events
    const actions = getState().profile.actions

    let [_, defaultAction] = buildDefaultAction(
        Object.values(actions.entities),
        [],
        payload.deps,
    )

    const [_2, defaultEvent] = buildDefaultEventChannelUpdate(Object.values(events.entities),
        defaultAction, payload.deps);

    const channel = getElementFromRef(defaultEvent.config.channelRef, payload.deps.channels, payload.deps.libraries)
    const expectedParams = channel ? getExpectedChannelOutputParams(channel,
        payload.deps) : []

    let [_3, defaultActionWithParams] = buildDefaultAction(
        Object.values(actions.entities),
        expectedParams,
        payload.deps)

    // Trick to actual get params filled (channel is obtained after the event creation)
    defaultActionWithParams.id = defaultAction.id
    defaultActionWithParams.name = defaultAction.name

    dispatch(profileEventsActions.addOneInternal(defaultEvent))
    dispatch(profileActionsActions.addOne(defaultActionWithParams))
};

const eventsSlice = createSlice({
    name: 'events',
    initialState: eventAdapter.getInitialState(),
    reducers: {
        addOneInternal: eventAdapter.addOne,
        updateOne: eventAdapter.updateOne,
        eventRemove: (state, action: PayloadAction<{id: number}>) => {
            const index = state.ids.findIndex(it => it === action.payload.id);
            if (index !== -1) {
                state.ids.splice(index, 1);
            }
            delete state.entities[action.payload.id]
        },
        eventUpdateArray: (state, action: PayloadAction<{ids: number[], type: EventType}>) => {
            const filteredIds = Object.values(state.entities)
                .filter((it) => it.type != action.payload.type)
                .map((it) => it.id)
            state.ids = filteredIds.concat(action.payload.ids)
            state.entities = Object.fromEntries(
                state.ids.map(id => [id, state.entities[id]])
            );
        },
        eventUpdateChannelUpdateSettings: (state, action: PayloadAction<{id: number, key: keyof EventChannelUpdate, value: any}>) => {
            state.entities[action.payload.id].config[action.payload.key as string] = action.payload.value
        },
    }
})

export const profileEventsReducer = eventsSlice.reducer
export const profileEventsActions = {...eventsSlice.actions, ...{addOne: addOne}}