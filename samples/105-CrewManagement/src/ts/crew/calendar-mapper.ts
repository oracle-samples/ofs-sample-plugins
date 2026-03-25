import { BucketRow, CrewCalendarRow, OFSAssistant } from "./types";

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return `${value}`.trim();
}

export function mapTechnicianToCalendarRow(
  technician: BucketRow,
  assistants: OFSAssistant[]
): CrewCalendarRow {
  const assistantNames = assistants
    .map((assistant) => asString(assistant.name) || asString(assistant.resourceId))
    .filter((entry) => entry.length > 0);

  return {
    technicianResourceId: technician.resourceId,
    technicianName: technician.resourceName,
    technicianType: technician.resourceType,
    assistantsCount: assistantNames.length,
    assistantsLabel:
      assistantNames.length > 0
        ? assistantNames.join(", ")
        : "No assistants assigned",
  };
}
