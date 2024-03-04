/**
 * @license
 * Copyright (c) 2014, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { OFSOpenMessage } from "../libs/ofs/main";
import { useState, useContext, useEffect } from "preact/hooks";
import "oj-c/button";
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import { CustomPlugin } from "../services/custom";
import { pluginContext } from "./app";
import { Table } from "./table";
import { Language, LocaleProvider } from "../services/locale";
import { Button } from "oj-c/button";
import { ButtonBar } from "./buttonbar";
import { TestButtonBar } from "./testbuttonbar";

export type QuotaInformation = {
    key: string;
    date: string;
    area: string;
    status: string;
    category: string;
    timeSlot: string;
    maxAvailable: number;
    stopBooking: string;
    quota: number;
    used: number;
    usedPercent: number;
    closed: boolean;
    open: boolean;
};

const quotaData: QuotaInformation[] = [];
let tag: string = "ofs";

export const ofsQuotaDataProvider: MutableArrayDataProvider<
    QuotaInformation["key"],
    QuotaInformation
> = new MutableArrayDataProvider(quotaData, {
    keyAttributes: "key",
    implicitSort: [{ attribute: "usedPercent", direction: "descending" }],
});

function getDateArray(start: number = 0, end: number = 0) {
    // Returns an array of dates in format YYYY-MM-DD between start and end days from today
    var dateArray = [];
    var currentDate = new Date();
    var endDate = new Date();
    endDate.setDate(currentDate.getDate() + end);
    currentDate.setDate(currentDate.getDate() + start);
    while (currentDate <= endDate) {
        dateArray.push(new Date(currentDate).toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
}

export function getQuota(
    ofsPlugin: CustomPlugin,
    start: number = 0,
    end: number = 0
) {
    var dateArray = getDateArray(start, end);
    ofsPlugin.proxy
        .getQuota({
            // dates should be equal todays date in YYYY-MM-DD format
            dates: dateArray.join(","),
            categoryLevel: true,
            timeSlotLevel: true,
            returnStatuses: true,
        })
        .then((response) => {
            console.debug(ofsPlugin.tag, response);
            // Flatten the returned quota object
            const transformedQuota = transformQuota(response.data.items);
            console.debug(ofsPlugin.tag, "Transformed data", transformedQuota);
            ofsQuotaDataProvider.data = transformedQuota;
        });
}

export function exportData() {
    console.info(tag, "Exporting data");
    const data = ofsQuotaDataProvider.data;
    console.info(tag, "Data to export", data);
    const csv = data.map((row) => {
        return Object.values(row).join(",");
    });
    csv.unshift(Object.keys(data[0]).join(","));
    const csvContent = csv.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", "data:text/csv;charset=utf-8," + encodedUri);
    link.setAttribute("download", "ofs-quota.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
}

function transformQuota(quota: any[]) {
    const transformedQuota: QuotaInformation[] = [];
    for (const day of quota) {
        // flatten the day object and store it in the transformedQuota array
        for (const area of day.areas) {
            console.info(
                tag,
                `Processing Area ${area.name} with  ${area.timeSlots?.length} timeslots and ${area.categories?.length} categories`
            );
            var chainOpen = !area.quotaIsClosed;
            if (area.timeSlots) {
                for (const timeSlot of area.timeSlots) {
                    chainOpen = chainOpen && !timeSlot.quotaIsClosed;
                    if (timeSlot.categories) {
                        for (const category of timeSlot.categories) {
                            // Case 0: Category and TimeSlot
                            var lastLevel = category;
                            transformedQuota.push({
                                key: `${day.date}-${area.label}-${category.label}-${timeSlot.label}`,
                                date: day.date,
                                area: area.label,
                                status: area.status,
                                category: category.label,
                                timeSlot: timeSlot.label,
                                maxAvailable: lastLevel.maxAvailable,
                                stopBooking: lastLevel.stopBookingAt,
                                quota: lastLevel.quota,
                                used: lastLevel.used,
                                usedPercent: lastLevel.usedQuotaPercent,
                                closed: lastLevel.quotaIsClosed,
                                open: chainOpen && !lastLevel.quotaIsClosed,
                            });
                        }
                    } else {
                        // Case 1: TimeSlot only
                        var lastLevel = timeSlot;
                        transformedQuota.push({
                            key: `${day.date}-${area.label}-${timeSlot.label}-`,
                            date: day.date,
                            area: area.label,
                            status: area.status,
                            category: "",
                            timeSlot: timeSlot.label,
                            maxAvailable: lastLevel.maxAvailable,
                            stopBooking: lastLevel.stopBookingAt,
                            quota: lastLevel.quota,
                            used: lastLevel.used,
                            usedPercent: lastLevel.usedQuotaPercent,
                            closed: lastLevel.quotaIsClosed,
                            open: chainOpen && !lastLevel.quotaIsClosed,
                        });
                    }
                }
            } else if (area.categories) {
                for (const category of area.categories) {
                    // Case 2: Category only
                    var lastLevel = category;
                    chainOpen = chainOpen && !category.quotaIsClosed;
                    transformedQuota.push({
                        key: `${day.date}-${area.label}--${category.label}-`,
                        date: day.date,
                        area: area.label,
                        status: area.status,
                        category: category.label,
                        timeSlot: "",
                        maxAvailable: lastLevel.maxAvailable,
                        stopBooking: lastLevel.stopBookingAt,
                        quota: lastLevel.quota,
                        used: lastLevel.used,
                        usedPercent: lastLevel.usedQuotaPercent,
                        closed: lastLevel.quotaIsClosed,
                        open: chainOpen && !lastLevel.quotaIsClosed,
                    });
                }
            } else {
                // Case 3: No timeslot or category
                var lastLevel = day;
                transformedQuota.push({
                    key: `${day.date}-${area.label}---`,
                    date: day.date,
                    area: area.label,
                    status: area.status,
                    category: "",
                    timeSlot: "",
                    maxAvailable: lastLevel.maxAvailable,
                    stopBooking: lastLevel.stopBookingAt,
                    quota: lastLevel.quota,
                    used: lastLevel.used,
                    usedPercent: lastLevel.usedQuotaPercent,
                    closed: lastLevel.quotaIsClosed,
                    open: chainOpen && !lastLevel.quotaIsClosed,
                });
            }
        }
    }
    // return transformedQuota filtering out the values where usedPercent is undefined
    return transformedQuota.filter((item) => item.usedPercent !== undefined);
}

export function OfsContainer() {
    const ofsPlugin = useContext(pluginContext);
    const [data, setData] = useState(ofsPlugin.data);
    const [language, setLanguage] = useState(
        navigator.language.substring(0, 2) as string
    );
    ofsPlugin.setState = setData;
    tag = ofsPlugin.tag;
    if (data.method == "open") {
        getQuota(ofsPlugin);
        if (language !== data.user.languageCode) {
            setLanguage(data.user.languageCode);
        }
    }
    return (
        /* Hide this section if no debug is needed */
        <div class="oj-web-applayout-max-width oj-web-applayout-content">
            <ButtonBar tag={ofsPlugin.tag} language={language} />
            <TestButtonBar tag={ofsPlugin.tag} language={language} />
            <Table tag={ofsPlugin.tag} language={language} />
            <hr></hr>
            <oj-button
                id="submit_button"
                label={
                    LocaleProvider.getDictionary(language as Language)["Close"]
                }
                onojAction={() => ofsPlugin.close()}
            ></oj-button>
        </div>
    );
}
