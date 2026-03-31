import * as React from "react";
import {useState} from "react";
import {useDispatch, useSelector} from 'react-redux';
import {
    CompareDataCode,
    CompareDataQuery,
    CompareDataType,
    RenderModeCode, RenderModeGui, RenderModeType
} from "../../../../../common/model/profile/Common";
import {ElementReferenceComponent} from "../ElementReferenceComponent";
import {RootState} from "../../../../store/AppStore";
import {profileSelectEventDeps, profileSelectViewFragmentById} from "../../../../store/profile/ProfileSelectors";
import {ConditionalRenderProperty} from "../../../../../common/model/profile/Filter";
import {profileConditionalRendersActions, profileConditionalRendersSelectors} from "../../../../store/profile/ProfileConditionalRendersSlice";
import {LayerTreeNodeSelectDialog} from "../../../dialogs/special/LayerTreeNodeSelectDialog";
import {getElementFromRef} from "../../../Utils";
import {profileChannelSelectors} from "../../../../store/profile/ProfileChannelsSlice";
import {librariesExportsSelectors} from "../../../../store/dependencies/dependencies";
import {ChannelNodeLayerData} from "../../../../../common/model/profile/Channel";
import {ActionParamMapping} from "../../../../../common/model/profile/Actions";
import {QueryComponent} from "../../../QueryComponent";
import {getExpectedNodeOutputParams, getNodeOutputParamsWithAncestors} from "../../../../../common/utility/CommonUtil";
import {
    buildAutoConditionalRenderGuiMappings,
    buildDefaultConditionalRendersCompareDataSettings,
    buildDefaultConditionalRendersGuiMapping, buildDefaultConditionalRendersModeSettings
} from "../../../../DefaultPropertiesConditionalRenders";
import {CodeComponent} from "../CodeComponent";
import {HtmlParamMappings} from "../HtmlParamMappings";
import {IOParameter} from "../../../../../common/model/profile/Layer";

