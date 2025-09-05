# Inventory Manager Plugin

This Oracle Field Service (OFS) plugin provides a comprehensive inventory management interface for field technicians to manage provider inventory items directly from activities.

## Overview

The Inventory Manager plugin allows technicians to:
- View available provider inventory items in a filterable table
- Select quantities for installation from the provider inventory pool
- Install selected inventory items directly to activities
- Filter inventory items by multiple criteria for easy searching

## Features

- **Provider Inventory Display**: Shows all inventory items where `invpool = "provider"`
- **Interactive Table**: Sortable and filterable table with real-time search capabilities
- **Quantity Selection**: Input fields for selecting installation quantities with validation
- **Smart Filtering**: Column-based filtering for quick item location
- **Inventory Installation**: Direct inventory installation actions to activities
- **Responsive Design**: Mobile-friendly interface for field use

## Configuration

### Plugin Properties

The plugin expects the following data properties to be configured in OFS:

#### Activity Properties
- `aid` - Activity ID
- `appt_number` - Appointment number

#### Provider Properties  
- `pid` - Provider ID
- `pname` - Provider name

#### Inventory Properties
- `invid` - Inventory ID
- `invpool` - Inventory pool (plugin filters for "provider")
- `invtype` - Inventory type
- `inv_pid` - Provider inventory ID
- `quantity` - Available quantity
- `part_item_number` - Part item number
- `part_item_revision` - Part item revision
- `part_item_number_rev` - Part item number with revision
- `part_item_desc` - Part item description
- `labor_item_number` - Labor item number
- `labor_item_desc` - Labor item description
- `invsn` - Inventory serial number
- `part_uom_code` - Part unit of measure code
- `part_disposition_code` - Part disposition code
- `inventory_model` - Inventory model
- `I_TECHNICIAN_NAME` - Technician name
- `expense_amount` - Expense amount
- `expense_currency_code` - Expense currency code
- `expense_item_number` - Expense item number
- `expense_item_desc` - Expense item description

### Secure Parameters

The plugin supports the following secure parameters:

#### INV_FIELD_ORDER
- **Description**: Defines the order and which fields to display in the inventory table
- **Default Value**: `invtype,invsn,part_item_number,part_item_revision,quantity`
- **Format**: Comma-separated list of field names
- **Example**: `invtype,part_item_number,invsn,quantity,part_item_desc`

This parameter allows administrators to customize which inventory fields are displayed and in what order, providing flexibility for different business requirements.

## Usage

1. **Opening the Plugin**: The plugin automatically loads when opened from an activity
2. **Viewing Inventory**: Provider inventory items are displayed in a filterable table
3. **Filtering Items**: Use the filter inputs below each column header to search for specific items
4. **Selecting Quantities**: Enter desired quantities in the "Selected Quantity" column
   - Quantities are validated against available stock
   - Maximum quantity is displayed for reference
5. **Installing Items**: Click "OK" to install selected items to the current activity

### Inventory Installation Logic

- Items with serial numbers (`invsn`): Installed without specifying quantity (1:1 mapping)
- Items without serial numbers: Installed with the specified quantity
- All selected inventory properties are passed to the installation action

## Development

### Prerequisites

- Node.js and npm installed
- `webpack` (recommended but not required)
- `just` (recommended but not required)

### Installation

Install required packages:
```bash
npm install
```

### Building the Plugin

#### Development Build
```bash
# Using just (recommended)
just dev-pack

# Using webpack directly
rm -rf dist/
mkdir dist
cp index.html dist/
webpack --mode=development
```

#### Production Build
```bash
# Using just (recommended)
just pack

# Using webpack directly
rm -rf dist/
mkdir dist
cp index.html dist/
webpack --mode=production
```

### Creating Plugin Archive

#### Development Archive
```bash
# Using just
just dev-zip

# Manual creation
cd dist
zip plugin.zip index.html main.js
```

#### Production Archive
```bash
# Using just
just zip

# Manual creation
just pack
cd dist
zip plugin.zip index.html main.js
```

## Deployment

### Method 1: Using Upload Manager (Recommended)
```bash
just upload
```

### Method 2: Manual Upload
1. Create the plugin ZIP file using one of the methods above
2. Log into OFS Administration
3. Navigate to Configuration → Plugins
4. Create a new hosted plugin
5. Upload the `plugin.zip` file
6. Configure the required properties and secure parameters
7. Assign the plugin to appropriate activities or workflows

### Plugin Configuration in OFS

1. **Plugin Properties**: Configure all required activity, provider, and inventory properties
2. **Secure Parameters**: Set the `INV_FIELD_ORDER` parameter to customize displayed fields
3. **Plugin Assignment**: Assign to activities where inventory management is needed

## Technical Details

- **Framework**: Built using Oracle Field Service Plugin SDK (@ofs-users/plugin)
- **Language**: TypeScript compiled to JavaScript
- **Styling**: SCSS compiled to CSS
- **Build Tool**: Webpack for bundling and compilation

## File Structure

```
018-inventoryManager/
├── assets/
│   ├── js/
│   │   ├── main.ts          # Plugin entry point
│   │   ├── custom.ts        # Main plugin implementation
│   │   └── utils/           # Utility functions
│   └── css/
│       └── inventory.scss   # Plugin styles
├── dist/                    # Built plugin files
├── tests/                   # Test files
├── index.html               # Plugin UI template
├── descriptor.json          # Plugin configuration
├── package.json             # Project dependencies
├── webpack.config.js        # Build configuration
├── justfile                 # Build automation
└── README.md               # This file
```

## Troubleshooting

### Common Issues

1. **No inventory items displayed**: Ensure inventory data includes items with `invpool = "provider"`
2. **Filters not working**: Check that field names in `INV_FIELD_ORDER` match actual data properties
3. **Quantity validation errors**: Verify that quantity values are numeric and within available stock

### Debug Mode

The plugin includes a debug section that displays all input data in JSON format. Click on "DEBUG ONLY: INPUT DATA" to expand and view the raw data being passed to the plugin.

## Support

For questions or issues with this plugin sample:
1. Check the Oracle Field Service documentation
2. Review the plugin logs in the browser console
3. Verify plugin configuration in OFS Administration

## License

Copyright © 2022, 2023, Oracle and/or its affiliates.
Licensed under the Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/