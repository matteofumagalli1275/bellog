import * as React from "react";
import {ElementReference, ElementReferenceType, ElementType} from "../../../../common/model/profile/Common";
import {useSelector} from "react-redux";
import {RootState} from "../../../store/AppStore";
import {AllHtmlComponents} from "../../../../common/res/embeddedSetupObjects/htmlComponents/AllHtmlComponents";
import {AllLayerComponents} from "../../../../common/res/embeddedSetupObjects/layer/AllLayerComponents";
import {librariesExportsSelectors} from "../../../store/dependencies/dependencies";
import {getEmbeddedRefFromElement, getLibraryRefFromElement, getLocalRefFromElement} from "../../Utils";
import {ElementProperty} from "../../../../common/model/profile/Element";

export const ElementReferenceComponent = (
    props: {
        title: string
        elementReference: ElementReference,
        onUpdate: (newElementReference: ElementReference) => void
    }) => {

    const elementReference = props.elementReference
    const embeddedComponents = (() => {
        if(elementReference) {
            if (elementReference.type === ElementType.Html) {
                return Object.values(AllHtmlComponents).map((it) => it.component)
            }
            if (elementReference.type === ElementType.Layer) {
                return Object.values(AllLayerComponents).map((it) => it.component)
            }
        }
        return []
    })()

    const profileKey: string
        = (()=> {
        switch(props.elementReference.type) {
            case ElementType.Html:
                return "htmls"
            case ElementType.Layer:
                return "layers"
            case ElementType.Channel:
                return "channels"
            case ElementType.View:
                return "views"
            case ElementType.ConditionalRendering:
                return "filters"
        }
    })()

    const localElementListNormalized = useSelector((state: RootState) => {
        return state.profile[profileKey].entities;
    });

    const dependencies = useSelector(librariesExportsSelectors.selectAll)
    const localElementList: ElementProperty[] = Object.values(localElementListNormalized) as ElementProperty[];

    const hasEmbedded = embeddedComponents.length > 0
    const hasLocal = localElementList.length > 0
    const hasLibrary = dependencies.some(d => d.setup[profileKey]?.ids?.length > 0)

    function isRefTypeAvailable(refType: ElementReferenceType): boolean {
        switch (refType) {
            case ElementReferenceType.EmbeddedReference: return hasEmbedded
            case ElementReferenceType.LocalReference: return hasLocal
            case ElementReferenceType.LibraryReference: return hasLibrary
        }
    }

    function updateRefType(refType: ElementReferenceType) {
        if (refType === ElementReferenceType.EmbeddedReference) {
            props.onUpdate(getEmbeddedRefFromElement(embeddedComponents[0], props.elementReference.type));
        } else if (refType === ElementReferenceType.LocalReference && localElementList.length > 0) {
            const firstAvailable = localElementList[0];
            const newRef = getLocalRefFromElement(firstAvailable, props.elementReference.type);
            props.onUpdate(newRef);
        } else if (refType === ElementReferenceType.LibraryReference && dependencies.length > 0) {
            const firstLibAvailable = dependencies[0];
            if (firstLibAvailable.setup[profileKey].ids.length > 0) {
                const firstAvailableId = firstLibAvailable.setup[profileKey].ids[0];
                const firstAvailable = firstLibAvailable.setup[profileKey].entities[firstAvailableId];
                const newRef = getLibraryRefFromElement(firstAvailable, props.elementReference.type, firstLibAvailable.rdnId);
                props.onUpdate(newRef);
            }
        }
    }

    return (
        <div className="field">
            <label className="label">{props.title}</label>
            <div className="field is-grouped is-flex-wrap-wrap">
                <div className="control select">
                    <select value={elementReference.refType} onChange={(evt) => updateRefType(evt.target.value as ElementReferenceType)}>
                        {Object.values(ElementReferenceType).map((it) => (
                            <option key={it} disabled={!isRefTypeAvailable(it)}>{it}</option>
                        ))}
                    </select>
                </div>

                {elementReference.refType === ElementReferenceType.EmbeddedReference && (
                    <div className="control select">
                        <select value={elementReference.refName} onChange={(evt) => props.onUpdate({...elementReference, refName: evt.target.value})}>
                            {embeddedComponents.map((it) => (
                                <option key={it.name}>{it.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {elementReference.refType === ElementReferenceType.LocalReference && (
                    <div className="control select">
                        <select value={elementReference.refId} onChange={
                            (evt) =>
                                {
                                    const element = localElementList.find((it) => it.id === parseInt(evt.target.value))
                                    if (element) {
                                        props.onUpdate(getLocalRefFromElement(element, elementReference.type))
                                    }
                                }
                        }>
                            <option value={-1} disabled>-- Select an Element --</option>
                            {localElementList.map((it) => (
                                <option key={it.id} value={it.id}>{it.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {elementReference.refType === ElementReferenceType.LibraryReference && (
                    <>
                        <div className="control select">
                            <select value={elementReference.libraryRdnId} onChange={(evt) => props.onUpdate({...elementReference, libraryRdnId: evt.target.value})}>
                                <option value={-1}>None</option>
                                {dependencies.map((it) => (
                                    <option key={it.rdnId} value={it.rdnId}>{it.setup.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="control select">
                            <select value={elementReference.refId} onChange={(evt) => props.onUpdate({...elementReference, refId: parseInt(evt.target.value)})}>
                                <option value={-1}>-- Select an Element --</option>
                                {(() => {
                                    const foundDependency = dependencies.find((it) => it.rdnId === elementReference.libraryRdnId);
                                    if (!foundDependency) return null;
                                    return foundDependency.setup[profileKey].ids.map((id) => {
                                        const item = foundDependency.setup[profileKey].entities[id];
                                        if (!item) return null;
                                        return (
                                            <option key={id} value={id}>{item.name}</option>
                                        );
                                    });
                                })()}
                            </select>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}