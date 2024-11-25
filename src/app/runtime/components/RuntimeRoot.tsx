import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import * as React from "react";
import {RuntimeTopToolbar} from "./RuntimeTopToolbar";
import {bellogRuntime} from "../core/BellogRuntime";
import {RuntimeRootTabsContainer} from "./RuntimeRootTabsContainer";
import {bellogRuntimePlaybackEngine} from "../core/BellogRuntimePlaybackEngine";
import {PlaybackTimelinePopup} from "./PlaybackTimelinePopup";

export const RuntimeRoot = () => {

    const {profileId, historyId} = useParams();
    const isReplay = !!historyId;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                if (isReplay) {
                    await bellogRuntime.loadProfileForReplay(parseInt(profileId));
                    await bellogRuntimePlaybackEngine.load(parseInt(historyId));
                } else {
                    await bellogRuntime.loadProfile(parseInt(profileId));
                }
                setLoading(false);
            } catch (ex) {
                console.error('[RuntimeRoot] load error:', ex);
                setLoading(false);
                setError(true);
            }
        };
        init();
    }, []);

    if (loading) return <div className="blr-loading">Loading profile...</div>;
    if (error) return <div className="blr-error">An error occurred loading profile {profileId}</div>;

    return (
        <div className="blr-wrapper">
            <RuntimeTopToolbar />
            <RuntimeRootTabsContainer />
            {isReplay && <PlaybackTimelinePopup />}
        </div>
    );
};