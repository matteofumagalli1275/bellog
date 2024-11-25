import {createSlice, PayloadAction} from "@reduxjs/toolkit";

type MessageType = {message: string}

const warnings: MessageType[] = []
const errors: MessageType[] = []

const initialState = {
    warnings: warnings,
    errors: errors
}

const statusBarSlice = createSlice({
    name: 'statusBar',
    initialState: initialState,
    reducers: {
        setErrors: (state, action: PayloadAction<MessageType[]>) => {
            state.errors = action.payload
        },
        setWarnings: (state, action: PayloadAction<MessageType[]>) => {
            state.warnings = action.payload
        },
        clearAll: (state) => {
            state.warnings = []
            state.errors = []
        }
    }
})

export const statusBarReducer = statusBarSlice.reducer
export const statusBarActions = statusBarSlice.actions