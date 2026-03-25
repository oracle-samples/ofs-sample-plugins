import { OFSOpenMessage } from "../ofs-plugin-core/plugin";

export interface CrewOpenMessage extends OFSOpenMessage {
  openParams?: unknown;
  securedData?: unknown;
}

export interface CrewOpenConfig {
  bucketTypes: string[];
  techniciansTypes: string[];
  enableLogging: boolean;
}

export interface BucketRow {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  parentResourceId: string;
}

export interface CrewCalendarRow {
  technicianResourceId: string;
  technicianName: string;
  technicianType: string;
  assistantsCount: number;
  assistantsLabel: string;
}

export interface OFSListResponse<T> {
  status: number;
  description?: string;
  data?: {
    items?: T[];
  };
}

export interface OFSResource {
  resourceId?: string | number;
  name?: string;
  resourceType?: string;
  parentResourceId?: string | number;
}

export interface OFSAssistant {
  resourceId?: string | number;
  name?: string;
}

export interface CrewProxy {
  getAllResources(params?: { fields?: string[] }): Promise<{
    items?: OFSResource[];
    totalResults?: number;
  }>;
  getAllResourceAssistants(
    resourceId: string,
    params: { fields?: string[]; dateFrom: string; dateTo: string }
  ): Promise<{
    items?: OFSAssistant[];
    totalResults?: number;
  }>;
}
