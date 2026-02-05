/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import {
    OFSPlugin,
    OFSMessage,
    OFSOpenMessage,
    OFSCallProcedureResultMessage,
    BackScreen,
} from "@ofs-users/plugin";
import { FusionApiService, InspectionEventPayload } from "./services/fusionApi";

/**
 * Extended open message with activity, inventory, and openParams
 */
interface OFSCustomOpenMessage extends OFSOpenMessage {
    activity?: {
        aid: string;
        [key: string]: any;
    };
    inventory?: {
        invid: string;
        [key: string]: any;
    };
    openParams?: {
        formLabel?: string;
        [key: string]: any;
    };
    resource?: any;
}

/**
 * Form submission data structure (matches getSubmittedForms response)
 */
interface SubmittedForm {
    formSubmitId: string;
    submittedAt: string;
    formLabel: string;
    formTitle: string;
    userName: string;
    resourceInternalId: string;
    activityId: string | null;
    inventoryId: string | null;
    data?: Record<string, any>;
    [key: string]: any;
}

/**
 * Context type enumeration
 */
enum ContextType {
    ACTIVITY = 'activity',
    INVENTORY = 'inventory',
    UNKNOWN = 'unknown'
}

/**
 * Plugin context information
 */
interface PluginContext {
    type: ContextType;
    activityId?: string;
    inventoryId?: string;
    formLabel?: string;
}

// Storage key for tracking form submission state
const FORM_OPENED_KEY = 'FromFormsToQuality_formOpened';

export class CustomPlugin extends OFSPlugin {
    private context: PluginContext = { type: ContextType.UNKNOWN };
    private openData: OFSCustomOpenMessage | null = null;
    private submittedFormsCallId: string | null = null;
    private tokenCallId: string | null = null;
    private submittedForms: SubmittedForm[] = [];
    private isReturningFromForm: boolean = false;

    /**
     * Handle the open message from OFS
     * Identifies context (activity vs inventory) and determines workflow
     */
    open(data: OFSCustomOpenMessage): void {
        console.debug(`${this.tag}: OPEN received`);
        console.debug(`${this.tag}: Data: ${JSON.stringify(data)}`);

        this.openData = data;
        this.context = this.identifyContext(data);

        console.debug(`${this.tag}: Context identified: ${JSON.stringify(this.context)}`);

        if (!this.context.formLabel) {
            console.error(`${this.tag}: No form label provided in openParams`);
            alert('Error: No form label provided in openParams');
            this.close();
            return;
        }

        // Check if we're returning from a form submission
        this.isReturningFromForm = this.checkIfReturningFromForm();
        console.debug(`${this.tag}: Is returning from form: ${this.isReturningFromForm}`);

        if (this.isReturningFromForm) {
            // We're returning from a form submission - check for submitted forms
            this.clearFormOpenedFlag();
            this.checkForSubmittedForms();
        } else {
            // First time opening - open the form directly
            this.openFormForContext();
        }
    }

