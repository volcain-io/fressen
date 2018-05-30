import Controller from './js/_controller.js';
import DBHelper from './js/_dbhelper_promises.js';
import { startIntersectionObserver, offlineReviewSupport } from './js/_utils.js';

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  // register service worker
  const controller = new Controller();
  controller.registerServiceWorker();
  controller.loadPage();
});

window.onload = () => {
  startIntersectionObserver();
  // add offline review support
  offlineReviewSupport();
};

window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function(f) {
    return setTimeout(f, 1000 / 60);
  }; // simulate calling code 60

window.cancelAnimationFrame =
  window.cancelAnimationFrame ||
  window.mozCancelAnimationFrame ||
  function(requestID) {
    clearTimeout(requestID);
  }; //fallback
