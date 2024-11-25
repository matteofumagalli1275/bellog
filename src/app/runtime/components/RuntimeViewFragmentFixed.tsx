import * as React from "react";
import {useEffect, useRef, useCallback} from "react";
import {ViewFragmentFixed, ViewProperty} from "../../common/model/profile/View";
import {HtmlProperty, HtmlComponentDefinitionFramework} from "../../common/model/profile/Html";
import {bellogRuntime} from "../core/BellogRuntime";
import {compileTemplateLiteral, compileJavascriptHook} from "../core/BellogRuntimeHtmlCompiler";
import {resolveVariable} from "../core/BellogRuntimeUtils";
import {bellogRuntimePropertyStore, BellogRuntimePropertyStore} from "../core/BellogRuntimePropertyStore";

/**
 * Renders a Fixed view fragment — a static HTML component
 * whose properties are resolved from their defaults / bindings.
 * Subscribes to PropertyStore for dynamic updates via ReplaceHtmlProperties actions.
 */
export const RuntimeViewFragmentFixed = (props: { view: ViewProperty; viewFragment: ViewFragmentFixed }) => {
    const rootRef = useRef<HTMLDivElement>(null);

    const renderHtml = useCallback((html: HtmlProperty, resolvedProps: Record<string, any>) => {
        if (!rootRef.current) return;
        if (html.type === HtmlComponentDefinitionFramework.SimpleTemplateLiteral) {
            rootRef.current.innerHTML = compileTemplateLiteral(html, resolvedProps);
        } else if (html.type === HtmlComponentDefinitionFramework.JavascriptHook) {
            const hookFn = compileJavascriptHook(html, resolvedProps);
            hookFn(rootRef.current);
        }
    }, []);

    useEffect(() => {
        const html = bellogRuntime.getElement<HtmlProperty>(props.viewFragment.ui);
        if (!html || !rootRef.current) return;

        // Initial render with defaults
        const defaults: Record<string, any> = {};
        for (const prop of html.config.properties) {
            defaults[prop.name] = resolveVariable(prop.default, {});
        }
        renderHtml(html, defaults);

        // Subscribe to PropertyStore for dynamic updates
        const uiRef = props.viewFragment.ui;
        const key = BellogRuntimePropertyStore.buildKey(props.view.id, uiRef.refType, uiRef.refId);
        const unsub = bellogRuntimePropertyStore.subscribe(key, (overrides) => {
            renderHtml(html, overrides);
        });

        return unsub;
    }, []);

    return <div ref={rootRef} className="blr-fragment" />;
};
