importScripts("/firebase.js");

firebase.initializeApp({
    apiKey: "AIzaSyADm0cXoWcLLay-Tr7FlAEK_bCIwrHaJv4",
    authDomain: "spotlight-4d126.firebaseapp.com",
    databaseURL: "https://spotlight-4d126.firebaseio.com",
    projectId: "spotlight-4d126",
    storageBucket: "spotlight-4d126.appspot.com",
    messagingSenderId: "611970133528"
});

const messaging = firebase.messaging();
const cache_name = "v2.0";
const fine_caches = [cache_name];
const static_files = [
    "/",
    "/firebase.js",
    "/script.js",
    "/style.css",
    "/index.html",
    "/placeholder.png"
];

self.addEventListener("install", function (event) {
    self.skipWaiting();

    event.waitUntil(
        caches.open(cache_name).then(function (cache) {
            return cache.addAll(static_files);
        })
    );
});

self.addEventListener("fetch", function (event) {
    const url = new URL(event.request.url);

    if (url.origin == location.origin) {
        event.respondWith(
            caches.match(event.request).then(function (response) {
                return response || fetch(event.request);
            })
        );
    }
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            Promise.all(
                keys.map(function (key) {
                    if (!fine_caches.includes(key)) {
                        return caches.delete(key);
                    }
                })
            );
        })
    )
});