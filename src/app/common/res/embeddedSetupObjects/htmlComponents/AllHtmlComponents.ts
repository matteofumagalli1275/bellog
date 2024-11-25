import {HtmlComponentDiv} from "./Div";
import {HtmlComponentDivWithTimestamp} from "./DivWithTimestamp";
import {HtmlComponentButton} from "./Button";
import {HtmlComponentRaw} from "./Raw";
import {HtmlComponentSpan} from "./Span";


export const AllHtmlComponents = {
    [HtmlComponentDiv.name]: {
        component: HtmlComponentDiv,
    },
    [HtmlComponentDivWithTimestamp.name]: {
        component: HtmlComponentDivWithTimestamp,
    },
    [HtmlComponentButton.name]: {
        component: HtmlComponentButton,
    },
    [HtmlComponentRaw.name]: {
        component: HtmlComponentRaw,
    },
    [HtmlComponentSpan.name]: {
        component: HtmlComponentSpan,
    },
}