    /**
     * Check if we're returning from a form submission using localStorage
     */
    private checkIfReturningFromForm(): boolean {
        const formOpenedData = window.localStorage.getItem(FORM_OPENED_KEY);
        if (!formOpenedData) {
            return false;
        }

        try {
            const data = JSON.parse(formOpenedData);
            // Verify it's for the same context (formLabel + activityId/inventoryId)
            if (data.formLabel !== this.context.formLabel) {
                return false;
            }
            if (this.context.type === ContextType.ACTIVITY && data.activityId !== this.context.activityId) {
                return false;
            }
            if (this.context.type === ContextType.INVENTORY && data.inventoryId !== this.context.inventoryId) {
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Set flag indicating we're opening a form
     */
    private setFormOpenedFlag(): void {
        const data = {
            formLabel: this.context.formLabel,
            activityId: this.context.activityId,
            inventoryId: this.context.inventoryId,
            timestamp: Date.now()
        };
        window.localStorage.setItem(FORM_OPENED_KEY, JSON.stringify(data));
        console.debug(`${this.tag}: Set form opened flag`);
    }

    /**
     * Clear the form opened flag
     */
    private clearFormOpenedFlag(): void {
        window.localStorage.removeItem(FORM_OPENED_KEY);
        console.debug(`${this.tag}: Cleared form opened flag`);
    }

    /**
     * Check for submitted forms using the getSubmittedForms procedure
     */
    private checkForSubmittedForms(): void {
        console.debug(`${this.tag}: Checking for submitted forms`);

        // Build params to filter submitted forms by formLabel and entity
        const params: Record<string, any> = {
            formLabel: this.context.formLabel
        };

        if (this.context.type === ContextType.ACTIVITY && this.context.activityId) {
            params.activityId = this.context.activityId;
        } else if (this.context.type === ContextType.INVENTORY && this.context.inventoryId) {
            params.inventoryId = this.context.inventoryId;
        }

        console.debug(`${this.tag}: getSubmittedForms params: ${JSON.stringify(params)}`);
        this.submittedFormsCallId = this.getSubmittedForms(params);
    }

    /**
     * Identify the context from the open message
     */
    private identifyContext(data: OFSCustomOpenMessage): PluginContext {
        const context: PluginContext = {
            type: ContextType.UNKNOWN,
            formLabel: data.openParams?.formLabel
        };

        // Check if opened from inventory
        if (data.inventory && data.inventory.invid) {
            context.type = ContextType.INVENTORY;
            context.inventoryId = data.inventory.invid;
            console.debug(`${this.tag}: Opened from inventory: ${context.inventoryId}`);
        }
        // Check if opened from activity
        else if (data.activity && data.activity.aid) {
            context.type = ContextType.ACTIVITY;
            context.activityId = data.activity.aid;
            console.debug(`${this.tag}: Opened from activity: ${context.activityId}`);
        }

        return context;
    }

    /**
     * Open the form based on the identified context
     */
    private openFormForContext(): void {
        if (!this.context.formLabel) {
            console.error(`${this.tag}: Cannot open form - no form label`);
            return;
        }

        console.debug(`${this.tag}: Opening form with label: ${this.context.formLabel}`);

        // Set flag to track that we're opening a form (to detect return from form)
        this.setFormOpenedFlag();

        // Build the entity data based on context
        const entityData: Record<string, any> = {};

        if (this.context.type === ContextType.ACTIVITY && this.context.activityId) {
            entityData.activityId = this.context.activityId;
        } else if (this.context.type === ContextType.INVENTORY && this.context.inventoryId) {
            entityData.inventoryId = this.context.inventoryId;
        }

        // Add resourceId from resource.pid if available
        if (this.openData?.resource?.pid) {
            entityData.resourceId = this.openData.resource.pid;
            console.debug(`${this.tag}: Including resourceId: ${entityData.resourceId}`);
        }

        // Use the new 26A closeAndOpenForm method
        this.closeAndOpenForm(this.context.formLabel, entityData);
    }

    /**
     * Handle procedure results - specifically for getSubmittedForms and getAccessTokenByScope
     */
    callProcedureResult(data: OFSCallProcedureResultMessage): void {
        console.debug(`${this.tag}: Procedure result received: ${JSON.stringify(data)}`);

        const callId = data.callId;

        if (callId === this.submittedFormsCallId) {
            this.handleSubmittedFormsResult(data);
        } else if (callId === this.tokenCallId) {
            this.handleTokenResult(data);
        } else {
            console.debug(`${this.tag}: Unknown procedure result with callId: ${callId}`);
        }
    }

    /**
     * Handle the result from getSubmittedForms procedure
     */
    private async handleSubmittedFormsResult(data: OFSCallProcedureResultMessage): Promise<void> {
        console.debug(`${this.tag}: Processing submitted forms result`);
        console.debug(`${this.tag}: resultData: ${JSON.stringify(data.resultData)}`);

        // resultData is directly an array of submitted forms
        const allForms = Array.isArray(data.resultData) ? data.resultData as SubmittedForm[] : [];

        console.debug(`${this.tag}: Total forms returned: ${allForms.length}`);

        if (allForms.length === 0) {
            // No forms found - user cancelled/didn't submit or error retrieving forms
            // Close the plugin to avoid infinite loop
            console.debug(`${this.tag}: No submitted forms found`);
            console.debug(`${this.tag}: Closing plugin to avoid loop`);
            this.close();
            return;
        }

        // Use the last submitted form (most recent) for the integration
        const lastForm = allForms[allForms.length - 1];
        console.debug(`${this.tag}: Using last submitted form: ${lastForm.formSubmitId} (submitted at: ${lastForm.submittedAt})`);

        // Store the form data for later use after token retrieval (only the last form)
        this.submittedForms = [lastForm];

        // Build scope and request token
        await this.requestTokenByScope();
    }

    /**
     * Build the scope using environment and request token
     */
    private async requestTokenByScope(): Promise<void> {
        const environment = this.environment;

        if (!environment) {
            console.error(`${this.tag}: Environment not available`);
            alert('Error: Environment information not available');
            this.close();
            return;
        }

        console.debug(`${this.tag}: Environment: ${JSON.stringify(environment)}`);

        // Build scope based on environment
        // The scope format depends on your Fusion Apps configuration
        const faUrl = environment.faUrl;
        if (!faUrl) {
            console.error(`${this.tag}: Fusion Apps URL not available in environment`);
            alert('Error: Fusion Apps URL not available');
            this.close();
            return;
        }

        // Construct the scope - adjust this based on your requirements
        const scope = `${faUrl}/.default`;

        console.debug(`${this.tag}: Requesting token with scope: ${scope}`);

        // Call getAccessTokenByScope procedure using the convenience method
        this.tokenCallId = this.getAccessTokenByScope(scope);
    }

    /**
     * Handle the token result and invoke Fusion APIs
     */
    private async handleTokenResult(data: OFSCallProcedureResultMessage): Promise<void> {
        console.debug(`${this.tag}: Processing token result`);

        const result = data.resultData as { accessToken?: string; error?: string };

        if (result.error || !result.accessToken) {
            console.error(`${this.tag}: Failed to get access token: ${result.error}`);
            alert(`Error: Failed to get access token - ${result.error}`);
            this.close();
            return;
        }

        const token = result.accessToken;

        if (this.submittedForms.length === 0) {
            console.error(`${this.tag}: No submitted forms available`);
            this.close();
            return;
        }

        // Process forms and update inspection
        await this.processFormsAndUpdateInspection(token, this.submittedForms);
    }

    /**
     * Process submitted forms and update inspection events in Fusion
     */
    private async processFormsAndUpdateInspection(token: string, forms: SubmittedForm[]): Promise<void> {
        const environment = this.environment;
        const faUrl = environment?.faUrl;

        if (!faUrl) {
            console.error(`${this.tag}: Fusion Apps URL not available`);
            alert('Error: Fusion Apps URL not available');
            this.close();
            return;
        }

        // Create Fusion API service instance
        const fusionApi = new FusionApiService(faUrl, token);

        try {
            for (const form of forms) {
                console.debug(`${this.tag}: Processing form: ${form.formLabel} (formSubmitId: ${form.formSubmitId})`);
                const formData = form.data;

                // Check if form data is available
                if (!formData) {
                    console.debug(`${this.tag}: Form data not available for formSubmitId: ${form.formSubmitId}`);
                    console.debug(`${this.tag}: Form metadata: ${JSON.stringify(form)}`);
                    continue;
                }

                // Check if we have inspection event identifiers in the form data or activity
                const inspectionPayload = this.buildInspectionPayload(formData);

                if (inspectionPayload) {
                    // Step 1: Create inspection event
                    console.debug(`${this.tag}: Creating inspection event`);
                    const createdEvent = await fusionApi.createInspectionEvent(inspectionPayload);
                    console.debug(`${this.tag}: Created inspection event: ${createdEvent.IpEventId}`);

                    // Step 2: Get inspection event details to get SampleResultIds
                    console.debug(`${this.tag}: Getting inspection event details`);
                    const eventDetails = await fusionApi.getInspectionEventById(createdEvent.IpEventId);
                    console.debug(`${this.tag}: Got inspection event details`);

                    // Step 3: Build update payload and update inspection results
                    const updatePayload = FusionApiService.buildUpdatePayloadFromForm(eventDetails, formData);

                    if (updatePayload.Sample.length > 0) {
                        console.debug(`${this.tag}: Updating inspection results`);
                        await fusionApi.updateInspectionResults(createdEvent.IpEventId, updatePayload);
                        console.debug(`${this.tag}: Successfully updated inspection results`);
                    } else {
                        console.debug(`${this.tag}: No matching characteristics found in form data`);
                    }
                } else {
                    console.debug(`${this.tag}: Skipping form - no inspection payload could be built`);
                }
            }

            alert('Inspection updated successfully');
        } catch (error) {
            console.error(`${this.tag}: Error processing inspection:`, error);
            alert(`Error updating inspection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        this.close();
    }

    /**
     * Build the inspection event payload from form data and activity/inventory context
     * This method should be customized based on your specific requirements
     */
    private buildInspectionPayload(formData: Record<string, any>): InspectionEventPayload | null {
        // Check for required fields - adjust these based on your form structure
        // The form should contain fields that map to the inspection event payload
        const activity = this.openData?.activity;

        // Try to extract required fields from form data or activity
        const eventType = formData['EventType'] || 'AST';
        const inspectedBy = formData['InspectedBy'] || activity?.['resource_email'];
        const organizationCode = formData['OrganizationCode'] || activity?.['organization_code'];
        const assetWorkOrderNumber = formData['AssetWorkOrderNumber'] || activity?.['work_order_number'];
        const assetNumber = formData['AssetNumber'] || activity?.['asset_number'];
        const operationSequenceNumber = formData['OperationSequenceNumber'] || activity?.['operation_sequence'] || '10';
        const assetInspectionPlanName = formData['AssetInspectionPlanName'] || activity?.['inspection_plan_name'];
        const woOperationCode = formData['WoOperationCode'] || activity?.['operation_code'];

        // Validate required fields
        if (!inspectedBy || !organizationCode || !assetWorkOrderNumber || !assetNumber) {
            console.debug(`${this.tag}: Missing required fields for inspection payload`);
            return null;
        }

        return {
            EventType: eventType,
            Inline: formData['Inline'] || 'N',
            InspectedBy: inspectedBy,
            InspectionDate: formData['InspectionDate'] || new Date().toISOString(),
            OrganizationCode: organizationCode,
            AssetWorkOrderNumber: assetWorkOrderNumber,
            AssetNumber: assetNumber,
            QuantityRequested: formData['QuantityRequested'] || 1,
            OperationSequenceNumber: operationSequenceNumber,
            AssetInspectionPlanName: assetInspectionPlanName,
            WoOperationCode: woOperationCode
        };
    }

    /**
     * Handle error messages from OFS
     */
    error(data: OFSMessage): void {
        console.error(`${this.tag}: ERROR received`);
        console.error(`${this.tag}: Error data: ${JSON.stringify(data)}`);

        // Clear any stored state to avoid issues on next open
        this.clearFormOpenedFlag();

        // Close the plugin
        this.close();
    }
}
