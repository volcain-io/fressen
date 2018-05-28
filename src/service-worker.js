import DBHelper from './js/_dbhelper_promises.js';

const CACHE_VERSION = 2;
const STATIC_CACHE_NAME = `fressen-static-v${CACHE_VERSION}`;
const CONTENT_IMGS_CACHE = 'fressen-content-imgs';
const GOOGLE_MAP_API_KEY = 'AIzaSyBni5ZJUEvoGfyJO2yCNTbDW9B2eIs1pDE';
const _dbHelper = new DBHelper();

self.addEventListener('install', event => {
  const urlsToPrefetch = [
    '.',
    './index.html',
    './restaurant.html',
    './css/index.css',
    './css/restaurant.css',
    './css/restaurant-min-600px.css',
    './css/restaurant-min-850px.css',
    './css/restaurant-min-1000px.css',
    './img/placeholder.png',
    './img/cuisines/american.svg',
    './img/cuisines/asian.svg',
    './img/cuisines/mexican.svg',
    './img/cuisines/pizza.svg',
    './img/material-icons/back.svg',
    './img/material-icons/directions.svg',
    './img/material-icons/favorite-border-red.svg',
    './img/material-icons/favorite-border-white.svg',
    './img/material-icons/favorite-red.svg',
    './img/material-icons/favorite-white.svg',
    './img/material-icons/portrait.svg',
    './img/material-icons/restaurant.svg',
    './img/neighborhoods/brooklyn.svg',
    './img/neighborhoods/manhattan.svg',
    './img/neighborhoods/queens.svg',
    './app.bundle.js'
  ];
  const foreignUrlsToPrefetch = [
    'https://polyfill.io/v2/polyfill.min.js?features=IntersectionObserver',
    `https://maps.googleapis.com/maps/api/js?key=AIzaSyBni5ZJUEvoGfyJO2yCNTbDW9B2eIs1pDE&libraries=places&callback=initMap`
  ];

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      cache.addAll(urlsToPrefetch);

      for (let foreignUrlToPrefetch of foreignUrlsToPrefetch) {
        const request = new Request(foreignUrlToPrefetch, { mode: 'no-cors' });
        fetch(request)
          .then(response => {
            cache.put(request, response);
          })
          .catch(() => {
            console.error(`Fetching request failed: ${request.url}`);
          });
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(
            cacheName =>
              !(cacheName.startsWith(STATIC_CACHE_NAME) || cacheName.startsWith(CONTENT_IMGS_CACHE))
          )
          .map(cacheName => {
            caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  let requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin && requestUrl.port === location.port) {
    if (requestUrl.pathname.includes('restaurant.html')) {
      event.respondWith(caches.match('./restaurant.html'));
      return;
    }
    if (requestUrl.pathname.includes('/img/restaurant')) {
      event.respondWith(_servePhoto(event.request));
      return;
    }
  }
  if (requestUrl.href.includes(`key=${GOOGLE_MAP_API_KEY}`)) {
    event.respondWith(_serveMap(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

const _serveMap = request => {
  return fetch(request).catch(() => new Response(`initMap();`));
};

const _servePhoto = request => {
  const storageUrl = request.url.replace(/(-small)*(@2x)*\.jpg$/, '');

  return caches.open(CONTENT_IMGS_CACHE).then(cache => {
    return cache.match(storageUrl).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          cache.put(storageUrl, response.clone());
          return response;
        })
        .catch(() => {
          console.error(`Fetching request failed: ${request}`);
        });
    });
  });
};

self.addEventListener('message', event => {
  if (!event.data) return;

  switch (event.data) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
    default:
      // NOOP
      break;
  }
});

self.addEventListener('sync', function(event) {
  if (!event.tag) return;

  switch (event.tag) {
    case 'syncIndexedDB':
      event.waitUntil(_dbHelper.updateReviews());
      break;
    default:
      // NOOP
      break;
  }
});
