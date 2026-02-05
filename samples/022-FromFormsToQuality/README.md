# FromFormsToQuality (022)

## Description

This plugin demonstrates the **OFS 26A functionality** introduced in [plugin-core v1.6.0](https://github.com/oracle-samples/ofs-plugin-core/releases/tag/v1.6.0). It showcases form management capabilities, environment-based token retrieval, and Fusion API integration for Quality Inspection Events.

The plugin opens a form, collects inspection data, and sends the results to Oracle Fusion Quality Management via REST APIs.

## Features

- **Context Detection**: Automatically identifies whether the plugin was opened from an activity or inventory
- **Form Integration**: Uses 26A `closeAndOpenForm()` method to open forms with context data
- **Token Retrieval**: Uses `environment` getter and `getAccessTokenByScope()` for Fusion API authentication
- **Quality API Integration**: Creates and updates inspection events in Oracle Fusion Quality Management
- **Property-to-Characteristic Mapping**: Form property names automatically map to Quality characteristic names

## Architecture

The plugin follows a separation of concerns pattern:

```
assets/js/
├── main.ts              # Entry point
├── custom.ts            # Plugin logic (context detection, form handling)
└── services/
    └── fusionApi.ts     # Fusion API integration (isolated and reusable)
```

## Parameters

**Open Parameters**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `formLabel` | Yes | The label of the form to open for data collection |

Example:
```json
{
  "openParams": {
    "formLabel": "InspectionForm"
  }
}
```

**Secure Parameters**

None

**Properties Needed**

From Activity:
- `aid` - Activity ID
- `resource_email` - Email of the technician (used as InspectedBy)
- `organization_code` - Organization code
- `work_order_number` - Asset work order number
- `asset_number` - Asset number
- `operation_sequence` - Operation sequence number
- `inspection_plan_name` - Asset inspection plan name
- `operation_code` - Work order operation code

From Inventory:
- `invid` - Inventory ID

## Form Configuration

### Property-to-Characteristic Mapping

**Important**: The name of each property in the OFS form **must match exactly** the name of the corresponding characteristic in Oracle Fusion Quality Management.

Example mapping:

| Form Property Name | Quality Characteristic Name | Data Type |
|-------------------|----------------------------|-----------|
| `MT 01M MAIN TANK` | `MT 01M MAIN TANK` | Character |
| `MT 01M BUSHINGS` | `MT 01M BUSHINGS` | Character |
| `MT 01M OLTC COUNTER` | `MT 01M OLTC COUNTER` | Number |
| `MT 01M CURRENT TOP OIL` | `MT 01M CURRENT TOP OIL` | Number |

### Form Fields for Inspection Event

The form can optionally include these fields to override default values:

| Field | Description | Default |
|-------|-------------|---------|
| `EventType` | Inspection event type | `AST` |
| `Inline` | Inline inspection flag | `N` |
| `InspectedBy` | Inspector email | From `resource_email` property |
| `InspectionDate` | Inspection date/time | Current timestamp |
| `OrganizationCode` | Organization code | From `organization_code` property |
| `AssetWorkOrderNumber` | Work order number | From `work_order_number` property |
| `AssetNumber` | Asset number | From `asset_number` property |
| `OperationSequenceNumber` | Operation sequence | From `operation_sequence` property or `10` |
| `AssetInspectionPlanName` | Inspection plan name | From `inspection_plan_name` property |
| `WoOperationCode` | Operation code | From `operation_code` property |

## Fusion API Flow

1. **Create Inspection Event** - `POST /fscmRestApi/resources/latest/inspectionEvents`
2. **Get Event Details** - `GET /fscmRestApi/resources/latest/inspectionEvents/{IpEventId}`
3. **Update Results** - `PATCH /fscmRestApi/resources/latest/inspectionEvents/{IpEventId}`

## How to Use

1. Add this plugin to an activity or inventory screen
2. Configure an application with access to Fusion APIs
3. Set up the form with properties matching Quality characteristic names
4. Configure the plugin with `formLabel` in openParams

## Plugin Configuration

1. **Application**: Configure an application with access to Oracle Fusion Quality APIs
2. **Scope**: The plugin builds the scope automatically using `{faUrl}/.default`
3. **Environment**: Ensure the OFS environment is configured with Fusion Apps URL

## For Development

### Prerequisites

- Node.js (v16+)
- npm

### How to Build

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Build for development (with source maps):
   ```bash
   npm run dev
   ```

4. Create the plugin zip:
   ```bash
   cd dist && zip plugin.zip index.html main.js
   ```

### Running Tests

```bash
npm test
```

## Customization

### Using Different Fusion APIs

The `FusionApiService` class in `services/fusionApi.ts` is designed to be easily extended or replaced. To use different APIs:

1. Create a new service class in `services/`
2. Import and use it in `custom.ts`
3. The separation allows you to swap API implementations without changing the main plugin logic

### Example: Adding a New API Method

```typescript
// In services/fusionApi.ts
async customApiCall(endpoint: string, payload: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
    });
    return response.json();
}
```

## Dependencies

- `@ofs-users/plugin`: ^1.6.0 (26A features)
- `@ofs-users/proxy`: ^1.20.0

## Related Resources

- [OFS Plugin Core v1.6.0 Release Notes](https://github.com/oracle-samples/ofs-plugin-core/releases/tag/v1.6.0)
- [Oracle Fusion Quality Management REST APIs](https://docs.oracle.com/en/cloud/saas/supply-chain-management/23d/fasrp/inspectionEvents.html)
