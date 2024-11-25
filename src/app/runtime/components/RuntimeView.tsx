import * as React from "react";
import {bellogRuntime} from "../core/BellogRuntime";
import {ElementReference} from "../../common/model/profile/Common";
import {
    LayoutType,
    ViewFragment,
    ViewFragmentAppend,
    ViewFragmentFixed,
    ViewFragmentType,
    ViewProperty
} from "../../common/model/profile/View";
import {RuntimeViewFragmentAppend} from "./RuntimeViewFragmentAppend";
import {RuntimeViewFragmentFixed} from "./RuntimeViewFragmentFixed";
import {SplitPane} from "./SplitPane";

export const RuntimeView = (props: { viewRef: ElementReference }) => {

    const view: ViewProperty = bellogRuntime.getElement(props.viewRef);
    const { layout, config } = view;

    const renderFragment = (frag: ViewFragment) => {
        if (frag.type === ViewFragmentType.Append) {
            return <RuntimeViewFragmentAppend view={view} viewFragment={frag.config as ViewFragmentAppend} />;
        } else if (frag.type === ViewFragmentType.Fixed) {
            return <RuntimeViewFragmentFixed view={view} viewFragment={frag.config as ViewFragmentFixed} />;
        }
        return null;
    };

    const f1 = config.fragment1;
    const f2 = config.fragment2;
    const f3 = config.fragment3;

    switch (layout) {
        case LayoutType.Full:
            return <div className="blr-view-full">{renderFragment(f1)}</div>;

        case LayoutType.Column2:
            return (
                <SplitPane direction="horizontal" initialPercent={f1.percent}
                    first={renderFragment(f1)}
                    second={renderFragment(f2)}
                />
            );

        case LayoutType.Row2:
            return (
                <SplitPane direction="vertical" initialPercent={f1.percent}
                    first={renderFragment(f1)}
                    second={renderFragment(f2)}
                />
            );

        /* Two columns on top, one full-width row on bottom */
        case LayoutType.Column2Row1:
            return (
                <SplitPane direction="vertical" initialPercent={f1.percent}
                    first={
                        <SplitPane direction="horizontal" initialPercent={f2.percent}
                            first={renderFragment(f1)}
                            second={renderFragment(f2)}
                        />
                    }
                    second={renderFragment(f3)}
                />
            );

        /* One full-width row on top, two columns on bottom */
        case LayoutType.Row1Column2:
            return (
                <SplitPane direction="vertical" initialPercent={f1.percent}
                    first={renderFragment(f1)}
                    second={
                        <SplitPane direction="horizontal" initialPercent={f2.percent}
                            first={renderFragment(f2)}
                            second={renderFragment(f3)}
                        />
                    }
                />
            );

        /* One column on the left, two rows on the right */
        case LayoutType.Column1Row2:
            return (
                <SplitPane direction="horizontal" initialPercent={f1.percent}
                    first={renderFragment(f1)}
                    second={
                        <SplitPane direction="vertical" initialPercent={f2.percent}
                            first={renderFragment(f2)}
                            second={renderFragment(f3)}
                        />
                    }
                />
            );

        default:
            return <div className="blr-error">Unknown layout type: {layout}</div>;
    }
};