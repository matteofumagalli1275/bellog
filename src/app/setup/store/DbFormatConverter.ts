
import {ProfileState} from "./profile/Profile";
import {ProfileProperty} from "../../common/model/profile/Profile";
import {ElementReference, ElementReferenceType, ElementType} from "../../common/model/profile/Common";
import {EventType} from "../../common/model/profile/Event";
import {ActionType, ActionRenderSettings, ActionSendDataSettings} from "../../common/model/profile/Actions";
import {ViewFragmentType, ViewFragmentAppend} from "../../common/model/profile/View";
import {ChannelType} from "../../common/model/profile/Channel";

/**
 * Resolve an ElementReference to check if the target entity exists.
 * Returns true if the reference is valid, false otherwise.
 */
function isValidRef(ref: ElementReference, entityMap: { ids: number[], entities: { [key: number]: any } }): boolean {
    if (!ref) return false;
    if (ref.refType === ElementReferenceType.EmbeddedReference) return true;
    if (ref.refType === ElementReferenceType.LibraryReference) return true; // validated separately via deps
    return entityMap.ids.includes(ref.refId);
}

function refLabel(ref: ElementReference): string {
    if (!ref) return '(null)';
    return `${ref.type} "${ref.refName}" (id=${ref.refId}, ${ref.refType})`;
}

export function convertDbFormatToReduxState(profileDb: ProfileProperty): [ProfileState, string[]] {

    const createIdMap = (items: any[], itemName: string): { ids: number[], entities: { [key: number]: any } } => {
        const entities = {};
        const ids = [];
        for (const item of items) {
            if (!item.id) {
                throw new Error(`Missing ID for ${itemName} item: ${JSON.stringify(item)}`);
            }
            ids.push(item.id);
            entities[item.id] = item;
        }
        return {
            ids: ids,
            entities: entities
        };
    };

    const profileState: ProfileState = {
        name: profileDb.name,
        schemaVersion: profileDb.schemaVersion,
        interfaces: createIdMap(profileDb.interfaces, 'interfaces'),
        views: createIdMap(profileDb.views, 'views'),
        channels: createIdMap(profileDb.channels, 'channels'),
        htmls: createIdMap(profileDb.htmls, 'htmls'),
        events: createIdMap(profileDb.events, 'events'),
        actions: createIdMap(profileDb.actions, 'actions'),
        conditionalRenderings: createIdMap(profileDb.conditionalRenderings, 'filters'),
        layers: createIdMap(profileDb.layers, 'layers'),
        scripts: createIdMap(profileDb.scripts, 'scripts'),
        scriptsExportedSymbols: createIdMap(profileDb.scriptsExportedSymbols, 'scriptsExportedSymbols'),
        styles: createIdMap(profileDb.styles, 'styles'),
        dependencies: createIdMap(profileDb.dependencies, 'dependencies'),
        settings: profileDb.settings
    };

    const anomalies = validateProfileState(profileState);
    return [profileState, anomalies];
}

/**
 * Validate cross-references between all profile entities.
 * Returns a list of human-readable warning messages for broken relations.
 */
