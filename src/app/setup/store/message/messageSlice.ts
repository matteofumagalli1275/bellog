import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {DialogMessageSeverity} from "../../components/dialogs/DialogMessage";

const initialState = {
    id: 0,
    message: "",
    code: 0,
    type: DialogMessageSeverity.SUCCESS,
    visible: false
}

const messageSlice = createSlice({
    name: 'message',
    initialState: initialState,
    reducers: {
        setError: (state, action) => {
            state.id = state.id + 1
            state.message = action.payload
            state.type = DialogMessageSeverity.ERROR
            state.visible = true
        },
        hideError: (state) => {
            state.visible = false
        }
    }
})

export const messageReducer = messageSlice.reducer
export const messageActions = messageSlice.actions