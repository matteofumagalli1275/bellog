import * as React from "react";
import {useState} from "react";
import {bellogRuntime} from "../core/BellogRuntime";
import {RuntimeView} from "./RuntimeView";
import {getElementRefString} from "../../common/utility/CommonUtil";

export const RuntimeRootTabsContainer = () => {

    const libraries = bellogRuntime.getLoadedLibraries();
    const [perspective, setPerspective] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const views = perspective
        ? bellogRuntime.getLibraryViews(perspective)
        : bellogRuntime.getViews();

    const handlePerspectiveChange = (rdnId: string | null) => {
        bellogRuntime.setPerspective(rdnId);
        setPerspective(rdnId);
        setActiveIndex(0);
    };

    return (
        <div className="blr-main-content">
            <div className="blr-tabs-bar">
                <div className="blr-tabs-bar-tabs">
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
                {libraries.length > 0 && (
                    <div className="blr-tabs-perspective">
                        <select
                            value={perspective ?? ''}
                            onChange={(e) => handlePerspectiveChange(e.target.value || null)}
                        >
                            <option value="">Profile</option>
                            {libraries.map(lib => (
                                <option key={lib.rdnId} value={lib.rdnId}>{lib.name}</option>
                            ))}
                        </select>
                    </div>
                )}
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
