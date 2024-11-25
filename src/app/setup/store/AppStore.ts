import {configureStore, Tuple} from '@reduxjs/toolkit'
import {dbEntriesRootReducer} from "./dbEntries/dbEntries";
import {useDispatch} from "react-redux";
import {profileRootReducer} from "./profile/Profile";
import {messageReducer} from "./message/messageSlice";
import {statusBarReducer} from "./statusBar/statusBarSlice";
import {storeMiddleWare} from "./Middleware";
import {librariesReducer} from "./dependencies/dependencies";


export const appStore = configureStore({
    reducer: {
        profile: profileRootReducer,
        dependencies: librariesReducer,
        dbEntries: dbEntriesRootReducer,
        messageSlice: messageReducer,
        statusBar: statusBarReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(storeMiddleWare),
    devTools: true
})

// Infer the type of `store`
export type AppStore = typeof appStore
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof appStore.dispatch
// Same for the `RootState` type
export type RootState = ReturnType<typeof appStore.getState>