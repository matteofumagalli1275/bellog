import {DbFolder} from "../providers/indexedDb/db";

function isObject(item: any): boolean {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
}

export function deepMerge<T extends object>(target: T, ...sources: Array<Partial<T>>): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const sourceValue = source[key];
                if (isObject(sourceValue) && isObject(target[key])) {
                    target[key] = deepMerge(target[key] as any, sourceValue as any);
                } else {
                    (target as any)[key] = sourceValue;
                }
            }
        }
    }
    return deepMerge(target, ...sources);
}

export function generateUniqueName(base: string, existing: string[]):string {
    let sameName: string[]
    let uniqueAppend = ""
    let count = 0
    do {
        if(count > 0) {
            uniqueAppend = " (Copy " + count + ")"
        }
        sameName = existing.filter((it) => it.toLowerCase() === base.toLowerCase() + uniqueAppend.toLowerCase())
        count++
    } while (sameName.length > 0);
    return base + uniqueAppend
}