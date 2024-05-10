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
import { Table } from "./table";
import { CustomPlugin } from "../services/custom";
import {
  Inventory,
  InventoryItem,
  InventoryItemElement,
} from "../libs/ofs/main";

let tag: string = "ofs";

export const pluginContext = createContext(new CustomPlugin());

export function OfsProxy() {
  const ofsPlugin = useContext(pluginContext);
  const [data, setData] = useState(ofsPlugin.data);
  console.log(ofsPlugin.tag, "Component created " + JSON.stringify(data));
  ofsPlugin.setState = setData;
  tag = ofsPlugin.tag;
  var inventoryDataString = "";
  var inventoryList: InventoryItem[] = [];
  if ("inventoryList" in data) {
    inventoryDataString = data.inventoryList;
    var inventoryData = new Inventory(inventoryDataString);
    inventoryList = inventoryData.installed({
      aid: data.activity.aid,
    });
  }

  console.log(ofsPlugin.tag, "Items to draw " + inventoryList.length);
  return (
    <div class="oj-web-applayout-max-width oj-web-applayout-content">
      <Table tag={ofsPlugin.tag} tableDataArray={inventoryList} />
      <hr></hr>
      <oj-button
        id="submit_button"
        label={"Close"}
        onojAction={() => ofsPlugin.close()}
      ></oj-button>
    </div>
  );
}
