import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {SettingsProperty} from "../../../common/model/profile/GlobalSettings";

const intialState:SettingsProperty = {
    version: "1.0.0",
    rdnId: "com.mycompany.profilename",
    isLibrary: false,
    maximumItemsPerView: 10000
}

const profileSettings = createSlice({
    name: 'settings',
    initialState: intialState,
    reducers: {
        update: (state, action: PayloadAction<{change: Partial<SettingsProperty>}>) => {
             Object.assign(state, action.payload.change);
        },
    }
});

export const profileSettingsReducer = profileSettings.reducer
export const profileGlobalSettingsActions = profileSettings.actions