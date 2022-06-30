import {createContext} from "react";
import {SetupGlobalScriptProperties} from "./setup/SetupInterfaces";

export interface IProfile {
    profileName?: string
    driverName?: string
    renderName?: string
    views?: any[]
    scripts: SetupGlobalScriptProperties[]
    parsers: any[]
}

export type ContextWithSetter<T> = [T, (value: T) => void]