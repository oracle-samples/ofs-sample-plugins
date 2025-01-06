export default {
    "apiVersion": 1,
    "method": "init",
    "attributeDescription": {
        "caddress": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "caddress",
            "title": "Address",
            "type": "string",
            "access": "READ_WRITE"
        },
        "ccity": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "ccity",
            "title": "City",
            "type": "string",
            "access": "READ_WRITE"
        },
        "cname": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "cname",
            "title": "Name",
            "type": "string",
            "access": "READ_WRITE"
        },
        "czip": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "czip",
            "title": "ZIP/Postal Code",
            "type": "string",
            "access": "READ_WRITE"
        },
        "cstate": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "cstate",
            "title": "State",
            "type": "string",
            "access": "READ_WRITE"
        },
        "appt_number": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "appt_number",
            "title": "Work Order",
            "type": "string",
            "access": "READ_WRITE"
        },
        "ETA": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "ETA",
            "title": "Start",
            "type": "string",
            "access": "READ_WRITE"
        },
        "astatus": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "astatus",
            "title": "Activity status",
            "type": "string",
            "access": "READ_WRITE",
            "enum": {
                "cancelled": {
                    "label": "cancelled",
                    "text": "Cancelled"
                },
                "complete": {
                    "label": "complete",
                    "text": "Completed"
                },
                "deleted": {
                    "label": "deleted",
                    "text": "Deleted"
                },
                "notdone": {
                    "label": "notdone",
                    "text": "Not Done"
                },
                "pending": {
                    "label": "pending",
                    "text": "Pending"
                },
                "started": {
                    "label": "started",
                    "text": "Started"
                },
                "suspended": {
                    "label": "suspended",
                    "text": "Suspended"
                }
            }
        },
        "aid": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "aid",
            "title": "Activity ID",
            "type": "string",
            "access": "READ_WRITE"
        },
        "travel": {
            "fieldType": "field",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "travel",
            "title": "Traveling Time",
            "type": "string",
            "access": "READ_WRITE"
        },
        "csign": {
            "fieldType": "property",
            "entity": "ENTITY_ACTIVITY",
            "gui": "signature",
            "label": "csign",
            "title": "Signature",
            "type": "file",
            "access": "READ_WRITE",
            "mime_types": [
                "image/png",
                "image/jpeg",
                "image/gif"
            ]
        },
        "ccompany": {
            "fieldType": "property",
            "entity": "ENTITY_ACTIVITY",
            "gui": "text",
            "label": "ccompany",
            "title": "Company name",
            "type": "string",
            "access": "READ_WRITE"
        },
        "invoice": {
            "fieldType": "property",
            "entity": "ENTITY_ACTIVITY",
            "gui": "file",
            "label": "invoice",
            "title": "Invoice",
            "type": "file",
            "access": "READ_WRITE",
            "mime_types": [
                "application/pdf"
            ],
            "file_size_limit": "5"
        },
        "XA_DEBRIEF_COMPLETED": {
            "fieldType": "property",
            "entity": "ENTITY_ACTIVITY",
            "gui": "checkbox",
            "label": "XA_DEBRIEF_COMPLETED",
            "title": "Debrief Completed",
            "type": "int",
            "access": "READ_WRITE"
        },
        "invpool": {
            "fieldType": "field",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "invpool",
            "title": "Inventory pool",
            "type": "string",
            "access": "READ_WRITE",
            "enum": {
                "customer": {
                    "label": "customer",
                    "text": "Customer"
                },
                "deinstall": {
                    "label": "deinstall",
                    "text": "Deinstalled"
                },
                "install": {
                    "label": "install",
                    "text": "Installed"
                },
                "provider": {
                    "label": "provider",
                    "text": "Technician"
                }
            }
        },
        "invsn": {
            "fieldType": "field",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "invsn",
            "title": "Serial Number",
            "type": "string",
            "access": "READ_WRITE"
        },
        "invtype": {
            "fieldType": "field",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "invtype",
            "title": "Inventory Type",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "FIT5000": {
                    "label": "FIT5000",
                    "text": "FIT5000 Virtual Reality Trainer",
                    "nonSerialized": false
                },
                "FIT3000": {
                    "label": "FIT3000",
                    "text": "FIT3000 Cardio Fitness Machine",
                    "nonSerialized": false
                },
                "FIT1410": {
                    "label": "FIT1410",
                    "text": "FIT1410 Elliptical",
                    "nonSerialized": false
                },
                "FIT2100": {
                    "label": "FIT2100",
                    "text": "FIT2100 Treadmill",
                    "nonSerialized": false
                },
                "HEADSET": {
                    "label": "HEADSET",
                    "text": "VR Headset",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "MOUNT": {
                    "label": "MOUNT",
                    "text": "Tablet Mount",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "PEDAL": {
                    "label": "PEDAL",
                    "text": "Elliptical Pedal",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "MAT": {
                    "label": "MAT",
                    "text": "Floor Mat",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "STRAP": {
                    "label": "STRAP",
                    "text": "Heart Rate Strap",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "BELT": {
                    "label": "BELT",
                    "text": "Treadmill Belt",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "MOTOR": {
                    "label": "MOTOR",
                    "text": "Drive Motor",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "SCALE": {
                    "label": "SCALE",
                    "text": "Body Composition Scale",
                    "nonSerialized": false
                },
                "STABLE": {
                    "label": "STABLE",
                    "text": "Front Stabilizer",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "part": {
                    "label": "part",
                    "text": "Part",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "Each"
                },
                "labor": {
                    "label": "labor",
                    "text": "Labor",
                    "nonSerialized": false
                },
                "expense": {
                    "label": "expense",
                    "text": "Expense",
                    "nonSerialized": false
                },
                "TRAY": {
                    "label": "TRAY",
                    "text": "Treadmill Tray",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "BREAKER": {
                    "label": "BREAKER",
                    "text": "Reset Circuit Breaker",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "CONSOLE": {
                    "label": "CONSOLE",
                    "text": "FIT5000 Workout Console",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "BASE": {
                    "label": "BASE",
                    "text": "FIT5000 Base Assembly",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "CRANK": {
                    "label": "CRANK",
                    "text": "Crank Bearing",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "ordered_part": {
                    "label": "ordered_part",
                    "text": "Ordered Part",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                },
                "received_part": {
                    "label": "received_part",
                    "text": "Received Part",
                    "nonSerialized": true,
                    "quantityPrecision": 0,
                    "unitOfMeasurement": "ea"
                }
            }
        },
        "invid": {
            "fieldType": "field",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "invid",
            "title": "Inventory Id",
            "type": "string",
            "access": "READ_WRITE"
        },
        "inv_aid": {
            "fieldType": "field",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "inv_aid",
            "title": "Activity Id",
            "type": "string",
            "access": "READ_WRITE"
        },
        "inv_pid": {
            "fieldType": "field",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "inv_pid",
            "title": "Resource Id",
            "type": "string",
            "access": "READ_WRITE"
        },
        "quantity": {
            "fieldType": "field",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "quantity",
            "title": "Quantity",
            "type": "string",
            "access": "READ_WRITE"
        },
        "labor_service_activity": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "labor_service_activity",
            "title": "Labor Activity",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "com": {
                    "text": "Commute"
                },
                "drp": {
                    "text": "Diagnose and Repair"
                },
                "Labor": {
                    "text": "Labor"
                }
            }
        },
        "labor_item_number": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "labor_item_number",
            "title": "Labor Item",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "FS Overtime Labor": {
                    "text": "FS Overtime Labor"
                },
                "ovr": {
                    "text": "FS Overtime Labor",
                    "inactive": true
                },
                "FS Reg Labor": {
                    "text": "FS Reg Labor"
                },
                "reg": {
                    "text": "FS Regular Labor",
                    "inactive": true
                },
                "trv": {
                    "text": "Travel Time"
                }
            }
        },
        "labor_item_desc": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "labor_item_desc",
            "title": "Labor Item Description",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "trv": {
                    "text": "FS Tech Actual Travel"
                },
                "FS Overtime Labor": {
                    "text": "Overtime Labor (Hours)"
                },
                "ovr": {
                    "text": "Overtime Labor Time",
                    "inactive": true
                },
                "FS Reg Labor": {
                    "text": "Regular Labor (Hours)"
                },
                "reg": {
                    "text": "Regular Labor Time",
                    "inactive": true
                }
            }
        },
        "labor_start_time": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "labor_start_time",
            "title": "Labor Start Time",
            "type": "string",
            "access": "READ_WRITE"
        },
        "labor_end_time": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "labor_end_time",
            "title": "Labor End Time",
            "type": "string",
            "access": "READ_WRITE"
        },
        "expense_service_activity": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "expense_service_activity",
            "title": "Expense Activity",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "Expense": {
                    "text": "Expense"
                },
                "msc": {
                    "text": "Miscellaneous"
                },
                "trv": {
                    "text": "Travel"
                }
            }
        },
        "expense_item_number": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "expense_item_number",
            "title": "Expense Item",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "FS Toll": {
                    "text": "FS Toll"
                },
                "prk": {
                    "text": "Parking"
                },
                "tol": {
                    "text": "Toll Charges"
                }
            }
        },
        "expense_item_desc": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "expense_item_desc",
            "title": "Expense Item Description",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "prk": {
                    "text": "Parking Charges for Service"
                },
                "FS Toll": {
                    "text": "Toll Charges"
                },
                "tol": {
                    "text": "Toll Charges for Service"
                }
            }
        },
        "part_service_activity_used": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "part_service_activity_used",
            "title": "Activity (Used)",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "IN": {
                    "text": "Install",
                    "inactive": true
                },
                "Install": {
                    "text": "Install"
                },
                "W_IN": {
                    "text": "Warranty Install",
                    "inactive": true
                },
                "Warranty Install": {
                    "text": "Warranty Install"
                }
            }
        },
        "part_service_activity_returned": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "part_service_activity_returned",
            "title": "Activity (returned)",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "RET": {
                    "text": "Return",
                    "inactive": true
                },
                "Return": {
                    "text": "Return"
                },
                "W_RET": {
                    "text": "Warranty Return",
                    "inactive": true
                },
                "Warranty Return": {
                    "text": "Warranty Return"
                }
            }
        },
        "part_item_number_rev": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "part_item_number_rev",
            "title": "Part Item + Revision",
            "type": "string",
            "access": "READ_WRITE"
        },
        "part_item_number": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "part_item_number",
            "title": "Part Item",
            "type": "string",
            "access": "READ_WRITE"
        },
        "part_item_revision": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "part_item_revision",
            "title": "Part Revision",
            "type": "string",
            "access": "READ_WRITE"
        },
        "part_item_desc": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "part_item_desc",
            "title": "Part Item Description",
            "type": "string",
            "access": "READ_WRITE"
        },
        "part_uom_code": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "part_uom_code",
            "title": "Part Unit of Measure",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "ea": {
                    "text": "ea"
                },
                "zzu": {
                    "text": "ea"
                },
                "in": {
                    "text": "in"
                },
                "m": {
                    "text": "m"
                }
            }
        },
        "part_disposition_code": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "part_disposition_code",
            "title": "Part Disposition",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "M": {
                    "text": "Fast Return"
                },
                "N": {
                    "text": "No Return"
                },
                "S": {
                    "text": "Slow Return"
                }
            }
        },
        "expense_currency_code": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "combobox",
            "label": "expense_currency_code",
            "title": "Expense Currency",
            "type": "enum",
            "access": "READ_WRITE",
            "enum": {
                "USD": {
                    "text": "$|US Dollars"
                },
                "GBP": {
                    "text": "£|UK Pound"
                },
                "EUR": {
                    "text": "€|Euro"
                }
            }
        },
        "expense_amount": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "expense_amount",
            "title": "Expense",
            "type": "string",
            "access": "READ_WRITE"
        },
        "part_item_cost": {
            "fieldType": "property",
            "entity": "ENTITY_INVENTORY",
            "gui": "text",
            "label": "part_item_cost",
            "title": "Part Cost",
            "type": "string",
            "access": "READ_WRITE"
        },
        "pid": {
            "fieldType": "field",
            "entity": "ENTITY_PROVIDER",
            "gui": "text",
            "label": "pid",
            "title": "ID",
            "type": "string",
            "access": "READ_WRITE"
        },
        "pname": {
            "fieldType": "field",
            "entity": "ENTITY_PROVIDER",
            "gui": "text",
            "label": "pname",
            "title": "Name",
            "type": "string",
            "access": "READ_WRITE"
        }
    },
    "buttons": [
        {
            "buttonId": "20634",
            "params": {}
        },
        {
            "buttonId": "32278",
            "params": {}
        }
    ]
}