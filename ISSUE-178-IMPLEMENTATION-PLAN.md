# Issue #178 — Crew Management Plugin Implementation Plan

Branch: `feature/issue-178-crew-management-plugin-plan`

## Context

Issue #178 requests a plugin that makes Crew Management more user-friendly while preserving the Oracle Fusion Field Service (OFS) out-of-the-box (OOTB) design guidance from Product Management.

From the Oracle JET getting-started guidance, this plan aligns with:

- MVVM architecture (clear separation of Model, View, ViewModel)
- Responsive, accessible UI component usage
- Validation and data-provider-driven data handling
- Event/messaging patterns and service integration

Reference: <https://docs.oracle.com/en/middleware/developer-tools/jet/17/develop/getting-started-oracle-javascript-extension-toolkit-jet.html>

## Repository Placement and Bootstrap Strategy

- The plugin will be implemented as a **new sample** under `samples/`, following the repository convention used by existing sample plugins.
- Initial draft scaffolding is created from `templates/ojet-beta` via `cookiecutter`.
- Generated sample folder for this issue: `samples/105-CrewManagement`.

Template command used (HTTPS equivalent of the provided repo template source):

```bash
cookiecutter https://github.com/oracle-samples/ofs-sample-plugins.git \
  --directory templates/ojet-beta \
  --output-dir samples \
  --no-input \
  plugin_name=105-CrewManagement
```

## Goals

1. Simplify crew creation and assignment workflows.
2. Keep functional behavior compatible with OOTB crew concepts.
3. Improve user confidence with clearer state, validation, and feedback.

## Proposed Functional Scope (MVP)

1. **Crew List & Search**
   - Display crews with key attributes.
   - Provide quick filtering/search.

2. **Crew Creation / Edit Flow**
   - Guided form for crew metadata.
   - Inline validation and explicit error messaging.
   - Save/cancel flow with unsaved-change protection.

3. **Team Work Assignment Management**
   - Assign/unassign team work to selected crew.
   - Show assignment status and conflict/error outcomes.

4. **User Feedback & Usability**
   - Consistent loading, success, and error states.
   - Accessibility-first interactions (keyboard and screen-reader-friendly labels).

## Technical Plan (Oracle JET-aligned)

### 1) App Architecture (MVVM)
- **Model**: Data services for OFS/OOTB endpoints and response mapping.
- **ViewModel**: State containers for crews, assignments, filters, and form lifecycle.
- **View**: Oracle JET components for lists, forms, dialogs, and notifications.

### 2) Data & Service Layer
- Define service methods for:
  - fetch crews
  - create/update crew
  - fetch team work assignments
  - assign/unassign team work
- Normalize API errors into a consistent UI-friendly shape.

### 3) UI Components and Interaction Model
- List screen: table/list + filter controls.
- Detail/edit panel: form inputs with validators.
- Assignment section: selectable items with action buttons.
- Feedback: non-blocking notifications and inline field messages.

### 4) Validation & Error Handling
- Required fields and format constraints at UI layer.
- Server error handling with actionable messages.
- Prevent duplicate submission while requests are in-flight.

### 5) Non-Functional Requirements
- **Accessibility**: keyboard nav, labels, focus management.
- **Responsiveness**: workable on common OFS-supported viewports.
- **Maintainability**: modular files, clear naming, and separation of concerns.

## Delivery Phases

### Phase 1 — Discovery and UX Definition
- Confirm exact crew/team work operations and constraints.
- Define user flow and wireframe-level interaction states.

### Phase 2 — Skeleton Plugin + Data Services
- Scaffold plugin structure in `samples/105-CrewManagement` using `templates/ojet-beta`.
- Implement API client/service abstractions and mock/test data pathways.

### Phase 3 — Core UI Implementation
- Build crew list and crew create/edit forms.
- Add assignment management interactions.

### Phase 4 — Hardening
- Add robust validation and error scenarios.
- Accessibility and responsive refinements.

### Phase 5 — Documentation & Handover
- Update sample/plugin README with setup and usage.
- Add validation steps for maintainers/reviewers.

## Definition of Done

- User can create and edit crews through streamlined flows.
- User can assign/unassign team work to crews with clear system feedback.
- Behavior remains aligned to OOTB crew management concepts.
- Documentation includes setup, flow description, and validation steps.
