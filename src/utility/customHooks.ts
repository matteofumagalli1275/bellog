import {useState} from "react";

export function useStateWithCallback<T>(initialValue: T, onUpdate: (T) => void):  [T, ((newValue: T, propagateState?: boolean) => void)] {

    const [state, _setState] = useState<T>(initialValue)
    //this logic is up to you
    const setState = (newState, propagateState: boolean = true) => {
        if(propagateState)
            _setState(newState)
        onUpdate(newState)
    }
    return [state, setState]
}