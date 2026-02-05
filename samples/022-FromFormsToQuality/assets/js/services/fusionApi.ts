/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

/**
 * Fusion API Service for Quality Inspection Events
 *
 * This module is completely separated from the main plugin logic
 * to allow easy adjustment for invoking different APIs.
 */

export interface InspectionEventPayload {
    EventType: string;
    Inline: string;
    InspectedBy: string;
    InspectionDate: string;
    OrganizationCode: string;
    AssetWorkOrderNumber: string;
    AssetNumber: string;
    QuantityRequested: number;
    OperationSequenceNumber: string;
    AssetInspectionPlanName: string;
    WoOperationCode: string;
}

export interface SampleResult {
    SampleResultId: number;
    CharacteristicName: string;
    DataType?: string;
    ResultValueChar?: string;
    ResultValueNumber?: number;
}

export interface SampleDisposition {
    SampleEventDispositionId: number;
    SampleResult: SampleResult[];
}

export interface Sample {
    SampleId: number;
    SampleDisposition: SampleDisposition[];
}

export interface InspectionEvent {
    IpEventId: number;
    Sample: Sample[];
}

export interface InspectionEventResponse {
    items: InspectionEvent[];
    count: number;
    hasMore: boolean;
    limit: number;
    offset: number;
}

export interface UpdateResultPayload {
    IpEventId: number;
    Sample: {
        SampleId: number;
        SampleDisposition: {
            SampleEventDispositionId: number;
            SampleResult: {
                SampleResultId: number;
                CharacteristicName: string;
                ResultValueChar?: string;
                ResultValueNumber?: number;
            }[];
        }[];
    }[];
}

/**
 * FusionApiService - Handles all Fusion API interactions for Quality Inspection Events
 */
export class FusionApiService {
    private baseUrl: string;
    private token: string;

    constructor(faUrl: string, token: string) {
        // Remove trailing slash if present
        this.baseUrl = faUrl.replace(/\/$/, '');
        this.token = token;
    }

    /**
     * Get authorization headers for API calls
     */
    private getHeaders(): HeadersInit {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Create a new inspection event
     * POST /fscmRestApi/resources/latest/inspectionEvents
     */
    async createInspectionEvent(payload: InspectionEventPayload): Promise<InspectionEvent> {
        const url = `${this.baseUrl}/fscmRestApi/resources/latest/inspectionEvents`;

        console.debug(`FusionApiService: Creating inspection event at ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create inspection event: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Get inspection event details
     * GET /fscmRestApi/resources/latest/inspectionEvents
     */
    async getInspectionEvents(query?: string): Promise<InspectionEventResponse> {
        let url = `${this.baseUrl}/fscmRestApi/resources/latest/inspectionEvents`;
        if (query) {
            url += `?${query}`;
        }

        console.debug(`FusionApiService: Getting inspection events from ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get inspection events: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Get a specific inspection event by ID
     * GET /fscmRestApi/resources/latest/inspectionEvents/{IpEventId}
     */
    async getInspectionEventById(ipEventId: number): Promise<InspectionEvent> {
        const url = `${this.baseUrl}/fscmRestApi/resources/latest/inspectionEvents/${ipEventId}`;

        console.debug(`FusionApiService: Getting inspection event ${ipEventId} from ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get inspection event: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Update inspection results
     * PATCH /fscmRestApi/resources/latest/inspectionEvents/{IpEventId}
     */
    async updateInspectionResults(ipEventId: number, payload: UpdateResultPayload): Promise<InspectionEvent> {
        const url = `${this.baseUrl}/fscmRestApi/resources/latest/inspectionEvents/${ipEventId}`;

        console.debug(`FusionApiService: Updating inspection event ${ipEventId} at ${url}`);

        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update inspection results: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Build update payload from form data and inspection event
     * Maps form property names to characteristic names
     *
     * @param inspectionEvent - The inspection event with sample results
     * @param formData - The submitted form data (property names match characteristic names)
     */
    static buildUpdatePayloadFromForm(
        inspectionEvent: InspectionEvent,
        formData: Record<string, any>
    ): UpdateResultPayload {
        const payload: UpdateResultPayload = {
            IpEventId: inspectionEvent.IpEventId,
            Sample: []
        };

        for (const sample of inspectionEvent.Sample) {
            const samplePayload: UpdateResultPayload['Sample'][0] = {
                SampleId: sample.SampleId,
                SampleDisposition: []
            };

            for (const disposition of sample.SampleDisposition) {
                const dispositionPayload: UpdateResultPayload['Sample'][0]['SampleDisposition'][0] = {
                    SampleEventDispositionId: disposition.SampleEventDispositionId,
                    SampleResult: []
                };

                for (const result of disposition.SampleResult) {
                    // Check if form data has a property matching the characteristic name
                    const characteristicName = result.CharacteristicName;
                    if (characteristicName in formData) {
                        const value = formData[characteristicName];
                        const resultPayload: UpdateResultPayload['Sample'][0]['SampleDisposition'][0]['SampleResult'][0] = {
                            SampleResultId: result.SampleResultId,
                            CharacteristicName: characteristicName
                        };

                        // Determine if the value is numeric or character based on DataType or value type
                        if (result.DataType === 'NUMBER' || typeof value === 'number') {
                            resultPayload.ResultValueNumber = Number(value);
                        } else {
                            resultPayload.ResultValueChar = String(value);
                        }

                        dispositionPayload.SampleResult.push(resultPayload);
                    }
                }

                if (dispositionPayload.SampleResult.length > 0) {
                    samplePayload.SampleDisposition.push(dispositionPayload);
                }
            }

            if (samplePayload.SampleDisposition.length > 0) {
                payload.Sample.push(samplePayload);
            }
        }

        return payload;
    }
}
