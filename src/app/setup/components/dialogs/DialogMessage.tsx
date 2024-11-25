import * as React from "react";
import {createPortal} from "react-dom";
import {DialogCancelable} from "./DialogHelper";

export enum DialogMessageSeverity {
    SUCCESS,
    WARNING,
    INFO,
    ERROR
}

export interface DialogMessageProps extends DialogCancelable {
    title: string,
    message: string,
    severity: DialogMessageSeverity
}

export const defaultDialogMessageState: DialogMessageProps = {
    title: "",
    message: "",
    severity: DialogMessageSeverity.ERROR,
    onCancel: () => null
}

export const DialogMessage = (
    props: DialogMessageProps
) => {

    const {title, message, severity, onCancel} = props;

    // Map message types to Bulma classes
    const typeStyles: Record<DialogMessageSeverity, string> = {
        [DialogMessageSeverity.SUCCESS]: "has-text-success",
        [DialogMessageSeverity.WARNING]: "has-text-warning",
        [DialogMessageSeverity.INFO]: "has-text-info",
        [DialogMessageSeverity.ERROR]: "has-text-danger"
    };

    return createPortal(
        <div className={`modal is-active`}>
            <div className="modal-background"></div>
            <div className="modal-card">
                <header className={`modal-card-head ${typeStyles[severity]}`}>
                    <p className={`modal-card-title ${typeStyles[severity]}`}>{title}</p>
                </header>
                <section className="modal-card-body">
                    <div>{message}</div>
                </section>
                <footer className="modal-card-foot">
                    <button className="button" onClick={onCancel}>
                        Cancel
                    </button>
                </footer>
            </div>
        </div>, document.body
    )
}
