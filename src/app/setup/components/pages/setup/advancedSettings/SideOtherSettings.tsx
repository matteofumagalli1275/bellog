import * as React from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../../../store/AppStore";
import {profileGlobalSettingsActions} from "../../../../store/profile/ProfileGlobalSettingsSlice";
import {CollapseCard} from "../../../CollapseCard";
import {CollpaseGroupRedux} from "../../../CollapseGroupRedux";
import {profileSelectChannelById} from "../../../../store/profile/ProfileSelectors";
import {ChannelComponentSetup} from "../main/ChannelComponentSetup";
import {profileDependenciesSelectors} from "../../../../store/profile/ProfileDependenciesSlice";
import DependenciesTable from "./DependenciesTable";
import * as semver from 'semver';


export const SideOtherSettings = () => {
    const dispatch = useDispatch();

    const settings = useSelector((state:RootState) => state.profile.settings)
    const dependencies = useSelector((state: RootState) => state.profile.dependencies)

    const isValidVersion = (version) => semver.valid(version) !== null;
    const isValidRdn = (rdnId) => {
        const rdnRegex = /^(?:[a-zA-Z][a-zA-Z0-9-]*\.)+[a-zA-Z][a-zA-Z0-9-]*$/;
        return rdnRegex.test(rdnId);
    };

    function setIsLibrary(value: boolean) {
        dispatch(profileGlobalSettingsActions.update({change: {isLibrary: value}}))
    }

    function setVersion(value: string) {
        dispatch(profileGlobalSettingsActions.update({change: {version: value}}))
    }

    function setRdn(value: string) {
        dispatch(profileGlobalSettingsActions.update({change: {rdnId: value}}))
    }

    function setMaximumItemsPerView(value: number) {
        dispatch(profileGlobalSettingsActions.update({change: {maximumItemsPerView: value}}))
    }

    return (
        <React.Fragment>
            <h1 className="title">Advanced settings</h1>

            <div className="field">
                <div className="control">
                    <label className="checkbox">
                        <input type="checkbox" checked={settings.isLibrary} disabled={dependencies.ids.length > 0}
                               onChange={(evt) => {
                                   setIsLibrary(evt.target.checked)
                               }}/>
                        &nbsp;Library
                    </label>
                </div>
                {dependencies.ids.length > 0 ?
                    <p className="help is-danger">A Library cannot have dependencies</p> : ""}
            </div>

            <div className="field">
                <div className="control">
                    <label className="label">Version</label>
                    <div className="control is-expanded">
                        <input className="input" type="text"
                               placeholder="Text input"
                               value={settings.version}
                               onChange={(evt) => {
                                   setVersion(evt.target.value)
                               }}/>
                    </div>
                </div>
                {!isValidVersion(settings.version) ?
                    <p className="help is-danger">Invalid version format (ex. 1.0.0)</p> : ""}
            </div>

            <div className="field">
                <div className="control">
                    <label className="label">Reverse Domain Name{settings.isLibrary ? <span className="has-text-danger"> *</span> : ""}</label>
                    <div className="control is-expanded">
                        <input className={`input${settings.isLibrary && !isValidRdn(settings.rdnId) ? ' is-danger' : ''}`} type="text"
                               placeholder="Text input"
                               value={settings.rdnId}
                               onChange={(evt) => {
                                   setRdn(evt.target.value)
                               }}/>
                    </div>
                </div>
                {settings.isLibrary && !settings.rdnId ?
                    <p className="help is-danger">Reverse Domain Name is required for libraries</p> :
                 !isValidRdn(settings.rdnId) && settings.rdnId ?
                    <p className="help is-danger">Invalid format (ex. org.bellog.mylib)</p> : ""}
            </div>

            <div className="field">
                <div className="control">
                    <label className="label">Maximum Items Per View</label>
                    <div className="control is-expanded">
                        <input className="input" type="number"
                               placeholder="Text input"
                               value={settings.maximumItemsPerView}
                               onChange={(evt) => {
                                   setMaximumItemsPerView(parseInt(evt.target.value))
                               }}/>
                    </div>
                </div>
            </div>

            <DependenciesTable/>

        </React.Fragment>
    )
}
