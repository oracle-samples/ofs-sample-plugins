# Force Start

## Description

`009-ForceStart` lets a technician start the selected activity even when it is not the next ordered activity in the route.

Before any start/suspend action, the plugin checks route queue status from the `open` payload:

- If `queue.status` is `notActivated`, it sends:
  - `method: "update"`
  - `actions: [{ entity: "queue", action: "activate_queue" }]`
- After activation, it continues with the force-start flow.
- It retries queue activation up to 3 times; if activation still fails, it redirects back without forcing updates.

## Behavior

When the queue is activated, the plugin decides actions in this order:

1. If selected activity is already `started`: close and redirect.
2. If selected activity is already non-ordered (`position_in_route = "-1"`): start it.
3. Otherwise:
   - If another activity is `started`: suspend that activity, then re-check.
   - If selected activity is next in route: start it.
   - If selected activity is not next in route: set selected activity to non-ordered (`position_in_route = "-1"`), then start it.

After successful start, the plugin closes and redirects to the configured back screen.

## Parameters

### Secure Parameters

None.

### Open Parameters

- `backScreen`: destination when plugin closes.
  - Default: `activity_by_id`
- `redirectPluginLabel`: plugin label used when `backScreen = plugin_by_label`.

## Required Open Message Data

- `queue.status`
- `activity.aid`
- `activity.astatus`
- `activity.position_in_route`
- `activityList` entries with `aid`, `astatus`, and `position_in_route`

## How To Use

Add this plugin to Activity Details for activities that technicians may need to force start.

## Development

### Build

1. Install dependencies: `npm install`
2. Build: `just pack`
3. Zip package: `just zip`

### Upload Credentials (`$HOME/.secure`)

`just upload` resolves credentials from:

- `$HOME/.secure/<env>-plugin_mgr.secret` (preferred)
- `$HOME/.secure/<env>.secret` (fallback)

Examples:

- `just upload sunrise0511`
- `just upload env=etaq-dev4`