export function validateProfileState(profileState: ProfileState): string[] {
    const anomalies: string[] = [];

    // --- Channels ---
    for (const channelId of profileState.channels.ids) {
        const channel = profileState.channels.entities[channelId];
        if (!channel) continue;

        // Channel graph nodes → layer refs
        for (const node of channel.config.nodes) {
            if (node.data.layerRef && !isValidRef(node.data.layerRef, profileState.layers)) {
                anomalies.push(`Channel "${channel.name}" node "${node.data.label}" references missing layer: ${refLabel(node.data.layerRef)}`);
            }
        }

        // Channel graph edges → source/target nodes exist
        const nodeIds = new Set(channel.config.nodes.map(n => n.id));
        for (const edge of channel.config.edges) {
            if (!nodeIds.has(edge.source)) {
                anomalies.push(`Channel "${channel.name}" edge "${edge.id}" references missing source node "${edge.source}"`);
            }
            if (!nodeIds.has(edge.target)) {
                anomalies.push(`Channel "${channel.name}" edge "${edge.id}" references missing target node "${edge.target}"`);
            }
        }

        // Output channels should have at most one leaf node
        if (channel.type === ChannelType.Output) {
            const sources = new Set(channel.config.edges.map(e => e.source));
            const leafCount = channel.config.nodes.filter(n =>
                n.type !== 'input' && n.type !== 'output' && !sources.has(n.id)
            ).length;
            if (leafCount > 1) {
                anomalies.push(`Channel "${channel.name}" (Output) has ${leafCount} leaf nodes — only the first will be used at runtime`);
            }
        }
    }

    // --- Events ---
    for (const eventId of profileState.events.ids) {
        const event = profileState.events.entities[eventId];
        if (!event) continue;

        if (event.type === EventType.ChannelUpdate) {
            const config = event.config;

            // Event → channel ref
            if (!isValidRef(config.channelRef, profileState.channels)) {
                anomalies.push(`Event "${event.name}" references missing channel: ${refLabel(config.channelRef)}`);
            } else {
                // Check layerId points to a valid node in the channel
                const channel = profileState.channels.entities[config.channelRef.refId];
                if (channel && config.layerId !== -1) {
                    const nodeExists = channel.config.nodes.some(n => n.id === config.layerId.toString());
                    if (!nodeExists) {
                        anomalies.push(`Event "${event.name}" references missing layer node (id=${config.layerId}) in channel "${channel.name}"`);
                    }
                }
            }

            // Event → action ref
            if (!isValidRef(config.actionRef, profileState.actions)) {
                anomalies.push(`Event "${event.name}" references missing action: ${refLabel(config.actionRef)}`);
            }
        }
    }

    // --- Actions ---
    for (const actionId of profileState.actions.ids) {
        const action = profileState.actions.entities[actionId];
        if (!action) continue;

        if (action.type === ActionType.SendData) {
            const config = action.config as ActionSendDataSettings;
            if (config.channelRef && !isValidRef(config.channelRef, profileState.channels)) {
                anomalies.push(`Action "${action.name}" (SendData) references missing channel: ${refLabel(config.channelRef)}`);
            }
        }

        if (action.type === ActionType.ReplaceHtmlProperties) {
            const config = action.config as ActionRenderSettings;
            if (config.viewRef && !isValidRef(config.viewRef, profileState.views)) {
                anomalies.push(`Action "${action.name}" (ReplaceHtmlProperties) references missing view: ${refLabel(config.viewRef)}`);
            }
            if (config.elementToRender?.htmlRef && !isValidRef(config.elementToRender.htmlRef, profileState.htmls)) {
                anomalies.push(`Action "${action.name}" (ReplaceHtmlProperties) references missing HTML: ${refLabel(config.elementToRender.htmlRef)}`);
            }
        }
    }

    // --- Views ---
    for (const viewId of profileState.views.ids) {
        const view = profileState.views.entities[viewId];
        if (!view) continue;

        const fragments = [view.config.fragment1, view.config.fragment2, view.config.fragment3].filter(Boolean);
        for (const fragment of fragments) {
            if (fragment.type === ViewFragmentType.Append) {
                const appendConfig = fragment.config as ViewFragmentAppend;

                // Fragment → container HTML ref
                if (appendConfig.container && !isValidRef(appendConfig.container, profileState.htmls)) {
                    anomalies.push(`View "${view.name}" fragment "${fragment.name}" references missing HTML container: ${refLabel(appendConfig.container)}`);
                }

                // Fragment → conditional render (filter) refs
                if (appendConfig.conditionalRenders) {
                    for (const filterRef of appendConfig.conditionalRenders) {
                        if (!isValidRef(filterRef, profileState.conditionalRenderings)) {
                            anomalies.push(`View "${view.name}" fragment "${fragment.name}" references missing filter: ${refLabel(filterRef)}`);
                        }
                    }
                }
            }

            if (fragment.type === ViewFragmentType.Fixed) {
                const fixedConfig = fragment.config as { ui: ElementReference };
                if (fixedConfig.ui && !isValidRef(fixedConfig.ui, profileState.htmls)) {
                    anomalies.push(`View "${view.name}" fragment "${fragment.name}" (Fixed) references missing HTML: ${refLabel(fixedConfig.ui)}`);
                }
            }
        }
    }

    // --- Conditional Renders (Filters) ---
    for (const filterId of profileState.conditionalRenderings.ids) {
        const filter = profileState.conditionalRenderings.entities[filterId];
        if (!filter) continue;

        // Filter → channel ref
        if (filter.channelRef && !isValidRef(filter.channelRef, profileState.channels)) {
            anomalies.push(`Filter "${filter.name}" references missing channel: ${refLabel(filter.channelRef)}`);
        } else if (filter.channelRef) {
            // Check layerId node exists in channel
            const channel = profileState.channels.entities[filter.channelRef.refId];
            if (channel && filter.layerId !== -1) {
                const nodeExists = channel.config.nodes.some(n => n.id === filter.layerId.toString());
                if (!nodeExists) {
                    anomalies.push(`Filter "${filter.name}" references missing layer node (id=${filter.layerId}) in channel "${channel.name}"`);
                }
            }
        }

        // Filter → html ref
        if (filter.htmlRef && !isValidRef(filter.htmlRef, profileState.htmls)) {
            anomalies.push(`Filter "${filter.name}" references missing HTML: ${refLabel(filter.htmlRef)}`);
        }
    }

    return anomalies;
}

export function convertReduxStateToDbFormat(profileState: ProfileState): ProfileProperty {
    return {
        name: profileState.name,
        schemaVersion: profileState.schemaVersion,
        interfaces: Object.values(profileState.interfaces.entities),
        views: Object.values(profileState.views.entities),
        channels: Object.values(profileState.channels.entities),
        htmls: Object.values(profileState.htmls.entities),
        events: Object.values(profileState.events.entities),
        actions: Object.values(profileState.actions.entities),
        conditionalRenderings: Object.values(profileState.conditionalRenderings.entities),
        layers: Object.values(profileState.layers.entities),
        dependencies: Object.values(profileState.dependencies.entities),
        scripts: Object.values(profileState.scripts.entities),
        scriptsExportedSymbols: Object.values(profileState.scriptsExportedSymbols.entities),
        styles: Object.values(profileState.styles.entities),
        settings: profileState.settings
    }
}