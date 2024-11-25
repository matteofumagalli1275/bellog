import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {CollapseCard} from "../../../CollapseCard";
import {ChannelUpdateEvents} from "./ChannelUpdateEvents";


export const SideCustomEventsComponents = () => {

    return (
        <React.Fragment>
            <h1 className="title">Events</h1>
            <p>Events are triggered when data flows through a channel and matches a condition.
                Each event triggers an action such as replacing HTML properties, sending data
                to an output channel, or running custom code.
            </p>
            <br/>
            <CollapseCard title="Channel Update Events">
                <ChannelUpdateEvents/>
            </CollapseCard>
        </React.Fragment>
    )
}
