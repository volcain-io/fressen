const CACHE_VERSION = 3;
const STATIC_CACHE_NAME = `fressen-static-v${CACHE_VERSION}`;
const CONTENT_IMGS_CACHE = 'fressen-content-imgs';
const ALL_CACHES = [STATIC_CACHE_NAME, CONTENT_IMGS_CACHE];

self.addEventListener('install', event => {
  const urlsToPrefetch = [
    '.',
    './index.html',
    './restaurant.html',
    './css/index.css',
    './css/main.css',
    './css/restaurant.css',
    './data/cuisine_types.json',
    './data/neighborhood_types.json',
    './data/restaurants.json',
    './js/app.js',
    './js/dbhelper.js',
    './js/main.js',
    './js/restaurant_info.js',
    'https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjxAwXjeu.woff2',
    'https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjx4wXg.woff2',
    'https://fonts.gstatic.com/s/lato/v14/S6u9w4BMUTPHh50XSwaPGR_p.woff2',
    'https://fonts.gstatic.com/s/lato/v14/S6u9w4BMUTPHh50XSwiPGQ.woff2',
    'https://fonts.gstatic.com/s/materialicons/v36/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2'
  ];
  const foreignUrlsToPrefetch = [
    'https://fonts.googleapis.com/css?family=Lato:400,900',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://maps.googleapis.com/maps/api/js?key=AIzaSyBni5ZJUEvoGfyJO2yCNTbDW9B2eIs1pDE&libraries=places&callback=initMap'
  ];

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      cache.addAll(urlsToPrefetch);

      for (urlToPrefetch of foreignUrlsToPrefetch) {
        const request = new Request(urlToPrefetch, { mode: 'no-cors' });
        fetch(request).then(response => cache.put(request, response));
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            cacheName.startsWith(STATIC_CACHE_NAME) && !ALL_CACHES.includes(cacheName);
          })
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  let requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/restaurant.html') {
      event.respondWith(caches.match('./restaurant.html'));
      return;
    }
    if (requestUrl.pathname.startsWith('/images/')) {
      event.respondWith(_servePhoto(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

_servePhoto = request => {
  const storageUrl = request.url.replace(/small_1x/, 'medium_2x');

  return caches.open(CONTENT_IMGS_CACHE).then(cache => {
    return cache.match(storageUrl).then(cached => {
      if (cached) return cached;

      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
};

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') self.skipWaiting();
});
