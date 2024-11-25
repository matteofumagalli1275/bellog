import * as React from "react";
import { useLayoutEffect, useState } from "react";
import {useSelector} from "react-redux";
import {RootState} from "../store/AppStore";
import {DragDropContext, Draggable, Droppable} from "@hello-pangea/dnd";
import {CollapseCard} from "./CollapseCard";
import {CollapseDraggableComponent} from "./CollapseDraggableComponent";
import {ElementProperty} from "../../common/model/profile/Element";
import {profileChannelsActions} from "../store/profile/ProfileChannelsSlice";

export const CollpaseGroup = (props: {
    array: ElementProperty[],
    disableItem?: (id: ElementProperty) => void,
    eyeIcon?: boolean,
    deleteIcon?: boolean,
    duplicateIcon?: boolean,
    duplicateClick?: (item, index) => void,
    setNewArray: (array: ElementProperty[]) => void,
    children: (item: any, index: number) => React.ReactNode
}) => {

    const [draggingItem, setDraggingItem] = useState<number | null>(null);
    const preventExpandOnDragRef = React.useRef<boolean>(false)
    const array = props.array
    const setNewArray = props.setNewArray

    // Function to update list on drop
    const handleDrop = (result) => {
        if (!result.destination) return; // Dropped outside the list

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        const [reorderedItem] = array.splice(sourceIndex, 1);
        array.splice(destIndex, 0, reorderedItem);
        setNewArray(array)
    };
    /* Drag element needs to be re-created if length changes */
    return (
        <DragDropContext
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
                            array.map((elem, index) => {
                                function eyeClick(eyeOff) {
                                    props?.disableItem(elem)
                                }

                                function deleteClick() {
                                    setNewArray(array.filter((val, n_index) => {
                                        return n_index != index
                                    }))
                                }

                                function duplicateClick() {
                                    props?.duplicateClick(elem, index)
                                }

                                return (

                                    <Draggable
                                        key={elem.id} draggableId={elem.id.toString()} index={index}>
                                        {(provided) => (
                                            <div  className={"mb-2"} ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                  >
                                            <CollapseDraggableComponent
                                                dragHandleProps={provided.dragHandleProps}
                                                deleteIcon={props.deleteIcon}
                                                duplicateIcon={props.duplicateIcon}
                                                title={elem.name}
                                                duplicateClick={duplicateClick}
                                                deleteClick={deleteClick}
                                                dragging={elem.id === draggingItem}
                                            >
                                                {props.children(elem.id, index)}
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