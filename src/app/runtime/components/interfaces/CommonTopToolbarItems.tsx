import * as React from "react";
import {useState} from "react";
import {useParams} from "react-router-dom";
import {bellogRuntimeRecorder} from "../../core/BellogRuntimeRecorder";
import {bellogRuntime} from "../../core/BellogRuntime";

export const CommonTopToolbarItems = () => {

    const {historyId} = useParams();
    const isReplay = !!historyId;

    const [recording, setRecording] = useState(false);

    const toggleRecording = async () => {
        if (recording) {
            await bellogRuntimeRecorder.stopRecording();
            setRecording(false);
        } else {
            await bellogRuntimeRecorder.startRecording(bellogRuntime.profileId);
            setRecording(true);
        }
    };

    if (isReplay) return null;

    return (
        <React.Fragment>
            <button
                className={`blr-btn blr-btn--toolbar ${recording ? 'blr-btn--active' : ''}`}
                onClick={toggleRecording}
            >
                {recording ? '\u23F9 Stop' : '\u23FA Record'}
            </button>
        </React.Fragment>
    );
};