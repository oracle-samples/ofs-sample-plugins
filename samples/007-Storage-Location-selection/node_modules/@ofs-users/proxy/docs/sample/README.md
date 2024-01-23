## A sample Script

### Description

This script shows how to use the library to connect to an OFS instance and call the getSubscriptions API to get the list of event subscriptions

### How-To

1. Generate the javascript version of the module (`npm run dist`). A new folder called `dist` will be created, containing a javascript module (`ofs.es.js`)
2. Create in the same folder as the sample a file called `credentials_sample.json` with the following content, replacing the placeholders by your own environment data:
```
{
    "instance": "<YOUR OFS INSTANCE NAME>",
    "clientId": "<YOUR APPLICATION CLIENT ID>",
    "clientSecret": "<YOUR APPLICATION CLIENT SECRET>"
}
```
3. Run the sample. The output should be a list of the active event subscriptions in your environment
```
node sample.js
```

### Sample Output (no subscriptions)

```
{
  totalResults: 0,
  links: [
    {
      rel: 'canonical',
      href: 'https://yourinstance.fs.ocs.oraclecloud.com/rest/ofscCore/v1/events/subscriptions'
    }
  ]
}
```
