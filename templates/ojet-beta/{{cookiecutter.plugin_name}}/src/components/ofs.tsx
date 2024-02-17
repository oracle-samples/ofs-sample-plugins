/**
 * @license
 * Copyright (c) 2014, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { createContext } from "preact";
import { useState, useContext } from "preact/hooks";
import "oj-c/button";
import { OFSOpenMessage, OFSPlugin } from "../libs/ofs/main";

export class CustomPlugin extends OFSPlugin {
    dataContext = createContext(new OFSOpenMessage());
    data: OFSOpenMessage = new OFSOpenMessage();
    setState: any;
    open(data: OFSOpenMessage): void {
        // write data in the dataContext
        this.setState(data);
    }
    constructor() {
        super("plugin-template");
    }
}

export const pluginContext = createContext(new CustomPlugin());

export function OfsProxy() {
    const ofsPlugin = useContext(pluginContext);
    const [data, setData] = useState(ofsPlugin.data);
    ofsPlugin.setState = setData;

    return (
        <div>
            <p>Hello world. Greetings from {data.user.uname}</p>
            <oj-c-button
                id="close_button"
                label="Close"
                onojAction={() => ofsPlugin.close()}
            ></oj-c-button>
        </div>
    );
}
