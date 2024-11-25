import * as React from "react";
import {useState} from "react";
import {useDispatch, useSelector} from 'react-redux';
import {ViewFragmentAppend} from "../../../../../common/model/profile/View";
import {profileViewsActions} from "../../../../store/profile/ProfileViewsSlice";
import {ElementReference, ElementReferenceType, ElementType} from "../../../../../common/model/profile/Common";
import {ElementReferenceComponent} from "../ElementReferenceComponent";
import {RootState} from "../../../../store/AppStore";
import {profileSelectViewFragmentById} from "../../../../store/profile/ProfileSelectors";
import {DragDropContext, Draggable, Droppable} from "@hello-pangea/dnd";
import {ViewFragmentConditionalRenderComponent} from "./ViewFragmentConditionalRenderComponent";
import {profileConditionalRendersActions, profileConditionalRendersSelectors} from "../../../../store/profile/ProfileConditionalRendersSlice";
import {
    buildDefaultConditionalRenders,
} from "../../../../DefaultPropertiesConditionalRenders";
import {getLocalRefFromElement} from "../../../Utils";

export const ViewFragmentAppendComponent = (props: { fragmentId: number, viewId: number }) => {
    const dispatch = useDispatch();

    const [activeTab, setActiveTab] = useState(0)

    const fragment = useSelector((state: RootState) => profileSelectViewFragmentById(state, props.viewId, props.fragmentId))
    const conditionals = useSelector(profileConditionalRendersSelectors.selectAll)
    const conditionalsEntities = useSelector(profileConditionalRendersSelectors.selectEntities)

    const htmlRef = (fragment.config as ViewFragmentAppend).container
    const conditionalRefs = (fragment.config as ViewFragmentAppend).conditionalRenders
    const localRefs = conditionalRefs.filter((it) => it.refType === ElementReferenceType.LocalReference)
    const selectedConditionalRef = localRefs.filter((it) => it.refId === activeTab)

    function setHtmlRef(htmlReference: ElementReference) {
        dispatch(profileViewsActions.viewUpdateFragmentAppendConfig({
            viewId: props.viewId,
            fragmentId: props.fragmentId,
            changes: {
                container: htmlReference
            }
        }))
    }

    function addFilter() {
        const elem = buildDefaultConditionalRenders(conditionals)
        dispatch(profileConditionalRendersActions.addOne({...elem}))

        const newRef = getLocalRefFromElement(elem, ElementType.ConditionalRendering)
        dispatch(profileViewsActions.viewUpdateFragment({viewId: props.viewId, fragmentId: props.fragmentId, changes: {
            config: {
                container: htmlRef,
                conditionalRenders: [...conditionalRefs, newRef]
            }
        }}))
        setActiveTab(elem.id)
    }

    function deleteFilter(refId: number) {
        // Remove the conditional render entity
        dispatch(profileConditionalRendersActions.removeOne(refId))
        // Remove from the fragment's list
        const updated = conditionalRefs.filter(r => !(r.refType === ElementReferenceType.LocalReference && r.refId === refId))
        dispatch(profileViewsActions.viewUpdateFragment({viewId: props.viewId, fragmentId: props.fragmentId, changes: {
            config: {
                container: htmlRef,
                conditionalRenders: updated
            }
        }}))
        // Switch to another tab
        const remaining = updated.filter(r => r.refType === ElementReferenceType.LocalReference)
        setActiveTab(remaining.length > 0 ? remaining[0].refId : 0)
    }

    function handleFilterNameChange(filterId: number, newName: string) {
        // Sync the tab reference name in the fragment config
        const updated = conditionalRefs.map(r =>
            (r.refType === ElementReferenceType.LocalReference && r.refId === filterId)
                ? {...r, refName: newName}
                : r
        )
        dispatch(profileViewsActions.viewUpdateFragment({viewId: props.viewId, fragmentId: props.fragmentId, changes: {
            config: {
                container: htmlRef,
                conditionalRenders: updated
            }
        }}))
    }

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const srcIdx = result.source.index;
        const dstIdx = result.destination.index;
        if (srcIdx === dstIdx) return;

        const reordered = [...localRefs];
        const [moved] = reordered.splice(srcIdx, 1);
        reordered.splice(dstIdx, 0, moved);

        // Merge back with any non-local refs (preserve ordering)
        const nonLocal = conditionalRefs.filter(r => r.refType !== ElementReferenceType.LocalReference);
        dispatch(profileViewsActions.viewUpdateFragment({viewId: props.viewId, fragmentId: props.fragmentId, changes: {
            config: {
                container: htmlRef,
                conditionalRenders: [...reordered, ...nonLocal]
            }
        }}))
    };

    // Resolve live name from Redux store for each tab
    function getTabName(ref: ElementReference): string {
        const entity = conditionalsEntities[ref.refId];
        return entity?.name ?? ref.refName;
    }

    return (
        <>
            <ElementReferenceComponent
                title={"Container"}
                elementReference={htmlRef}
                onUpdate={setHtmlRef}
            />

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="filters" direction="horizontal">
                    {(provided) => (
                        <div className="tabs is-left is-boxed" {...provided.droppableProps} ref={provided.innerRef}>
                            <ul>
                                {localRefs.map((conditional, i) => (
                                    <Draggable key={conditional.refId} draggableId={`filter-${conditional.refId}`} index={i}>
                                        {(provided) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={activeTab === conditional.refId ? 'is-active' : ''}
                                            >
                                                <a onClick={() => setActiveTab(conditional.refId)}>
                                                    {getTabName(conditional)}
                                                </a>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {selectedConditionalRef.length > 0 &&
                <fieldset className="fieldset">
                    <legend className="ml-2">{getTabName(selectedConditionalRef[0])}</legend>
                    <ViewFragmentConditionalRenderComponent
                        fragmentId={props.fragmentId}
                        viewId={props.viewId}
                        filterId={selectedConditionalRef[0].refId}
                        onNameChange={handleFilterNameChange}
                    />
                    <button className="button is-danger mt-4" onClick={() => deleteFilter(selectedConditionalRef[0].refId)}>
                        Delete Filter
                    </button>
                </fieldset>
            }

            <button className={"is-success button mt-2"} onClick={addFilter}>Add Filter</button>
        </>
    )
};