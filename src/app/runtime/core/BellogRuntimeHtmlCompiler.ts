/**
 * Compiles HTML components (SimpleTemplateLiteral and JavascriptHook)
 * with resolved property values.
 */
import {HtmlProperty, HtmlComponentDefinitionFramework} from "../../common/model/profile/Html";
import {CustomPropertyType} from "../../common/model/profile/Common";

/**
 * Escape HTML entities for safe insertion into HTML content.
 * Used when a CustomProperty has safeHtml === true.
 */
export function escapeHtml(str: string): string {
    if (typeof str !== 'string') return String(str ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Compile a SimpleTemplateLiteral HTML component with resolved property values.
 * The template code uses JS template literal syntax: ${propName}.
 * Returns an HTML string.
 */
export function compileTemplateLiteral(
    html: HtmlProperty,
    resolvedProps: Record<string, any>
): string {
    const props = html.config.properties;
    const paramNames = props.map(p => p.name);
    const paramValues = paramNames.map(name => {
        const prop = props.find(p => p.name === name);
        const val = resolvedProps[name];
        // safeHtml: escape the value before template substitution
        // Skip Function props and Number props (numbers must stay numeric for Date(), math, etc.)
        if (prop && prop.safeHtml
            && prop.type !== CustomPropertyType.Function
            && prop.type !== CustomPropertyType.Number) {
            return escapeHtml(String(val ?? ''));
        }
        return val;
    });

    try {
        const fn = new Function(...paramNames, 'return `' + html.config.code + '`\n//# sourceURL=BellogHtml_' + html.name + '.js');
        return fn(...paramValues);
    } catch (e) {
        console.error('[HtmlCompiler] Template compilation error:', e);
        return `<div style="color:red">[Template error: ${e}]</div>`;
    }
}

/**
 * Compile a JavascriptHook HTML component.
 * The hook code runs with `this` bound to the target DOM element.
 * Property values are passed as function arguments.
 * Returns a function that mutates a DOM element.
 */
export function compileJavascriptHook(
    html: HtmlProperty,
    resolvedProps: Record<string, any>
): (element: HTMLElement) => void {
    const props = html.config.properties;
    const paramNames = props.map(p => p.name);
    const paramValues = paramNames.map(name => resolvedProps[name]);

    try {
        const fn = new Function(...paramNames, html.config.code + '\n//# sourceURL=BellogHtmlHook_' + html.name + '.js');
        return (element: HTMLElement) => {
            fn.apply(element, paramValues);
        };
    } catch (e) {
        console.error('[HtmlCompiler] Hook compilation error:', e);
        return (element: HTMLElement) => {
            element.innerHTML = `<div style="color:red">[Hook error: ${e}]</div>`;
        };
    }
}
