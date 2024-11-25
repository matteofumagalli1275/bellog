import * as React from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import CodeEditor from "../../../CodeEditor";
import {useDispatch, useSelector} from "react-redux";
import {
    profileSelectHtmlById, profileSelectLayerById,
} from "../../../../store/profile/ProfileSelectors";
import {appStore, RootState} from "../../../../store/AppStore";
import {CustomProperty} from "../../../../../common/model/profile/Common";
import {CustomPropertiesComponent} from "../CustomPropertiesComponent";
import {profileLayersActions} from "../../../../store/profile/ProfileLayersSlice";
import {IOParametersComponent} from "../IOParametersComponent";
import {IOParameter, LayerProperty} from "../../../../../common/model/profile/Layer";
import {buildIframePreviewSource} from "../../../PreviewUtil";

import {buildDefaultCustomIOParam} from "../../../../DefaultPropertiesLayers";
import {ImportEmbeddedElementDialog} from "../../../dialogs/special/ImportEmbeddedElementDialog";
import {LineDeserializer} from "../../../../../common/res/embeddedSetupObjects/layer/LineDeserializer";
import {LineSerializer} from "../../../../../common/res/embeddedSetupObjects/layer/LineSerializer";

enum TabType {
    CodeTab,
    PreviewTab
}

