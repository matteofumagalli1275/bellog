import * as beautify from "js-beautify"
import {DriverFactory} from "../runtime/interfaces/DriverFactory";
import {SCHEMA_VERSION} from "../../Version";
import {InterfaceSettings, InterfacesProperty, InterfaceType} from "../common/model/profile/Interface";
import {CodeProperty, ElementType, ScriptExportedSymbols} from "../common/model/profile/Common";
import {ProfileProperty} from "../common/model/profile/Profile";
import {HtmlComponentDiv} from "../common/res/embeddedSetupObjects/htmlComponents/Div";
import {ViewFragment, ViewFragmentType} from "../common/model/profile/View";
import {getEmbeddedRefFromElement} from "./components/Utils";


const beautifyOptions = { indent_size: 2, space_in_empty_paren: true }

export function buildDefaultInterfaces(values: InterfacesProperty[]): [number, InterfacesProperty] {

    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    return [maxId + 1, {
        id: maxId + 1,
        name: "Interface " + (maxId + 1),
        type: InterfaceType.InterfaceClipboard,
        settings: buildDefaultInterfaceSettings(InterfaceType.InterfaceClipboard),
        deleted: false
    }]
}

export function buildDefaultInterfaceSettings(type: InterfaceType): InterfaceSettings {
    function toBindable(val) {
        const keys = Object.keys(val)
        let newMap = {}
        keys.forEach((key) => {
            newMap[key] = {
                bind: false,
                value: val[key]
            }
        })
        return newMap
    }
    switch (type) {
        case InterfaceType.InterfaceClipboard:
            return {}
        case InterfaceType.InterfaceSerialPortWebSerial:
            return toBindable({
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: "none",
                bufferSize: 255,
                flowControl: "none",
                cacheTimeout: 200,
                cacheMaxElemCount: 100,
            })
        case InterfaceType.InterfaceWebAdb:
            return toBindable({clearLogAtConnection: false})
        case InterfaceType.InterfaceTcpSocket:
            return toBindable({
                ip: "192.168.1.10",
                port: 5555,
                ssl: false,
                wsPort: 8765,
            })
        case InterfaceType.InterfaceCAN:
            return toBindable({
                transport: "serial",
                bitrate: 500000,
                busMode: "normal",
                canFd: false,
                socketUrl: "ws://localhost:8080",
                idWhitelist: "",
                defaultCanId: "0x000",
            })
        default:
            return {}
    }
}

export function buildDefaultGlobalScript(values: CodeProperty[]): [number, CodeProperty] {
    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    return [
        maxId + 1, {
            id: maxId + 1,
            name: `Unnamed-${maxId+1}.js`,
            code: beautify(`
            // Access and modify global symbols declared in the Exported Symbols table:
            // const value = bellog.symbols.get("myvar");
            // bellog.symbols.set("myvar", 42);

            // Send data to all connected interfaces:
            // bellog.rawSend("hello");
            // bellog.rawSend(new Uint8Array([0x01, 0x02, 0x03]));

            // Send data to a specific interface by id:
            // const ifc = bellog.getInterfaces()[0];
            // bellog.send(ifc.id, "hello");

            function custom_global_func() {
                console.log("dummy")
            }`, beautifyOptions
            )
        }
    ]
}


export function buildDefaultExportSymbol(values: ScriptExportedSymbols[]): [number, ScriptExportedSymbols] {
    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    return [
        maxId + 1, {
            id: maxId + 1,
            name: "myvar",
            defaultValue: "",
            description: "",
            persistent: false,
            public: false
        }
    ]
}

export function buildDefaultGlobalStyle(values: CodeProperty[]): [number, CodeProperty] {
    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    return [
        maxId + 1, {
            id: maxId + 1,
            name: `Unnamed-${maxId+1}.css`,
            code: ".my_div { color: red; }"
        }
    ]
}


export function buildDefaultViewFragment(type: ViewFragmentType): ViewFragment {

    if(ViewFragmentType.Append === type) {
        return {
            name: "Fragment",
            type: ViewFragmentType.Append,
            percent: 100,
            config: {
                container: getEmbeddedRefFromElement(HtmlComponentDiv, ElementType.Html),
                conditionalRenders: []
            }
        }
    } else {
        return {
            name: "Fragment",
            type: ViewFragmentType.Fixed,
            percent: 100,
            config: {
                ui: getEmbeddedRefFromElement(HtmlComponentDiv, ElementType.Html)
            }
        }
    }
}

