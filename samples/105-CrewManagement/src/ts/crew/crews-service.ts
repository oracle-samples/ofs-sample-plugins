import { BucketRow, CrewAssignment, CrewProxy, OFSAssistant } from "./types";

type DailyAssistants = {
  date: string;
  assistants: OFSAssistant[];
};

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return `${value}`.trim();
}

function toDateKey(input: string): string {
  if (!input) {
    return "";
  }
  return input.slice(0, 10);
}

function buildDateRange(dateFrom: string, dateTo: string): string[] {
  const days: string[] = [];
  const current = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);
  while (current.getTime() <= end.getTime()) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export class CrewsService {
  constructor(
    private readonly proxy: CrewProxy,
    private readonly logger?: (...args: unknown[]) => void
  ) {}

  private log(...args: unknown[]): void {
    if (this.logger) {
      this.logger(...args);
    }
  }

  private buildAssistantsTraceTag(technician: BucketRow): string {
    return `[ASSISTANTS_API][leadId=${technician.resourceId}][leadName=${technician.resourceName}]`;
  }

  private normalizeAssistantsResponse(response: any): DailyAssistants[] {
    const items = Array.isArray(response?.items) ? response.items : [];
    const daily: DailyAssistants[] = [];

    for (const item of items) {
      const itemDate = toDateKey(asString(item?.date));
      const normalizedAssistants: OFSAssistant[] = [];

      if (item && typeof item === "object" && Array.isArray(item.assistants)) {
        for (const nested of item.assistants) {
          const resourceId = asString(nested?.resourceDetails?.resourceId);
          const name = asString(nested?.resourceDetails?.name);
          if (resourceId || name) {
            normalizedAssistants.push({ resourceId, name });
          }
        }
      } else {
        const resourceId = asString(item?.resourceId);
        const name = asString(item?.name);
        if (resourceId || name) {
          normalizedAssistants.push({ resourceId, name });
        }
      }

      if (normalizedAssistants.length > 0 && itemDate) {
        daily.push({ date: itemDate, assistants: normalizedAssistants });
      }
    }

    return daily;
  }

  private buildAssignmentsForTechnician(
    technician: BucketRow,
    dailyAssistants: DailyAssistants[],
    allowedDates: string[],
    resourceNamesById: Map<string, string>
  ): CrewAssignment[] {
    const leadId = technician.resourceId;
    const assistantsByDate = new Map<string, OFSAssistant[]>();
    for (const daily of dailyAssistants) {
      assistantsByDate.set(daily.date, daily.assistants);
    }

    const assignments: CrewAssignment[] = [];
    let active:
      | {
          key: string;
          memberResourceIds: string[];
          dates: string[];
        }
      | undefined;

    for (const date of allowedDates) {
      const assistants = assistantsByDate.get(date) || [];
      const assistantIds = assistants
        .map((assistant) => asString(assistant.resourceId))
        .filter((id) => id.length > 0)
        .sort();

      if (assistantIds.length === 0) {
        if (active) {
          assignments.push(
            this.createAssignmentFromActive(
              technician,
              active.memberResourceIds,
              active.dates,
              resourceNamesById
            )
          );
          active = undefined;
        }
        continue;
      }

      const memberResourceIds = [leadId, ...assistantIds];
      const key = memberResourceIds.join("|");

      if (!active) {
        active = { key, memberResourceIds, dates: [date] };
        continue;
      }

      if (active.key === key) {
        active.dates.push(date);
      } else {
        assignments.push(
          this.createAssignmentFromActive(
            technician,
            active.memberResourceIds,
            active.dates,
            resourceNamesById
          )
        );
        active = { key, memberResourceIds, dates: [date] };
      }
    }

    if (active) {
      assignments.push(
        this.createAssignmentFromActive(
          technician,
          active.memberResourceIds,
          active.dates,
          resourceNamesById
        )
      );
    }

    return assignments;
  }

  private createAssignmentFromActive(
    technician: BucketRow,
    memberResourceIds: string[],
    dates: string[],
    resourceNamesById: Map<string, string>
  ): CrewAssignment {
    const leadResourceId = technician.resourceId;
    const leadName = technician.resourceName || leadResourceId;
    const memberLabels = memberResourceIds.map((id) => resourceNamesById.get(id) || id);

    return {
      crewId: `${leadResourceId}:${dates[0]}:${memberResourceIds.join(",")}`,
      crewName: `${leadName} Crew`,
      leadResourceId,
      leadName,
      memberResourceIds,
      membersLabel: memberLabels.join(", "),
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      dates,
      durationDays: dates.length,
    };
  }

  async loadCrewAssignments(
    technicians: BucketRow[],
    dateFrom: string,
    dateTo: string,
    allResources: BucketRow[]
  ): Promise<CrewAssignment[]> {
    this.log("[CrewsService] loadCrewAssignments: start", {
      technicianCount: technicians.length,
      dateFrom,
      dateTo,
      technicianIds: technicians.map((t) => t.resourceId),
    });

    const allowedDates = buildDateRange(dateFrom, dateTo);
    const resourceNamesById = new Map<string, string>();
    for (const resource of allResources) {
      resourceNamesById.set(resource.resourceId, resource.resourceName || resource.resourceId);
    }

    const allAssignments: CrewAssignment[] = [];
    for (const technician of technicians) {
      const traceTag = this.buildAssistantsTraceTag(technician);
      const requestPayload = {
        fields: ["resourceId", "name"],
        dateFrom,
        dateTo,
      };
      this.log(`${traceTag} request`, requestPayload);
      this.log("[CrewsService] loadCrewAssignments: requesting assistants", {
        technicianResourceId: technician.resourceId,
        technicianName: technician.resourceName,
      });
      let assistantsResponse: any;
      try {
        assistantsResponse = await this.proxy.getAllResourceAssistants(
          technician.resourceId,
          requestPayload
        );
        this.log(`${traceTag} rawResponse`, assistantsResponse);
      } catch (error) {
        this.log(`${traceTag} requestFailed`, {
          requestPayload,
          error,
        });
        this.log("[CrewsService] loadCrewAssignments: assistants request failed", {
          technicianResourceId: technician.resourceId,
          technicianName: technician.resourceName,
          error,
        });
        throw error;
      }

      const dailyAssistants = this.normalizeAssistantsResponse(assistantsResponse);
      this.log(`${traceTag} normalizedDailyAssistants`, dailyAssistants);
      this.log("[CrewsService] loadCrewAssignments: normalized daily assistants", {
        technicianResourceId: technician.resourceId,
        daysWithAssistants: dailyAssistants.length,
        dates: dailyAssistants.map((d) => d.date),
      });

      const assignments = this.buildAssignmentsForTechnician(
        technician,
        dailyAssistants,
        allowedDates,
        resourceNamesById
      );
      this.log("[CrewsService] loadCrewAssignments: technician assignments", {
        technicianResourceId: technician.resourceId,
        assignmentCount: assignments.length,
      });
      if (dailyAssistants.length > 0 && assignments.length === 0) {
        this.log(`${traceTag} warning`, {
          message:
            "Daily assistants exist but no assignment was generated. Check date values and assistant resourceDetails payload.",
          dailyAssistants,
        });
      }
      allAssignments.push(...assignments);
    }

    allAssignments.sort((a, b) => {
      if (a.startDate === b.startDate) {
        return a.crewName.localeCompare(b.crewName);
      }
      return a.startDate.localeCompare(b.startDate);
    });

    this.log("[CrewsService] loadCrewAssignments: finished", {
      totalAssignments: allAssignments.length,
    });
    return allAssignments;
  }
}
