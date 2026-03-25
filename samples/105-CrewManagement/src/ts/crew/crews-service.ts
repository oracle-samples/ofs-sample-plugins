import { mapTechnicianToCalendarRow } from "./calendar-mapper";
import { BucketRow, CrewCalendarRow, CrewProxy } from "./types";

export class CrewsService {
  constructor(private readonly proxy: CrewProxy) {}

  async loadCrewCalendarRows(
    technicians: BucketRow[]
  ): Promise<CrewCalendarRow[]> {
    const rows: CrewCalendarRow[] = [];

    for (const technician of technicians) {
      const assistantsResponse = await this.proxy.getAllResourceAssistants(
        technician.resourceId,
        { fields: ["resourceId", "name"] }
      );

      const assistants = Array.isArray(assistantsResponse?.items)
        ? assistantsResponse.items
        : [];

      rows.push(mapTechnicianToCalendarRow(technician, assistants));
    }

    return rows.sort((a, b) => a.technicianName.localeCompare(b.technicianName));
  }
}
