
import {LineDeserializer} from "./LineDeserializer";
import {LineSerializer} from "./LineSerializer";


export const AllLayerComponents = {
    [LineDeserializer.name]: {
        component: LineDeserializer,
    },
    [LineSerializer.name]: {
        component: LineSerializer,
    },
}