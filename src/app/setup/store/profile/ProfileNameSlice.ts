import { createSlice } from '@reduxjs/toolkit';

const name = createSlice({
    name: 'name',
    initialState: "New Profile",
    reducers: {
        setProfileName: (state, action) => action.payload, // Update the name
    },
});

export const profileNameReducer = name.reducer
export const profileNameActions = name.actions