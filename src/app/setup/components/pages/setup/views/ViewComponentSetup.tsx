import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../../../store/AppStore";
import {profileViewsActions} from "../../../../store/profile/ProfileViewsSlice";
import {
    LayoutType,
    ViewFragment,
    ViewFragmentType,
    ViewProperty,
    ViewSettings
} from "../../../../../common/model/profile/View";
import {ViewFragmentComponent} from "./ViewFragmentComponent";
import {CollpaseGroupRedux} from "../../../CollapseGroupRedux";

import {profileSelectViewById, profileSelectViewFragmentById} from "../../../../store/profile/ProfileSelectors";
import {DragDropContext, Draggable, Droppable} from "@hello-pangea/dnd";
import {useState} from "react";

export const ViewComponentSetup = (props: {
        id: number
    }) => {

    const dispatch = useDispatch();

    const view = useSelector((state:RootState) => profileSelectViewById(state, props.id))
    const [activeTab, setActiveTab] = useState(1)

    const name = view.name;
    const fragmentNumberLookup = {
        [LayoutType.Full]: 1,
        [LayoutType.Column2]: 2,
        [LayoutType.Row2]: 2,
        [LayoutType.Column2Row1]: 3,
        [LayoutType.Row1Column2]: 3,
        [LayoutType.Column1Row2]: 3,
    }
    const fragmentSvgLookup = {
        [LayoutType.Full]: "layout_full.svg",
        [LayoutType.Column2]: "layout_column2.svg",
        [LayoutType.Row2]: "layout_row2.svg",
        [LayoutType.Column2Row1]: "layout_column2row1.svg",
        [LayoutType.Row1Column2]: "layout_row1column2.svg",
        [LayoutType.Column1Row2]: "layout_column1row2.svg",
    }

    // Handle drag end to reorder fragments
    const onDragEnd = (result) => {
        if (!result.destination) return; // Dropped outside the list

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;

        if (sourceIndex === destIndex) return; // No change

        // Get current fragments from config
        const fragments = [
            view.config.fragment1,
            view.config.fragment2,
            view.config.fragment3,
        ].slice(0, fragmentNumberLookup[view.layout]);
        const active = fragments[activeTab-1];

        // Reorder fragments
        const [reorderedItem] = fragments.splice(sourceIndex, 1);
        fragments.splice(destIndex, 0, reorderedItem);

        // Update config with reordered fragments
        const newConfig: Partial<ViewSettings> = {};
        fragments.forEach((frag, i) => {
            newConfig[`fragment${i + 1}` as keyof ViewSettings] = frag;
        });

        dispatch(
            profileViewsActions.viewUpdate({
                id: props.id,
                changes: { config: { ...view.config, ...newConfig } },
            })
        );

        setActiveTab(fragments.findIndex((it) => it === active)+1)
    };

    function update(key: keyof ViewProperty, name: any) {
        dispatch(profileViewsActions.viewUpdate({
            id: props.id,
            changes: {
                [key]: name,
            }
        }))
    }

    return (
        <React.Fragment>

            <div className="field">
                <label className="label">View Name</label>
                <div className="control">
                    <input className="input" type="text" placeholder="Text input" value={name}
                           onChange={(evt) => update("name", evt.target.value)
                           }/>
                </div>
            </div>

            <div className="field">
                <label className="label">Select a Layout</label>
                <div className="control">
                    {
                        Object.keys(fragmentNumberLookup).map((key, index) =>
                            <label key={key} className="radio ml-2">
                                <input type="radio" name="layout" value={key} checked={key === view.layout}
                                       onChange={(evt) => {
                                           update("layout", key)
                                           setActiveTab(1)
                                       }}
                                />
                                <span className="icon is-large">
                                            <img src={`res/layout/${fragmentSvgLookup[key]}`} width="32" height="32"
                                                 alt={"Full"}/>
                                        </span>
                                {String.fromCharCode(0x41 + index)}
                            </label>
                        )
                    }
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="fragments" direction="horizontal">
                    {(provided) => (
                        <div className="tabs is-left is-boxed" {...provided.droppableProps} ref={provided.innerRef}>
                            <ul>
                                {Array.from({length: fragmentNumberLookup[view.layout]}, (_, i) => (
                                    <Draggable key={i} draggableId={`fragment-${i}`} index={i}>
                                        {(provided) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={activeTab === (i + 1) ? 'is-active' : ''}
                                            >
                                                <a
                                                    onClick={() => setActiveTab(i + 1)}
                                                >
                                                    Fragment {i + 1}
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

            <ViewFragmentComponent
                viewId={props.id}
                fragmentId={activeTab}
            />
        </React.Fragment>
    )
}