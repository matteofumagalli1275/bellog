import {AppStore, RootState} from "../AppStore";
import {createSelector} from "@reduxjs/toolkit";
import {EventType} from "../../../common/model/profile/Event";

export const profileSelectName = (state: RootState) => {
    return state.profile.name;
}

export const profileSelectInterfacesIds = (state: RootState) => {
    return state.profile.interfaces.ids;
}

export const  profileSelectInterfaceById = createSelector(
    [(state: RootState) => state.profile.interfaces.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id]
);

export const profileSelectScriptIds = (state: RootState) => {
    return state.profile.scripts.ids;
}

export const profileSelectScripts = (state: RootState) => {
    return Object.values(state.profile.scripts.entities)
}

export const  profileSelectScriptName = createSelector(
    [(state: RootState) => state.profile.scripts.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id].name
);

export const  profileSelectScriptById = createSelector(
    [(state: RootState) => state.profile.scripts.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id]
);

export const  profileSelectStyleName = createSelector(
    [(state: RootState) => state.profile.styles.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id].name
);

export const profileSelectStyleIds = (state: RootState) => {
    return state.profile.styles.ids;
}

export const profileSelectStyles = (state: RootState) => {
    return Object.values(state.profile.styles.entities)
}

export const  profileSelectStyleById = createSelector(
    [(state: RootState) => state.profile.styles.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id]
);

export const profileSelectHtmlIds = (state: RootState) => {
    return state.profile.htmls.ids
}

export const profileSelectHtmls = (state: RootState) => {
    return state.profile.htmls.ids.map((id) => {
        return {
            id: id,
            name:  state.profile.htmls.entities[id].name
        }
    })
}

export const  profileSelectHtmlById = createSelector(
    [(state: RootState) => state.profile.htmls.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id]
);

export const  profileSelectChannelById = createSelector(
    [(state: RootState) => state.profile.channels.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id]
);

export const profileSelectChannelsIds = (state: RootState) => {
    return state.profile.channels.ids;
}

export const profileSelectLayersIds = (state: RootState) => {
    return state.profile.layers.ids;
}

export const  profileSelectLayerById = createSelector(
    [(state: RootState) => state.profile.layers.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id]
);

export const profileSelectEventIds = createSelector(
    [(state: RootState) => state.profile.events, (_: RootState, type: EventType) => type],
    (events, type) => events.ids.filter((id) => events.entities[id].type === type)
);

export const profileSelectEventDeps = createSelector(
    [(state: RootState) => state.profile.views.entities,
        (state: RootState) => state.profile.htmls.entities,
        (state: RootState) => state.profile.channels.entities,
        (state: RootState) => state.profile.interfaces.entities,
        (state: RootState) => state.profile.layers.entities,
        (state: RootState) => state.dependencies.entities],
    (views,
     htmls, channels,
     interfaces,
     middlewares,
     libraries) => {
        return {
            views: Object.values(views),
            htmls: Object.values(htmls),
            channels: Object.values(channels),
            interfaces: Object.values(interfaces),
            layers: Object.values(middlewares),
            libraries: Object.values(libraries),
        }
    }
)

export const  profileSelectEventById = createSelector(
    [(state: RootState) => state.profile.events.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id]
);

export const profileSelectViewIds = (state: RootState) => {
    return state.profile.views.ids;
}

export const  profileSelectViewById = createSelector(
    [(state: RootState) => state.profile.views.entities, (_: RootState, id: number) => id],
    (entities, id) => entities[id]
);

export const  profileSelectViewFragmentById = (state: RootState, viewId: number, fragmentId: number) => {
    switch (fragmentId) {
        case 1:
            return state.profile.views.entities[viewId].config.fragment1
        case 2:
            return state.profile.views.entities[viewId].config.fragment2
        case 3:
            return state.profile.views.entities[viewId].config.fragment3
    }
}