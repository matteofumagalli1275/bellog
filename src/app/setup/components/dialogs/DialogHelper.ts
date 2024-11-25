import {Dispatch, SetStateAction, useContext} from "react";
import {deepMerge} from "../../../common/utility/JSUtils";
import {DialogContext} from "../../../App";
import {defaultInputTextDialogState, DialogInputTextProps} from "./DialogInputText";
import {defaultYesNoConfirmDialogState, DialogYesNoConfirmProps} from "./DialogYesNoConfirm";
import {defaultDialogImportListState, DialogImportListProps} from "./DialogImportList";
import {defaultDialogMessageState, DialogMessageProps} from "./DialogMessage";

export interface DialogCancelable {
    onCancel: () => void;
}

export interface DialogInterface {
    dialogMessage: {
        open: boolean,
        opts: DialogMessageProps
    }
    dialogImportList: {
        open: boolean,
        opts: DialogImportListProps
    }
    dialogInputText: {
        open: boolean,
        opts: DialogInputTextProps
    }
    dialogYesNoConfirm: {
        open: boolean,
        opts: DialogYesNoConfirmProps
    }
}

export const defaultDialogState: DialogInterface = {
    dialogMessage: {
        open: false,
        opts: defaultDialogMessageState
    },
    dialogImportList: {
        open: false,
        opts: defaultDialogImportListState
    },
    dialogInputText: {
        open: false,
        opts: defaultInputTextDialogState
    },
    dialogYesNoConfirm: {
        open: false,
        opts: defaultYesNoConfirmDialogState
    }
}

function createDialogHelper<T extends DialogCancelable>(dialogState: DialogInterface, setDialogState: Dispatch<SetStateAction<DialogInterface>>, key: keyof DialogInterface) {
    const h = {
        close: () =>
            setDialogState(deepMerge({ ...dialogState }, { [key]: { open: false, opts: dialogState[key].opts } })),
        show: (options: Partial<T>) => {
            options.onCancel = options.onCancel ?? (() => h.close())
            setDialogState(deepMerge({ ...dialogState }, { [key]: { open: true, opts: options } }))
        }
    };
    return h
}

export function useDialogHelper() {
    const [dialogState, setDialogState]  = useContext(DialogContext)

    return {
        dialogMessage: createDialogHelper<DialogMessageProps>(dialogState, setDialogState, "dialogMessage"),
        dialogImportList: createDialogHelper<DialogImportListProps>(dialogState, setDialogState, "dialogImportList"),
        dialogInputText: createDialogHelper<DialogInputTextProps>(dialogState, setDialogState, "dialogInputText"),
        dialogYesNoConfirm: createDialogHelper<DialogYesNoConfirmProps>(dialogState, setDialogState, "dialogYesNoConfirm"),
    }
}