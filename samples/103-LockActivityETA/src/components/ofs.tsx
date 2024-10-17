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
import {
    OFSMessage,
    OFSCallProcedureResultMessage,
} from "@ofs-users/plugin";
import {
    OFSTimeslotsResponse,
    OFSTimeslotsList,
    OFSTimeslot,
    OFSActivityResponse,
    ActivityResponse,
    OFSSubscriptionResponse,
} from "@ofs-users/proxy";

class OFSCustomOpenMessage extends OFSOpenMessage {
    activity: any;
    openParams: any;
    resource: any;
}

class OFSCustomActivityResponseDetails implements ActivityResponse {
    customerName: any = null;
    activityId: number = 0;
    timeDeliveredStart: any = null;
    timeDeliveredEnd: any = null;
    startTime: any = null;
    date: any = null;
}

class OFSCustomInitMessage extends OFSMessage {
    applications: any;
}

enum pinActionValues {
    PIN = "PIN",
    UNPIN = "UNPIN",
}

enum pluginModeValues {
    BUTTON = "BUTTON",
    SCREEN = "SCREEN",
}

enum appointmentOriginValues {
    A_APPOINTMENT_TIME = "A_APPOINTMENT_TIME",
    CURRENT = "CURRENT",
    TIMESLOT = "TIMESLOT",
}

