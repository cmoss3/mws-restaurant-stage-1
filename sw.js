class browserDB {

    constructor() {
        this.indexedDB = ServiceWorkerGlobalScope.indexedDB;
    }

    /*
     * Open database and set callbacks
     */
    access(success) {
        this.open = this.indexedDB.open("RestaurantReviewApp", 1);
        this.open.onupgradeneeded = () => {
            let db = this.open.result;
            db.createObjectStore("RestaurantReviewApp");
        };
        this.open.onsuccess = () => {
            let db = this.open.result;
            let tx = db.transaction("RestaurantReviewApp", "readwrite");
            let store = tx.objectStore("RestaurantReviewApp");
            this.successCallback(store);
            tx.oncomplete = function() {
                db.close();
            };
        };
        this.successCallback = success;
    }

}

let dbInstance = null;
const syncStore = {};
const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = [
    '/',
    '/css/styles.min.css',
    '/js/common.js',
    '/js/browserDB.js',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/index.html',
    '/restaurant.html',
    'https://png.icons8.com/color/50/000000/filled-star.png',
    'https://png.icons8.com/color/50/000000/star.png'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', function (event)
{
    dbInstance = new browserDB();
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
    switch(event.data.type) {
        case 'sync':
            const id = '_' + Math.random().toString(36).substr(2, 9);
            syncStore[id] = event.data;
            self.registration.sync.register(id);
            break;
    }
});

self.addEventListener('sync', function(event) {
    console.log('Sending postponed data to server...');
    const {url, options} = syncStore[event.tag];
    event.waitUntil(fetch(url, options).then(() => delete syncStore[event.tag]));
});

self.addEventListener('fetch', function(event) {
    if (event.request.url.match('/reviews') || event.request.method.toLowerCase() === 'post') {
      return;
    }
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {

                if (response) {
                    return response;
                }

                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function(response) {

                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});