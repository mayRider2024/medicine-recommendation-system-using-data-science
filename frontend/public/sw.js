// CureAI Service Worker for PWA Add to Home Screen support
const CACHE_NAME = 'cureai-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle normal requests
});
