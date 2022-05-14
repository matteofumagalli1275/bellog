/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";

import App from "./App.js";

import 'bootstrap/dist/css/bootstrap.min.css';

const BrowserWindow = eval(`require('@electron/remote')`)
const {ipcRenderer} = eval(`require('electron')`)

const {FindInPage} = eval(`require('electron-find')`)

const routing = (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </HashRouter>
  );
  
  ReactDOM.render(routing, document.getElementById("root"));

  const findInPage = new FindInPage(BrowserWindow.getCurrentWebContents());

  ipcRenderer.on('on-find', (e, args) => {
    findInPage.openFindWindow()
  })

  var isOpen = false;
  window.addEventListener("keydown",function (e) {
    if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) { 
      if(!isOpen)
        {
          findInPage.openFindWindow()
          isOpen = true
        }
      else
        {
          findInPage.closeFindWindow()
          isOpen = false
        }
    }
  })