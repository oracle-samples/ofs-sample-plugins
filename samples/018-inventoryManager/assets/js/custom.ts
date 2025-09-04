/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";
import { JSONTree } from "./utils/jsonview";

interface CustomOFSOpenMessage extends OFSOpenMessage {
    activity?: {
        aid: string;
        [key: string]: any;
    };
    inventoryList?: { [key: string]: any };
    securedData?: { [key: string]: string };
}

interface InventoryItem {
    invid: string;
    invpool: string;
    invtype: string;
    inv_pid?: number;
    quantity: number;
    part_item_number?: string;
    part_item_revision?: string;
    part_item_number_rev?: string;
    part_item_desc?: string;
    labor_item_number?: string;
    labor_item_desc?: string;
    invsn?: string;
    part_uom_code?: string;
    part_disposition_code?: string;
    inventory_model?: string;
    I_TECHNICIAN_NAME?: string;
    expense_amount?: string;
    expense_currency_code?: string;
    expense_item_number?: string;
    expense_item_desc?: string;
}

interface InventoryTableRow extends InventoryItem {
    selectedQuantity: number;
}

export class CustomPlugin extends OFSPlugin {
    private inventoryData: InventoryTableRow[] = [];
    private filteredData: InventoryTableRow[] = [];
    private fieldOrder: string[] = [];
    private activityAid: string = "";
    private currentFilters: { [key: string]: string } = {};

    open(data: CustomOFSOpenMessage) {
        // Initialize debug view safely
        try {
            const tree = new JSONTree(JSON.stringify(data));
            const input_data = document.getElementById("input_data");
            if (!!input_data) {
                tree.render(input_data);
            }
        } catch (error) {
            console.warn("Failed to render debug JSON tree:", error);
            const input_data = document.getElementById("input_data");
            if (input_data) {
                input_data.innerHTML = '<div class="alert alert-warning">Debug data could not be displayed</div>';
            }
        }

        // Get field order from secured parameters with fallback
        const securedData = data.securedData || {};
        const fieldOrderString = securedData.INV_FIELD_ORDER || "invtype,invsn,part_item_number,part_item_revision,quantity";
        this.fieldOrder = this.getFieldOrder(fieldOrderString);
        this.activityAid = data.activity?.aid || "";

        console.log("Field order:", this.fieldOrder);
        console.log("Activity ID:", this.activityAid);

        // Filter and process inventory data
        this.processInventoryData(data.inventoryList);

        // Render the inventory table
        this.renderInventoryTable();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup section toggle functionality
        this.setupSectionToggles();
    }

    private getFieldOrder(fieldOrderString: string): string[] {
        return fieldOrderString.split(',').map(field => field.trim());
    }

    private processInventoryData(inventoryList: any) {
        this.inventoryData = [];
        
        if (!inventoryList) {
            console.warn("No inventory data provided");
            return;
        }

        console.log("Processing inventory data...", Object.keys(inventoryList).length, "total items");

        // Filter inventory items where invpool = "provider"
        Object.values(inventoryList).forEach((item: any) => {
            console.log(`Item ${item.invid}: pool=${item.invpool}, type=${item.invtype}`);
            if (item.invpool === "provider") {
                const tableRow: InventoryTableRow = {
                    ...item,
                    selectedQuantity: 0 // Default selected quantity
                };
                this.inventoryData.push(tableRow);
                console.log(`Added provider item: ${item.invid} (${item.invtype})`);
            }
        });

        this.filteredData = [...this.inventoryData];
        console.log(`Found ${this.inventoryData.length} provider inventory items:`, this.inventoryData.map(item => item.invid));
    }

