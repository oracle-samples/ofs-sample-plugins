self.baseUrl = new URL(self.registration.scope);
self.pluginTag = "OJET-MVVM";
// const addResourcesToCache = async (resources) => {
//   //const cache = await caches.open("v1");
//   //await cache.addAll(resources);
// };

/**
 * Listener to install event of Service Worker
 */
self.addEventListener("install", (event) => {
  console.debug(`${self.pluginTag} >> `+self.baseUrl);

  /**
   * If new SW is available, e.g new code was deployed, and if there is an existing service worker available, 
   * the new version is installed in the background, but not yet activated — at this point it is called the worker in waiting. 
   * It is only activated when there are no longer any pages loaded that are still using the old service worker. 
   * As soon as there are no more pages to be loaded, the new service worker activates (becoming the active worker).
   * 
   * We use the following statement to skip waiting and proceed to activating the new SW right away.
   * We follow this skip waiting by calling the clients.claim() method in the Active event listeren.
   * 
   * More Info: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * 
   * IMPORTANT: If you usecase doesn't need this, you can comment out this line.
   */
  self.skipWaiting();
});

/**
 * SW claims and starts handleing the exisitng pages still open that were being handled by older version of SW.
 */
self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

/**
 * Adds the resource retrieved from network in the cache
 * @param {*} request 
 * @param {*} response 
 */
const putInCache = async (request, response) => {
  const cache = await caches.open(self.pluginTag);
  await cache.put(request, response);
};

/**
 * Checks the requested resource in the cache first. If found, the resource is returnd, else the resource is retrived from network, cached and returned to the requester.
 * If the resource is not in cache and network call fails, then an error is returned.
 * This is helpful for resources that don't change often, e.g. CDN or other static resources
 * @param {*} request 
 * @returns 
 */
const cacheFirst = async (request) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  // if not in cache, try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request);
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    //network is down and resource not in cache
    // return a Response object
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

/**
 * Tries to retrive the requested resource from the network first. If found, the cache is updated and resource is returned to the requester.
 * If Network isn't accessible or anyother error occurs, the it looks for the resource in cache and returns it. 
 * If the resource is not in the cache either, then an error is returned.
 * This is helpful where resources might change frequently ro are preferred to be fetched from network always. This keeps the resources updated in cache and always serves latest contents when possible.
 * @param {*} request 
 * @returns 
 */
const networkFirst = async (request) => {
    
  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request);
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    //network error happened. fatched from cache.
    console.log("Network error happened. Retrieving resource from cache.")
    return await caches.match(request);
  }
};

/**
 * Intercepts outgoing calls made by the application that fall under this Service Workers scope and allows us to handle the requests.
 * We control which requests should be intercepted and handled specially or ignored and let them proceed usually.
 * For Example: we only want to check and cache the GET requests and not any other requests, hence we put a check in the function's body on request.Method === 'GET'.
 * 
 * IMPORTANT: Some of the GET calls can be data fetches and should be cached. Such requests can be marked by adding a dummy url parameter "ignoreChache".
 * Developers need to make sure such calls aren't intercepted by the SW.
 * This method checkes the parameter and let such requests pass through.
 */
self.addEventListener("fetch", (event) => {
  //intecept and cache only get requests
  if (!("GET" !== event.request.method || /ignoreCache=/.test(event.request.url))){
    if( self.baseUrl.toString() === event.request.url || /\/js\/bundle\.js/.test(event.request.url) || /index\.html/.test(event.request.url)){
      console.debug("Network Fist >> "+event.request.url);
      event.respondWith(networkFirst(event.request));
    }
    else{
      console.debug("Cache Fist >> "+event.request.url);
      event.respondWith(
        cacheFirst(event.request)
      );
    }
  }
});
