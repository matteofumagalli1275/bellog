import {combineReducers, createAction, Reducer} from "@reduxjs/toolkit";
import {profileSchemaVersionReducer} from "./ProfileSetupVersionSlice";
import {profileInterfacesReducer} from "./ProfileInterfacesSlice";
import {profileScriptsReducer} from "./ProfileScriptsSlice";
import {profileStylesReducer} from "./ProfileStylesSlice";
import {profileViewsReducer} from "./ProfileViewsSlice";
import {profileHtmlsReducer} from "./ProfileHtmlsSlice";
import {profileEventsReducer} from "./ProfileEventsSlice";
import {profileDependenciesReducer} from "./ProfileDependenciesSlice";
import {profileSettingsReducer} from "./ProfileGlobalSettingsSlice";
import {profileNameReducer} from "./ProfileNameSlice";
import {profileChannelsReducer} from "./ProfileChannelsSlice";
import {profileLayersReducer} from "./ProfileLayersSlice";
import {profileActionsReducer} from "./ProfileActionsSlice";
import {profileExportedSymbolsAdapterReducer} from "./ProfileScriptsExportedSymbolsSlice";
import {ChannelProperty} from "../../../common/model/profile/Channel";
import {ViewProperty} from "../../../common/model/profile/View";
import {HtmlProperty} from "../../../common/model/profile/Html";
import {LayerProperty} from "../../../common/model/profile/Layer";
import {InterfacesProperty} from "../../../common/model/profile/Interface";
import {Dependency} from "../dependencies/dependencies";
import {profileConditionalRendersReducers} from "./ProfileConditionalRendersSlice";

export const profileStateSetAction = createAction<ProfileState>('profile/set');

export interface ProfileState {
    name: ReturnType<typeof profileNameReducer>;
    schemaVersion: ReturnType<typeof profileSchemaVersionReducer>;
    interfaces: ReturnType<typeof profileInterfacesReducer>;
    channels: ReturnType<typeof profileChannelsReducer>;
    scripts: ReturnType<typeof profileScriptsReducer>;
    scriptsExportedSymbols: ReturnType<typeof profileExportedSymbolsAdapterReducer>,
    styles: ReturnType<typeof profileStylesReducer>;
    views: ReturnType<typeof profileViewsReducer>;
    htmls: ReturnType<typeof profileHtmlsReducer>;
    events: ReturnType<typeof profileEventsReducer>;
    actions: ReturnType<typeof profileActionsReducer>;
    conditionalRenderings: ReturnType<typeof profileConditionalRendersReducers>;
    layers: ReturnType<typeof profileLayersReducer>;
    dependencies: ReturnType<typeof profileDependenciesReducer>;
    settings: ReturnType<typeof profileSettingsReducer>;
}

export const profileReducer: Reducer<ProfileState> = combineReducers({
    name: profileNameReducer,
    schemaVersion: profileSchemaVersionReducer,
    interfaces: profileInterfacesReducer,
    channels: profileChannelsReducer,
    scripts: profileScriptsReducer,
    scriptsExportedSymbols: profileExportedSymbolsAdapterReducer,
    styles: profileStylesReducer,
    views: profileViewsReducer,
    htmls: profileHtmlsReducer,
    events: profileEventsReducer,
    actions: profileActionsReducer,
    conditionalRenderings: profileConditionalRendersReducers,
    layers: profileLayersReducer,
    dependencies: profileDependenciesReducer,
    settings: profileSettingsReducer
})

export const profileRootReducer = (state:ProfileState, action) => {
    if (action.type === profileStateSetAction.type) {
        // Write the state according to values imported from db or other ways
        return action.payload as ProfileState;
    }

    return profileReducer(state, action)
};

export const selectProfileSetup = state => state.profile;

export type ProfilesDeps = {
    channels: ChannelProperty[], views: ViewProperty[],
    htmls: HtmlProperty[], layers: LayerProperty[], interfaces: InterfacesProperty[], libraries: Dependency[]
}