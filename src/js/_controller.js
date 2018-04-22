class Controller {
  constructor() {
    this._serviceWorkerURL = './../service-worker.js';
    this._serviceWorkerScope = './';
  }

  /**
   * Register ServiceWorker
   */
  registerServiceWorker() {
    if (!'serviceWorker' in navigator) return;

    navigator.serviceWorker
      .register(this._serviceWorkerURL, { scope: this._serviceWorkerScope })
      .then(reg => {
        if (!navigator.serviceWorker.controller) {
          return;
        }

        if (reg.waiting) {
          this._updateReady(reg.waiting);
          return;
        }

        if (reg.installing) {
          this._trackInstalling(reg.installing);
          return;
        }

        reg.addEventListener('updatefound', () => {
          this._trackInstalling(reg.installing);
        });
      })
      .catch(error => console.error('Failed to register ServiceWorker', error));

    // Ensure refresh is only called once
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', event => {
      if (refreshing) return;
      if (window.location.origin === document.referrer) window.location.reload();
      refreshing = true;
    });
  }

  _trackInstalling(worker) {
    worker.addEventListener('statechange', () => {
      console.log('Update state changed');
      if (worker.state === 'installed') {
        this._updateReady(worker);
      }
    });
  }

  _updateReady(worker) {
    console.log('Update ready');
    worker.postMessage({ action: 'skipWaiting' });
  }
}

export default Controller;
