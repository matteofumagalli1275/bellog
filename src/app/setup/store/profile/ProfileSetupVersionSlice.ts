import { createSlice } from '@reduxjs/toolkit';
import {PROFILE_VERSION, SCHEMA_VERSION} from "../../../../Version";

const schemaVersion = createSlice({
    name: 'schemaVersion',
    initialState: SCHEMA_VERSION, // Initial value for the "name" variable
    reducers: {},
});

export const profileSchemaVersionReducer = schemaVersion.reducer