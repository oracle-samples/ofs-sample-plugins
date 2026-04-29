import { OFSOpenMessage } from "@ofs-users/plugin";

export interface StockingLocationsSecuredData {
  enableLogging?: string;
  [key: string]: unknown;
}

export interface StockingLocationsOpenMessage extends OFSOpenMessage {
  openParams?: Record<string, unknown>;
  securedData?: StockingLocationsSecuredData;
  provider?: {
    pid?: string;
    pname?: string;
    [key: string]: unknown;
  };
}

export interface TokenProcedureResult {
  token?: string;
  status?: string;
  detail?: string;
}

export interface TechnicianSubinventoryItem {
  TechSubinventoryId?: number | string;
  PartyId?: number | string;
  PartyName?: string;
  OrganizationCode?: string;
  OrganizationName?: string;
  Subinventory?: string;
  StockLocationName?: string;
  DefaultFlag?: string;
  EnabledFlag?: string;
  AllowPartsOrdersFlag?: string;
  [key: string]: unknown;
}

export interface TechnicianSubinventoriesResponse {
  count?: number;
  hasMore?: boolean;
  limit?: number;
  offset?: number;
  items?: TechnicianSubinventoryItem[];
}

export interface StockingLocationRow {
  techSubinventoryId: string;
  partyId: string;
  partyName: string;
  organizationCode: string;
  organizationName: string;
  subinventory: string;
  stockLocationName: string;
  defaultFlag: string;
  enabledFlag: string;
  allowPartsOrdersFlag: string;
  technicianLabel: string;
}
