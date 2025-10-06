# Forms Viewer Plugin

This Oracle Field Service (OFS) plugin provides a user-friendly interface to view submitted forms for activities, making it easy to review historical form submissions such as notes, checklists, and other activity-related forms.

## Overview

The Forms Viewer plugin allows users to:
- View all submitted forms for a specific activity
- Filter forms by form label (e.g., show only "Service Notes")
- Sort forms by time, user, form label, or submit ID
- Display form details in a readable table format
- Configure which columns to display and in what order

## Features

- **Submitted Forms Display**: Shows all forms submitted for an activity via the OFS API
- **Configurable Filtering**: Filter by specific form labels through secured parameters
- **Sortable Columns**: Click column headers to sort data ascending or descending
- **Customizable Columns**: Configure which columns to display and their order
- **Responsive Design**: Mobile-friendly interface for field use
- **Detailed Form Data**: Displays form details, activity details, and resource details

## Configuration

### Plugin Properties

The plugin expects the following data properties to be configured in OFS:

#### Activity Properties
- `aid` - Activity ID (required)
- `appt_number` - Appointment number (optional, for display)

### Configuration Parameters

The plugin supports configuration via two methods:
1. **openParams** - Dynamic parameters passed when opening the plugin (takes precedence)
2. **securedParams** - Static parameters configured in the plugin descriptor

When both are provided, `openParams` values override `securedParams` values.

#### Available Parameters:

#### FORM_LABEL
- **Description**: Filter forms by specific form label
- **Example**: `Service Notes`
- **Default**: Empty (shows all forms)
- **Use Case**: When you only want to display specific types of forms (e.g., only notes)

#### COLUMN_ORDER
- **Description**: Comma-separated list of columns to display
- **Available Column Types**:
  - `time` - Submission timestamp
  - `user` - User who submitted the form
  - `formLabel` - Form type/label
  - `formSubmitId` - Unique submission ID
  - `formDetails` - Expands to show each form field as a separate column
  - `activityDetails` - Expands to show each activity field as a separate column
  - `resourceDetails` - Expands to show each resource field as a separate column
- **Example**: `time,user,formLabel,formDetails`
- **Default**: `time,user,formLabel,formDetails`
- **Note**: When you specify `formDetails`, `activityDetails`, or `resourceDetails`, the plugin automatically creates a column for each field found in the data. For example, if your forms have `SITE_NOTE_TITLE` and `SITE_NOTE_DETAILS` fields, specifying `formDetails` will create two columns with those names.

### Example Configurations

#### Using securedParams (Static Configuration)

```json
{
    "properties": {
        "activity": ["aid", "appt_number"],
        "provider": []
    },
    "securedParams": [
        {
            "name": "FORM_LABEL",
            "value": "Service Notes"
        },
        {
            "name": "COLUMN_ORDER",
            "value": "time,user,formDetails"
        }
    ]
}
```

#### Using openParams (Dynamic Configuration)

When opening the plugin programmatically, you can pass parameters dynamically:

```javascript
// Open plugin with specific form filter
openPlugin({
    plugin: "formsViewer",
    openParams: {
        FORM_LABEL: "Service Notes",
        COLUMN_ORDER: "time,user,formDetails"
    }
});

// Open plugin showing all forms with different columns
openPlugin({
    plugin: "formsViewer",
    openParams: {
        COLUMN_ORDER: "time,formLabel,activityDetails"
    }
});
```

**Note**: `openParams` values override `securedParams`, allowing dynamic behavior while maintaining sensible defaults.

## Usage

### Opening the Plugin

The plugin can be opened from:
1. Activity details screen
2. Custom actions
3. Routing or scheduling screens

### Viewing Forms

1. **Initial Load**: Forms are automatically fetched when the plugin opens
2. **Sorting**: Click any sortable column header to sort by that column
   - First click: Sort descending
   - Second click: Sort ascending
   - Sort indicator (↑/↓) shows current sort direction
3. **Refresh**: Click the "Refresh" button to reload forms from the API
4. **Close**: Click the "Close" button to exit the plugin

### Form Details Display

The plugin dynamically creates columns based on the actual fields present in the submitted forms:

- **Dynamic Columns**: When you include `formDetails` in `COLUMN_ORDER`, the plugin scans all forms and creates a column for each unique field found
- **Field Values**: Each form field value is displayed in its own column
- **Simple Fields**: Text and numeric values displayed directly
- **File References**: Shows filename for file attachments (e.g., signatures, photos)
- **Missing Fields**: Shows "-" when a form doesn't have a particular field
- **Sortable**: All dynamically created columns are sortable

**Example**: If you filter by "Service Notes" forms that have `SITE_NOTE_TITLE` and `SITE_NOTE_DETAILS` fields, the table will display:
- Time | User | Form Label | SITE_NOTE_TITLE | SITE_NOTE_DETAILS

The same applies to `activityDetails` and `resourceDetails` - each field becomes its own column.

## Use Cases

### Service Notes Review
Configure `FORM_LABEL=Service Notes` to create a dedicated notes viewer showing only note submissions with timestamps and details.

### Safety Checklist Audit
Filter by safety checklist form label to review all safety submissions for compliance auditing.

### Complete Form History
Leave `FORM_LABEL` empty and configure `COLUMN_ORDER` to include all columns for a comprehensive view of all activity forms.

### Field Technician Review
Use `time,user,formLabel,formDetails` to provide technicians with a quick overview of relevant form submissions.

## API Integration

The plugin uses the OFS Core API endpoint:
```
GET /rest/ofscCore/v1/activities/{activityId}/submittedForms
```

This endpoint returns:
- Form submission history
- Form details and field values
- Activity context (when available)
- Resource information (when applicable)
- File references (signatures, photos, etc.)

## Technical Requirements

- **@ofs-users/plugin**: ^1.5.0
- **@ofs-users/proxy**: ^1.20.1
- Bootstrap 5.2.2 (loaded via CDN)
- Modern browser with ES6+ support

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Deployment

Use the `@ofs-users/plugin-manager` to upload the compiled plugin to your OFS instance:

```bash
plugin-manager upload --plugin ./dist --instance YOUR_INSTANCE
```

## Limitations

- Requires activity ID to be provided
- Forms data is read-only (no editing capability)
- Limited to forms associated with a single activity
- API pagination not currently implemented (shows first 100 forms)

## Version History

| Version | Comments                          |
|---------|-----------------------------------|
| 1.0.0   | Initial release                   |
|         | - View submitted forms            |
|         | - Filter by form label            |
|         | - Sortable columns                |
|         | - Configurable column order       |

## License

Copyright © 2022, 2023, Oracle and/or its affiliates.
Licensed under the Universal Permissive License (UPL), Version 1.0
See [LICENSE](https://oss.oracle.com/licenses/upl/)
