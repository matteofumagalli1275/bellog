import * as React from "react";
import {useEffect, useState} from "react";
import {historyRepository} from "../../../../common/repositories/HistoryRepository";
import {DbHistoryMeta} from "../../../../common/providers/indexedDb/db";

export const HistoryList = (props: { profileId: number }) => {

    const [sessions, setSessions] = useState<DbHistoryMeta[]>([]);
    const [expanded, setExpanded] = useState(false);

    const load = async () => {
        const list = await historyRepository.getSessionsForProfile(props.profileId);
        setSessions(list);
    };

    useEffect(() => {
        if (expanded) load();
    }, [expanded]);

    const handleDelete = async (id: number) => {
        await historyRepository.deleteSession(id);
        await load();
    };

    const handleExport = async (id: number) => {
        const blob = await historyRepository.exportSession(id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `history_${id}.jsonl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        await historyRepository.importSession(props.profileId, text);
        e.target.value = "";
        await load();
    };

    const formatTime = (ts?: number) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleString();
    };

    if (!expanded) {
        return (
            <button className="button is-small is-light"
                    onClick={() => setExpanded(true)}>
                <span className="icon"><i className="fas fa-history"></i></span>
                <span>History</span>
            </button>
        );
    }

    return (
        <>
            <button className="button is-small is-light"
                    onClick={() => setExpanded(false)}>
                <span className="icon"><i className="fas fa-history"></i></span>
                <span>History</span>
            </button>
            <div style={{flexBasis: '100%', marginTop: '0.5rem'}}>
            <div className="is-flex is-align-items-center" style={{gap: '0.5rem', marginBottom: '0.25rem'}}>
                <strong style={{fontSize: '0.85rem'}}>History</strong>
                <input type="file" accept=".jsonl" style={{display: 'none'}}
                       onChange={handleImport} id={`hist-import-${props.profileId}`}/>
                <button className="button is-small is-info"
                        onClick={() => document.getElementById(`hist-import-${props.profileId}`)?.click()}>
                    Import
                </button>
            </div>

            {sessions.length === 0 ? (
                <p style={{fontSize: '0.8rem', color: '#888'}}>No recordings yet.</p>
            ) : (
                <table className="table is-narrow is-fullwidth" style={{fontSize: '0.8rem'}}>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sessions.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{formatTime(s.startTime)}</td>
                            <td>{formatTime(s.endTime)}</td>
                            <td>
                                <div className="is-flex" style={{gap: '0.25rem'}}>
                                    <a className="button is-small is-success"
                                       href={`/runtime.html#/${props.profileId}/history/${s.id}`}
                                       target="_blank"
                                       rel="noopener noreferrer">
                                        Replay
                                    </a>
                                    <button className="button is-small is-link"
                                            onClick={() => handleExport(s.id!)}>
                                        Export
                                    </button>
                                    <button className="button is-small is-danger"
                                            onClick={() => handleDelete(s.id!)}>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
            </div>
        </>
    );
};
