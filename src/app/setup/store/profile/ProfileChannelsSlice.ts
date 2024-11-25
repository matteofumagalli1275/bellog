import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";

import {ChannelProperties, ChannelProperty, ChannelType} from "../../../common/model/profile/Channel";
import {buildDefaultChannel} from "../../DefaultPropertiesChannels";
import {RootState} from "../AppStore";

const channelAdapter = createEntityAdapter({
    selectId: (channel: ChannelProperty) => channel.id,
})

const channelsSlice = createSlice({
    name: 'channels',
    initialState: channelAdapter.getInitialState(),
    reducers: {
        channelAdd: (state, action: PayloadAction<{direction: ChannelType}>) => {
            const [defaultItemId, defaultItem] = buildDefaultChannel(Object.values(state.entities), action.payload.direction)
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
        },
        channelRemove: (state, action: PayloadAction<{id: number}>) => {
            const index = state.ids.findIndex(it => it === action.payload.id);
            if (index !== -1) {
                state.ids.splice(index, 1);
            }
            delete state.entities[action.payload.id]
        },
        channelUpdate: channelAdapter.updateOne,
        channelUpdateConfig: (state, action: PayloadAction<{id: number, changes: Partial<ChannelProperties>}>) => {
            Object.assign(state.entities[action.payload.id].config, action.payload.changes)
        },
        channelSetMany: channelAdapter.setMany
    }
})

export const profileChannelsReducer = channelsSlice.reducer
export const profileChannelsActions = channelsSlice.actions
export const profileChannelSelectors = channelAdapter.getSelectors((root: RootState) => root.profile.channels)