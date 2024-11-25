import {InterfacesProperty} from "./Interface";
import {ViewProperty} from "./View";
import {ChannelProperty} from "./Channel";
import {HtmlProperty} from "./Html";
import {CodeProperty, ScriptExportedSymbols} from "./Common";
import {SettingsProperty} from "./GlobalSettings";
import {LayerProperty} from "./Layer";
import {EventProperty} from "./Event";
import {ActionProperty} from "./Actions";
import {DependencyProperty} from "./Dependency";
import {ConditionalRenderProperty} from "./Filter";


export interface ProfileProperty {
    name: string,
    schemaVersion: number,
    interfaces: (InterfacesProperty)[]
    views: ViewProperty[],
    channels: ChannelProperty[],
    htmls: (HtmlProperty)[]
    events: (EventProperty)[],
    actions: ActionProperty[],
    conditionalRenderings: ConditionalRenderProperty[],
    layers: (LayerProperty)[],
    dependencies: DependencyProperty[],
    scripts: (CodeProperty)[],
    scriptsExportedSymbols: ScriptExportedSymbols[],
    styles: (CodeProperty)[],
    settings: SettingsProperty
}