if ('function' === typeof importScripts) {
  importScripts('/assets/js/vendor/idb.min.js');
  importScripts('/assets/js/db.js');
  addEventListener('message', onMessage);

  function onMessage(e) {
    // Todo:
  }
}

var GOOGLE_FONT_URL = 'https://fonts.gstatic.com';
var CACHE_STATIC_NAME = 'metro-static_v6';
var CACHE_DYNAMIC_NAME = 'metro-dynamic_v6';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  // '/favicon.ico',
  '/assets/js/vendor/es6-promise.min.js',
  '/assets/js/vendor/fetch.js',
  '/assets/js/vendor/jquery.easy-autocomplete.min.js',
  '/assets/js/vendor/idb.min.js',
  '/assets/js/vendor/jquery-3.2.1.min.js',
  '/assets/js/db.js',
  '/assets/js/utils.js',
  '/assets/js/main.js',
  '/assets/css/bootstrap.min.css',
  '/assets/css/easy-autocomplete.min.css',
  '/assets/css/main.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,700italic,400,300,700',
  'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.11/handlebars.js',
  'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.1/moment.min.js',
  'https://code.jquery.com/jquery-3.2.1.min.js',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function (cache) {
        console.log('[SW] Precaching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(function (e) {
        console.error('[SW] Precaching Error!', e);
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            // Removing old cache
            return caches.delete(key);
          }
        }));
    }));
  return self.clients.claim();
});

function isIncluded(string, array) {
  var path;
  if (string.indexOf(self.origin) === 0) {
    // request for same domain (i.e. NOT a CDN)
    path = string.substring(self.origin.length);
  } else {
    // for CDNs
    path = string;
  }
  return array.indexOf(path) > -1;
}

var isGoogleFont = function (request) {
  return request.url.indexOf(GOOGLE_FONT_URL) === 0;
};

var cacheGFonts = function (request) {
  return fetch(request)
    .then(function (newRes) {
      caches
        .open(CACHE_DYNAMIC_NAME)
        .then(function (cache) {
          cache.put(request, newRes);
        });
      return newRes.clone();
    });
};

self.addEventListener('fetch', function (event) {
  var request = event.request;
  // cacheOnly for statics assets
  if (isIncluded(request.url, STATIC_ASSETS)) {
    event.respondWith(caches.match(request));
  }
  // Runtime or Dynamic cache for google fonts
  if (isGoogleFont(request)) {
    event.respondWith(
      caches.match(request)
        .then(function (res) {
          return res || cacheGFonts(request);
        })
    );
  }
});
