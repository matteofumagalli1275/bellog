/**
 * Evaluates conditional renders: compare condition check + HTML rendering.
 *
 * Used by RuntimeViewFragmentAppend to decide whether incoming data
 * matches a conditional render and, if so, produce the rendered HTML.
 */
import {ConditionalRenderProperty} from "../../common/model/profile/Filter";
import {ProfileProperty} from "../../common/model/profile/Profile";
import {
    CompareDataType,
    CompareDataCode,
    CompareDataQuery,
    CompareDataRegex,
    RenderModeType,
    RenderModeGui,
    RenderModeCode,
    BindableVariable,
    CustomPropertyType,
} from "../../common/model/profile/Common";
import {HtmlProperty, HtmlComponentDefinitionFramework} from "../../common/model/profile/Html";
import {ActionParamMapping} from "../../common/model/profile/Actions";
import {getElementFromRef} from "../../setup/components/Utils";
import {compileTemplateLiteral, compileJavascriptHook} from "./BellogRuntimeHtmlCompiler";
import {resolveVariable} from "./BellogRuntimeUtils";
import {registerFunctionAction} from "./BellogRuntimeActionExecutor";

export type RenderResult = {
    matched: boolean;
    html: string;
    actionKeys: string[];
    hookFn?: (element: HTMLElement) => void;
    isHook: boolean;
};

/* ── Compare-condition evaluation ──────────────────────────── */

function evaluateCondition(crp: ConditionalRenderProperty, data: any): boolean {
    const type = crp.compareDataType;
    const settings = crp.compareDataSettings;
    if (!settings) return true; // no condition → always match

    try {
        switch (type) {
            case CompareDataType.Code: {
                const code = (settings as CompareDataCode).code;
                if (!code || code.trim().length === 0) return true;
                const fn = eval(`(${code})`);
                return !!fn(data);
            }
            case CompareDataType.Query: {
                const query = (settings as CompareDataQuery).query;
                if (!query || query.trim().length === 0) return true;
                const fn = new Function('data', 'return ' + query);
                return !!fn(data);
            }
            case CompareDataType.Regex: {
                const regex = (settings as CompareDataRegex).regex;
                if (!regex || regex.trim().length === 0) return true;
                const re = new RegExp(regex);
                const str = typeof data === 'string' ? data : JSON.stringify(data);
                return re.test(str);
            }
            default:
                return true;
        }
    } catch (e) {
        console.error('[ConditionalRenderEngine] condition evaluation error:', e);
        return false;
    }
}

/* ── GUI-mode mapping resolution ──────────────────────────── */

function resolveGuiMappings(
    mappings: ActionParamMapping[],
    data: any,
    timestamp: number
): { resolvedProps: Record<string, any>; actionKeys: string[] } {
    const resolvedProps: Record<string, any> = {};
    const actionKeys: string[] = [];

    for (const mapping of mappings) {
        if (mapping.functionAction) {
            // Function property → register a global action handler
            const key = registerFunctionAction(mapping.functionAction, data);
            actionKeys.push(key);
            // Value becomes an inline onclick expression
            resolvedProps[mapping.destParamName] = `window.__blr_fnAction('${key}')`;
        } else {
            // Normal property → resolve from data / symbols / literal
            resolvedProps[mapping.destParamName] = resolveVariableFromData(
                mapping.sourceParam, data, timestamp
            );
        }
    }

    return { resolvedProps, actionKeys };
}

/**
 * Resolve a BindableVariable against incoming channel data.
 */
function resolveVariableFromData(
    variable: BindableVariable<any>,
    data: any,
    timestamp: number
): any {
    if (!variable) return undefined;

    if (!variable.bind) {
        return variable.value;
    }

    if (variable.symbol) {
        return resolveVariable(variable, {});
    }

    if (variable.paramFromSource) {
        if (data && typeof data === 'object') {
            return resolveParamPath(data, variable.paramFromSource);
        }
        return data; // primitive passthrough
    }

    return variable.value;
}

/**
 * Resolve a dotted parameter path against a data object.
 * e.g. "_origin.datetime" → data._origin.datetime
 */
function resolveParamPath(data: any, path: string): any {
    if (!path) return undefined;
    const parts = path.split('.');
    let current = data;
    for (const part of parts) {
        if (current == null || typeof current !== 'object') return undefined;
        current = current[part];
    }
    return current;
}

/* ── Main evaluation entry point ──────────────────────────── */

/**
 * Evaluate a ConditionalRenderProperty against incoming data.
 * Returns {matched, html, actionKeys, hookFn?, isHook}.
 */
export function evaluateConditionalRender(
    crp: ConditionalRenderProperty,
    data: any,
    timestamp: number,
    profile: ProfileProperty
): RenderResult {
    const noMatch: RenderResult = { matched: false, html: '', actionKeys: [], isHook: false };

    // Step 1: evaluate compare condition
    if (!evaluateCondition(crp, data)) {
        return noMatch;
    }

    // Step 2: resolve the HTML component
    const html = getElementFromRef(crp.htmlRef, profile.htmls, []) as HtmlProperty;
    if (!html) {
        return noMatch;
    }

    // Step 3: render based on mode type
    const modeType = crp.renderModeType;

    if (modeType === RenderModeType.Gui) {
        const guiSettings = crp.renderModeSettings as RenderModeGui;
        if (!guiSettings?.mappings) return noMatch;

        const { resolvedProps, actionKeys } = resolveGuiMappings(
            guiSettings.mappings, data, timestamp
        );

        if (html.type === HtmlComponentDefinitionFramework.SimpleTemplateLiteral) {
            const renderedHtml = compileTemplateLiteral(html, resolvedProps);
            return { matched: true, html: renderedHtml, actionKeys, isHook: false };
        } else if (html.type === HtmlComponentDefinitionFramework.JavascriptHook) {
            const hookFn = compileJavascriptHook(html, resolvedProps);
            return { matched: true, html: '', actionKeys, isHook: true, hookFn };
        }
    } else if (modeType === RenderModeType.Code) {
        const codeSettings = crp.renderModeSettings as RenderModeCode;
        if (!codeSettings?.code) return noMatch;

        try {
            const fn = new Function('data', 'timestamp', 'html', codeSettings.code);
            const result = fn(data, timestamp, html);
            const renderedHtml = typeof result === 'string' ? result : String(result ?? '');
            return { matched: true, html: renderedHtml, actionKeys: [], isHook: false };
        } catch (e) {
            console.error('[ConditionalRenderEngine] code mode error:', e);
            return {
                matched: true,
                html: `<div style="color:red">[Render error: ${e}]</div>`,
                actionKeys: [],
                isHook: false
            };
        }
    }

    return noMatch;
}
