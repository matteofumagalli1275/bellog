import * as React from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import CodeEditor from "../../../CodeEditor";
import {useDispatch, useSelector} from "react-redux";
import {
    profileSelectHtmlById,
    profileSelectScripts,
    profileSelectStyles
} from "../../../../store/profile/ProfileSelectors";
import {appStore, RootState} from "../../../../store/AppStore";
import {profileHtmlsActions} from "../../../../store/profile/ProfileHtmlsSlice";
import {CustomProperty, CustomPropertyType} from "../../../../../common/model/profile/Common";
import {
    HtmlComponentDefinitionFramework,
    HtmlJavascriptHookConfig,
    HtmlProperty
} from "../../../../../common/model/profile/Html";
import ImportEmbeddedElementDialog from "../../../dialogs/special/ImportEmbeddedElementDialog";
import {HtmlComponentDiv} from "../../../../../common/res/embeddedSetupObjects/htmlComponents/Div";
import {
    HtmlComponentDivWithTimestamp
} from "../../../../../common/res/embeddedSetupObjects/htmlComponents/DivWithTimestamp";
import {HtmlComponentButton} from "../../../../../common/res/embeddedSetupObjects/htmlComponents/Button";
import {HtmlComponentRaw} from "../../../../../common/res/embeddedSetupObjects/htmlComponents/Raw";
import {CustomPropertiesComponent} from "../CustomPropertiesComponent";
import {buildIframePreviewSource} from "../../../PreviewUtil";

enum TabType {
    CodeTab,
    PreviewTab
}

export const HtmlComponentSetup = (props: {
    id: number
}) => {

    const dispatch = useDispatch();
    const [importDialogOpen, setImportDialogOpen] = useState(false)

    const html = useSelector((state: RootState) => profileSelectHtmlById(state, props.id))
    const initialCode = appStore.getState().profile.htmls.entities[props.id].config.code

    const name = html.name
    const type = html.type
    const code = html.config.code
    const properties = html.config.properties

    const [selectedTab, setSelectedTab] = useState(TabType.CodeTab)

    const previewRef = useRef<HTMLIFrameElement>()

    function update(key: keyof HtmlProperty, value: any) {
        dispatch(profileHtmlsActions.htmlUpdateOne({id: props.id, changes: {[key]: value}}))
    }

    function setProperties(properties: CustomProperty[]) {
        switch (html.type) {
            case HtmlComponentDefinitionFramework.JavascriptHook:
                dispatch(profileHtmlsActions.htmlUpdateJavascriptHookConfig({id: props.id, changes: {"properties": properties}}))
                break;
            case HtmlComponentDefinitionFramework.SimpleTemplateLiteral:
                dispatch(profileHtmlsActions.htmlUpdateTemplateLiteralConfig({id: props.id, changes: {"properties": properties}}))
                break;
        }
    }

    function setCode(properties: string) {
        switch (html.type) {
            case HtmlComponentDefinitionFramework.JavascriptHook:
                dispatch(profileHtmlsActions.htmlUpdateJavascriptHookConfig({id: props.id, changes: {"code": properties}}))
                break;
            case HtmlComponentDefinitionFramework.SimpleTemplateLiteral:
                dispatch(profileHtmlsActions.htmlUpdateTemplateLiteralConfig({id: props.id, changes: {"code": properties}}))
                break;
        }
    }

    function paramAutocomplete(context) {
        const word = context.matchBefore(/\w*/);
        if (!word) return null;

        const from = word.from;
        const to = word.to;

        const possibleParams = properties.filter((it) => it.name.startsWith(word.text));

        return {
            from,
            to,
            options: possibleParams.map((it) => ({label: it.name, type: "variable"})),
        };
    }

    function updateImport(item: HtmlProperty) {
        dispatch(profileHtmlsActions.htmlUpdateType({
            id: props.id,
            type: item.type,
        }))
        setProperties(item.config.properties)
        setCode(item.config.code)
    }

    useMemo(() => {
        if (selectedTab === TabType.PreviewTab) {
            try {
                previewRef.current.srcdoc = buildIframePreviewSource(
                    `
                        <script>
                        const properties = ${JSON.stringify(properties)}
                        const type = ${JSON.stringify(type)}
                        const code = ${JSON.stringify(code)}
                        const args = properties.map((param) => {
                            let value
                            if(!param.default.bind)
                                value = param.default.value
                            else if(param.default.symbol) {
                                if(param.default.symbol.libraryRdnId.length <= 0)
                                    value = eval("bellog.symbols." + param.default.symbol.name)
                                else
                                    value = eval("bellog.libraries["+param.default.symbol.libraryRdnId+"].symbols." + param.default.symbol.name)
                            }
                            else 
                                value = "Unavailable"
                           if(param.safeHtml) {
                               value = value ? DOMPurify.sanitize(value) : "undefined"
                           }
                           return value
                        })
                        const argNames = properties.map((param) => {
                            return param.name
                        })
                        if(type === "${HtmlComponentDefinitionFramework.JavascriptHook}")
                            new Function(...argNames, code).call(document.body, ...args)
                        else {
                            document.body.innerHTML = new Function(...argNames, "return \`" + code + "\`").call(document.body, ...args)
                        }
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
    }, [selectedTab, properties]);

    return (
        <React.Fragment>

            {
                importDialogOpen ?
                    <ImportEmbeddedElementDialog
                        items={[HtmlComponentDiv, HtmlComponentDivWithTimestamp, HtmlComponentButton, HtmlComponentRaw]}
                        onSelected={(it) => {
                            updateImport(it)
                        }}
                        onClose={() => setImportDialogOpen(false)}
                    /> : ""
            }

            <div className="field is-grouped">
                <div className="control is-expanded">
                    <input className="input" type="text" placeholder="Text input" value={name}
                           onChange={(evt) => update("name", evt.target.value)}/>
                </div>
                <button className="button is-info" onClick={() => setImportDialogOpen(true)}>Import Sample</button>
            </div>
            <div className="tabs is-left is-boxed">
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
                            <span>Preview</span>
                        </a>
                    </li>
                </ul>
            </div>


            <div
                className={`box ${selectedTab == TabType.PreviewTab ? "" : "is-hidden"}`} style={{height: '500px'}}
            >
                <iframe ref={previewRef} tabIndex={-1}>

                </iframe>
            </div>
            <div
                className={`box ${selectedTab == TabType.CodeTab ? "" : "is-hidden"}`} style={{height: '500px'}}
            >
                <CodeEditor
                    value={initialCode}
                    isHtml={true}
                    isJs={true}
                    maxHeight={"465px"}
                    additionalCompletitionSource={paramAutocomplete}
                    onChange={(value) => {
                        setCode(value)
                    }}/>
            </div>

            <CustomPropertiesComponent
                overrideMode={false}
                overrideTitle={"Properties"}
                properties={properties}
                setProperties={setProperties}
            />

        </React.Fragment>
    )
}