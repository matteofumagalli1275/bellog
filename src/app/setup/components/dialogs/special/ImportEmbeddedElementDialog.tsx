import * as React from "react";
import {useEffect, useState} from "react";
import {useThrottle} from "../../../../common/utility/customHooks";
import {DialogMessageSeverity} from "../DialogMessage";
import {useDialogHelper} from "../DialogHelper";

export type ImportEmbeddedElementDialogProps<T extends { id: number; name: string }> = {
    onClose: () => void;
    onSelected: (item: T) => void;
    items: T[]
}

export const ImportEmbeddedElementDialog = <T extends { id: number; name: string }>(
    { onClose, onSelected, items }: ImportEmbeddedElementDialogProps<T>) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState(items);

    // Function to handle library selection
    const handleSelect = async (item: T) => {
        onSelected(item)
        onClose(); // Close dialog after selection
    };

    // Effect for API call when search term changes
    useEffect(() => {
        setFilteredItems(items.filter((it) => searchTerm === '' || it.name.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0))
    }, [searchTerm]);

    return (
        <>
            <div className="modal is-active">
                <div className="modal-background" onClick={onClose}></div>
                <div className="modal-card">
                    <header className="modal-card-head">
                        <p className="modal-card-title">Search</p>
                        <button className="delete" aria-label="close" onClick={onClose}></button>
                    </header>
                    <section className="modal-card-body">
                        <div className="field">
                            <div className="control">
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Search for libraries..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="panel">
                            {filteredItems.map((item, index) => (
                                <a key={index} className="panel-block" onClick={() => handleSelect(item)}>
                                    {item.name}
                                </a>
                            ))}
                        </div>
                    </section>
                    <footer className="modal-card-foot">
                        <button className="button" id="cancelButton" onClick={onClose}>Cancel</button>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default ImportEmbeddedElementDialog;