import * as ReactDOM from "react-dom/client";
import {HashRouter, Route, Routes} from "react-router-dom";
import * as React from "react";
import {RuntimeRoot} from "./app/runtime/components/RuntimeRoot";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <HashRouter>
        <Routes>
            <Route path=":profileId/history/:historyId" element={
                <RuntimeRoot />
            } />
            <Route path=":profileId" element={
                <RuntimeRoot />
            } />
        </Routes>

    </HashRouter>
);