    private renderInventoryTable() {
        console.log("Rendering inventory table...");
        const container = document.getElementById('inventory-table-container') as HTMLElement;
        if (!container) {
            console.error('Could not find inventory-table-container');
            return;
        }

        console.log(`Rendering table with ${this.filteredData.length} items`);

        if (this.filteredData.length === 0) {
            console.log("No provider items found, showing warning message");
            container.innerHTML = '<div class="alert alert-warning">No provider inventory items found.</div>';
            return;
        }
        
        const tableHTML = this.generateTableHTML();
        console.log("Generated table HTML length:", tableHTML.length);
        container.innerHTML = tableHTML;
        console.log("Table rendered successfully");
    }

    private generateTableHTML(): string {
        if (this.filteredData.length === 0) {
            // Check if there are filters applied
            const hasFilters = this.hasActiveFilters();
            const message = hasFilters 
                ? 'No inventory items match the current filters. <button class="btn btn-primary" id="clear-filters-btn" style="margin-left: 10px;">Clear Filters</button>'
                : 'No provider inventory items found.';
            return `<div class="alert alert-warning">${message}</div>`;
        }

        const headers = [...this.fieldOrder, 'Selected Quantity'];
        
        // Add filter controls section
        let html = '<div class="filter-controls" style="margin-bottom: 15px;">';
        html += '<button class="btn btn-cancel" id="clear-filters-btn">Clear All Filters</button>';
        html += '<span class="filter-info" style="margin-left: 15px; font-size: 14px; color: #6c757d;">Showing <strong>' + this.filteredData.length + '</strong> of <strong>' + this.inventoryData.length + '</strong> items</span>';
        html += '</div>';
        
        html += '<div class="table-responsive">';
        html += '<table class="table" id="inventoryTable">';
        
        // Table header with filters
        html += '<thead>';
        html += '<tr>';
        headers.forEach(header => {
            html += `<th>${this.formatHeaderName(header)}</th>`;
        });
        html += '</tr>';
        
        // Filter row
        html += '<tr>';
        this.fieldOrder.forEach(field => {
            html += `<th><input type="text" class="filter-input" data-field="${field}" placeholder="Filter ${this.formatHeaderName(field)}" value="${this.getCurrentFilterValue(field)}"></th>`;
        });
        html += '<th></th>'; // No filter for Selected Quantity column
        html += '</tr>';
        html += '</thead>';
        
        // Table body
        html += '<tbody>';
        this.filteredData.forEach((item, index) => {
            html += '<tr>';
            this.fieldOrder.forEach(field => {
                const value = item[field as keyof InventoryItem] || '';
                html += `<td>${value}</td>`;
            });
            
            // Selected Quantity input with validation - use invid as identifier
            html += `<td>
                <input type="number" 
                       class="quantity-input" 
                       data-invid="${item.invid}"
                       data-max="${item.quantity}"
                       min="0" 
                       max="${item.quantity}" 
                       value="${item.selectedQuantity}"
                       placeholder="0">
                <div class="form-text">Max: ${item.quantity}</div>
            </td>`;
            html += '</tr>';
        });
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        
        return html;
    }

