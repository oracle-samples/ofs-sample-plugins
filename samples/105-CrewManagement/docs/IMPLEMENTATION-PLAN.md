# Crew Management Plugin — Implementation Plan (History Search Principles)

This plan uses `history_search` as the template baseline for project structure, runtime behavior, and coding standards.

## 1) Template principles to preserve

From `history_search`, keep these core principles:

1. **Clear MVVM separation**
   - `root.ts` bootstraps
   - `appController.ts` manages UI state and orchestration
   - domain modules (`orders/*` pattern) isolate parsing, service logic, types, and metadata

2. **Plugin wrapper lifecycle first**
   - extend/use `@ofs-users/plugin` flow
   - execute key load logic from `open()`
   - build proxy once credentials are available in `securedData`

3. **Service layer abstraction**
   - isolate OFS API calls behind service modules
   - map raw OFS responses into UI-ready domain objects

4. **Config-driven behavior**
   - parse runtime settings from `openParams`
   - keep defaults and validation centralized

5. **Documentation and tests as first-class artifacts**
   - maintain `docs/` runtime and technical docs
   - unit-test domain/config parsers and service mapping behavior

## 2) Proposed module layout for Crew Management

Suggested structure (mirroring `history_search` modularity):

- `src/ts/root.ts`
  - plugin bootstrap + bindings
- `src/ts/appController.ts`
  - observables, user actions, orchestration
- `src/ts/ofs-plugin-core/*`
  - plugin/proxy/model wrappers (aligned with current baseline)
- `src/ts/crew/`
  - `config.ts` (openParams + secured params parsing)
  - `cache.ts` (bucket cache/session logic)
  - `resources-service.ts` (resources + descendants retrieval)
  - `crews-service.ts` (assistant retrieval + crew correlation)
  - `calendar-mapper.ts` (transform correlated crews to calendar model)
  - `types.ts` (shared interfaces/types)
  - `metadata.ts` (optional view metadata if needed)

## 3) Runtime flow (aligned to technical details)

### Phase A — Open and initialize

1. `open()` receives activity/context/open params/secured data.
2. Parse secure params:
   - `bucketTypes`
   - `techniciansTypes`
3. Initialize OFS proxy.

### Phase B — Bucket loading and cache

1. On `open()`, attempt to load bucket cache for current browser session context.
2. If cache miss/stale, call proxy to list resources.
3. Filter resources by `bucketTypes`.
4. Store normalized bucket list in cache.
5. Render searchable Buckets list.

### Phase C — Crew retrieval after bucket selection

1. User selects Bucket.
2. User clicks “Retrieve Crews”.
3. Call `getResourceDescendants(selectedResourceId)`.
4. Filter descendants by `techniciansTypes`.
5. For each technician, call `getAllAssistants`.
6. Correlate all responses to build “who works with who” graph/model.

### Phase D — Calendar representation

1. Transform correlated crew model into calendar rows/events.
2. Render calendar view with clear grouping and legend.
3. Support refresh action that re-runs retrieval flow.

## 4) UI/UX plan (Oracle JET MVVM)

1. **Buckets screen**
   - search input + results list/table
   - selected bucket summary
   - `Refresh Buckets` action

2. **Crew action panel**
   - primary button: `Retrieve Crews`
   - loading and progress indicators
   - robust empty/error states

3. **Calendar screen/section**
   - visual representation of crew relationships
   - technician/assistant grouping
   - details drawer/panel for selected entry

4. **State & feedback**
   - explicit `idle/loading/success/error` observables
   - non-blocking messages/toasts where appropriate

## 5) Data contracts and configuration

### Secure params (required)

- `bucketTypes`: list of bucket resource types to display initially
- `techniciansTypes`: list of technician resource types for descendant filtering

### Open params (optional, recommended)

- default search behavior (e.g., placeholder/min chars)
- cache strategy toggles (if required)
- debug/logging enable flag (similar to `history_search`)

## 6) Caching strategy details

1. Maintain in-memory/session cache for bucket list.
2. Refresh triggers:
   - explicit UI refresh button
   - new browser session (`open()` on new session context)
3. Cache only normalized bucket fields needed by UI.
4. Keep cache invalidation simple and explicit (avoid silent stale merges).

## 7) Testing strategy

1. Unit tests for:
   - secure/open params parsing
   - bucket filtering by `bucketTypes`
   - descendant filtering by `techniciansTypes`
   - crew correlation algorithm
   - calendar mapping
2. Service tests with proxy mocks for success/failure branches.
3. Basic runtime/manual validation through test harness pattern (as in `history_search/tests`).

## 8) Delivery plan

1. Scaffold code layout from template baseline.
2. Implement config + types + cache first.
3. Implement resources and crew services.
4. Implement MVVM screens and interactions.
5. Add tests and docs.
6. Final validation against issue #178 requirements.

## 9) Definition of Done

- Bucket list loads from OFS resources and is filtered by secure `bucketTypes`.
- Bucket list supports flexible search and cache/refresh behavior.
- Crew retrieval works from selected bucket using descendants + assistants.
- Technician filtering uses secure `techniciansTypes`.
- Correlated crews are represented in a calendar view.
- Implementation follows Oracle JET MVVM and the `history_search` template principles.
- Technical and runtime docs are present under `docs/`.
