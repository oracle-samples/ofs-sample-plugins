# Fusion Init Loading Plugin

Oracle Field Service plugin built with Oracle JET MVVM and Redwood styling. This sample combines two patterns:

- background retrieval during the `init` / `wakeup` lifecycle
- Fusion REST calls authenticated with OFS `getAccessTokenByScope`

The plugin reads its runtime configuration from `securedData` and uses it to refresh Fusion data in the background. When the user opens the plugin, it renders the latest cached snapshot immediately in an OJET table.

## Runtime Configuration

The plugin reads the Fusion target from `securedData`. Supported keys:

- `fusionPath`
  - Required.
  - Fusion resource path or full URL to call.
  - Examples:
    - `technicianSubinventories`
    - `/inventoryOnHandBalances`
    - `/fscmRestApi/resources/11.13.18.05/technicianSubinventories`

- `fusionQuery`
  - Optional.
  - Query string or JSON object string appended to the request.
  - Examples:
    - `limit=200&onlyData=true`
    - `{"limit":200,"q":"OrganizationCode=V1"}`
    - `q=OperatingOrganizationId=${provider.mwo_resource_orgid}`

- `itemsPath`
  - Optional.
  - Dot path to the array inside the Fusion response when the payload does not use the default `items` property.

- `pageLimit`
  - Optional.
  - Default page size used when the request does not already define `limit`.

- `title`, `subtitle`, `emptyStateMessage`
  - Optional display strings for the UI.

- `enableLogging`
  - Optional runtime logging flag.

## How It Works

1. `init()` stores available environment, provider context, and `securedData`, then requests a wakeup.
2. `wakeup()` restores the latest saved secure runtime config, requests a Fusion token through `getAccessTokenByScope`, calls the configured Fusion endpoint, flattens the response, and stores it in `localStorage`.
3. `open()` loads the cached snapshot for the secured config and renders it instantly in the OJET table.
4. `Refresh Now` lets you force the same fetch path while the plugin is open.

## URL and Scope Selection

This sample invokes Fusion Applications APIs through `environment.faUrl`. It does not invoke Fusion Field Service / FusionFS APIs through `environment.fsUrl`.

| API call | URL source | Token scope |
|----------|------------|-------------|
| Direct `fetch()` to `fusionPath` | `environment.faUrl` unless `fusionPath` is already a full URL | `${environment.environmentName.toUpperCase()}` |

For Fusion Applications / `faUrl` calls, the access token scope is the uppercase environment name:

```text
${environment.environmentName.toUpperCase()}
```

For example, `environment.environmentName = "etaq-dev4"` creates:

```text
ETAQ-DEV4
```

If this sample is extended to call FusionFS / `fsUrl` APIs, use the FusionFS scope instead:

```text
urn:opc:resource:fusion:${environment.environmentName.toLowerCase()}:field-service-common/use
```

## Template Resolution

`fusionPath`, `fusionQuery`, `title`, `subtitle`, and `emptyStateMessage` support placeholders resolved from the saved OFS context before the Fusion request runs.

- Explicit scoped property:
  - `${provider.mwo_resource_orgid}`
- Other supported scopes:
  - `${activity.some_property}`
  - `${environment.faUrl}`
  - `${securedData.DEFAULT_FUSION_PATH}`

Example for your case:

```json
{
  "fusionPath": "/fscmRestApi/resources/11.13.18.05/installedBaseAssets",
  "fusionQuery": "",
  "itemsPath": "items",
  "title": "Installed Base Assets"
}
```

Because the config lives in `securedData`, init and wakeup can use it immediately without depending on `openParams`.

## Secure Parameters

The plugin reads these secure params from `securedData`:

- `fusionPath`
- `fusionQuery`
- `itemsPath`
- `pageLimit`
- `title`
- `subtitle`
- `emptyStateMessage`
- `enableLogging`
- `WAKEUP_DELAY`
- `DEFAULT_FUSION_PATH`
- `DEFAULT_FUSION_QUERY`
- `DEFAULT_ITEMS_PATH`
- `DEFAULT_PAGE_LIMIT`

## Environment Requirements

The Fusion host comes from OFS environment data:

- `environment.faUrl`
- `environment.environmentName`

See "URL and Scope Selection" for the `faUrl` scope rule used by this sample.

## Example `securedData`

```json
{
  "fusionPath": "/fscmRestApi/resources/11.13.18.05/installedBaseAssets",
  "fusionQuery": "",
  "itemsPath": "items",
  "title": "Installed Base Assets",
  "subtitle": "Background-loaded installed base assets",
  "enableLogging": "true"
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

The Oracle JET release output is generated in `web/`, and `plugin_descriptor.json` packages the built assets for OFS.
