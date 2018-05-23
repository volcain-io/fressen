import Controller from './js/_controller.js';
import { initRestaurant, initRestaurantList, startIntersectionObserver } from './js/_utils.js';

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  const controller = new Controller();
  controller.registerServiceWorker();
});

window.initMap = () => {
  location.pathname === '/restaurant.html' ? initRestaurant() : initRestaurantList();
};

window.onload = () => {
  startIntersectionObserver();
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
