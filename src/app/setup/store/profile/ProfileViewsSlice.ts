import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {buildDefaultViewFragment} from "../../DefaultProperties";
import {
    ViewFragment, ViewFragmentAppend, ViewFragmentFixed,
    ViewProperty,
} from "../../../common/model/profile/View";
import {buildDefaultView} from "../../DefaultPropertiesViews";
import {RootState} from "../AppStore";


const viewAdapter = createEntityAdapter({
    selectId: (view: ViewProperty) => view.id,
})

const viewsSlice = createSlice({
    name: 'views',
    initialState: viewAdapter.getInitialState(),
    reducers: {
        viewAdd: (state) => {
            const [defaultItemId, defaultItem] = buildDefaultView(Object.values(state.entities))
            state.ids.push(defaultItemId)
            state.entities[defaultItemId] = defaultItem
        },
        viewUpdateArray: (state, action: PayloadAction<{ids: number[]}>) => {
            state.ids = action.payload.ids;
            state.entities = Object.fromEntries(
                state.ids.map(id => [id, state.entities[id]])
            );
        },
        viewUpdate: viewAdapter.updateOne,
        viewRemove: viewAdapter.removeOne,

        viewUpdateFragment: (state, action: PayloadAction<{
            viewId: number;
            fragmentId: number;
            changes: Partial<ViewFragment>
        }>) => {
            const view = state.entities[action.payload.viewId];
            if (view) {
                const fragment: ViewFragment = view.config["fragment" + action.payload.fragmentId]
                if (fragment) {
                    if(action.payload.changes.type) {
                        Object.assign(fragment, {
                            ...buildDefaultViewFragment(action.payload.changes.type),
                            name: fragment.name
                        });
                    }
                    Object.assign(fragment, action.payload.changes);
                }
            }
        },
        viewUpdateFragmentAppendConfig: (state, action: PayloadAction<{
            viewId: number;
            fragmentId: number;
            changes: Partial<ViewFragmentAppend>
        }>) => {
            const view = state.entities[action.payload.viewId];
            if (view) {
                const fragment: ViewFragment = view.config["fragment" + action.payload.fragmentId]
                Object.assign(fragment.config, action.payload.changes);
            }
        },
        viewUpdateFragmentFixedConfig: (state, action: PayloadAction<{
            viewId: number;
            fragmentId: number;
            changes: Partial<ViewFragmentFixed>
        }>) => {
            const view = state.entities[action.payload.viewId];
            if (view) {
                const fragment: ViewFragment = view.config["fragment" + action.payload.fragmentId]
                Object.assign(fragment.config, action.payload.changes);
            }
        },
    }
})

export const profileViewsReducer = viewsSlice.reducer
export const profileViewsActions = viewsSlice.actions
export const profileViewsSelectors = viewAdapter.getSelectors((state: RootState) => state.profile.views)
