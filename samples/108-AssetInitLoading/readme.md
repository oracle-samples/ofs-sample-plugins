# Asset Init Loading Plugin

Oracle Field Service plugin built with Oracle JET MVVM and Redwood styling. This sample preloads installed base assets for the currently logged-in OFS user during the `init` and `wakeup` lifecycle so the latest asset snapshot is available from cache when the user is offline.

## Functional Flow

1. `init()` persists runtime configuration and schedules a wakeup.
2. `wakeup()` requests a Fusion Applications access token through OFS `getAccessTokenByScope` using the uppercase environment name.
3. The plugin requests a separate Field Service access token through `getAccessTokenByScope` using the `field-service-common/use` scope.
4. The plugin creates an OFS proxy with `environment.fsUrl`, calls `getUserDetails(user.ulogin)`, and retries the same call with `alternativeUrl` if the original call fails.
5. The plugin calls `getResource(mainResourceId)` and reads `mwo_resource_orgid` from that resource response.
6. The plugin calls `/fscmRestApi/resources/11.13.18.05/installedBaseAssets` on `environment.faUrl` with `OperatingOrganizationId`.
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
- `alternativeUrl`
  - Optional.
  - Alternative FusionFS base URL used only when `getUserDetails(user.ulogin)` fails against `environment.fsUrl`.
  - Defaults to `https://plugins-0-etaq-dev4.fs.ocs.oraclecloud.com`.
- `title`, `subtitle`, `emptyStateMessage`
  - Optional display strings for the UI.
- `enableLogging`
  - Optional runtime logging flag.
- `WAKEUP_DELAY`
  - Optional timer in seconds before `wakeup()` executes.

## URL and Scope Selection

This sample can invoke both Fusion Field Service / FusionFS APIs and Fusion Applications APIs. Each URL family requires the matching token scope.

| API call | URL source | Token scope |
|----------|------------|-------------|
| `OFS.getUserDetails(user.ulogin)` | `environment.fsUrl`, then `alternativeUrl` if it fails | `urn:opc:resource:fusion:${environment.environmentName.toLowerCase()}:field-service-common/use` |
| `OFS.getResource(mainResourceId)` | `environment.fsUrl` | `urn:opc:resource:fusion:${environment.environmentName.toLowerCase()}:field-service-common/use` |
| Direct `fetch()` to `assetsPath` | `environment.faUrl` unless `assetsPath` is already a full URL | `${environment.environmentName.toUpperCase()}` |

For FusionFS / `fsUrl` calls, the Field Service scope is:

```text
urn:opc:resource:fusion:${environment.environmentName.toLowerCase()}:field-service-common/use
```

For Fusion Applications / `faUrl` calls, the Fusion Applications scope is:

```text
${environment.environmentName.toUpperCase()}
```

For example, `environment.environmentName = "etaq-dev4"` creates:

```text
fsUrl scope: urn:opc:resource:fusion:etaq-dev4:field-service-common/use
faUrl scope: ETAQ-DEV4
```

## Required Context

- `environment.fsUrl`
- `environment.faUrl`
- `environment.environmentName`
- `user.ulogin`

The plugin does not expect `provider.mwo_resource_orgid` in init or wakeup data. It always resolves that value through `getUserDetails(user.ulogin)` followed by `getResource(mainResourceId)`.

See "URL and Scope Selection" for the `fsUrl` and `faUrl` scope rules used by this sample.

## Example `securedData`

```json
{
  "title": "Asset Init Loading",
  "subtitle": "Background-loaded installed base assets cached for offline use",
  "pageLimit": "500",
  "alternativeUrl": "https://plugins-0-etaq-dev4.fs.ocs.oraclecloud.com",
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
