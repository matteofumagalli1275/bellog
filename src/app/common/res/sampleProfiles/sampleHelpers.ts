/**
 * Shared helpers used by sample profile definitions.
 */
import {ElementReferenceType, ElementType} from "../../model/profile/Common";

export function embeddedRef(name: string, type: ElementType) {
    return {type, refType: ElementReferenceType.EmbeddedReference, refName: name, refId: 0, libraryRdnId: ""};
}

export function localRef(id: number, name: string, type: ElementType) {
    return {type, refType: ElementReferenceType.LocalReference, refName: name, refId: id, libraryRdnId: ""};
}

export const defaultStyles = [
    {id: 1, name: "bulma.css", code: "@import url('/bulma.min.css');\n@import url('/bulma-tooltip.min.css');"},
    {id: 2, name: "font-awesome.css", code: "@import url('/font-awesome.all.min.css');"},
];
