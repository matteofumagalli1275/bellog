import * as React from "react";
import {useCallback, useEffect, useRef, useState} from "react";
import {bellogRuntimePlaybackEngine, PlaybackState} from "../core/BellogRuntimePlaybackEngine";

const SPEEDS = [0.5, 1, 2, 5, 10];

export const PlaybackTimelinePopup = () => {

    const [state, setState] = useState<PlaybackState>(bellogRuntimePlaybackEngine.state);
    const [progress, setProgress] = useState(0);
    const [cursorTime, setCursorTime] = useState(0);
    const [speed, setSpeed] = useState(bellogRuntimePlaybackEngine.speed);

    // Drag state for the popup
    const popupRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({x: 0, y: 0});
    const dragging = useRef(false);

    useEffect(() => {
        const unsub = bellogRuntimePlaybackEngine.onChange((s, t, p) => {
            setState(s);
            setCursorTime(t);
            setProgress(p);
        });
        return unsub;
    }, []);

    const handlePlay = () => bellogRuntimePlaybackEngine.play();
    const handlePause = () => bellogRuntimePlaybackEngine.pause();

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pct = parseFloat(e.target.value);
        const start = bellogRuntimePlaybackEngine.startTime;
        const end = bellogRuntimePlaybackEngine.endTime;
        const ts = start + (end - start) * pct;
        bellogRuntimePlaybackEngine.seek(ts);
    };

    const handleSpeedChange = (s: number) => {
        bellogRuntimePlaybackEngine.setSpeed(s);
        setSpeed(s);
    };

    // Draggable popup
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('input, button, select')) return;
        dragging.current = true;
        const rect = popupRef.current!.getBoundingClientRect();
        dragOffset.current = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        e.preventDefault();
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current || !popupRef.current) return;
            popupRef.current.style.left = `${e.clientX - dragOffset.current.x}px`;
            popupRef.current.style.top = `${e.clientY - dragOffset.current.y}px`;
            popupRef.current.style.right = 'auto';
            popupRef.current.style.bottom = 'auto';
        };
        const onMouseUp = () => { dragging.current = false; };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    const formatTime = (ts: number) => {
        if (!ts) return '--:--:--';
        return new Date(ts).toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const formatDuration = (ms: number) => {
        const sec = Math.floor(ms / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const elapsed = cursorTime - bellogRuntimePlaybackEngine.startTime;
    const total = bellogRuntimePlaybackEngine.duration;

    return (
        <div
            ref={popupRef}
            onMouseDown={onMouseDown}
            style={{
                position: 'fixed',
                bottom: '60px',
                right: '20px',
                width: '420px',
                background: '#1a1a2e',
                color: '#eee',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                zIndex: 10000,
                cursor: 'default',
                userSelect: 'none',
                fontFamily: 'monospace',
                fontSize: '12px',
            }}
        >
            {/* Header */}
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{fontWeight: 'bold', fontSize: '13px'}}>
                    ▶ Replay: {bellogRuntimePlaybackEngine.meta?.name || 'History'}
                </span>
                <a href={`/runtime.html#/${new URLSearchParams(window.location.hash.split('?')[1] || '').get('profileId') || window.location.hash.split('/')[1]}`}
                   style={{color: '#ff6b6b', textDecoration: 'none', fontWeight: 'bold'}}>
                    ✕ Live
                </a>
            </div>

            {/* Timeline bar */}
            <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                onChange={handleSeek}
                style={{width: '100%', cursor: 'pointer', accentColor: '#4ecca3'}}
            />

            {/* Time display */}
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px'}}>
                <span>{formatTime(cursorTime)}</span>
                <span>{formatDuration(elapsed)} / {formatDuration(total)}</span>
            </div>

            {/* Controls */}
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                {state === 'playing' ? (
                    <button onClick={handlePause} style={btnStyle}>⏸</button>
                ) : (
                    <button onClick={handlePlay} style={btnStyle}>▶</button>
                )}

                {SPEEDS.map(s => (
                    <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        style={{
                            ...btnStyle,
                            background: speed === s ? '#4ecca3' : '#333',
                            color: speed === s ? '#000' : '#eee',
                        }}
                    >
                        {s}x
                    </button>
                ))}
            </div>
        </div>
    );
};

const btnStyle: React.CSSProperties = {
    background: '#333',
    color: '#eee',
    border: '1px solid #555',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'monospace',
};
