# New Plugin Requirements Template

Use this document to capture the minimum information needed before creating a new sample plugin. The topics below were derived from the existing `samples/*/README.md` files and `samples/105-CrewManagement/docs/IMPLEMENTATION-PLAN.md`.

## 1. Functional Summary

- Plugin name
- Short business description
- Problem to solve
- Expected user outcome
- Whether the plugin is:
  - silent/background
  - action-only
  - screen-based
  - OJET UI

## 2. Entry Point and Invocation

- Where the plugin is launched from:
  - activity details
  - provider screen
  - inventory details
  - button
  - message scenario
  - redirect
  - wakeup/init lifecycle
- Which OFS entity context is expected:
  - activity
  - provider
  - inventory
  - resource
  - queue
- Visibility or blocking conditions for the button/action
- Whether the plugin must close automatically or keep a screen open

## 3. User Flow

- Step-by-step functional flow from open/init to completion
- User actions available on screen
- Refresh/retry behavior
- Redirect or close behavior after success
- Required back screen / redirect target
- Whether the plugin must open a form or another plugin

## 4. Data Inputs from OFS

- Required activity properties
- Required provider properties
- Required inventory properties
- Required resource properties
- Required queue/application/environment data
- Which properties are:
  - mandatory
  - optional
  - output fields to be updated

## 5. Configuration Parameters

### Secure Parameters (`securedData`)

- List every secure parameter name
- Purpose of each parameter
- Required vs optional
- Default value
- Example value

### Open Parameters (`openParams`)

- List every open parameter name
- Purpose of each parameter
- Required vs optional
- Default value
- Example value
- Whether `openParams` override secure params

## 6. External Integrations

- OFS REST APIs used
- Fusion APIs used
- Forms functionality used
- Applications/proxy usage needed
- Whether `getAccessToken` or `getAccessTokenByScope` is required
- Authentication requirements
- Required environment fields such as:
  - `environment.faUrl`
  - `environment.fsUrl`

## 7. Lifecycle Behavior

- Which plugin lifecycle methods are required:
  - `init`
  - `open`
  - `update`
  - `wakeup`
  - `close`
- Whether data must be loaded:
  - on open
  - in background during init/wakeup
  - after an update action
- Whether the plugin needs local/session cache
- Whether wakeup timing must be configurable

## 8. Business Rules and Data Processing

- Validation rules
- Mapping rules between OFS/Fusion data and UI/update payloads
- Filtering logic
- Sorting/grouping rules
- Threshold logic
- Pagination requirements
- Retry rules
- Derived/calculated values

## 9. Output and Side Effects

- OFS entities updated
- Properties updated
- Inventory/labor/debrief actions triggered
- Whether forms are opened/submitted
- Whether records are created in external systems
- Whether files/CSV/downloads are produced

## 10. User Interface Requirements

- UI type:
  - no UI
  - simple modal/page
  - OJET MVVM screen
  - table/grid
  - calendar
  - filter/search panel
- Main screen sections
- Required buttons/actions
- Empty state behavior
- Loading/progress indicators
- Error state behavior
- Mobile/responsive expectations
- Need for multi-language support

## 11. Error Handling and Logging

- User-visible error messages required
- Technical logging requirements
- Debug/verbose logging flag
- Failure behavior:
  - stop
  - retry
  - fallback
  - close and redirect

## 12. Caching and Storage

- Whether data must be stored in:
  - `localStorage`
  - session cache
  - in-memory cache
- Cache key inputs
- Cache invalidation rules
- Freshness expectations

## 13. Performance and Limits

- Expected data volume
- Pagination or chunking rules
- Max number of rows/items/forms/resources
- Time-sensitive requirements
- Whether the plugin must avoid long waits on open

## 14. Testing and Validation

- Required manual validation scenarios
- Required unit/integration tests
- Mock data or sample payloads needed
- Acceptance criteria / definition of done

## 15. Documentation Deliverables

- README topics that must be included
- Need for additional `docs/*.md`
- Configuration examples to include
- Example OFS configuration (buttons, visibility, forms, properties)

## 16. Template Selection

Choose the closest base sample before implementation:

- `samples/105-CrewManagement`
  - Use for OJET MVVM screens, richer UI, table/calendar/search patterns
- `samples/106-StockingLocations`
  - Use for Fusion API calls with `getAccessTokenByScope`
- `samples/107-FusionInitLoading`
  - Use for init/wakeup background loading and local caching

Optional additional references depending on scope:

- `samples/019-formsViewer` for configurable table/detail rendering
- `samples/020-InitDataLoading` for lifecycle-based preloading
- `samples/022-FromFormsToQuality` for form + Fusion integration
- `samples/104-OJET-MVVM` for OJET starter structure and packaging patterns

## 17. Requirements Summary Block

Before implementation starts, the final requirements summary should answer these questions in one place:

- What does the plugin do?
- Which screen/context invokes it?
- Which OFS properties are required?
- Which secure params and open params are required?
- Which APIs are called?
- Does it need OJET UI, forms, redirects, background loading, or caching?
- What are the acceptance criteria?
