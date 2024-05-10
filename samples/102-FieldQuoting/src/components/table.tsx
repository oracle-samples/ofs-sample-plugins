import { h, FunctionalComponent, ComponentProps } from "preact";
import { useState, useContext } from "preact/hooks";
import "ojs/ojbutton";
import "ojs/ojtable";
import "ojs/ojmenu";
import "ojs/ojslider";
import "ojs/ojaccordion";
import "ojs/ojswitch";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import { RowExpanderElement } from "ojs/ojrowexpander";

import { pluginContext } from "./app";

type TableProps = ComponentProps<"oj-table">;
type Props = {
  tag: string;
  tableDataArray: any[];
};

export function Table(props: Props) {
  const setColumnsDefault: TableProps["columnsDefault"] = {
    sortable: "disabled",
  };
  const setSelectionMode: TableProps["selectionMode"] = {
    row: "none",
    column: "none",
  };
  const setScrollPolicy: TableProps["scrollPolicyOptions"] = {
    fetchSize: 500,
    maxCount: 1000,
  };

  const columnsDef: TableProps["columns"] = [
    /*{
        headerText: "Key",
        field: "key",
        headerClassName: "oj-sm-only-hide",
        className: "oj-sm-only-hide",
        resizable: "enabled",
        sortable: "enabled",
    },*/
    {
      headerText: "Line Type",
      field: "invtype",
      resizable: "enabled",
    },
    {
      headerText: "Part Model",
      field: "inventory_model",
      resizable: "enabled",
    },
    {
      headerText: "Part Description",
      field: "part_item_desc",
      resizable: "enabled",
    },
    {
      headerText: "Labor Start Time",
      field: "labor_start_time",
      resizable: "enabled",
    },
    {
      headerText: "Labor End Time",
      field: "labor_end_time",
      resizable: "enabled",
    },
    {
      headerText: "Expense Amount",
      field: "expense_amount",
      resizable: "enabled",
    },
    {
      headerText: "Expense Currency",
      field: "expense_currency_code",
      resizable: "enabled",
    },
    {
      headerText: "Calculated Charges",
      field: "I_TOTAL_PRICE",
      resizable: "enabled",
    },
  ];

  var tableDataList = new ArrayDataProvider(props.tableDataArray, {
    keyAttributes: "inventory_model",
    implicitSort: [{ attribute: "inventory_model", direction: "ascending" }],
  });

  tableDataList.addEventListener("mutate", (event: Event) => {
    console.log(props.tag, "Data mutated");
  });
  return (
    <div class="oj-md-margin-4x-horizontal">
      <br></br>
      <h3 slot="header">{"Charges Summary"}</h3>
      <oj-table
        id="table"
        aria-label="Charges Table"
        data={tableDataList}
        selectionMode={setSelectionMode}
        scrollPolicy="loadMoreOnScroll"
        scrollPolicyOptions={setScrollPolicy}
        columnsDefault={setColumnsDefault}
        columns={columnsDef}
        class="oj-bg-body table-sizing"
      >
      </oj-table>
   
    </div>
  );
}
