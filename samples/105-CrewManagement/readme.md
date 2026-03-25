# Crew Management Plugin

Oracle Field Service plugin built with Oracle JET MVVM and Redwood styling. The plugin opens in activity context and provides a crew-focused workflow:

- load and search buckets
- select a bucket and retrieve crew relationships
- render technician/assistant relationships in a calendar-ready table

## Open Parameters

The plugin reads optional `openParams` values when OFS opens it:

- `enableLogging`
  - Enables additional runtime logs.
  - Supported truthy values: `true`, `1`, `yes`, `on`
  - Default: `false`

## Secure Parameters

The plugin reads secure params from `securedData`:

- `bucketTypes`: list of bucket resource types to show
- `techniciansTypes`: list of technician resource types to keep when building crews

## Development

Install dependencies:

```bash
npm install
```

Run the TDD suite:

```bash
npm test
```

Run a full TypeScript check:

```bash
npm run typecheck
```

Build the release bundle:

```bash
npm run build
```

The Oracle JET release output is generated in `web/`, and the OFS plugin descriptor lives at `plugin_descriptor.json`.
