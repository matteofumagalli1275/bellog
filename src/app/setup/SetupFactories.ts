import {SetupGlobalScriptProperties} from "./SetupInterfaces";
import * as serialize from "serialize-javascript"
import * as beautify from "js-beautify"

export function buildDefaultProfile() {

}

export function buildDefaultGlobalScript() : SetupGlobalScriptProperties {
    return {
        code: beautify(serialize(
            function custom_global_func() {
                console.log("dummy")
            })
        )
    }
}

export function buildDefaultCustomParsers() {

}
