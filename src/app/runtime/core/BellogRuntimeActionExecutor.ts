/**
 * Global function-action registry and action execution engine.
 *
 * Function-type HTML properties (e.g. Button's onClick) register a handler
 * globally so that inline onclick="window.__blr_fnAction('key')" works
 * after innerHTML injection.
 */
import {
    ActionProperty,
    ActionType,
    ActionSendDataSettings,
    ActionRenderSettings,
    ActionCustomSettings,
    FunctionActionConfig,
    FunctionActionMode,
} from "../../common/model/profile/Actions";
import {BindableVariable, ElementReference, RenderModeType} from "../../common/model/profile/Common";
import {ProfileProperty} from "../../common/model/profile/Profile";
import {getElementFromRef} from "../../setup/components/Utils";
import {bellogRuntimeLayerController} from "./BellogRuntimeLayerController";
import {resolveVariable} from "./BellogRuntimeUtils";
import {bellogRuntimePropertyStore, BellogRuntimePropertyStore} from "./BellogRuntimePropertyStore";
import {HtmlProperty} from "../../common/model/profile/Html";

/* ── Global function-action registry ─────────────────────────── */

const fnActionRegistry = new Map<string, () => void>();
let fnActionCounter = 0;

// Expose the handler globally so inline onclick attributes can call it
(window as any).__blr_fnAction = (key: string) => {
    const handler = fnActionRegistry.get(key);
    if (handler) handler();
    else console.warn('[ActionExecutor] No handler for action key:', key);
};

/**
 * Register a FunctionActionConfig with captured channel params.
 * Returns a unique key that can be used in an inline onclick handler.
 */
export function registerFunctionAction(config: FunctionActionConfig, channelParams: any): string {
    const key = `fa_${fnActionCounter++}`;
    fnActionRegistry.set(key, () => executeFunctionAction(config, channelParams));
    return key;
}

/**
 * Unregister function actions by their keys (called when entries are evicted).
 */
export function unregisterFunctionActions(keys: string[]): void {
    for (const k of keys) fnActionRegistry.delete(k);
}

/* ── Initialization ───────────────────────────────────────────── */

let _profile: ProfileProperty | null = null;
let _sendToInterface: ((ifcRefId: number, data: any) => void) | null = null;

/**
 * Initialize the action executor with the loaded profile and interface send callback.
 */
export function initActionExecutor(
    profile: ProfileProperty,
    sendToInterfaceFn: (ifcRefId: number, data: any) => void
): void {
    _profile = profile;
    _sendToInterface = sendToInterfaceFn;
}

/* ── Public action execution ──────────────────────────────────── */

/**
 * Execute a named action by its ElementReference.
 * @param actionRef Reference to the ActionProperty in the profile
 * @param channelParams Data available from the triggering event/channel
 */
export function executeAction(actionRef: ElementReference, channelParams: any): void {
    if (!_profile) return;
    const action = getElementFromRef(actionRef, _profile.actions, []) as ActionProperty;
    if (!action) {
        console.warn('[ActionExecutor] Action not found:', actionRef);
        return;
    }

    switch (action.type) {
        case ActionType.SendData:
            executeSendData(action.config as ActionSendDataSettings, channelParams);
            break;
        case ActionType.ReplaceHtmlProperties:
            executeReplaceHtmlProperties(action.config as ActionRenderSettings, channelParams);
            break;
        case ActionType.Custom:
            executeCustom(action.config as ActionCustomSettings, channelParams);
            break;
    }
}

/* ── Internal execution helpers ───────────────────────────────── */

function executeSendData(config: ActionSendDataSettings, channelParams: any): void {
    const resolved = resolveActionMappings(config.mappings, channelParams);
    const timestamp = Date.now();
    const result = bellogRuntimeLayerController.sendToOutputChannel(
        config.channelRef.refId, timestamp, resolved
    );

    if (result !== undefined && _profile) {
        for (const entry of _profile.interfaces) {
            if (!(entry as any).deleted) {
                _sendToInterface?.(entry.id, result);
            }
        }
    }
}

