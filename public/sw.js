
// This is a basic service worker file.

// Listen for the 'install' event.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // This will activate the service worker immediately.
  self.skipWaiting();
});

// Listen for the 'activate' event.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // This ensures that the service worker takes control of the page as soon as it's activated.
  event.waitUntil(self.clients.claim());
});

// Listen for 'fetch' events.
// This example uses a network-first strategy.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // If the network request fails (e.g., offline), you could serve a fallback page.
      // For now, we'll just let the browser's default offline page show.
      return new Response(
        'Você está offline. Verifique sua conexão com a internet.',
        { headers: { 'Content-Type': 'text/html' } }
      );
    })
  );
});
