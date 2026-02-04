# InitDataLoading Plugin (020)

This plugin demonstrates how to retrieve resource data from OFS in the background using the init/wakeup lifecycle, making the data available before the user opens the plugin.

## What This Plugin Does

The plugin fetches property values from OFS resources (buckets) during initialization and stores them locally. When the user opens the plugin, the data is instantly available without waiting for API calls.

### Use Case

This pattern is useful when you need to:
- Pre-load configuration data stored in OFS resources
- Fetch reference data that technicians need during their work
- Cache data that doesn't change frequently to improve user experience

## Plugin Lifecycle

```
┌─────────┐     ┌────────┐     ┌───────┐     ┌──────┐
│  INIT   │────>│ SLEEP  │────>│WAKEUP │────>│ OPEN │
└─────────┘     └────────┘     └───────┘     └──────┘
     │               │              │             │
     │               │              │             │
  Store config   Wait for      Fetch data    Display
  Request wakeup  timer        from API      stored data
```

1. **Init**: Plugin receives configuration, stores it, and requests a wakeup after a delay
2. **Sleep**: Plugin waits for the configured delay
3. **Wakeup**: Plugin creates an API proxy, fetches resource data, stores it in localStorage
4. **Open**: Plugin displays the previously retrieved data to the user

## Configuration via descriptor.json

The plugin is configured using secured parameters in `descriptor.json`.

### descriptor.json Structure

```json
{
    "properties": {
        "activity": ["aid"],
        "provider": []
    },
    "securedParams": [
        {
            "name": "DATA_TO_RETRIEVE",
            "value": "<JSON configuration>"
        },
        {
            "name": "WAKEUP_DELAY",
            "value": "10"
        }
    ]
}
```

### Secured Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `DATA_TO_RETRIEVE` | Yes | JSON array defining which resources and properties to fetch |
| `WAKEUP_DELAY` | No | Seconds to wait before wakeup (default: 30) |

## Configuring DATA_TO_RETRIEVE

The `DATA_TO_RETRIEVE` parameter defines which OFS resources (buckets) to query and which properties to extract.

### Format

```json
[
    {
        "bucket_name": "<resourceId>",
        "properties_to_fetch": ["<property1>", "<property2>", ...]
    }
]
```

| Field | Description |
|-------|-------------|
| `bucket_name` | The `resourceId` of the OFS resource to retrieve |
| `properties_to_fetch` | Array of property labels to extract from the resource |

### Single Resource Example

To fetch two properties (`PA_DATA_01` and `PA_DATA_02`) from a resource called `my_data_bucket`:

```json
{
    "name": "DATA_TO_RETRIEVE",
    "value": "[{\"bucket_name\": \"my_data_bucket\", \"properties_to_fetch\": [\"PA_DATA_01\", \"PA_DATA_02\"]}]"
}
```

### Multiple Resources Example

To fetch data from multiple resources:

```json
{
    "name": "DATA_TO_RETRIEVE",
    "value": "[{\"bucket_name\": \"config_bucket\", \"properties_to_fetch\": [\"threshold\", \"max_value\"]}, {\"bucket_name\": \"reference_data\", \"properties_to_fetch\": [\"lookup_table\", \"version\"]}]"
}
```

Formatted for readability (the actual value must be a single-line escaped JSON string):

```json
[
    {
        "bucket_name": "config_bucket",
        "properties_to_fetch": ["threshold", "max_value"]
    },
    {
        "bucket_name": "reference_data",
        "properties_to_fetch": ["lookup_table", "version"]
    }
]
```

## Complete descriptor.json Example

```json
{
    "properties": {
        "activity": ["aid"],
        "provider": []
    },
    "securedParams": [
        {
            "name": "DATA_TO_RETRIEVE",
            "value": "[{\"bucket_name\": \"my_data_bucket\", \"properties_to_fetch\": [\"PA_DATA_01\", \"PA_DATA_02\"]}]"
        },
        {
            "name": "WAKEUP_DELAY",
            "value": "10"
        }
    ]
}
```

This configuration will:
1. Wait 10 seconds after initialization
2. Fetch the resource with `resourceId = "my_data_bucket"`
3. Extract properties `PA_DATA_01` and `PA_DATA_02`
4. Store the values in localStorage for display when opened

## Building the Plugin

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

## Dependencies

- `@ofs-users/plugin`: ^1.5.2 - OFS plugin base class
- `@ofs-users/proxy`: ^1.27.0 - OFS REST API proxy

## License

Copyright 2022, 2023, Oracle and/or its affiliates.
Licensed under the Universal Permissive License (UPL), Version 1.0.
