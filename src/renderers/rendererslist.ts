import {GenericRenderer} from "./generic/Generic";
import {ReactNode} from "react";

interface RendererListEntry {
    name: string,
    renderer: any
}

export const RendererList: RendererListEntry[] = [
    {
        name: "Generic",
        renderer: GenericRenderer
    }
]