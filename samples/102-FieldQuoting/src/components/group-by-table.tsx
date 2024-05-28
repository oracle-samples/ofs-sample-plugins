import { ComponentProps } from "preact";
import "ojs/ojtable";
import { ojTable } from "ojs/ojtable";
import { Item } from "ojs/ojdataprovider";
import "ojs/ojrowexpander";
import { MutableArrayTreeDataProvider } from "ojs/ojmutablearraytreedataprovider";
import FlattenedTreeDataProviderView = require("ojs/ojflattenedtreedataproviderview");
import { KeySetImpl } from "ojs/ojkeyset";
import * as groupData from "text!./data/groupdatainventory.json";

type TableItem = {
  id: string;
  count?: number;
  accText?: string;
  inv_aid?: number | null;
  invid: any;
  quantity: any;
  inventory_model: any;
  invtype: any;
  invsn: any;
  invpool: string | undefined;
  I_TOTAL_PRICE: number | 0.0;
  part_item_desc?: string | undefined;
  labor_start_time?: string | undefined;
  labor_end_time?: string | undefined;
  expense_amount?: number | undefined;
  expense_currency_code?: string | undefined;
  totalCharges?: number;
  children?: object;
};

type TableProps = ComponentProps<"oj-table">;
type Props = {
  tag: string;
  tableDataArray: any[];
};

const setSelectionMode: TableProps["selectionMode"] = {
  row: "multiple",
  column: "multiple",
};
const setScrollPolicy: TableProps["scrollPolicyOptions"] = {
  fetchSize: 10,
  maxCount: 500,
};

const columnsDef: TableProps["columns"] = [
  {
    headerText: "Line Type",
    id: "invtype",
    field: "invtype",
    resizable: "enabled",
  },
  {
    headerText: "Part Model",
    id: "inventory_model",
    field: "inventory_model",
    resizable: "enabled",
  },
  {
    headerText: "Part Description",
    id: "part_item_desc",
    field: "part_item_desc",
    resizable: "enabled",
  },
  {
    headerText: "Labor Start Time",
    headerClassName: "oj-helper-text-align-end",
    className: "oj-helper-text-align-end",
    id: "labor_start_time",
    field: "labor_start_time",
    resizable: "enabled",
  },
  {
    headerText: "Labor End Time",
    headerClassName: "oj-helper-text-align-end",
    className: "oj-helper-text-align-end",
    id: "labor_end_time",
    field: "labor_end_time",
    resizable: "enabled",
  },
  {
    headerText: "Expense Amount",
    id: "expense_amount",
    field: "expense_amount",
    resizable: "enabled",
  },
  {
    headerText: "Expense Currency",
    id: "expense_currency_code",
    field: "expense_currency_code",
    resizable: "enabled",
  },
  {
    headerText: "Calculated Charges",
    headerClassName: "oj-helper-text-align-end",
    className: "oj-helper-text-align-end",
    id: "I_TOTAL_PRICE",
    field: "I_TOTAL_PRICE",
    resizable: "enabled",
  },
];

const rowItemTemplate = (
  row: ojTable.RowTemplateContext<TableItem["id"], TableItem>
) => {
  return (
    <tr>
      {row.item.metadata.treeDepth === 0 && (
        <td
          colSpan={8}
          aria-label={row.item.data.accText}
          class="oj-sm-padding-0-start"
        >
          <div class="oj-flex-bar oj-sm-align-items-center">
            <div class="oj-sm-padding-2x-horizontal">
              <oj-row-expander
                context={row}
                data-oj-clickthrough="disabled"
              ></oj-row-expander>
            </div>
            <div tabIndex={0} class="oj-typography-subheading-xs">
              {row.item.data.invtype}
            </div>
            <div class="oj-flex-bar-end oj-sm-text-align-end">
              <div tabIndex={0}>
                <span class="oj-typography-body-xs oj-text-color-secondary oj-typography-semi-bold">
                  Results
                </span>
                <div class="oj-sm-margin-0 oj-typography-body-md oj-typography-semi-bold">
                  {row.item.data.count}
                </div>
              </div>
              <div tabIndex={0} class="oj-sm-padding-10x-start">
                <span class="oj-typography-body-xs oj-text-color-secondary oj-typography-semi-bold">
                  Total Charges
                </span>
                <div class="oj-sm-margin-0 oj-typography-body-md oj-typography-semi-bold">
                  {row.item.data.totalCharges}
                </div>
              </div>
            </div>
          </div>
        </td>
      )}
      {row.item.metadata.treeDepth === 1 && (
        <>
          <td>
            <span>{row.item.data.invtype}</span>
          </td>
          <td>
            <span>{row.item.data.inventory_model}</span>
          </td>
          <td>
            <span>{row.item.data.part_item_desc}</span>
          </td>
          <td>
            <span>{row.item.data.labor_start_time}</span>
          </td>
          <td>
            <span>{row.item.data.labor_end_time}</span>
          </td>
          <td>
            <span>{row.item.data.expense_amount}</span>
          </td>
          <td>
            <span>{row.item.data.expense_currency_code}</span>
          </td>
          <td>
            <span>{row.item.data.I_TOTAL_PRICE}</span>
          </td>
        </>
      )}
    </tr>
  );
};

const GroupByTable = (props: Props) => {
  //const dataArray = JSON.parse(groupData);
  const dataArray = props.tableDataArray;
  const dataprovider: MutableArrayTreeDataProvider<TableItem["id"], TableItem> =
    new MutableArrayTreeDataProvider(dataArray, "id", {
      keyAttributeScope: "global",
    });

  const expanded = new KeySetImpl(["3"]);
  const flattenedTreeDataProviderView = new FlattenedTreeDataProviderView(
    dataprovider,
    {
      expanded: expanded,
    }
  );

  const setRowSelectable = (item: Item<TableItem["id"], TableItem>) => {
    if (item.metadata.treeDepth === 0) {
      return "off";
    }
    return "on";
  };

  const setRowSticky = (item: Item<TableItem["id"], TableItem>) => {
    if (item.metadata.treeDepth === 0) {
      return "on";
    }
    return "off";
  };

  const setRowOptions: TableProps["row"] = {
    selectable: setRowSelectable,
    sticky: setRowSticky,
  };
  return (
    <oj-table
      id="table"
      class="demo-table-container"
      aria-label="Group By Data Demo"
      accessibility={{ rowHeader: "invtype" }}
      scrollPolicyOptions={setScrollPolicy}
      data={flattenedTreeDataProviderView}
      selectionMode={setSelectionMode}
      row={setRowOptions}
      columns={columnsDef}
    >
      <template slot="rowTemplate" render={rowItemTemplate}></template>
    </oj-table>
  );
};
export default GroupByTable;
