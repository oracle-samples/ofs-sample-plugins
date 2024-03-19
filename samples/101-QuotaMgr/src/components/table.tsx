import { h, FunctionalComponent, ComponentProps } from "preact";
import { useState, useContext } from "preact/hooks";
import "ojs/ojbutton";
import "ojs/ojtable";
import "ojs/ojmenu";
import "ojs/ojslider";
import "ojs/ojaccordion";
import "ojs/ojswitch";
import { ojMenu } from "ojs/ojmenu";
import { ojTable } from "ojs/ojtable";
import { ofsQuotaDataProvider, QuotaInformation, getQuota } from "./ofs";
import ListDataProviderView = require("ojs/ojlistdataproviderview");
import {
    AttributeExprFilterDef,
    AttributeFilterDef,
    CompoundFilterDef,
    DataFilter,
    FilterFactory,
} from "ojs/ojdataprovider";
import { pluginContext } from "./app";
import { Language, LocaleProvider } from "../services/locale";

type TableProps = ComponentProps<"oj-table">;

type Props = {
    tag: string;
    language: string;
};

export function Table(props: Props) {
    let locale = new LocaleProvider(props.language as Language);
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

    const ofsQuotaList = new ListDataProviderView<
        any,
        QuotaInformation,
        any,
        QuotaInformation
    >(ofsQuotaDataProvider, {
        sortCriteria: [{ attribute: "usedPercent", direction: "descending" }],
        filterCriterion: buildFilter(),
    });

    ofsQuotaList.addEventListener("mutate", (event: Event) => {
        console.log(props.tag, "Data mutated");
    });
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
            headerText: locale.getLocale("Area Name"),
            field: "area",
            resizable: "enabled",
        },
        {
            headerText: locale.getLocale("Date"),
            field: "date",
            resizable: "enabled",
        },
        {
            headerText: locale.getLocale("Timeslot"),
            field: "timeSlot",
            resizable: "enabled",
        },
        {
            headerText: locale.getLocale("Category"),
            field: "category",
            resizable: "enabled",
        },
        {
            headerText: `${locale.getLocale("Ocupation")} (%)`,
            field: "usedPercent",
            resizable: "enabled",
            sortable: "enabled",
            style: "text-align: right;",
            template: "percentTemplate",
        },
        {
            headerText: locale.getLocale("Open"),
            field: "closed",
            resizable: "disabled",
            template: "inverseTrueFalsePartialTemplate",
            sortable: "enabled",
        },
        /*{ headerText: "Action", resizable: "disabled", template: "actionTemplate" },*/
    ];

    const menuListener = (event: ojMenu.ojMenuAction) => {
        console.log(
            props.tag,
            "Menu item " + event.detail.selectedValue + " was clicked"
        );
    };

    function getLocaleDateStr(distance: number) {
        var today = new Date();
        today.setDate(today.getDate() + distance);
        return today.toLocaleDateString();
    }

    const actionColumn = (
        cell: ojTable.CellTemplateContext<
            QuotaInformation["key"],
            QuotaInformation
        >
    ) => {
        return (
            <oj-menu-button
                chroming="borderless"
                display="icons"
                data-oj-clickthrough="disabled"
            >
                Action
                <oj-menu slot="menu" onojMenuAction={menuListener}>
                    <oj-option
                        value="approve"
                        disabled={cell.row.LocationId === 100}
                    >
                        <span class="oj-ux-ico-check" slot="startIcon"></span>
                        Approve
                    </oj-option>
                    <oj-option value="delete">
                        <span
                            class="oj-ux-ico-delete-circle"
                            slot="startIcon"
                        ></span>
                        Delete
                    </oj-option>
                </oj-menu>
            </oj-menu-button>
        );
    };

    function buildFilter(
        includeClosed: boolean = true,
        visibleThresholdMin: number = 0,
        visibleThresholdMax: number = 999
    ) {
        type CriteriaList = Array<DataFilter.FilterDef<QuotaInformation>>;
        var criteria: CriteriaList = [
            {
                op: "$ge",
                attribute: "usedPercent",
                value: visibleThresholdMin,
            },
            {
                op: "$le",
                attribute: "usedPercent",
                value: visibleThresholdMax,
            },
        ];
        if (!includeClosed) {
            criteria.push({
                op: "$eq",
                attribute: "closed",
                value: false,
            });
        }
        return FilterFactory.getFilter({
            filterDef: {
                op: "$and",
                criteria: criteria,
            } as DataFilter.FilterDef<QuotaInformation>,
        });
    }

    const ofsPlugin = useContext(pluginContext);
    const [warningThreshold, setWarningThreshold] = useState(80);
    const [criticalThreshold, setCriticalThreshold] = useState(90);
    const [visibleMin, setVisibleMin] = useState(0);
    const [visibleMax, setVisibleMax] = useState(999);
    const [fromThreshold, setFromThreshold] = useState(0);
    const [toThreshold, setToThreshold] = useState(0);
    const [filterClosed, setFilterClosed] = useState(false);
    const percentColumn = (
        cell: ojTable.CellTemplateContext<
            QuotaInformation["key"],
            QuotaInformation
        >
    ) => {
        if (cell.data === undefined) {
            return "";
        } else {
            if (
                typeof cell.data === "number" &&
                cell.data > criticalThreshold
            ) {
                return (
                    <span class="oj-badge oj-badge-danger oj-typography-body-lg">{`${cell.data.toFixed(
                        2
                    )} %`}</span>
                );
            } else if (
                typeof cell.data === "number" &&
                cell.data > warningThreshold
            ) {
                return (
                    <span class="oj-badge oj-badge-warning oj-typography-body-md">{`${cell.data.toFixed(
                        2
                    )} %`}</span>
                );
            } else {
                if (typeof cell.data === "number") {
                    return (
                        <div class="oj-text-color-success">{`${cell.data.toFixed(
                            2
                        )} %`}</div>
                    );
                } else {
                    return (
                        <div class="oj-text-color-success">{`${cell.data}`}</div>
                    );
                }
            }
        }
    };

    const inverseTrueFalsePartial = (
        cell: ojTable.CellTemplateContext<
            QuotaInformation["key"],
            QuotaInformation
        >
    ) => {
        if (cell.data === undefined) {
            return "";
        } else {
            if (cell.data === true) {
                return (
                    <span class="oj-ux-ico-close-circle-s oj-icon-color-danger"></span>
                );
            } else {
                return (
                    <span class="oj-ux-ico-check-circle-s oj-icon-color-success"></span>
                );
            }
        }
    };
    return (
        <div class="oj-md-margin-4x-horizontal">
            <br></br>
            <oj-accordion id="a1">
                <oj-collapsible id="c1">
                    <h3 slot="header">
                        {locale.getLocale("Warning Range")}: [{warningThreshold}
                        {"% "}- {criticalThreshold}%],{" "}
                        {locale.getLocale("Filter Closed")}:{" "}
                        {filterClosed
                            ? locale.getLocale("Yes")
                            : locale.getLocale("No")}
                        , {locale.getLocale("Date Range")}: [
                        {getLocaleDateStr(fromThreshold)} -
                        {getLocaleDateStr(toThreshold)}],{" "}
                        {locale.getLocale("Visible Range")}: [{visibleMin}% -{" "}
                        {visibleMax}%]
                    </h3>
                    <oj-range-slider
                        id="range-slider-id"
                        labelHint={`${locale.getLocale(
                            "Warning and Critical Thresholds"
                        )}: ${warningThreshold}% - ${criticalThreshold}%`}
                        value={{
                            start: warningThreshold,
                            end: criticalThreshold,
                        }}
                        max={100}
                        step={5}
                        min={0}
                        ontransientValueChanged={(event: CustomEvent) => {
                            setWarningThreshold(event.detail.value.start);
                            setCriticalThreshold(event.detail.value.end);
                        }}
                        style="max-width: 50% !important;"
                        onvalueChanged={(event: CustomEvent) => {
                            setWarningThreshold(event.detail.value.start);
                            setCriticalThreshold(event.detail.value.end);
                            getQuota(ofsPlugin, fromThreshold, toThreshold);
                        }}
                    ></oj-range-slider>
                    <oj-range-slider
                        id="value-slider-id"
                        labelHint={`${locale.getLocale(
                            "Visible Range"
                        )}: ${visibleMin}% - ${visibleMax}%`}
                        value={{
                            start: visibleMin,
                            end: visibleMax,
                        }}
                        max={999}
                        step={5}
                        min={0}
                        style="max-width: 50% !important;"
                        ontransientValueChanged={(event: CustomEvent) => {
                            setVisibleMin(event.detail.value.start);
                            setVisibleMax(event.detail.value.end);
                        }}
                        onvalueChanged={(event: CustomEvent) => {
                            setVisibleMin(event.detail.value.start);
                            setVisibleMax(event.detail.value.end);
                            ofsQuotaList.filterCriterion = buildFilter(
                                filterClosed,
                                visibleMin,
                                visibleMax
                            );
                            getQuota(ofsPlugin, fromThreshold, toThreshold);
                        }}
                    ></oj-range-slider>
                    <oj-range-slider
                        id="date-slider-id"
                        labelHint={`${locale.getLocale(
                            "Date Range"
                        )}: ${getLocaleDateStr(
                            fromThreshold
                        )} - ${getLocaleDateStr(toThreshold)}`}
                        value={{
                            start: fromThreshold,
                            end: toThreshold,
                        }}
                        max={14}
                        step={1}
                        min={0}
                        style="max-width: 50% !important;"
                        ontransientValueChanged={(event: CustomEvent) => {
                            setFromThreshold(event.detail.value.start);
                            setToThreshold(event.detail.value.end);
                        }}
                        onvalueChanged={(event: CustomEvent) => {
                            setFromThreshold(event.detail.value.start);
                            setToThreshold(event.detail.value.end);
                            getQuota(
                                event.detail.value.start,
                                event.detail.value.end
                            );
                        }}
                    ></oj-range-slider>
                    <br></br>
                    <oj-switch
                        id="switch-id"
                        value={filterClosed}
                        labelHint={locale.getLocale("Filter Closed")}
                        onvalueChanged={(event: CustomEvent) => {
                            setFilterClosed(event.detail.value);
                            ofsQuotaList.filterCriterion = buildFilter(
                                filterClosed,
                                visibleMin,
                                visibleMax
                            );
                        }}
                    ></oj-switch>
                </oj-collapsible>
                <oj-collapsible
                    id="c3"
                    onojBeforeExpand={() => {
                        getQuota(ofsPlugin, fromThreshold, toThreshold);
                    }}
                    expanded
                >
                    <h3 slot="header">
                        {locale.getLocale("Quota Information")}
                    </h3>
                    <oj-table
                        id="table"
                        aria-label="Quota Table"
                        data={ofsQuotaList}
                        selectionMode={setSelectionMode}
                        scrollPolicy="loadMoreOnScroll"
                        scrollPolicyOptions={setScrollPolicy}
                        columnsDefault={setColumnsDefault}
                        columns={columnsDef}
                        class="oj-bg-body table-sizing"
                    >
                        <template
                            slot="actionTemplate"
                            render={actionColumn}
                        ></template>
                        <template
                            slot="percentTemplate"
                            render={percentColumn}
                        ></template>
                        <template
                            slot="inverseTrueFalsePartialTemplate"
                            render={inverseTrueFalsePartial}
                        ></template>
                    </oj-table>
                </oj-collapsible>
            </oj-accordion>
        </div>
    );
}
