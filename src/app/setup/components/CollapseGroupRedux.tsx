import * as React from "react";
import { useLayoutEffect, useState } from "react";
import {useSelector} from "react-redux";
import {RootState} from "../store/AppStore";
import {DragDropContext, Draggable, Droppable} from "@hello-pangea/dnd";
import {CollapseCard} from "./CollapseCard";
import {CollapseDraggableComponent} from "./CollapseDraggableComponent";

export const CollpaseGroupRedux = (props: {
    arrayIds: Array<number>,
    disableItem?: (id: number) => void,
    selector: (state: RootState, id: number) => {name: string, disabled?: boolean} & any,
    eyeIcon?: boolean,
    deleteIcon?: boolean,
    duplicateIcon?: boolean,
    duplicateClick?: (item, index) => void,
    setNewArray: (array: Array<any>) => void,
    children: (item: any, index: number) => React.ReactNode
}) => {

    const [draggingItem, setDraggingItem] = useState<number | null>(null);
    const preventExpandOnDragRef = React.useRef<boolean>(false)
    const arrayIds = props.arrayIds
    const setNewArray = props.setNewArray

    // Function to update list on drop
    const handleDrop = (droppedItem) => {
        // Ignore drop outside droppable container
        if (!droppedItem.destination) return;
        var updatedList = [...arrayIds];
        // Remove dragged item
        const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
        // Add dropped item
        updatedList.splice(droppedItem.destination.index, 0, reorderedItem);
        // Update State
        setNewArray(updatedList);
    };
    /* Drag element needs to be re-created if length changes */
    return (
        <DragDropContext key={arrayIds.length}
            onDragStart={(start) => {
                setDraggingItem(parseInt(start.draggableId))
            }}
            onDragEnd={
                (droppedItem) => {
                    handleDrop(droppedItem)
                    setTimeout(() => setDraggingItem(null), 100);
                }
            }>
            <Droppable droppableId="list-container">
                {(provided) => (
                    <div
                        className="list-container p-1"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        {
                            arrayIds.map((elem, index) => {
                                const data = useSelector((state: RootState) => props.selector(state, elem))

                                function eyeClick(eyeOff) {
                                    props?.disableItem(elem)
                                }

                                function deleteClick() {
                                    setNewArray(arrayIds.filter((val, n_index) => {
                                        return n_index != index
                                    }))
                                }

                                function duplicateClick() {
                                    props?.duplicateClick(elem, index)
                                }

                                return (

                                    <Draggable
                                        key={elem} draggableId={elem.toString()} index={index}>
                                        {(provided) => (
                                            <div  className={"mb-2"} ref={provided.innerRef}
                                                {...provided.draggableProps}

                                                  >
                                            <CollapseDraggableComponent
                                                dragHandleProps={provided.dragHandleProps}
                                                deleteIcon={props.deleteIcon}
                                                duplicateIcon={props.duplicateIcon}
                                                title={data.name}
                                                duplicateClick={duplicateClick}
                                                deleteClick={deleteClick}
                                                dragging={elem === draggingItem}
                                            >
                                                {props.children(elem, index)}
                                            </CollapseDraggableComponent>
                                            </div>
                                        )}

                                    </Draggable>
                                )


                            })

                        }

                        {provided.placeholder}
                    </div>
                )}

            </Droppable>
        </DragDropContext >
    )
}