import * as React from "react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ViewFragmentAppend, ViewProperty} from "../../common/model/profile/View";
import {ConditionalRenderProperty} from "../../common/model/profile/Filter";
import {HtmlProperty} from "../../common/model/profile/Html";
import {bellogRuntime} from "../core/BellogRuntime";
import {bellogRuntimeDataBus, DataBusEntry} from "../core/BellogRuntimeDataBus";
import {evaluateConditionalRender} from "../core/BellogRuntimeConditionalRenderEngine";
import {compileTemplateLiteral} from "../core/BellogRuntimeHtmlCompiler";
import {resolveVariable} from "../core/BellogRuntimeUtils";
import {unregisterFunctionActions} from "../core/BellogRuntimeActionExecutor";
import {Virtuoso, VirtuosoHandle} from "react-virtuoso";
import {getElementFromRef} from "../../setup/components/Utils";
import {bellogRuntimeScrollLock} from "../core/BellogRuntimeScrollLock";
import {FragmentSearchBar} from "./FragmentSearchBar";
import {highlightHtml} from "./highlightHtml";

type RenderedEntry = {
    id: number;
    html: string;
    hookFn?: (element: HTMLElement) => void;
    isHook: boolean;
    actionKeys: string[];
};

let entryIdCounter = 0;

