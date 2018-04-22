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
