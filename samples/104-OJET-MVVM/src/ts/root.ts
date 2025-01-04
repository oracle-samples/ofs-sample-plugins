/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import * as ko from "knockout";
import { whenDocumentReady } from "ojs/ojbootstrap";
import rootViewModel from "./appController";
import "ojs/ojknockout";

function init(): void {
  //register service worker
  registerServiceWorker();

  // bind your ViewModel for the content of the whole page body.
  rootViewModel.initializeController("OJET-MVVM").then((app)=>{
    ko.applyBindings(app);
  })
}

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        scope: window.location.pathname,
      });
      if (registration.installing) {
        console.debug("Service worker installing");
      } else if (registration.waiting) {
        console.debug("Service worker installed");
      } else if (registration.active) {
        console.debug("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

whenDocumentReady().then(function(){
  // if running in a hybrid (e.g. Cordova) environment, we need to wait for the deviceready
  // event before executing any code that might interact with Cordova APIs or plugins.
  if (document.body.classList.contains("oj-hybrid")) {
    document.addEventListener("deviceready", init);
  } else {
    init();
  }
});