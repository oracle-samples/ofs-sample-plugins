# Asset Init Loading Plugin

Oracle Field Service plugin built with Oracle JET MVVM and Redwood styling. This sample preloads installed base assets for the currently logged-in OFS user during the `init` and `wakeup` lifecycle so the latest asset snapshot is available from cache when the user is offline.

## Functional Flow

1. `init()` persists runtime configuration and schedules a wakeup.
2. `wakeup()` requests a scoped token through OFS `getAccessTokenByScope`.
3. The plugin creates a custom OFS proxy with that token and `environment.fsUrl`.
4. The proxy calls `getUserDetails(user.ulogin)` to resolve the current user's `mainResourceId`.
5. The proxy calls `getResource(mainResourceId)` and reads `mwo_resource_orgid`.
6. The plugin calls `/fscmRestApi/resources/11.13.18.05/installedBaseAssets` on `environment.faUrl` using `OperatingOrganizationCode=mwo_resource_orgid`.
7. The resulting assets are flattened and stored in `localStorage`.
8. `open()` renders the latest cached snapshot immediately and exposes diagnostics for the last OFS/Fusion calls.

## Runtime Configuration

The plugin reads its runtime configuration from `securedData`. Supported keys:

- `assetsPath`
  - Optional.
  - Defaults to `/fscmRestApi/resources/11.13.18.05/installedBaseAssets`.
- `pageLimit`
  - Optional.
  - Default page size for the Fusion asset request.
- `title`, `subtitle`, `emptyStateMessage`
  - Optional display strings for the UI.
- `enableLogging`
  - Optional runtime logging flag.
- `WAKEUP_DELAY`
  - Optional timer in seconds before `wakeup()` executes.

## Required Context

- `environment.fsUrl`
- `environment.faUrl`
- `user.ulogin`

The OFS scope value is derived from the first hostname segment in `environment.fsUrl`.

Example:

- `https://ETAQ-DEV4.fs.ocs.oraclecloud.com` -> `ETAQ-DEV4`

## Example `securedData`

```json
{
  "title": "Asset Init Loading",
  "subtitle": "Background-loaded installed base assets cached for offline use",
  "pageLimit": "500",
  "enableLogging": "true",
  "WAKEUP_DELAY": "15"
}
```

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

Package the OFS zip:

```bash
just package
```
