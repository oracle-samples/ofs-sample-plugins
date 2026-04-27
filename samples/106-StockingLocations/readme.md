# Stocking Locations Plugin

Oracle Field Service plugin built with Oracle JET MVVM and Redwood styling. This first iteration focuses on browsing service logistics stocking locations from Fusion using the Maintenance Technician Subinventories REST API.

Current scope:

- request a Fusion access token through OFS `getAccessTokenByScope`
- load all technician subinventories from `technicianSubinventories` using `limit=500`
- continue paging while `hasMore` is `true`
- render the results in an OJET table
- filter the loaded rows dynamically with client-side search

## Secure Parameters

The plugin reads these secure params from `securedData`:

- `scope`: Fusion scope used for `getAccessTokenByScope`
- `enableLogging`: set to `true` to enable verbose console logging

The Fusion host comes from the OFS open message:

- `environment.faUrl`

## Plugin Context

The plugin requests OFS `provider` properties:

- `pid`
- `pname`

The current provider is shown in the header for context, but this phase does not yet change technician assignments.

## Development

Install dependencies:

```bash
npm install
```

Run a full TypeScript check:

```bash
npm run typecheck
```

Build the release bundle:

```bash
npm run build
```

The Oracle JET release output is generated in `web/`, and `plugin_descriptor.json` packages the built `web/` assets for OFS.