export class CustomPlugin extends OFSPlugin {
    dataContext = createContext(new OFSOpenMessage());
    data: OFSOpenMessage = new OFSOpenMessage();
    setState: any;
    async open(data: OFSCustomOpenMessage) {
        console.debug(`${this.tag} : OPEN: ${JSON.stringify(data)}`);
        var plugin = this;
        if (this.proxy) {
            console.log(
                "info",
                "PIN ACTIVITY " + JSON.stringify(data, undefined, 4)
            );
            var action = pinActionValues.PIN;
            var minutesThreshold: number = 15;
            var pluginMode: string = pluginModeValues.SCREEN;
            var appointmentOrigin: string =
                appointmentOriginValues.A_APPOINTMENT_TIME;
            if ("pinAction" in data.openParams) {
                action = data.openParams.pinAction;
            }
            if ("minutesThreshold" in data.openParams) {
                minutesThreshold = data.openParams.minutesThreshold;
            }
            if ("pluginMode" in data.openParams) {
                pluginMode = data.openParams.pluginMode;
            }
            if ("appointmentOrigin" in data.openParams) {
                appointmentOrigin = data.openParams.appointmentOrigin;
            }
            var activityResponse = await this.proxy.getActivityDetails(
                data.activity.aid
            );
            var activityData: OFSCustomActivityResponseDetails =
                activityResponse.data as OFSCustomActivityResponseDetails;
            console.debug(
                `${this.tag} - ${action}: We are going to process the action`
            );
            if (action == pinActionValues.UNPIN) {
                var activityDataToUpdate = {
                    aid: data.activity.aid,
                    timeDeliveredStart: null,
                    timeDeliveredEnd: null,
                    A_APPOINTMENT_TIME: "",
                };
                console.debug(
                    `${
                        this.tag
                    } - ${action}: Updating activity with : ${JSON.stringify(
                        activityDataToUpdate
                    )}`
                );
                var result = await this.proxy.updateActivity(
                    activityData.activityId,
                    activityDataToUpdate
                );
                console.debug(
                    `${
                        this.tag
                    } - ${action}: Updated activity result : ${JSON.stringify(
                        result
                    )}`
                );
                this.close();
            } else if (action == pinActionValues.PIN) {
                if (pluginMode == pluginModeValues.SCREEN) {
                    var appt_time = document.getElementById(
                        "appt-time"
                    ) as HTMLInputElement;
                    if (appt_time) {
                        appt_time.value = data.activity.A_APPOINTMENT_TIME;
                    } else {
                        console.error(
                            "Element with id 'appt-time' is not found or not an HTMLInputElement"
                        );
                    }
                    // Set close button handler
                    const submit_button =
                        document.getElementById("submit_button");
                    if (!!submit_button) {
                        submit_button.onclick = async () => {
                            this.setCommunicatedWindowByAppValue(
                                appt_time.value,
                                activityData,
                                minutesThreshold
                            );
                            this.close();
                        };
                    }
                } else if (pluginMode == pluginModeValues.BUTTON) {
                    var appt_time_value: string = "";
                    if (
                        appointmentOrigin ==
                        appointmentOriginValues.A_APPOINTMENT_TIME
                    ) {
                        if ("A_APPOINTMENT_TIME" in data.activity) {
                            appt_time_value = data.activity.A_APPOINTMENT_TIME;
                            this.setCommunicatedWindowByAppValue(
                                appt_time_value,
                                activityData,
                                minutesThreshold
                            );
                            this.close();
                        } else {
                            alert(
                                "When pluginMode is BUTTON and appointmentOrigin A_APPOINTMENT_TIME, this property is mandatory"
                            );
                            this.close();
                        }
                    } else if (
                        appointmentOrigin == appointmentOriginValues.TIMESLOT
                    ) {
                        var timeslotResponse: OFSTimeslotsResponse =
                            await this.proxy.getTimeslots();
                        if (timeslotResponse.status != 200) {
                            alert(
                                `Error getting timeslots ${timeslotResponse.status} ${timeslotResponse.description}`
                            );
                            this.close();
                        } else {
                            console.debug(
                                `${
                                    this.tag
                                } - : Timeslots response: ${JSON.stringify(
                                    timeslotResponse
                                )}`
                            );
                        }
                        var timeslot: OFSTimeslotsList =
                            timeslotResponse.data as OFSTimeslotsList;
                        var timeslotList: OFSTimeslot[] = timeslot.items;
                        if (timeslotList.length == 0) {
                            alert("No timeslots available");
                            this.close();
                        }
                        var timeslotLabel = data.activity.time_slot_label;
                        var timeslotFound: OFSTimeslot | undefined =
                            timeslotList.find(
                                (timeslot) => timeslot.label == timeslotLabel
                            );
                        if (timeslotFound) {
                            this.setCommunicatedWindowByAppValue(
                                timeslotFound.timeStart,
                                activityData,
                                minutesThreshold
                            );
                            this.close();
                        } else {
                            alert(`Timeslot ${timeslotLabel} not found`);
                            this.close();
                        }
                    } else if (
                        appointmentOrigin == appointmentOriginValues.CURRENT
                    ) {
                        alert(`pluginMode ${pluginMode} not implemented yet`);
                        this.close();
                    } else {
                        alert(
                            `appointmentOrigin ${appointmentOrigin} is incorrect. Correct values TIMESLOT, CURRENT,A_APPOINTMENT_TIME`
                        );
                        this.close();
                    }
                    this.setCommunicatedWindowByAppValue(
                        appt_time_value,
                        activityData,
                        minutesThreshold
                    );
                    this.close();
                } else {
                    alert(
                        `pluginMode ${pluginMode} is incorrect. Correct values ${pluginModeValues.SCREEN},${pluginModeValues.BUTTON}`
                    );
                    this.close();
                }
            } else {
                alert(
                    "The parameter pinAction needs to be configured as a securedParameter in plugin configuration"
                );
                this.close();
            }
        } else {
            alert(
                "Proxy not available. Review if you have included an application in the plugin configuration and it you have, review the logs for any errors."
            );
            this.close();
        }
    }
    async updateCommunicatedWindow(
        aid: number,
        newWindowStart: string,
        newWindowEnd: string,
        appt_time_value: string
    ) {
        var activityDataToUpdate = {
            aid: aid,
            timeDeliveredStart: newWindowStart,
            timeDeliveredEnd: newWindowEnd,
            A_APPOINTMENT_TIME: appt_time_value,
        };
        console.debug(
            `${this.tag} - : Updating activity with : ${JSON.stringify(
                activityDataToUpdate
            )}`
        );
        var result = await this.proxy.updateActivity(aid, activityDataToUpdate);
        console.debug(
            `${this.tag} - : Updated activity result : ${JSON.stringify(
                result
            )}`
        );
    }
    setCommunicatedWindowByAppValue(
        appt_time_value: string,
        activity: OFSCustomActivityResponseDetails,
        minutesThreshold: number
    ) {
        var newWindowStart = this.generateTimeWindowStart(
            appt_time_value,
            activity.date
        );
        var newWindowEnd = this.generateTimeWindowEnd(
            appt_time_value,
            activity.date,
            minutesThreshold
        );
        this.updateCommunicatedWindow(
            activity.activityId,
            newWindowStart,
            newWindowEnd,
            appt_time_value
        );
    }
    // additional function
    generateTimeWindowStart(startTime: string, startDate: string) {
        console.debug(
            `${this.tag} - Generating Communicated Window Start { startTime : ${startTime} },{ startDate : ${startDate}} 
            `
        );
        var a = startTime.split(":"); // split it at the colons
        // This is not required as the appointment time will be in 24 hours format
        var hours12 = a[0];
        var minutesAmPm = a[1].split(" ");
        var startMinute = parseInt(minutesAmPm[0]);
        var amPm = minutesAmPm[1];
        var startHour = parseInt(hours12);
        // To correct AM/PM situations
        if (amPm == "PM") {
            if (startHour != 12) {
                startHour = startHour + 12;
            }
        } else if (amPm == "AM") {
            if (startHour == 12) {
                startHour = startHour - 12;
            }
        }
        var newSlaStart =
            startDate +
            " " +
            (startHour < 10 ? "0" : "") +
            startHour +
            ":" +
            (startMinute < 10 ? "0" : "") +
            startMinute +
            ":00";
        return newSlaStart;
    }
    generateTimeWindowEnd(endTime: string, endDate: string, minutes: number) {
        console.debug(
            `${this.tag} - Generating Communicated Window End { endTime : ${endTime} },{ endDate : ${endDate}} , { minutes : ${minutes}}
            `
        );
        var a = endTime.split(":"); // split it at the colons
        // Get start time and give 15 minutes of margin
        var hours12 = a[0];
        var minutesAmPm = a[1].split(" ");
        var endMinute: number = parseInt(minutesAmPm[0]);
        var amPm = minutesAmPm[1];
        var endHour = parseInt(hours12);
        // To correct AM/PM situations
        if (amPm == "PM") {
            if (endHour != 12) {
                endHour = endHour + 12;
            }
        } else if (amPm == "AM") {
            if (endHour == 12) {
                endHour = endHour - 12;
            }
        }

        var result: number = +endMinute + +minutes;
        if (result < 60) {
            endMinute = result;
        } else {
            endMinute = result % 60;
            endHour = endHour + Math.floor(result / 60);
            if (endHour > 23) {
                endHour = endHour % 24;
                // TODO : Correct date to date - 1
                var date = new Date(endDate);
                date = new Date(
                    date.getTime() + Math.abs(date.getTimezoneOffset() * 60000)
                );
                //  console.log('info', "Date Before " + endDate + " -->"+ date );
                var dAfter: Date = this.addDays(date, 1) as Date;
                // console.log('info', "Date Before & After" + date + "," + dAfter);
                var afterYears = dAfter.getFullYear();
                var monthsNumber = dAfter.getMonth() + 1;
                var afterMonth = (monthsNumber < 10 ? "0" : "") + monthsNumber;
                var afterDay =
                    (dAfter.getDate() < 10 ? "0" : "") + dAfter.getDate();
                var dAfterTxt = afterYears + "-" + afterMonth + "-" + afterDay;
                var endDate = dAfterTxt;
                console.log("info", "Date After" + endDate);
            }
        }
        var newSlaEnd =
            endDate +
            " " +
            (endHour < 10 ? "0" : "") +
            endHour +
            ":" +
            (endMinute < 10 ? "0" : "") +
            endMinute +
            ":00";
        return newSlaEnd;
    }
    addDays(date: Date, days: number) {
        date.setDate(date.getDate() + days);
        return date;
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
