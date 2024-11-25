import * as React from "react";
import {useState} from "react";
import {createPortal} from "react-dom";
import {DialogCancelable} from "./DialogHelper";

export interface DialogInputTextProps extends DialogCancelable {
    title: string,
    message: string,
    initialText: string,
    notValidMessage: string,
    onValidTextCheck: (text: string) => boolean
    onConfirm: (text:string) => void
}

export const defaultInputTextDialogState: DialogInputTextProps = {
    title: "",
    message: "",
    initialText: "",
    notValidMessage: "Not Valid",
    onValidTextCheck: (_:string) => true,
    onConfirm: () => {},
    onCancel: () => {}
}

export const DialogInputText = (
    props: DialogInputTextProps
) => {

    const {title, message, initialText, notValidMessage, onValidTextCheck, onConfirm, onCancel} = props;

    const [isValidInput, setIsValidInput] = useState(onValidTextCheck(initialText))
    const [text, setText] = useState(initialText)

    return createPortal(
        <div className="modal is-active" id="validationDialog">
            <div className="modal-background"></div>
            <div className="modal-card">
                <header className="modal-card-head">
                    <p className="modal-card-title">{title}</p>

                    <button className="delete" aria-label="close" id="closeDialog" onClick={onCancel}></button>
                </header>
                <section className="modal-card-body">
                    <div className="field">
                        <label className="label">{message}</label>
                        <div className="control">
                            <input className="input" type="text"
                                   id="textInput" placeholder="Type something..." value={text}
                                    onKeyDown={(e) => {e.key === 'Enter' ? onConfirm(text) : ""}}
                                    onInput={(evt) => {
                                        setIsValidInput(onValidTextCheck(evt.currentTarget.value))
                                        setText(evt.currentTarget.value)
                                    }
                            }/>
                        </div>
                        <p className={`help is-danger ${isValidInput ? 'is-hidden' : ''}`} id="errorTooltip">{notValidMessage}</p>
                    </div>
                </section>
                <footer className="modal-card-foot">
                    <button className="button" id="cancelButton" onClick={onCancel}>Cancel</button>
                    <button className="button is-success" id="acceptButton" onClick={() => {onConfirm(text)}} disabled={!isValidInput}>Accept</button>
                </footer>
            </div>
        </div>, document.body
        )
}