export const LayerComponentSetup = (props: {
    id: number
}) => {

    const previewRef = useRef<HTMLIFrameElement>()
    const dispatch = useDispatch();
    const [importDialogOpen, setImportDialogOpen] = useState(false)

    const [selectedTab, setSelectedTab] = useState(TabType.CodeTab)

    const layer = useSelector((state: RootState) => profileSelectLayerById(state, props.id))
    const initialCode = appStore.getState().profile.layers.entities[props.id].config.code
    const initialTestCode = appStore.getState().profile.layers.entities[props.id].config.testCode

    const name = layer.name;
    const deterministic = layer.deterministic ?? false;
    const properties = layer.config.properties;
    const inputParameters = layer.config.input;
    const outputParameters = layer.config.output;

    function update(key: keyof LayerProperty, value: any) {
        dispatch(profileLayersActions.layerUpdateOne({id: props.id, changes: {[key]: value}}))
    }

    function setProperties(properties: CustomProperty[]) {
        dispatch(profileLayersActions.layerConfigUpdate({id: props.id, changes: {"properties": properties}}))
    }

    function addInput() {
        const newInput = buildDefaultCustomIOParam(layer.config.input)
        dispatch(profileLayersActions.layerConfigUpdate({
            id: props.id,
            changes: {"input": [...layer.config.input, newInput]}
        }))
    }

    function deleteInput(paramId: number) {
        dispatch(profileLayersActions.layerConfigUpdate({
            id: props.id, changes:
                {"input": layer.config.input.filter(prop => prop.id !== paramId)}
        }))
    }

    function setInput(input: IOParameter) {
        dispatch(profileLayersActions.layerConfigUpdate({
            id: props.id, changes:
                {"input": layer.config.input.map(prop => prop.id === input.id ? input : prop)}
        }))
    }

    function setOutput(input: IOParameter) {
        dispatch(profileLayersActions.layerConfigUpdate({
            id: props.id, changes:
                {"output": layer.config.output.map(prop => prop.id === input.id ? input : prop)}
        }))
    }

    function addOutput() {
        const newOutput = buildDefaultCustomIOParam(layer.config.output)
        dispatch(profileLayersActions.layerConfigUpdate({
            id: props.id,
            changes: {"output": [...layer.config.output, newOutput]}
        }))
    }

    function deleteOutput(paramId: number) {
        dispatch(profileLayersActions.layerConfigUpdate({
            id: props.id, changes:
                {"output": layer.config.output.filter(prop => prop.id !== paramId)}
        }))
    }

    function updateCode(code: string) {
        dispatch(profileLayersActions.layerConfigUpdate({id: props.id, changes: {code: code}}))
    }

    function updateTestCode(code: string) {
        dispatch(profileLayersActions.layerConfigUpdate({id: props.id, changes: {testCode: code}}))
    }

    function updateImport(item: LayerProperty) {
        dispatch(profileLayersActions.layerConfigUpdate({
            id: props.id,
            changes: {
                code: item.config.code,
                input: item.config.input,
                output: item.config.output,
                properties: item.config.properties,
                testCode: item.config.testCode,
            }
        }))
    }

    useMemo(() => {
        if (selectedTab === TabType.PreviewTab) {
            try {
                const testCode = appStore.getState().profile.layers.entities[props.id].config.testCode
                const accCode = appStore.getState().profile.layers.entities[props.id].config.code

                previewRef.current.srcdoc = buildIframePreviewSource(
                    `
                        <script>
                            const properties = ${JSON.stringify(properties)}
                           const args = properties.reduce((acc, param) => {
                                let value
                                if(!param.default.bind)
                                {
                                    value = param.default.value
                                }
                                else if(param.default.symbol) {
                                    if(param.default.symbol.libraryRdnId.length <= 0)
                                        value = eval("bellog.symbols." + param.default.symbol.name)
                                    else
                                        value = eval("bellog.libraries["+param.default.symbol.libraryRdnId+"].symbols." + param.default.symbol.name)
                                }
                                else
                                    value = "Unavailable"
                                if(param.safeHtml && typeof value === "string") {
                                    value = value ? DOMPurify.sanitize(value) : "undefined"
                                }
                                if(param.type === "Number")
                                    value = parseInt(value)
                                acc[param.name] = value
                                return acc
                            }, {})
                
                            const ctx = {
                                    interfaceId: 0,
                                    interfaceType: "",
                                    streamSourceId: 0,
                                    streamSourceType: "Interface",
                                    isTx: false,
                                    timestamp: 0
                            };
                            
                            const testFunc = ${testCode};
                            const accFunc = ${accCode};
                            const testResults = testFunc(args);
                            testResults.forEach((test, index) => {
                            let expected = [], exception = [];
                        
                            const next = (next, nextData) => expected.push(nextData);
                            const throwException = (err) => exception.push(err);
                        
                            const updatedProps = test.props ? {...args, ...test.props } : args;
                            accFunc(ctx, null, test.test, next, throwException, updatedProps);
                            const success = ((!test.expected ||JSON.stringify(test.expected) === JSON.stringify(expected)) &&
                                (!test.exception ||JSON.stringify(test.exception) === JSON.stringify(exception)))
                            function smartStringify(json) {
                                return JSON.stringify(json, function(k,v) {
                                    if(v instanceof Array || v instanceof Uint8Array)
                                      return JSON.stringify(v);
                                    return v;
                                  }, 2).replace(/\\\\/g, '')
                                        .replace(/\\"\\[/g, '[')
                                        .replace(/\\]\\"/g,']')
                                        .replace(/\\"\\{/g, '{')
                                        .replace(/\\}\\"/g,'}');
                            }
                            document.body.innerHTML += \`
                            <div class="box">
                                <strong>Test \${index}</strong> - \${success
                                    ? '<span class="tag is-success">✅ Passed</span>' 
                                    : '<span class="tag is-danger">❌ Failed</span>'}
                                <details>
                                    <summary>Input / Output</summary>
                                    <pre><code>\${smartStringify({ input: test.test, output: expected, exception: exception })}</code></pre>
                                </details>
                            </div>
                            \`;
                            })
                        </script>
                    `
                )
                previewRef.current.style.width = '100%';
                previewRef.current.style.height = '100%';
                previewRef.current.style.border = 'none';
            } catch (ex) {
                previewRef.current.srcdoc = ex
            }
        } else {
            if (previewRef.current)
                previewRef.current.srcdoc = ""
        }
    }, [selectedTab]);

    return (
        <React.Fragment>

            {importDialogOpen ?
                <ImportEmbeddedElementDialog
                    items={[LineDeserializer, LineSerializer]}
                    onSelected={(it) => {
                        updateImport(it)
                    }}
                    onClose={() => setImportDialogOpen(false)}
                /> : ""}

            <div className="field is-grouped">
                <div className="control is-expanded">
                    <input className="input" type="text" placeholder="Text input" value={name}
                           onChange={(evt) => update("name", evt.target.value)}/>
                </div>
                <button className="button is-info" onClick={() => setImportDialogOpen(true)}>Import Sample</button>
            </div>

            <div className="field">
                <label className="checkbox" title="A deterministic layer always produces the same output for the same input (e.g. a serializer). Its output does not need to be logged since it can be derived from its input.">
                    <input type="checkbox" checked={deterministic}
                           onChange={(evt) => update("deterministic", evt.target.checked)}/> Deterministic
                </label>
            </div>

            <CodeEditor
                value={initialCode}
                isJs={true}
                //additionalCompletitionSource={paramAutocomplete}
                onChange={(value) => {
                    updateCode(value)
                }}/>

            <IOParametersComponent
                title={"Inputs"}
                parameters={inputParameters}
                addProperty={addInput}
                deleteProperty={deleteInput}
                setProperty={setInput}
            />

            <IOParametersComponent
                title={"Outputs"}
                parameters={outputParameters}
                addProperty={addOutput}
                deleteProperty={deleteOutput}
                setProperty={setOutput}
            />

            <CustomPropertiesComponent
                overrideMode={false}
                overrideTitle={"Properties"}
                properties={properties}
                setProperties={setProperties}
            />

            <div className={"title is-6 mt-2 mb-2"}>Tests</div>

            <div className="tabs is-left is-boxed mb-0">
                <ul className="">
                    <li className={"is-clickable " + (selectedTab == TabType.CodeTab ? "is-active" : "")}
                        onClick={() => setSelectedTab(TabType.CodeTab)}>
                        <a>
                                <span className="icon is-small"><i className="fas fa-code"
                                                                   aria-hidden="true"></i></span>
                            <span>Code</span>
                        </a>
                    </li>
                    <li className={"is-clickable " + (selectedTab == TabType.PreviewTab ? "is-active" : "")}
                        onClick={() => {
                            setSelectedTab(TabType.PreviewTab)
                        }}>
                        <a>
                                <span className="icon is-small"><i className="fas fa-video"
                                                                   aria-hidden="true"></i></span>
                            <span>Result</span>
                        </a>
                    </li>
                </ul>
            </div>

            <div
                className={`box mb-0 ${selectedTab == TabType.PreviewTab ? "" : "is-hidden"}`} style={{height: '500px'}}
            >
                <iframe ref={previewRef}>

                </iframe>
            </div>
            <div
                className={`box mb-0 ${selectedTab == TabType.CodeTab ? "" : "is-hidden"}`} style={{height: '500px'}}
            >
                <CodeEditor
                    value={initialTestCode}
                    isJs={true}
                    maxHeight={"465px"}
                    //additionalCompletitionSource={paramAutocomplete}
                    onChange={(value) => {
                        updateTestCode(value)
                    }}/>
            </div>

        </React.Fragment>
    )
}