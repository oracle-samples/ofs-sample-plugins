# Routing Assignment Threshold Plugin

This Oracle Field Service (OFS) plugin evaluates routing assignment history for activities and determines whether pinning should be allowed based on configurable thresholds.

## Overview

The Routing Assignment Threshold plugin:
- Parses the `routingAssignTrack` activity property containing assignment history
- Counts total reassignments and recent reassignments within a time window
- Evaluates both counts against configurable thresholds
- Sets `xa_pin_allowed` flag (1 = allowed, 0 = blocked) based on threshold evaluation

## Features

- **Total Reassignment Tracking**: Counts all routing assignments in the activity history
- **Recent Reassignment Tracking**: Counts reassignments within a configurable time window
- **Configurable Thresholds**: Set maximum allowed total and recent reassignments via openParams
- **Automatic Flag Update**: Sets `xa_pin_allowed` property based on threshold evaluation
- **No User Interaction**: Plugin processes data and closes automatically

## Configuration

### Plugin Properties

The plugin requires the following activity properties to be configured in OFS:

#### Input Properties
| Property | Description |
|----------|-------------|
| `aid` | Activity ID (required) |
| `routingAssignTrack` | Pipe-delimited string containing assignment history |

#### Output Properties
| Property | Description |
|----------|-------------|
| `xa_total_reassignments` | Total count of all reassignments |
| `xa_recent_reassignments` | Count of reassignments within the time threshold |
| `xa_pin_allowed` | 1 if both thresholds pass, 0 otherwise |

### Configuration Parameters (openParams)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `reassigments_total_quantity` | Maximum allowed total reassignments | 10 |
| `reassigments_recent_quantity` | Maximum allowed recent reassignments | 3 |
| `minutes_threshold` | Time window in minutes for recent reassignments | 60 |

### Example descriptor.json

```json
{
    "properties": {
        "activity": [
            "aid",
            "routingAssignTrack",
            "xa_total_reassignments",
            "xa_recent_reassignments",
            "xa_pin_allowed"
        ],
        "provider": []
    },
    "openParams": [
        {
            "name": "reassigments_total_quantity",
            "value": "10"
        },
        {
            "name": "reassigments_recent_quantity",
            "value": "3"
        },
        {
            "name": "minutes_threshold",
            "value": "60"
        }
    ]
}
```

## routingAssignTrack Format

The `routingAssignTrack` property contains pipe-delimited assignment records, with rows separated by newlines:

```
resourceExternalId|resourceName|destinationDate|destinationResourceExternalId|destinationResourceName|messageTimeOfCreation
|resourceExternalId|resourceName|destinationDate|destinationResourceExternalId|destinationResourceName|messageTimeOfCreation
```

Example:
```
US154P78|Keizers Dex|2025-12-23|DK185220|Indianapolis IN|2025-12-23 13:04:41
|US154P77|Ross Aaron|2025-12-23|AR185314|Chicago IL|2025-12-23 14:05:00
```

**Note**: The first row contains the user_login prefix, while subsequent rows start with an empty field (pipe at the beginning).

## Threshold Evaluation Logic

The plugin evaluates two conditions:

1. **Total Threshold**: `totalReassignments <= reassigments_total_quantity`
2. **Recent Threshold**: `recentReassignments <= reassigments_recent_quantity`

The `xa_pin_allowed` flag is set to:
- `1` - if **both** thresholds pass
- `0` - if **either** threshold fails

## Use Cases

### Prevent Over-Assignment
Configure low thresholds to prevent activities from being reassigned too many times, which may indicate scheduling issues.

### Detect Rapid Reassignment
Use the `minutes_threshold` to detect activities being rapidly bounced between resources, which may indicate availability conflicts.

### Quality Control
Track reassignment patterns to identify activities that may need special attention or escalation.

## Technical Requirements

- **@ofs-users/plugin**: ^1.5.2
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

### Development Build

```bash
npm run build:dev
```

## Deployment

Use the justfile commands to build and deploy:

```bash
# Build production bundle and create zip
just zip

# Upload to OFS instance
just upload
```

Or use the `@ofs-users/plugin-manager` directly:

```bash
pluginmgr --filename dist/plugin.zip upload RoutingAssignmentThreshold
```

## Limitations

- Plugin processes data instantly and closes automatically (no UI interaction)
- Datetime parsing assumes UTC timezone for `messageTimeOfCreation`
- Requires `routingAssignTrack` property to be populated by external process

## Version History

| Version | Comments                          |
|---------|-----------------------------------|
| 1.0.0   | Initial release                   |
|         | - Parse routingAssignTrack        |
|         | - Count total/recent reassignments|
|         | - Evaluate configurable thresholds|
|         | - Set xa_pin_allowed flag         |

## License

Copyright © 2022, 2023, Oracle and/or its affiliates.
Licensed under the Universal Permissive License (UPL), Version 1.0
See [LICENSE](https://oss.oracle.com/licenses/upl/)
