import * as React from "react";
import {useState} from "react";
import {bellogRuntime} from "../core/BellogRuntime";
import {RuntimeView} from "./RuntimeView";
import {getElementRefString} from "../../common/utility/CommonUtil";

export const RuntimeRootTabsContainer = () => {

    const views = bellogRuntime.getViews();
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="blr-main-content">
            <div className="blr-tabs-bar">
                {views.map((view, index) => (
                    <div
                        key={getElementRefString(view)}
                        className={`blr-tab ${index === activeIndex ? 'blr-tab--active' : ''}`}
                        onClick={() => setActiveIndex(index)}
                    >
                        {view.refName}
                    </div>
                ))}
            </div>
            <div className="blr-tab-content">
                {views.map((view, index) => (
                    <div
                        key={getElementRefString(view)}
                        className={`blr-tab-panel ${index !== activeIndex ? 'blr-tab-panel--hidden' : ''}`}
                    >
                        <RuntimeView viewRef={view} />
                    </div>
                ))}
            </div>
        </div>
    );
};