export const ViewFragmentConditionalRenderComponent = (props: {
    fragmentId: number,
    viewId: number,
    filterId: number,
    onNameChange?: (id: number, newName: string) => void,
}) => {
    const dispatch = useDispatch();

    const [layerSelectDialogOpen, setLayerSelectDialogOpen] = useState(false);

    const deps = useSelector(profileSelectEventDeps)
    const conditional = useSelector((state: RootState) => profileConditionalRendersSelectors.selectById(state, props.filterId))

    const channels = useSelector(profileChannelSelectors.selectAll)
    const libraries = useSelector(librariesExportsSelectors.selectAll)

    const name = conditional?.name ?? ""
    const channelRef = conditional?.channelRef
    const channel = channelRef ? getElementFromRef(channelRef, channels, libraries) : undefined
    const htmlSelected = conditional?.htmlRef ? getElementFromRef(conditional.htmlRef, deps.htmls, deps.libraries) : undefined

    // Resolve the selected layer node — must happen BEFORE availableParams
    let conditionalLayerLabelName = "Unknown"
    let conditionalLayer: ChannelNodeLayerData | undefined
    if (channel) {
        const found = channel.config.nodes.find(n => n.id === conditional.layerId.toString());
        if (found) {
            conditionalLayerLabelName = found.data.label;
            conditionalLayer = found.data;
        }
    }

    // Collect params from the selected node AND all its ancestors in the channel graph
    const availableParams: IOParameter[] = (channel && conditional)
        ? getNodeOutputParamsWithAncestors(
            conditional.layerId.toString(),
            channel.config.nodes,
            channel.config.edges,
            deps
          )
        : [];

    if (!conditional) {
        return <div className="notification is-warning">Filter not found.</div>
    }

    function update(key: keyof ConditionalRenderProperty, value: any) {
        dispatch(profileConditionalRendersActions.updateOne({id: props.filterId, changes: {[key]: value}}))
        if (key === 'name' && props.onNameChange) {
            props.onNameChange(props.filterId, value);
        }
    }

    return (
        <>
            <div className="field">
                <label className="label">Filter Name</label>
                <div className="control">
                    <input className="input" type="text" placeholder="Filter name" value={name}
                           onChange={(evt) => update("name", evt.target.value)}/>
                </div>
            </div>

            <div className="field">
                <div className="control">
                    <label className="checkbox">
                        <input type="checkbox"
                               checked={conditional.stopPropagation}
                               onChange={(evt) => update("stopPropagation", evt.target.checked)}
                        />
                        &nbsp;Absorb
                        <span className="ml-2 has-text-info has-tooltip-right icon"
                              data-tooltip="When checked and this filter matches, subsequent filters are skipped (first-match wins).">
                            <i className="fas fa-circle-info"></i>
                        </span>
                    </label>
                </div>
            </div>

            <ElementReferenceComponent title={"Channel"} elementReference={channelRef}
                                       onUpdate={(newRef) => update("channelRef", newRef)}/>
            <div className="field is-grouped">
                <div className="field">
                    <label className="label">Layer</label>
                    <div className="control">
                        <div className="field has-addons" style={{maxWidth: "400px"}}>
                            <p className="control is-expanded">
                                <input className="input" type="text" disabled={true} value={conditionalLayerLabelName}/>
                            </p>
                            <p className="control">
                                <button className="button" onClick={() => setLayerSelectDialogOpen(true)}>
                                    Select
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {
                layerSelectDialogOpen && channel &&
                <LayerTreeNodeSelectDialog
                    nodes={channel.config.nodes}
                    edges={channel.config.edges}
                    onSelect={(id, node) => {
                        update("layerId", parseInt(id))
                        setLayerSelectDialogOpen(false)
                    }}
                    onClose={() => setLayerSelectDialogOpen(false)}
                />
            }

            <div className="field">
                <label className="label">Compare Type</label>
                <div className="control">
                    <div className="select">
                        <select value={conditional.compareDataType}
                                onChange={(evt) => {
                                    const newType = evt.target.value as CompareDataType;
                                    dispatch(profileConditionalRendersActions.updateOne({id: props.filterId, changes: {
                                        compareDataType: newType,
                                        compareDataSettings: buildDefaultConditionalRendersCompareDataSettings(newType, availableParams)
                                    }}))
                                }}>
                            <option key={CompareDataType.Query}>{CompareDataType.Query}</option>
                            <option key={CompareDataType.Code}>{CompareDataType.Code}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-2 mb-2">
                {conditional.compareDataType === CompareDataType.Query && conditionalLayer &&
                    <QueryComponent
                        query={(conditional.compareDataSettings as CompareDataQuery).query}
                        params={availableParams}
                        onQueryUpdate={(query) => {
                            update("compareDataSettings", {query: query})
                        }}
                    />
                }
                {conditional.compareDataType === CompareDataType.Code &&
                    <CodeComponent
                        code={(conditional.compareDataSettings as CompareDataCode).code}
                        onCodeUpdate={(code) => update("compareDataSettings", {code: code})}
                    />
                }
            </div>

            <div className="field">
                <label className="label">Bind Type</label>
                <div className="control">
                    <div className="select">
                        <select value={conditional.renderModeType}
                                onChange={(evt) => {
                                    const newMode = evt.target.value as RenderModeType;
                                    const newSettings = (newMode === RenderModeType.Gui && htmlSelected)
                                        ? { mappings: buildAutoConditionalRenderGuiMappings(htmlSelected.config.properties, availableParams) }
                                        : buildDefaultConditionalRendersModeSettings(newMode, htmlSelected, availableParams);
                                    dispatch(profileConditionalRendersActions.updateOne({id: props.filterId, changes: {
                                        renderModeType: newMode,
                                        renderModeSettings: newSettings
                                    }}))
                                }}>
                            {
                                Object.values(RenderModeType).map((it) =>
                                    <option key={it} value={it}>{it}</option>
                                )
                            }
                        </select>
                    </div>
                </div>
            </div>

            <ElementReferenceComponent title={"Select Html Element"}
                                       elementReference={conditional.htmlRef}
                                       onUpdate={(ref) => {
                                           update("htmlRef", ref);
                                           // Auto-populate GUI mappings when HTML component changes
                                           if (conditional.renderModeType === RenderModeType.Gui) {
                                               const newHtml = getElementFromRef(ref, deps.htmls, deps.libraries);
                                               if (newHtml) {
                                                   const autoMappings = buildAutoConditionalRenderGuiMappings(
                                                       newHtml.config.properties,
                                                       availableParams
                                                   );
                                                   update("renderModeSettings", { mappings: autoMappings });
                                               }
                                           }
                                       }}/>

            {
                conditional.renderModeType === RenderModeType.Code &&
                <CodeComponent
                    code={(conditional.renderModeSettings as RenderModeCode).code}
                    onCodeUpdate={(code) => update("renderModeSettings", {code: code})}
                />
            }

            {
                conditional.renderModeType === RenderModeType.Gui && conditionalLayer &&
                <>
                    <fieldset className="fieldset">
                        <legend className="ml-2">Overrides</legend>
                        <HtmlParamMappings
                            mappings={(conditional.renderModeSettings as RenderModeGui).mappings}
                            availableParams={availableParams}
                            htmlProps={htmlSelected?.config?.properties}
                            setOValue={(index: number, key: keyof ActionParamMapping, value: any) => {
                                const mappings = (conditional.renderModeSettings as RenderModeGui).mappings
                                update("renderModeSettings", {
                                    mappings: mappings.map((v, vindex) => {
                                        if (index === vindex)
                                            return {...v, [key]: value}
                                        return v
                                    })
                                })
                            }}
                            updateOvalues={(mappings) => update("renderModeSettings", {mappings: mappings})}
                        />
                        <button className="button is-success" onClick={() => {
                            const mappings = (conditional.renderModeSettings as RenderModeGui).mappings
                            update("renderModeSettings", {mappings: [...mappings, buildDefaultConditionalRendersGuiMapping()]})
                        }}>Add Override
                        </button>
                    </fieldset>
                </>
            }
        </>
    )
};