export const RuntimeViewFragmentAppend = (props: { view: ViewProperty; viewFragment: ViewFragmentAppend }) => {

    const profile = bellogRuntime.getProfile();
    const maxItems = profile.settings?.maximumItemsPerView || 10000;

    const [entries, setEntries] = useState<RenderedEntry[]>([]);
    const rootRef = useRef<HTMLDivElement>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [locked, setLocked] = useState(bellogRuntimeScrollLock.locked);
    const lockedRef = useRef(bellogRuntimeScrollLock.locked);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchTermRef = useRef('');

    // Keep locked in sync with singleton (both state for re-render and ref for callbacks)
    useEffect(() => {
        return bellogRuntimeScrollLock.subscribe((v) => {
            lockedRef.current = v;
            setLocked(v);
        });
    }, []);

    const scrollerRef = useRef<HTMLElement | null>(null);

    // When lock is toggled ON manually, scroll to bottom immediately
    useEffect(() => {
        if (locked && scrollerRef.current) {
            scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
        }
    }, [locked]);

    // Detect actual user scroll (wheel / touch) to disengage lock
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const disengage = () => {
            if (bellogRuntimeScrollLock.locked) bellogRuntimeScrollLock.setLocked(false);
        };
        el.addEventListener('wheel', disengage, { passive: true });
        el.addEventListener('touchmove', disengage, { passive: true });
        return () => {
            el.removeEventListener('wheel', disengage);
            el.removeEventListener('touchmove', disengage);
        };
    }, []);

    // Resolve container HTML component — extract style/class for the root wrapper
    const [containerAttrs, setContainerAttrs] = useState<{ style?: string; className?: string }>({});
    useEffect(() => {
        const containerHtml = bellogRuntime.getElement<HtmlProperty>(props.viewFragment.container);
        if (!containerHtml) return;
        const defaults: Record<string, any> = {};
        for (const prop of containerHtml.config.properties) {
            defaults[prop.name] = resolveVariable(prop.default, {});
        }
        const compiled = compileTemplateLiteral(containerHtml, defaults);
        const parser = new DOMParser();
        const doc = parser.parseFromString(compiled, 'text/html');
        const el = doc.body.firstElementChild;
        if (el) {
            setContainerAttrs({
                style: el.getAttribute('style') || undefined,
                className: el.getAttribute('class') || undefined,
            });
        }
    }, [props.viewFragment.container]);

    // Resolve conditional render property objects once
    const crps = useRef<ConditionalRenderProperty[]>([]);
    useEffect(() => {
        crps.current = (props.viewFragment.conditionalRenders ?? [])
            .map(ref => getElementFromRef(ref, profile.conditionalRenderings, []) as ConditionalRenderProperty)
            .filter(Boolean);
    }, [props.viewFragment]);

    // Attach interfaces to this fragment's root element (e.g. clipboard paste listener)
    useEffect(() => {
        if (rootRef.current) {
            bellogRuntime.attachViewFragmentAppend(props.view, props.viewFragment, rootRef.current);
        }
    }, []);

    // Subscribe to DataBus for all unique (channelId, nodeId) pairs from conditional renders
    useEffect(() => {
        const subscriptionMap = new Map<string, { channelId: number; nodeId: string }>();
        for (const crp of crps.current) {
            if (!crp.channelRef) continue;
            const key = `${crp.channelRef.refId}:${crp.layerId}`;
            if (!subscriptionMap.has(key)) {
                subscriptionMap.set(key, { channelId: crp.channelRef.refId, nodeId: crp.layerId.toString() });
            }
        }

        const unsubs: (() => void)[] = [];

        for (const { channelId, nodeId } of subscriptionMap.values()) {
            const unsub = bellogRuntimeDataBus.subscribe(channelId, nodeId, (entry: DataBusEntry) => {
                if (entry.error) return;

                // Evaluate conditional renders for this (channelId, nodeId)
                for (const crp of crps.current) {
                    if (!crp.channelRef) continue;
                    if (crp.channelRef.refId !== channelId) continue;
                    if (crp.layerId.toString() !== nodeId) continue;

                    const result = evaluateConditionalRender(crp, entry.data, entry.timestamp, profile);
                    if (result.matched) {
                        const newEntry: RenderedEntry = {
                            id: entryIdCounter++,
                            html: result.html,
                            hookFn: result.hookFn,
                            isHook: result.isHook,
                            actionKeys: result.actionKeys,
                        };

                        setEntries(prev => {
                            let next = [...prev, newEntry];
                            // Ring buffer eviction
                            if (next.length > maxItems) {
                                const evicted = next.splice(0, next.length - maxItems);
                                for (const e of evicted) {
                                    unregisterFunctionActions(e.actionKeys);
                                }
                            }
                            return next;
                        });

                        if (crp.stopPropagation) break;
                    }
                }
            });
            unsubs.push(unsub);
        }

        // Listen for reset (e.g. on seek) — clear accumulated entries
        const unsubReset = bellogRuntimeDataBus.onReset(() => {
            setEntries(prev => {
                for (const e of prev) unregisterFunctionActions(e.actionKeys);
                return [];
            });
        });

        return () => {
            for (const unsub of unsubs) unsub();
            unsubReset();
        };
    }, [props.viewFragment]);

    // Cleanup action keys on unmount
    useEffect(() => {
        return () => {
            setEntries(prev => {
                for (const e of prev) {
                    unregisterFunctionActions(e.actionKeys);
                }
                return [];
            });
        };
    }, []);

    // Ctrl+F interception to open custom search
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                e.stopPropagation();
                setSearchOpen(true);
            }
        };
        el.addEventListener('keydown', onKeyDown);
        return () => el.removeEventListener('keydown', onKeyDown);
    }, []);

    const handleSearchNavigate = useCallback((entryIndex: number) => {
        virtuosoRef.current?.scrollToIndex({ index: entryIndex, align: 'center', behavior: 'auto' });
    }, []);

    const handleSearchClose = useCallback(() => {
        searchTermRef.current = '';
        setSearchOpen(false);
    }, []);

    const handleSearchTermChange = useCallback((term: string) => {
        searchTermRef.current = term;
        // Force re-render of visible items with highlights
        setEntries(prev => [...prev]);
    }, []);

    const containerStyle = useMemo<React.CSSProperties | undefined>(() => {
        if (!containerAttrs.style) return undefined;
        const style: Record<string, string> = {};
        for (const part of containerAttrs.style.split(';')) {
            const [key, ...rest] = part.split(':');
            if (!key?.trim() || !rest.length) continue;
            const camel = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            style[camel] = rest.join(':').trim();
        }
        return style;
    }, [containerAttrs.style]);

    const renderItem = useCallback((index: number, entry: RenderedEntry) => {
        if (entry.isHook && entry.hookFn) {
            return (
                <div ref={(el) => {
                    if (el && entry.hookFn) entry.hookFn(el);
                }} />
            );
        }
        const html = searchTermRef.current ? highlightHtml(entry.html, searchTermRef.current) : entry.html;
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }, []);

    return (
        <div ref={rootRef} className={`blr-fragment${containerAttrs.className ? ' ' + containerAttrs.className : ''}`} style={containerStyle} tabIndex={0}>
            {searchOpen && (
                <FragmentSearchBar
                    entries={entries}
                    onSearchTermChange={handleSearchTermChange}
                    onNavigate={handleSearchNavigate}
                    onClose={handleSearchClose}
                />
            )}
            <Virtuoso
                ref={virtuosoRef}
                scrollerRef={(ref) => { scrollerRef.current = ref as HTMLElement; }}
                style={{ width: '100%', height: '100%' }}
                data={entries}
                initialTopMostItemIndex={entries.length - 1}
                followOutput={() => lockedRef.current ? 'auto' : false}
                itemContent={renderItem}
            />
        </div>
    );
};