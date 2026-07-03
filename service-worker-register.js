if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/Car-game/service-worker.js')
    .then(reg => console.log('Service Worker registered'))
    .catch(err => console.log('SW registration failed:', err));
}
