// This is a basic service worker file.
// It's required for a web app to be considered a PWA and be installable.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // The service worker is being installed.
  // You can pre-cache assets here if needed.
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // The service worker is being activated.
  // Clean up old caches here.
});

self.addEventListener('fetch', (event) => {
  // This event fires for every network request.
  // A common strategy is "cache-first" or "network-first".
  // For this basic setup, we'll just let the network handle it.
  event.respondWith(fetch(event.request));
});