function executeReplaceHtmlProperties(config: ActionRenderSettings, channelParams: any): void {
    if (!_profile) return;

    const htmlRef = config.elementToRender?.htmlRef;
    const viewRef = config.viewRef;
    if (!htmlRef || !viewRef) return;

    const html = getElementFromRef(htmlRef, _profile.htmls, []) as HtmlProperty;
    if (!html) {
        console.warn('[ActionExecutor] ReplaceHtmlProperties: HTML component not found', htmlRef);
        return;
    }

    // Start from defaults
    const resolvedProps: Record<string, any> = {};
    for (const prop of html.config.properties) {
        resolvedProps[prop.name] = resolveVariable(prop.default, {});
    }

    // Apply overrides from action config
    const binding = config.elementToRender;
    if (binding.mode === RenderModeType.Gui && binding.mappings) {
        for (const m of binding.mappings) {
            resolvedProps[m.destParamName] = resolveActionMappings(
                [m], channelParams
            )[m.destParamName];
        }
    } else if (binding.mode === RenderModeType.Code && binding.code) {
        try {
            const fn = new Function('params', binding.code);
            const overrides = fn(channelParams);
            if (overrides && typeof overrides === 'object') {
                Object.assign(resolvedProps, overrides);
            }
        } catch (e) {
            console.error('[ActionExecutor] ReplaceHtmlProperties code error:', e);
            return;
        }
    }

    // Publish to PropertyStore — Fixed fragments subscribed to this key will re-render
    const key = BellogRuntimePropertyStore.buildKey(
        viewRef.refId, htmlRef.refType, htmlRef.refId
    );
    bellogRuntimePropertyStore.set(key, resolvedProps);
}

function executeCustom(config: ActionCustomSettings, channelParams: any): void {
    try {
        const fn = new Function('params', 'channelParams', config.code);
        fn(channelParams, channelParams);
    } catch (e) {
        console.error('[ActionExecutor] Custom action error:', e);
    }
}

function executeFunctionAction(config: FunctionActionConfig, channelParams: any): void {
    switch (config.mode) {
        case FunctionActionMode.SendData: {
            const sdConfig = config.sendDataConfig;
            if (!sdConfig) return;
            const resolved = resolveActionMappings(sdConfig.mappings, channelParams);
            const timestamp = Date.now();
            const result = bellogRuntimeLayerController.sendToOutputChannel(
                sdConfig.channelRef.refId, timestamp, resolved
            );
            if (result !== undefined && _profile) {
                for (const entry of _profile.interfaces) {
                    if (!(entry as any).deleted) {
                        _sendToInterface?.(entry.id, result);
                    }
                }
            }
            break;
        }
        case FunctionActionMode.Code: {
            try {
                const fn = new Function('params', config.code);
                fn(channelParams);
            } catch (e) {
                console.error('[ActionExecutor] FunctionAction code error:', e);
            }
            break;
        }
    }
}

function resolveActionMappings(
    mappings: { destParamName: string; sourceParam: BindableVariable<any> }[],
    channelParams: any
): Record<string, any> {
    const result: Record<string, any> = {};
    if (!mappings) return result;
    for (const m of mappings) {
        if (!m.sourceParam) {
            result[m.destParamName] = undefined;
        } else if (!m.sourceParam.bind) {
            result[m.destParamName] = m.sourceParam.value;
        } else if (m.sourceParam.paramFromSource) {
            result[m.destParamName] = resolveParamPath(channelParams, m.sourceParam.paramFromSource);
        } else if (m.sourceParam.symbol) {
            result[m.destParamName] = resolveVariable(m.sourceParam, {});
        } else {
            result[m.destParamName] = m.sourceParam.value;
        }
    }
    return result;
}

/**
 * Resolve a dotted parameter path against a data object.
 * e.g. "_origin.datetime" → data._origin.datetime
 */
function resolveParamPath(data: any, path: string): any {
    if (data == null || !path) return undefined;
    const parts = path.split('.');
    let current = data;
    for (const part of parts) {
        if (current == null || typeof current !== 'object') return undefined;
        current = current[part];
    }
    return current;
}
