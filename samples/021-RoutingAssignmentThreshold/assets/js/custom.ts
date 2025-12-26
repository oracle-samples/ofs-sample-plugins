/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSOpenMessage } from "@ofs-users/plugin";

interface OFSOpenMessageCustom extends OFSOpenMessage {
    activity: {
        aid: number;
        routingAssignTrack?: string;
        [key: string]: any;
    };
    openParams?: {
        reassigments_total_quantity?: string;
        reassigments_recent_quantity?: string;
        minutes_threshold?: string;
    };
}

interface RoutingAssignment {
    resourceExternalId: string;
    resourceName: string;
    destinationDate: string;
    destinationResourceExternalId: string;
    destinationResourceName: string;
    messageTimeOfCreation: Date;
}

export class CustomPlugin extends OFSPlugin {
    /**
     * Parse the routingAssignTrack string into an array of assignments
     */
    private parseRoutingAssignTrack(trackString: string): RoutingAssignment[] {
        if (!trackString || trackString.trim() === "") {
            return [];
        }

        // Unescape literal \n to actual newlines
        const unescaped = trackString.replace(/\\n/g, "\n");
        const rows = unescaped.split("\n");
        const assignments: RoutingAssignment[] = [];

        for (const row of rows) {
            if (!row || row.trim() === "") {
                continue;
            }

            const fields = row.split("|");

            // Expected format: resourceExternalId|resourceName|destinationDate|destinationResourceExternalId|destinationResourceName|messageTimeOfCreation
            // First row may have user_login prefix, subsequent rows start with empty field
            // Minimum 6 fields expected (some may be empty)
            if (fields.length >= 6) {
                // Handle the first field which could be user_login or empty
                const startIndex = fields[0].trim() === "" ? 1 : 0;

                const assignment: RoutingAssignment = {
                    resourceExternalId: fields[startIndex] || "",
                    resourceName: fields[startIndex + 1] || "",
                    destinationDate: fields[startIndex + 2] || "",
                    destinationResourceExternalId: fields[startIndex + 3] || "",
                    destinationResourceName: fields[startIndex + 4] || "",
                    messageTimeOfCreation: this.parseDateTime(fields[startIndex + 5] || ""),
                };

                assignments.push(assignment);
            }
        }

        return assignments;
    }

    /**
     * Parse datetime string to Date object
     * Expected format: "2025-12-23 13:04:41" (UTC)
     */
    private parseDateTime(dateTimeStr: string): Date {
        if (!dateTimeStr || dateTimeStr.trim() === "") {
            return new Date(0);
        }

        // Parse as UTC
        const trimmed = dateTimeStr.trim();
        const date = new Date(trimmed + "Z"); // Append Z to treat as UTC

        if (isNaN(date.getTime())) {
            console.warn(`${this.tag}: Failed to parse datetime: ${dateTimeStr}`);
            return new Date(0);
        }

        return date;
    }

    /**
     * Count assignments within the time threshold
     */
    private countRecentAssignments(
        assignments: RoutingAssignment[],
        minutesThreshold: number
    ): number {
        const now = new Date();
        const thresholdMs = minutesThreshold * 60 * 1000;
        const cutoffTime = new Date(now.getTime() - thresholdMs);

        let count = 0;
        for (const assignment of assignments) {
            if (assignment.messageTimeOfCreation >= cutoffTime) {
                count++;
            }
        }

        return count;
    }

    open(data: OFSOpenMessageCustom): void {
        console.log(`${this.tag}: Plugin opened`);
        console.debug(`${this.tag}: Received data: ${JSON.stringify(data)}`);

        // Read openParams with defaults
        const openParams = data.openParams || {};
        const maxTotalReassignments = parseInt(openParams.reassigments_total_quantity || "10");
        const maxRecentReassignments = parseInt(openParams.reassigments_recent_quantity || "3");
        const minutesThreshold = parseInt(openParams.minutes_threshold || "60");

        console.log(`${this.tag}: Configuration - maxTotal: ${maxTotalReassignments}, maxRecent: ${maxRecentReassignments}, threshold: ${minutesThreshold} minutes`);

        // Get the routing track data
        const routingAssignTrack = data.activity?.routingAssignTrack || "";
        console.debug(`${this.tag}: routingAssignTrack: ${routingAssignTrack}`);

        // Parse the routing assignments
        const assignments = this.parseRoutingAssignTrack(routingAssignTrack);
        console.log(`${this.tag}: Parsed ${assignments.length} assignments`);

        // Calculate totals
        const totalReassignments = assignments.length;
        const recentReassignments = this.countRecentAssignments(assignments, minutesThreshold);

        console.log(`${this.tag}: Total reassignments: ${totalReassignments}, Recent reassignments: ${recentReassignments}`);

        // Evaluate thresholds
        const totalOk = totalReassignments <= maxTotalReassignments;
        const recentOk = recentReassignments <= maxRecentReassignments;
        const pinAllowed = totalOk && recentOk ? 1 : 0;

        console.log(`${this.tag}: Evaluation - totalOk: ${totalOk}, recentOk: ${recentOk}, pinAllowed: ${pinAllowed}`);

        // Prepare activity data to update
        const activityData: any = {
            aid: data.activity.aid,
            xa_total_reassignments: totalReassignments,
            xa_recent_reassignments: recentReassignments,
            xa_pin_allowed: pinAllowed,
        };

        console.log(`${this.tag}: Closing with data: ${JSON.stringify(activityData)}`);

        // Close plugin with updated properties
        this.close({
            activity: activityData,
        });
    }
}
