import * as React from "react";
import {useEffect, useState} from "react";
import {useThrottle} from "../../../../common/utility/customHooks";
import {DialogMessageSeverity} from "../DialogMessage";
import {useDialogHelper} from "../DialogHelper";

type CDNResponse = { name: string; latest:string, fileType: string, description: string; version: string }

export interface LibrarySearchDialogProps {
    open: boolean;
    onClose: () => void;
    onSelected: (libraryName: string, libraryCode: string) => void;
    scriptType: string
}

export const LibraryCDNSearchDialog: React.FC<LibrarySearchDialogProps> = ({ open, onClose, onSelected, scriptType }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const throttledSearch = useThrottle(searchTerm, 400);
    const [libraries, setLibraries] = useState<CDNResponse[]>([]);

    const {dialogMessage} = useDialogHelper()

    // Function to handle library selection
    const handleLibrarySelect = async (library: CDNResponse) => {
        try {
            const response = await fetch(library.latest)
            const data = await response.text()
            onSelected(library.name + "_" + library.version + "." + scriptType, data)
        } catch (ex) {
            dialogMessage.show({
                title: "CDN Import Failed",
                severity: DialogMessageSeverity.ERROR,
                message: ex.message
            })
        }
        onClose(); // Close dialog after selection
    };

    // Effect for API call when search term changes
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const signal = controller.signal;

        if (throttledSearch) {
            fetch(`https://api.cdnjs.com/libraries?search=${throttledSearch}&fields=version,fileType,description&limit=30`, { signal })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (isMounted) {
                        setLibraries(data.results.filter((it) => it.fileType === scriptType));
                    }
                })
                .catch(error => {
                    // Check if the error is from aborting the request
                    if (error.name !== 'AbortError') {
                        console.error("Failed to fetch libraries:", error);
                    }
                });
        } else {
            if (isMounted) {
                setLibraries([]);
            }
        }

        // Cleanup function to cancel the fetch request if the effect runs again before completion
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [throttledSearch]);

    return (
        <>
            {open && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={onClose}></div>
                    <div className="modal-card">
                        <header className="modal-card-head">
                            <p className="modal-card-title">Search for Libraries</p>
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
                                {libraries.map((lib, index) => (
                                    <a key={index} className="panel-block" onClick={() => handleLibrarySelect(lib)}>
                                        {lib.name} - {lib.description}
                                    </a>
                                ))}
                            </div>
                        </section>
                        <footer className="modal-card-foot">
                            <button className="button" id="cancelButton" onClick={onClose}>Cancel</button>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default LibraryCDNSearchDialog;