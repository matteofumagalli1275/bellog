import {CustomProperty, IOParameterType} from "./Common";
import {ElementProperty} from "./Element";

export enum LayerSourceType {
    Interface = "Interface",
    Layer = "Layer"
}

export enum LayerEmbeddedNames {
    LineDeserializer = "LineDeserializer",
    LineSerializer = "LineSerializer",
}

export type LayerEventCommonProperties = {
    interfaceId: number;
    interfaceName: string;
    interfaceType: string;
    streamSourceId: number;
    streamSourceType: LayerSourceType;
    direction: "up" | "down";
}

export type IOParameter = {
    id: number;
    name: string,
    type: IOParameterType
}

export enum LayerType {
    Layer = "Layer",
}

export interface LayerProperties {
    code: string,
    input: IOParameter[],
    output: IOParameter[],
    properties: CustomProperty[],
    testCode: string
}

export interface LayerProperty extends ElementProperty{
    type: LayerType,
    config: LayerProperties,
    disabled: boolean
}

// Backward compatibility aliases
export type MiddlewareSourceType = LayerSourceType;
export type MiddlewareEventCommonProperties = LayerEventCommonProperties;
export type MiddlewareProperty = LayerProperty;
export type MiddlewareProperties = LayerProperties;
export const MiddlewareType = LayerType;
export const MiddlewareEmbeddedNames = LayerEmbeddedNames;

