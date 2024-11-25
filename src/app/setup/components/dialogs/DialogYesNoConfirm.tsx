import * as React from "react";
import {createPortal} from "react-dom";
import {DialogCancelable} from "./DialogHelper";

export interface DialogYesNoConfirmProps extends DialogCancelable {
    title: string,
    message: string,
    onConfirm: () => void
}

export const defaultYesNoConfirmDialogState: DialogYesNoConfirmProps = {
    title: "Confirmation",
    message: "",
    onConfirm: () => {},
    onCancel: () => {}
}

export const DialogYesNoConfirm = (
    props: DialogYesNoConfirmProps
) => {

    const {title, message, onConfirm, onCancel} = props;

    return createPortal(
        <div className="modal is-active" id="confirmation-dialog">
            <div className="modal-background"></div>
            <div className="modal-card">
                <header className="modal-card-head">
                    <p className="modal-card-title">{title}</p>
                    <button className="delete" aria-label="close" onClick={onCancel}></button>
                </header>
                <section className="modal-card-body">
                    <p>{message}</p>
                </section>
                <footer className="modal-card-foot">
                    <button className="button is-success" onClick={onConfirm}>Yes</button>
                    <button className="button is-danger" onClick={onCancel}>No</button>
                </footer>
            </div>
        </div>, document.body
    )
}
