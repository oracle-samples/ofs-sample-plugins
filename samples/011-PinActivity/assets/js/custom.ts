/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import {
    OFSPlugin,
    OFSMessage,
    OFSOpenMessage,
    OFSCallProcedureResultMessage,
} from "@ofs-users/plugin";
import {
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
}

class OFSCustomInitMessage extends OFSMessage {
    applications: any;
}
export class CustomPlugin extends OFSPlugin {
    async open(data: OFSCustomOpenMessage) {
        console.debug(`${this.tag} : OPEN: ${JSON.stringify(data)}`);
        var plugin = this;
        if (this.proxy) {
            console.log(
                "info",
                "PIN ACTIVITY " + JSON.stringify(data, undefined, 4)
            );
            var action = "PIN";
            if ("pinAction" in data.openParams) {
                action = data.openParams.pinAction;
            }
            var minutesThreshold: number = 15;
            if ("minutesThreshold" in data.openParams) {
                minutesThreshold = data.openParams.minutesThreshold;
            }
            var activityResponse = await this.proxy.getActivityDetails(
                data.activity.aid
            );
            var activityData: OFSCustomActivityResponseDetails =
                activityResponse.data as OFSCustomActivityResponseDetails;
            console.debug(
                `${this.tag} - ${action}: We are going to process the action`
            );
            if (action == "UNPIN") {
                var activityDataToUpdate = {
                    aid: data.activity.aid,
                    timeDeliveredStart: "",
                    timeDeliveredEnd: "",
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
            } else if (action == "PIN") {
                var appt_time = document.getElementById(
                    "appt-time"
                ) as HTMLInputElement;
                if (appt_time) {
                    appt_time.value = data.activity.A_APPOINTMENT_TIME;
                } else {
                    console.error(
                        "Element with id 'input_data' is not found or not an HTMLInputElement"
                    );
                }

                // Set close button handler
                const submit_button = document.getElementById("submit_button");
                if (!!submit_button) {
                    submit_button.onclick = async () => {
                        var newWindowStart = this.generateTimeWindowStart(
                            appt_time.value,
                            data.activity.date
                        );
                        var newWindowend = this.generateTimeWindowEnd(
                            appt_time.value,
                            data.activity.date,
                            minutesThreshold
                        );
                        var activityDataToUpdate = {
                            aid: data.activity.aid,
                            timeDeliveredStart: newWindowStart,
                            timeDeliveredEnd: newWindowend,
                            A_APPOINTMENT_TIME: appt_time.value,
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
                    };
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

    // additional function
    generateTimeWindowStart(startTime: string, startDate: string) {
        console.log(
            "info",
            "Generating START SLA { startTime : " +
                startTime +
                "},{ startDate :" +
                startDate +
                "}"
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
        console.log(
            "info",
            "Generating END SLA { endTime : " +
                endTime +
                "},{ endDate :" +
                endDate +
                "},{ minutes :" +
                minutes +
                "}"
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
        // console.log('info', "HOUR and MINUTES Before" + endHour + ":" + endMinute);
        var result: number = endMinute + minutes;
        if (result < 60) {
            endMinute = result;
        } else {
            endMinute = result % 60;
            endHour = endHour + Math.floor(result / 60);
            // console.log('info', "HOUR and MINUTES After" + endHour + ":" + endMinute);
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
        console.log(
            "info",
            "HOUR and MINUTES After" + endHour + ":" + endMinute
        );
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
