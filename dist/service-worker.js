"use strict";var CACHE_VERSION=5,STATIC_CACHE_NAME="fressen-static-v"+CACHE_VERSION,CONTENT_IMGS_CACHE="fressen-content-imgs",ALL_CACHES=[STATIC_CACHE_NAME,CONTENT_IMGS_CACHE],GOOGLE_MAP_API_KEY="AIzaSyBni5ZJUEvoGfyJO2yCNTbDW9B2eIs1pDE";self.addEventListener("install",function(e){var c=[".","./index.html","./restaurant.html","./css/index.css","./css/restaurant.css","./css/restaurant-min-600px.css","./css/restaurant-min-850px.css","./css/restaurant-min-1000px.css","./app.bundle.js"],o=["https://polyfill.io/v2/polyfill.min.js?features=IntersectionObserver","https://maps.googleapis.com/maps/api/js?key=AIzaSyBni5ZJUEvoGfyJO2yCNTbDW9B2eIs1pDE&libraries=places&callback=initMap"];e.waitUntil(caches.open(STATIC_CACHE_NAME).then(function(n){n.addAll(c);var e=function(e){var t=new Request(e,{mode:"no-cors"});fetch(t).then(function(e){n.put(t,e)}).catch(function(){console.error("Fetching request failed: "+t)})},t=!0,s=!1,r=void 0;try{for(var i,a=o[Symbol.iterator]();!(t=(i=a.next()).done);t=!0){e(i.value)}}catch(e){s=!0,r=e}finally{try{!t&&a.return&&a.return()}finally{if(s)throw r}}}))}),self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(e){return Promise.all(e.filter(function(e){return e.startsWith(STATIC_CACHE_NAME)&&!ALL_CACHES.includes(e)}).map(function(e){caches.delete(e)}))}))}),self.addEventListener("fetch",function(t){var e=new URL(t.request.url);if(e.origin===location.origin){if(e.pathname.includes("restaurant.html"))return void t.respondWith(caches.match("./restaurant.html"));if(e.pathname.includes("/img"))return void t.respondWith(_servePhoto(t.request))}e.href.includes("key="+GOOGLE_MAP_API_KEY)?t.respondWith(_serveMap(t.request)):t.respondWith(caches.match(t.request).then(function(e){return e||fetch(t.request)}))});var _serveMap=function(e){return fetch(e).catch(function(){return new Response("initMap();")})},_servePhoto=function(n){var s=n.url.replace(/(-small)*(@2x)*\.jpg$/,"");return caches.open(CONTENT_IMGS_CACHE).then(function(t){return t.match(s).then(function(e){return e||fetch(n).then(function(e){return t.put(s,e.clone()),e}).catch(function(){console.error("Fetching request failed: "+n)})})})};self.addEventListener("message",function(e){"skipWaiting"===e.data.action&&self.skipWaiting()});
//# sourceMappingURL=service-worker.js.map
