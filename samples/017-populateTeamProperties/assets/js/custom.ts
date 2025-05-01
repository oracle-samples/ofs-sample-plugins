/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

interface OFSOpenMessageCustom extends OFSOpenMessage {
    team: any;
    resource: any;
    activity: any;
    inventoryList: any;
    openParams: any;
}

export class CustomPlugin extends OFSPlugin {
    open(_data: OFSOpenMessageCustom) {
        let teamMembers = _data.team?.teamMembers || {};
        // For all elements in the team, set the properties starting with A_TEAM_PROPERTIES_pname_1 = member.pname and  A_TEAM_PROPERTIES_pid_1 = key

        let activityData: any = { aid: _data.activity.aid };
        const inputActivityData = _data.activity;
        // Read secure paramenters maxNumberOfassistants and propertiesPrefix
        let maxNumberOfassistants: number = 5;
        let propertiesPrefix: string = "A_TEAM_PROPERTIES_";
        // Check if the secure parameters are set
        for (var param in _data.securedData) {
            if (param == "maxNumberOfassistants") {
                maxNumberOfassistants = Number(
                    _data.securedData.maxNumberOfassistants
                );
            } else if (param == "propertiesPrefix") {
                propertiesPrefix = _data.securedData.propertiesPrefix;
            }
        }
        console.info(
            `${this.tag} :  Team members before ${JSON.stringify(teamMembers)}`
        );
        let existentTeamMembers: any = {};
        // Initialize A_TEAM_PROPERTIES_pname_ A_TEAM_PROPERTIES_pid from 1 to 5 to ""
        for (let i = 1; i <= maxNumberOfassistants; i++) {
            //  activityData[`${propertiesPrefix}pid_${i}`exists in teamMembers as key, remove
            // the team member from the teamMembers object and ignore continue the loop to the next one
            if (`${propertiesPrefix}pid_${i}` in inputActivityData) {
                console.debug(
                    `${this.tag} :  Let's check if team - member  ${
                        inputActivityData[`${propertiesPrefix}pid_${i}`]
                    } - Exists in the teamMembers object`
                );
                if (
                    inputActivityData[`${propertiesPrefix}pid_${i}`] in
                    teamMembers
                ) {
                    console.debug(
                        `${this.tag} :  Found the team member ${
                            inputActivityData[`${propertiesPrefix}pid_${i}`]
                        } - It will be removed from teamMembers entity`
                    );
                    // Add this team member to existentTeamMembers
                    let teamMember: any =
                        teamMembers[
                            inputActivityData[`${propertiesPrefix}pid_${i}`]
                        ];
                    teamMember.ETA =
                        inputActivityData[`${propertiesPrefix}ETA_${i}`];
                    teamMember.end_time =
                        inputActivityData[`${propertiesPrefix}end_time_${i}`];
                    existentTeamMembers[
                        inputActivityData[`${propertiesPrefix}pid_${i}`]
                    ] = teamMember;
                    delete teamMembers[
                        inputActivityData[`${propertiesPrefix}pid_${i}`]
                    ];
                    // Add this
                }
            }
        }
        // Now I can reset all properties
        for (let i = 1; i <= maxNumberOfassistants; i++) {
            console.debug(
                `${this.tag} :  Team member ${
                    inputActivityData[`${propertiesPrefix}pid_${i}`]
                } not found in the teamMembers object`
            );
            // If the key does not exist, set the value to ""
            activityData[`${propertiesPrefix}pid_${i}`] = "";
            activityData[`${propertiesPrefix}pname_${i}`] = "";
            activityData[`${propertiesPrefix}ETA_${i}`] = "";
            activityData[`${propertiesPrefix}end_time_${i}`] = "";
        }
        console.info(
            `${this.tag} :  Team members after ${JSON.stringify(teamMembers)}`
        );
        let index = 1;
        for (const [key, member] of Object.entries(existentTeamMembers)) {
            const typedMember = member as {
                pname: string;
                ETA: string;
                end_time: string;
            };
            activityData[`${propertiesPrefix}pname_${index}`] =
                typedMember.pname;
            activityData[`${propertiesPrefix}pid_${index}`] = key;
            activityData[`${propertiesPrefix}ETA_${index}`] = typedMember.ETA;
            activityData[`${propertiesPrefix}end_time_${index}`] =
                typedMember.end_time;
            index++;
        }
        // This team member should exist in the activity properties
        for (const [key, member] of Object.entries(teamMembers)) {
            const typedMember = member as { pname: string };
            // Check if the key already exists in the activityData object
            // as one of the ${propertiesPrefix}pname_$other_index values
            // If it does, ignore this member and go to the next one
            activityData[`${propertiesPrefix}pname_${index}`] =
                typedMember.pname;
            activityData[`${propertiesPrefix}pid_${index}`] = key;
            activityData[`${propertiesPrefix}ETA_${index}`] =
                inputActivityData.ETA;
            activityData[`${propertiesPrefix}end_time_${index}`] =
                inputActivityData.end_time;
            index++;
        }
        let dataToSend: any = {
            activity: activityData,
        };
        this.close(dataToSend);
    }
}