    private formatHeaderName(field: string): string {
        return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    private hasActiveFilters(): boolean {
        return Object.keys(this.currentFilters).some(key => this.currentFilters[key].trim() !== '');
    }

    private getCurrentFilterValue(field: string): string {
        return this.currentFilters[field] || '';
    }

    private clearAllFilters(): void {
        this.currentFilters = {};
        this.filteredData = [...this.inventoryData];
        this.renderInventoryTable();
        this.setupQuantityEventListeners();
    }

    private setupEventListeners() {
        // Filter inputs - use event delegation for dynamic content
        document.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.classList.contains('filter-input')) {
                this.handleFilter();
            } else if (target.classList.contains('quantity-input')) {
                this.handleQuantityInput(target);
            }
        });

        // Clear filters button - use event delegation
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            if (target.id === 'clear-filters-btn') {
                this.clearAllFilters();
            }
        });

        // Submit button
        const submitButton = document.getElementById('submit_button');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                this.handleSubmit();
            });
        }
        
        // Setup quantity listeners for initial render
        this.setupQuantityEventListeners();
    }
    
    private setupQuantityEventListeners() {
        // Event delegation handles this automatically, so this method can be empty or removed
        // The document-level event listener will catch all quantity input events
    }

    private handleFilter() {
        const filterInputs = document.querySelectorAll('.filter-input') as NodeListOf<HTMLInputElement>;
        this.currentFilters = {};
        
        filterInputs.forEach(input => {
            const field = input.dataset.field;
            if (field) {
                this.currentFilters[field] = input.value.trim();
            }
        });

        // Filter the data based on current filters
        this.filteredData = this.inventoryData.filter(item => {
            return Object.entries(this.currentFilters).every(([field, filterValue]) => {
                if (!filterValue) return true; // Empty filter means show all
                const itemValue = String(item[field as keyof InventoryItem] || '').toLowerCase();
                return itemValue.includes(filterValue.toLowerCase());
            });
        });

        this.renderInventoryTable();
        this.setupQuantityEventListeners();
    }

    private handleQuantityInput(input: HTMLInputElement) {
        const invid = input.dataset.invid || '';
        const maxQuantity = parseInt(input.dataset.max || '0');
        const value = parseInt(input.value) || 0;

        // Validate quantity
        if (value < 0) {
            input.value = '0';
            input.classList.add('is-invalid');
        } else if (value > maxQuantity) {
            input.value = maxQuantity.toString();
            input.classList.add('is-invalid');
            setTimeout(() => input.classList.remove('is-invalid'), 2000);
        } else {
            input.classList.remove('is-invalid');
            
            // Update the quantity in both inventoryData and filteredData
            const inventoryItem = this.inventoryData.find(item => item.invid === invid);
            if (inventoryItem) {
                inventoryItem.selectedQuantity = value;
                console.log(`Updated quantity for ${invid}: ${value}`);
            }
            
            const filteredItem = this.filteredData.find(item => item.invid === invid);
            if (filteredItem) {
                filteredItem.selectedQuantity = value;
            }
        }
    }

    private handleSubmit() {
        console.log("Handling submit...");
        console.log("All inventory data:", this.inventoryData.map(item => ({ invid: item.invid, selectedQuantity: item.selectedQuantity })));
        
        const selectedItems = this.inventoryData.filter(item => item.selectedQuantity > 0);
        console.log("Selected items for installation:", selectedItems.length);
        
        if (selectedItems.length === 0) {
            alert('Please select at least one inventory item with a quantity greater than 0.');
            return;
        }

        const actions = selectedItems.map(item => {
            console.log(`Creating action for ${item.invid} with quantity ${item.selectedQuantity}, invsn: ${item.invsn}`);
            
            // Create inventory install action with all properties except inv_pid, selectedQuantity, and quantity
            const { inv_pid, selectedQuantity, quantity, ...properties } = item;
            
            const action: any = {
                entity: "inventory",
                action: "install",
                inv_aid: this.activityAid,
                invid: item.invid,
                properties: properties
            };
            
            // Only include quantity in the action (not properties) if invsn is empty/null
            if (!item.invsn) {
                action.quantity = selectedQuantity.toString();
                console.log(`Including quantity ${selectedQuantity} for ${item.invid} (no serial number)`);
            } else {
                console.log(`Excluding quantity for ${item.invid} (has serial number: ${item.invsn})`);
            }
            
            return action;
        });

        const closeData = {
            apiVersion: 1,
            method: "close",
            backScreen: "default",
            actions: actions
        };

        console.log(`Submitting ${actions.length} inventory install actions:`, closeData);
        this.close(closeData);
    }

    private setupSectionToggles() {
        // Make toggleSection function globally available for onclick handlers
        (window as any).toggleSection = (sectionId: string) => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.toggle('hidden');
            }
        };
    }

    public close(data?: any): void {
        this.sendMessage("close" as any, data);
    }
}
