
import * as React from 'react';
import * as ReactDOM from 'react-dom/client'
import App from "./app/App";
import {Buffer} from "buffer"
import {HashRouter} from "react-router-dom";
import '@creativebulma/bulma-tooltip/dist/bulma-tooltip.min.css'
import './mystyles.css'
import './bulma_override.css'
import {appStore} from "./app/setup/store/AppStore";
import {Provider} from "react-redux";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <HashRouter>
        <Provider store={appStore}>
        <App />
        </Provider>
    </HashRouter>
);