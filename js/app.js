/**
 * Register ServiceWorker
 */
_registerServiceWorker = () => {
  if (!'serviceWorker' in navigator) return;

  const serviceWorkerURL =
    location.origin === 'https://volcain-io.github.io' ? '/fressen/sw.js' : '../sw.js';
  const serviceWorkerScope = location.origin === 'https://volcain-io.github.io' ? '/fressen/' : '/';
  navigator.serviceWorker
    .register(serviceWorkerURL, { scope: serviceWorkerScope })
    .then(reg => {
      if (!navigator.serviceWorker.controller) {
        return;
      }

      if (reg.waiting) {
        _updateReady(reg.waiting);
        return;
      }

      if (reg.installing) {
        _trackInstalling(reg.installing);
        return;
      }

      reg.addEventListener('updatefound', () => {
        _trackInstalling(reg.installing);
      });
    })
    .catch(() => console.log('Failed to register ServiceWorker'));

  // Ensure refresh is only called once
  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', event => {
    if (refreshing) return;
    if (window.location.origin === document.referrer) window.location.reload();
    refreshing = true;
  });
};

_trackInstalling = worker => {
  worker.addEventListener('statechange', () => {
    console.log('Update state changed');
    if (worker.state === 'installed') {
      _updateReady(worker);
    }
  });
};

_updateReady = worker => {
  console.log('Update ready');
  worker.postMessage({ action: 'skipWaiting' });
};

_registerServiceWorker();
