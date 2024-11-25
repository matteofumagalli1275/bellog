import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {profileSelectName} from "../store/profile/ProfileSelectors";
import {appStore, RootState} from "../store/AppStore";
import {validateProfileState} from "../store/DbFormatConverter";
import {statusBarActions} from "../store/statusBar/statusBarSlice";
import {useLocation} from "react-router-dom";
import {loadProfileDb, saveProfileDb} from "../store/Middleware";

export const Toolbar = () => {

    const profileName = useSelector(profileSelectName)
    const warnings = useSelector((state: RootState) => state.statusBar.warnings)
    const errors = useSelector((state: RootState) => state.statusBar.errors)
    const profileState = useSelector((state: RootState) => state.profile)
    const dispatch = useDispatch()
    const [showAnomalies, setShowAnomalies] = useState(false)
    const location = useLocation()
    const isSetupPage = location.pathname.includes('/setup')

    const totalIssues = warnings.length + errors.length
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Re-validate whenever profile state changes while on setup page
    useEffect(() => {
        if (isSetupPage) {
            const anomalies = validateProfileState(profileState)
            dispatch(statusBarActions.setWarnings(anomalies.map(m => ({message: m}))))
        }
    }, [profileState, isSetupPage])

    function saveProfile() {
        appStore.dispatch(saveProfileDb())
    }

    function exportProfile() {
        const a = document.createElement('a');
        a.download = appStore.getState().profile.name + ".bll";
        a.href = URL.createObjectURL(new Blob([JSON.stringify(appStore.getState().profile)], { type: 'text/plain' }));
        a.click();
        URL.revokeObjectURL(a.href)
    }

    function loadProfile(e: React.ChangeEvent<HTMLInputElement>) {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function () {
                appStore.dispatch(loadProfileDb(JSON.parse(reader.result as string)))
            }
            reader.readAsText(file);
            e.target.value = ""
        }
    }

    return (
        <>
            <nav className="navbar is-primary is-unselectable" role="navigation" aria-label="main navigation" style={{height: "3.25rem", position: "relative"}}>
                <div className="navbar-brand">
                    <a className="navbar-item" href="index.html">
                        <img src="logo.png" />
                    </a>

                    {isSetupPage && (
                        <span className="navbar-item">
                            {profileName}
                        </span>
                    )}
                </div>

                {isSetupPage && (
                    <>
                        <div style={{position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", height: "100%", alignItems: "center"}}>
                            <a className="navbar-item" onClick={saveProfile} title="Save (Ctrl+S)">
                                <span className="icon has-text-white"><i className="fas fa-save"></i></span>
                            </a>
                            <a className="navbar-item" onClick={exportProfile} title="Export profile">
                                <span className="icon has-text-white"><i className="fas fa-download"></i></span>
                            </a>
                            <a className="navbar-item" onClick={() => fileInputRef.current?.click()} title="Import profile">
                                <span className="icon has-text-white"><i className="fas fa-upload"></i></span>
                            </a>
                            <input ref={fileInputRef} type="file" accept=".bll" style={{display: 'none'}} onChange={loadProfile} />
                        </div>
                        <div className="navbar-end">
                            <a className="navbar-item" onClick={() => setShowAnomalies(true)}
                               title={totalIssues > 0 ? `${totalIssues} issue${totalIssues > 1 ? 's' : ''} found` : 'No issues'}>
                                <span style={{fontSize: '1.2rem', cursor: 'pointer', position: 'relative'}}>
                                    ⚠
                                    {totalIssues > 0 && (
                                        <span className="tag is-warning is-rounded" style={{
                                            position: 'absolute', top: '-6px', right: '-14px',
                                            fontSize: '0.6rem', minWidth: '18px', height: '18px',
                                            padding: '0 4px',
                                        }}>
                                            {totalIssues}
                                        </span>
                                    )}
                                </span>
                            </a>
                        </div>
                    </>
                )}
            </nav>

            {showAnomalies && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={() => setShowAnomalies(false)}></div>
                    <div className="modal-card" style={{maxWidth: '700px', width: '90%'}}>
                        <header className="modal-card-head">
                            <p className="modal-card-title">Profile Validation</p>
                            <button className="delete" aria-label="close" onClick={() => setShowAnomalies(false)}></button>
                        </header>
                        <section className="modal-card-body">
                            {warnings.length === 0 && errors.length === 0 ? (
                                <div className="notification is-success is-light">
                                    No issues found. All references are valid.
                                </div>
                            ) : (
                                <>
                                    {errors.length > 0 && (
                                        <div className="mb-4">
                                            <p className="title is-6 has-text-danger">Errors ({errors.length})</p>
                                            {errors.map((e, i) => (
                                                <div key={`err-${i}`} className="notification is-danger is-light py-2 px-3 mb-1" style={{fontSize: '0.85rem'}}>
                                                    {e.message}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {warnings.length > 0 && (
                                        <div>
                                            <p className="title is-6 has-text-warning-dark">Warnings ({warnings.length})</p>
                                            {warnings.map((w, i) => (
                                                <div key={`warn-${i}`} className="notification is-warning is-light py-2 px-3 mb-1" style={{fontSize: '0.85rem'}}>
                                                    {w.message}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                        <footer className="modal-card-foot">
                            <button className="button" onClick={() => setShowAnomalies(false)}>Close</button>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
}

export default Toolbar;