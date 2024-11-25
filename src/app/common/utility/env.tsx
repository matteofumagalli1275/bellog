import * as React from "react";
import {InterfaceType} from "../model/profile/Interface";

// Defined by Webpack.DefinePlugin
declare const LOCAL_MODE: boolean;

export function isWebMode(): boolean {
    try {
        if(LOCAL_MODE)
            return false;
    } catch (e) {}

    return true;
}