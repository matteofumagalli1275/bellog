import * as React from "react";
import {createPortal} from "react-dom";
import {DialogCancelable} from "./DialogHelper";

export interface DialogImportListProps extends DialogCancelable {
    title: string,
    message: string,
    items: Array<{name: string;} & any>
    onConfirmSelection: (item: any, index: number) => void
}

export const defaultDialogImportListState: DialogImportListProps = {
    title: "",
    message: "",
    items: [],
    onConfirmSelection: (_item:any, _index:number) => true,
    onCancel: () => {}
}

export const DialogImportList = (
    props: DialogImportListProps
) => {

    const {title, message, items, onConfirmSelection, onCancel} = props;

    return createPortal(
        <div className={`modal is-active`}>
            <div className="modal-background"></div>
            <div className="modal-card">
                <header className="modal-card-head">
                    <p className="modal-card-title">{title}</p>
                </header>
                <section className="modal-card-body">
                    <article className="panel is-primary">
                        {
                            items.map((sample, index: number) => {
                                return (
                                    <a key={sample.name} className="panel-block"
                                       onClick={() => onConfirmSelection(sample, index)}>
                                        <span className="panel-icon">
                                            <i className="fas fa-book" aria-hidden="true"></i>
                                        </span>
                                        {sample.name}
                                    </a>
                                )
                            })
                        }
                    </article>
                </section>
                <footer className="modal-card-foot">
                    <button className="button"
                        onClick={onCancel}>
                        Cancel
                    </button>
                </footer>
            </div>
        </div>, document.body
    )
}
