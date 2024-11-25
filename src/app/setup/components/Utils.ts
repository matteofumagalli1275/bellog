import {
    CustomPropertyType,
    ElementReference,
    ElementReferenceType,
    ElementType
} from "../../common/model/profile/Common";
import {AllLayerComponents} from "../../common/res/embeddedSetupObjects/layer/AllLayerComponents";
import {AllHtmlComponents} from "../../common/res/embeddedSetupObjects/htmlComponents/AllHtmlComponents";
import {Dependency} from "../store/dependencies/dependencies";

export function getElementFromRef<T extends {id: number, name: string}>(ref: ElementReference, list: T[], libraries: Dependency[]): T {
    const defaults = {
        [ElementType.Html]: AllHtmlComponents,
        [ElementType.Layer]: AllLayerComponents,
    }
    let newItem = null
    if(ref.refType === ElementReferenceType.LocalReference) {
        newItem = list.find((it) => it.id === ref.refId)
    }
    else if(ref.refType === ElementReferenceType.EmbeddedReference) {
        newItem = defaults[ref.type][ref.refName].component
    }
    else if(ref.refType === ElementReferenceType.LibraryReference) {
        const key = ref.type.toLowerCase()+"s";
        const library = libraries.find((it) => it.rdnId === ref.libraryRdnId)
        if(library) {
            // Resolve by name so re-imported libraries with different IDs still match
            const entities = library.setup[key].entities;
            newItem = Object.values(entities).find((it: any) => it.name === ref.refName)
        }
    }
    else {
        throw Error("Not supported");
    }
    return newItem
}

export function getLocalRefFromElement<T extends {id: number, name: string}>(element: T, type: ElementType): ElementReference {
    return {
        type: type,
        refType: ElementReferenceType.LocalReference,
        refName: element.name,
        refId: element.id,
        libraryRdnId: ""
    }
}

export function getLibraryRefFromElement<T extends {id: number, name: string}>(element: T, type: ElementType, rdnId: string): ElementReference {
    return {
        type: type,
        refType: ElementReferenceType.LibraryReference,
        refName: element.name,
        refId: element.id,
        libraryRdnId: rdnId
    }
}

export function getEmbeddedRefFromElement<T extends {id: number, name: string}>(element: T, type: ElementType): ElementReference {
    return {
        type: type,
        refType: ElementReferenceType.EmbeddedReference,
        refName: element.name,
        refId: element.id,
        libraryRdnId: ""
    }
}

export function getRefFromElement<T extends {id: number, name: string}>(element: T, refType: ElementReferenceType, type: ElementType, rdnId: string): ElementReference {
    switch (refType) {
        case ElementReferenceType.EmbeddedReference:
            return getEmbeddedRefFromElement(element, type)
        case ElementReferenceType.LibraryReference:
            return getLibraryRefFromElement(element, type, rdnId)
        case ElementReferenceType.LocalReference:
            return getLocalRefFromElement(element, type)
    }
}

export function getUndefinedRef(type: ElementType): ElementReference {
    return {
        type: type,
        refType: ElementReferenceType.LocalReference,
        refName: "",
        refId: -1,
        libraryRdnId: ""
    }
}