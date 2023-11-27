# PreDebrief

## Description

This plugin is designed to calculate and create default lines before switching the user
to the Debrief Screen

## Parameters

**Secure Parameters**

None

**Open Parameters**

- `laborInvType`: Value for the property invtype of the line this plugin is going to create. Default = labor
- `laborItemNumber`: Value for the property labor_item_number of the line this plugin is going to create. Default = "FS Reg Labor"
- `laborItemDesc`: Value for the property labor_item_description of the line this plugin is going to create. Default = "FS Reg Labor"
- `laborServActivity`: Value for the property labor_service_activity of the line this plugin is going to create. Default = Labor
- `debriefPluginLabel`: Label of the Debrief Plugin. Used to redirect. default = debriefing
- `thisPluginLabel`: Label of this Plugin. Used to redirect after creating the line. default = PreDebrief

**Properties needed**

`activity properties`

"appt_number",
"length",
"ETA",
"astatus",
"date",
"caddress",
"ccity",
"ccompany",
"cname",
"csign",
"cstate",
"appt_number",
"czip"

`provider properties`

"pname"
"pid"

`inventory properties`

"invpool",
"invtype",
"invid",
"inv_pid",
"invsn",
"inv_aid",
"inventory_model",
"labor_start_time",
"labor_end_time",
"labor_service_activity",
"labor_item_number",
"labor_item_desc",
"I_DEFAULT_VALUE",
"expense_amount",
"part_disposition_code",
"part_item_number",
"part_item_number_rev",
"part_item_desc",
"part_item_revision",
"part_uom_code",
"part_service_activity_returned",
"part_service_activity_used",
"expense_service_activity",
"expense_currency_code",
"expense_item_number",
"expense_item_desc",
"quantity"

## How to use

Add this plugin to the activity details screen and hide the debrief button.
Show this plugin only when the activity is started

## For development

### How to build

1. Install the dependencies

   `npm install`

2. Build and compress the plugin

   `webpack --mode=production`

3. Create the zip file that can be uploaded to OFS

   `cd dist; zip plugin.zip index.html main.js`
