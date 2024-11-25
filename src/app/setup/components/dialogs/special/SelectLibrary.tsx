import * as React from "react";
import {useEffect, useState} from "react";
import {BindableVariable, CustomPropertyType, ElementType} from "../../../../common/model/profile/Common";
import {getElementFromRef, getLocalRefFromElement} from "../../Utils";
import {profileSelectEventDeps} from "../../../store/profile/ProfileSelectors";
import {useSelector} from "react-redux";
import {appStore} from "../../../store/AppStore";
import {ProfileRepositoryFactory} from "../../../../common/repositories/ProfileRepositoryFactory";
import {UserDataProfileMeta} from "../../../../common/model/UserData";

export interface AvailableProfileVariablesProps {
    open: boolean;
    onClose: () => void;
    onSelected: (library: UserDataProfileMeta) => void;
}

export const SelectLibrary: React.FC<AvailableProfileVariablesProps> = ({
                                                                                        open,
                                                                                        onClose,
                                                                                        onSelected,
                                                                                    }) => {

    const [items, setItems] = useState<UserDataProfileMeta[]>([])

    useEffect( () => {
        async function fetchData() {
            const repoProfile = ProfileRepositoryFactory.getRepository()
            const profiles = await repoProfile.getProfiles()
            repoProfile.close()
            setItems(profiles.filter((it) => it.isLibrary))
        }
        fetchData();
    }, []);

    const handleSelect = (itemIndex: number) => {
        onSelected(items[itemIndex])
        onClose();
    };

    if (!open) return null;

    return (
        <div className="modal is-active">
            <div className="modal-background" onClick={onClose} />
            <div className="modal-card" style={{ maxWidth: '500px' }}>
                <header className="modal-card-head has-background-info">
                    <p className="modal-card-title has-text-weight-semibold">Select Library</p>
                    <button
                        className="delete"
                        aria-label="close"
                        onClick={onClose}
                    />
                </header>
                <section className="modal-card-body" style={{padding: '1rem'}}>
                    <div className="content">
                        {items.length > 0 ? (
                            <div className="menu">
                                <ul className="menu-list" style={{listStyle: "none"}}>
                                    {
                                        items.map((item, index) => (
                                            <li key={item.id}><a onClick={(e) => handleSelect(index)}>{`${item.name} (${item.rdnId})`}</a></li>
                                        ))
                                    }
                                </ul>
                            </div>
                        ) : (
                            <p className="has-text-grey is-italic" style={{padding: '0.5rem'}}>
                                No items available
                            </p>
                        )}
                    </div>
                </section>
                <footer className="modal-card-foot" style={{padding: '0.75rem'}}>
                    <button
                        className="button is-small is-outlined"
                        onClick={onClose}
                        style={{marginLeft: 'auto'}}
                    >
                        Cancel
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SelectLibrary;