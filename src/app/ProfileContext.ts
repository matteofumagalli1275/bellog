import {createContext} from "react";

export interface IProfile {
    profileName?: string
    driverName?: string
    renderName?: string
    views?: any[]
}

export type ContextWithSetter<T> = [T, (value: T) => void]