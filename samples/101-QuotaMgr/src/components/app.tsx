/**
 * @license
 * Copyright (c) 2014, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { registerCustomElement } from "ojs/ojvcomponent";
import { createContext } from "preact";
import { useState, useContext } from "preact/hooks";
import { h } from "preact";
import { useEffect } from "preact/hooks";
import Context = require("ojs/ojcontext");
import { OfsContainer } from "./ofs";
import { CustomPlugin } from "../services/custom";

export const pluginContext = createContext(new CustomPlugin());

type Props = Readonly<{
    appName?: string;
    userLogin?: string;
}>;

export const App = registerCustomElement(
    "app-root",
    ({ appName = "Capacity Dashboard" }: Props) => {
        useEffect(() => {
            Context.getPageContext()
                .getBusyContext()
                .applicationBootstrapComplete();
            //getQuota();
        }, []);

        return (
            <div id="appContainer" class="oj-web-applayout-page">
                <OfsContainer></OfsContainer>
            </div>
        );
    }
);
