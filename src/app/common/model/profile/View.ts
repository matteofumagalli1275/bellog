import {HtmlEmbeddedComponentNames} from "./Html";
import {
    CompareDataSettings,
    CompareDataType,
    CustomProperty,
    ElementReference,
    ElementReferenceType,
    ElementType, RenderModeSettings, RenderModeType
} from "./Common";
import {ElementProperty} from "./Element";
import {ChannelNodeLayerData} from "./Channel";
import {ActionParamMapping} from "./Actions";
import { ConditionalRenderProperty} from "./Filter";

export enum ViewType {
    TabView = 'TabView',
}

export enum ViewFragmentType {
    Append = 'Append',
    Fixed = 'Fixed',
}

export enum LayoutType {
    Full = 'Full',
    Column2 = 'Column2',
    Row2 = 'Row2',
    Column2Row1 = 'Column2Row1',
    Row1Column2 = 'Row1Column2',
    Column1Row2 = 'Column1Row2',
}


export interface ViewFragmentAppend {
    container: ElementReference,
    conditionalRenders: ElementReference[]
}

export interface ViewFragmentFixed {
    ui: ElementReference,
}

export interface ViewFragment {
    name: string,
    type: ViewFragmentType,
    percent: number,
    config: ViewFragmentAppend | ViewFragmentFixed
}

export interface ViewSettings {
    fragment1: ViewFragment,
    fragment2: ViewFragment,
    fragment3: ViewFragment,
}

export interface ViewProperty extends ElementProperty {
    type: ViewType,
    layout: LayoutType,
    config: ViewSettings,
    deleted: boolean
}