/*
export function buildDefaultHtmlBindings(htmlComponent: HtmlProperty,
                                    resolver: FilterExpType, resolverParam: FilterExpRefParameters): HtmlBindingParams | null {
    
    const injectValue = (value, type: UserParamType) => {
        switch(type) {
            case UserParamType.Number:
                return `${value}`;
            default:
                return `"${value}"`
        }
    }

    const resolverResultKeys = buildResolverResultKeys(resolverParam, resolver)

    if(!resolverResultKeys) {
        return null
    }

    const htmlParameters = htmlComponent.properties.parameters

    const bindings = Object.keys(htmlParameters).reduce((acc, name) => {
        const fixed = (htmlParameters[name].type !== UserParamType.Text)
        if(name !== "timestamp") {
            acc[name] = {
                fixed: fixed,
                value: htmlParameters[name].default,
                item: resolverResultKeys[0]
            }
        }
        return acc
    }, {})

    return {
        bindings: bindings,
        code: (() => {
            switch (resolver) {
                case FilterExpType.Regex:
                    return beautify(`
                        function applyObjectToHtml(state, resolvedParsedData)
                        {
                            // resolvedParsedData is the array of the regex result. item 0 is the whole line matches.
                            // items 1..n are the capturing group matches.
                            // ex. regex "hello (.*)" on "Hello Mark"
                            // resolvedParsedData['All'] -> Hello Mark
                            // resolvedParsedData['Group 1'] -> Mark
                            // available resolvedParsedData keys: ${resolverResultKeys.join(" ")}
                            return {${Object.keys(htmlParameters).filter((name) => name !== "timestamp").map((name) => {
                            return `${name}: ${(htmlParameters[name].type === UserParamType.Text) ? `resolvedParsedData["${resolverResultKeys.at(0)}"]` : injectValue(htmlParameters[name].default, htmlParameters[name].type)}\r\n`
                    })}}}`, beautifyOptions)
                case FilterExpType.ObjectCompare:
                    return beautify(`
                        function applyObjectToHtml(state, resolvedParsedData)
                        {
                            // available resolvedParsedData keys: ${resolverResultKeys.join(" ")}
                            return {${Object.keys(htmlParameters).filter((name) => name !== "timestamp").map((name) => {
                            return `${name}: ${(htmlParameters[name].type === UserParamType.Text) ? `resolvedParsedData["${resolverResultKeys.at(0)}"]` : injectValue(htmlParameters[name].default, htmlParameters[name].type)}\r\n`
                    })}}}`, beautifyOptions)
                default:
                    return beautify(`
                        function applyObjectToHtml(state, resolvedParsedData)
                        {
                            // available resolvedParsedData keys: ${resolverResultKeys.join(" ")}
                            return {${Object.keys(htmlParameters).filter((name) => name !== "timestamp").map((name) => {
                            return `${name}: ${(htmlParameters[name].type === UserParamType.Text) ? `resolvedParsedData["${resolverResultKeys.at(0)}"]` : injectValue(htmlParameters[name].default, htmlParameters[name].type)}\r\n`
                    })}}}`, beautifyOptions)
            }
        }
        )()
    }
}*/
/*
export function buildDefaultAction(value: ActionProperties, avaiableCustomBuilders: SetupCustomBuilderProperties): [number,CustomActionProperty] {

    let maxId = Math.max(...value.ids.map(o => o))
    maxId = maxId < 0 ? 0 : maxId
    
    return [
        maxId + 1,
        {
            id: maxId + 1,
            name: "New ChannelUpdateEvent" + (maxId + 1),
            actionType: CustomActionType.SendData,
            actionSettings: {
                builderType: BuilderType.LineBuilder,
                builderParams: {},
                builderBindingType: HtmlBindingType.Gui,
                interfacesRef: []
            }
        }
    ]
}

export function buildDefaultActionBindings(builderType: string, builderCustomID: number | null, avaiableCustomBuilders: SetupCustomBuilderProperties): HtmlBindingParams | null {
    let keys = null

    switch(builderType) {
        case BuilderType.LineBuilder:
            keys = {}
            keys['Text'] = "Text"
            break;
        case BuilderType.HexStringBuilder:
            keys = {}
            keys['HexString'] = "AABBCCDD"
            break;
        case BuilderType.CustomBuilder:
            try {
                let customBuilder = avaiableCustomBuilders[builderCustomID]
                const customBuilderFunc =  new Function("return " + customBuilder.code)()
                const [args, _] = customBuilderFunc({}, null)
                keys = args
            } catch(e) {}
            break;
    }

    if(!keys) {
        return null
    }

    const bindings = Object.keys(keys).reduce((acc, key) => {
        acc[key] = { fixed: true, value: keys[key] }
        return acc
    }, {})

    return {
        bindings: bindings,
        code: (() => {
            return beautify(`
            function composeAction(state)
            {
                // available args keys: ${Object.keys(bindings).join(" ")}
                return ${JSON.stringify(keys)}
            }`, beautifyOptions)
        }
        )()
    }
}*/

export function buildDefaultDriverWebSerialSettings(driverName: string): InterfaceSettings {
    return DriverFactory.getDefaultParams(driverName)
}

export function getDefaultProfileDbFormat(): ProfileProperty {
    return {
        name: "New Profile",
        schemaVersion: SCHEMA_VERSION,
        interfaces: [
            buildDefaultInterfaces([])[1]
        ],
        views: [],
        channels: [],
        htmls: [],
        events: [],
        actions: [],
        conditionalRenderings:[],
        scripts: [],
        scriptsExportedSymbols: [],
        styles: [
            { id: 1, name: "bulma.css", code: "@import url('/bulma.min.css');\n@import url('/bulma-tooltip.min.css');" },
            { id: 2, name: "font-awesome.css", code: "@import url('/font-awesome.all.min.css');" }
        ],
        layers: [],
        dependencies: [],
        settings: {
            isLibrary: false,
            rdnId: "",
            version: "1.0.0",
            maximumItemsPerView: 10000
        }
    }
}