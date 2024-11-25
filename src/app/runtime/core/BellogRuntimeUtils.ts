import {BindableVariable, CustomProperty} from "../../common/model/profile/Common";


export function resolveCustomProperty(customProperty: CustomProperty): string | number {
    const value = resolveVariable(customProperty.default, {})
    return value
}

/**
 * Resolve a BindableVariable to its concrete value.
 * @param value The bindable variable to resolve
 * @param sources A keyed object or Map to look up paramFromSource values
 */
export function resolveVariable<T>(value: BindableVariable<T>, sources: Map<string, T> | Record<string, T>): T {
    if (!value) return undefined as T;

    if (!value.bind)
        return value.value as T;

    if (value.symbol) {
        const bellog = (window as any)["bellog"];
        if (!value.symbol.libraryRdnId || value.symbol.libraryRdnId === "") {
            return bellog?.symbols?.get(value.symbol.name);
        } else {
            return bellog?.lib?.[value.symbol.libraryRdnId]?.symbols?.get(value.symbol.name);
        }
    }

    if (value.htmlProp) {
        // TODO: implement live htmlProp resolution from view DOM
        console.warn('[resolveVariable] htmlProp resolution not yet implemented');
        return value.value as T;
    }

    if (value.paramFromSource) {
        if (sources instanceof Map) return sources.get(value.paramFromSource) as T;
        return (sources as Record<string, T>)[value.paramFromSource];
    }

    return value.value as T;
}