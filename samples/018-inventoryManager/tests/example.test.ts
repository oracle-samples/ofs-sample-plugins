/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

// Test utility functions for inventory management

test("Field order parsing works correctly", () => {
    const parseFieldOrder = (fieldOrderString: string): string[] => {
        return fieldOrderString.split(',').map(field => field.trim());
    };
    
    const fieldOrder = parseFieldOrder("invtype,part_item_number,part_item_revision,quantity");
    expect(fieldOrder).toEqual(["invtype", "part_item_number", "part_item_revision", "quantity"]);
    
    const fieldOrderWithSpaces = parseFieldOrder("invtype, part_item_number , part_item_revision, quantity");
    expect(fieldOrderWithSpaces).toEqual(["invtype", "part_item_number", "part_item_revision", "quantity"]);
});

test("Inventory filtering logic works correctly", () => {
    const filterProviderInventory = (inventoryList: any) => {
        const result: any[] = [];
        
        if (!inventoryList) {
            return result;
        }

        Object.values(inventoryList).forEach((item: any) => {
            if (item.invpool === "provider") {
                result.push({
                    ...item,
                    selectedQuantity: 0
                });
            }
        });
        
        return result;
    };
    
    const mockInventoryList = {
        "item1": {
            invid: "item1",
            invpool: "provider",
            invtype: "part",
            quantity: 10
        },
        "item2": {
            invid: "item2", 
            invpool: "customer",
            invtype: "labor",
            quantity: 5
        },
        "item3": {
            invid: "item3",
            invpool: "provider", 
            invtype: "material",
            quantity: 3
        }
    };
    
    const filteredData = filterProviderInventory(mockInventoryList);
    
    // Should only include provider items
    expect(filteredData).toHaveLength(2);
    expect(filteredData[0].invpool).toBe("provider");
    expect(filteredData[1].invpool).toBe("provider");
    expect(filteredData.map((item: any) => item.invid)).toEqual(["item1", "item3"]);
    expect(filteredData[0].selectedQuantity).toBe(0);
});

test("Install actions generation works correctly", () => {
    const generateInstallActions = (selectedItems: any[], activityAid: string) => {
        return selectedItems.map(item => {
            const { inv_pid, selectedQuantity, quantity, ...properties } = item;
            
            const action: any = {
                entity: "inventory",
                action: "install",
                inv_aid: activityAid,
                invid: item.invid,
                properties: properties
            };
            
            // Only include quantity in the action if invsn is empty/null
            if (!item.invsn) {
                action.quantity = selectedQuantity.toString();
            }
            
            return action;
        });
    };
    
    // Test without serial number (should include quantity)
    const itemWithoutSerial = {
        invid: "21260605",
        invpool: "provider",
        invtype: "part",
        quantity: 10,
        part_item_number: "motoruniv101",
        part_item_revision: "A",
        inv_pid: 3000035,
        selectedQuantity: 5,
        invsn: null
    };
    
    // Test with serial number (should NOT include quantity)
    const itemWithSerial = {
        invid: "21258910",
        invpool: "provider",
        invtype: "geng103",
        quantity: 1,
        inv_pid: 3000035,
        selectedQuantity: 1,
        invsn: "NG175KW00013"
    };
    
    const actions = generateInstallActions([itemWithoutSerial, itemWithSerial], "137165123");
    
    expect(actions).toHaveLength(2);
    
    // First item (no serial) - should have quantity
    expect(actions[0].entity).toBe("inventory");
    expect(actions[0].action).toBe("install");
    expect(actions[0].quantity).toBe("5");
    expect(actions[0].inv_aid).toBe("137165123");
    expect(actions[0].invid).toBe("21260605");
    expect(actions[0].properties).not.toHaveProperty('inv_pid');
    expect(actions[0].properties).not.toHaveProperty('quantity');
    expect(actions[0].properties).not.toHaveProperty('selectedQuantity');
    
    // Second item (has serial) - should NOT have quantity
    expect(actions[1].entity).toBe("inventory");
    expect(actions[1].action).toBe("install");
    expect(actions[1]).not.toHaveProperty('quantity');
    expect(actions[1].inv_aid).toBe("137165123");
    expect(actions[1].invid).toBe("21258910");
    expect(actions[1].properties).not.toHaveProperty('inv_pid');
    expect(actions[1].properties).not.toHaveProperty('quantity');
    expect(actions[1].properties).not.toHaveProperty('selectedQuantity');
});
