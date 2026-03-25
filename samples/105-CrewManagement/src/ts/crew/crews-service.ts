import { mapTechnicianToCalendarRow } from "./calendar-mapper";
import { BucketRow, CrewCalendarRow, CrewProxy, OFSAssistant } from "./types";

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return `${value}`.trim();
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

  private normalizeAssistantsResponse(response: any): OFSAssistant[] {
    const items = Array.isArray(response?.items) ? response.items : [];
    const normalized: OFSAssistant[] = [];

    for (const item of items) {
      if (item && typeof item === "object" && Array.isArray(item.assistants)) {
        for (const nested of item.assistants) {
          const resourceId = asString(nested?.resourceDetails?.resourceId);
          const name = asString(nested?.resourceDetails?.name);
          if (resourceId || name) {
            normalized.push({ resourceId, name });
          }
        }
        continue;
      }

      const resourceId = asString((item as any)?.resourceId);
      const name = asString((item as any)?.name);
      if (resourceId || name) {
        normalized.push({ resourceId, name });
      }
    }

    return normalized;
  }

  async loadCrewCalendarRows(
    technicians: BucketRow[],
    dateFrom: string,
    dateTo: string
  ): Promise<CrewCalendarRow[]> {
    this.log("[CrewsService] loadCrewCalendarRows: start", {
      technicianCount: technicians.length,
      dateFrom,
      dateTo,
      technicianIds: technicians.map((t) => t.resourceId),
    });
    const rows: CrewCalendarRow[] = [];

    for (const technician of technicians) {
      this.log("[CrewsService] loadCrewCalendarRows: requesting assistants", {
        technicianResourceId: technician.resourceId,
        technicianName: technician.resourceName,
      });
      let assistantsResponse;
      try {
        assistantsResponse = await this.proxy.getAllResourceAssistants(
          technician.resourceId,
          {
            fields: ["resourceId", "name"],
            dateFrom,
            dateTo,
          }
        );
      } catch (error) {
        this.log("[CrewsService] loadCrewCalendarRows: assistants request failed", {
          technicianResourceId: technician.resourceId,
          technicianName: technician.resourceName,
          error,
        });
        throw error;
      }

      const assistants = this.normalizeAssistantsResponse(assistantsResponse);
      this.log("[CrewsService] loadCrewCalendarRows: assistants response", {
        technicianResourceId: technician.resourceId,
        assistantsCount: assistants.length,
        assistantIds: assistants.map((a) => a.resourceId),
      });

      if (assistants.length > 0) {
        rows.push(mapTechnicianToCalendarRow(technician, assistants));
      }
    }

    this.log("[CrewsService] loadCrewCalendarRows: finished", {
      rowCount: rows.length,
    });
    return rows.sort((a, b) => a.technicianName.localeCompare(b.technicianName));
  }
}
