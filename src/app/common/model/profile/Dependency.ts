import {CustomProperty, IOParameterType} from "./Common";


export enum DependencyRule {
    EQUAL = 'EQUAL',
    GREATER_EQUAL = 'GREATER_EQUAL',
}

export interface DependencyProperty {
    id: number,
    name: string,
    rdnId: string,
    version: string,
    rule: DependencyRule,
    deleted: boolean
}

