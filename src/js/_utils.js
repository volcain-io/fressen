import Restaurant from './restaurant.js';
import RestaurantList from './index.js';

/**
 * Get a parameter by name from page URL.
 */
export const getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Get id of element
 */
export const getId = elem => {
  const neighborhood = 'neighborhood-';
  const cuisine = 'cuisine-';
  const restaurant = 'restaurant-';
  const favorite = 'favorite-';
  if (elem) {
    if (elem.id) {
      if (elem.id.startsWith(neighborhood)) return elem.id.replace(neighborhood, '');
      if (elem.id.startsWith(cuisine)) return elem.id.replace(cuisine, '');
      if (elem.id.startsWith(restaurant)) return elem.id.replace(restaurant, '');
      if (elem.id.startsWith(favorite)) return elem.id.replace(favorite, '');

      return getId(elem.parentElement);
    }
    return getId(elem.parentElement);
  }
  return -1;
};

export const loadInstance = page => {
  switch (page) {
    case 'restaurant':
      new Restaurant();
      break;
    default:
      new RestaurantList();
  }
};

export const loadMap = () => {
  const elemMap = document.getElementById('map');
  if (elemMap) {
    if (typeof google === 'undefined') {
      const h3 = document.createElement('h3');
      h3.classList.add('error');
      h3.textContent = 'Google Maps not available';
      elemMap.appendChild(h3);
    } else {
      const loc = {
        lat: 40.722216,
        lng: -73.987501
      };
      return new google.maps.Map(elemMap, {
        zoom: 12,
        center: loc,
        scrollwheel: false
      });
    }
  }
  return null;
};

export const loadImage = image => {
  const srcset = image.dataset.srcset;
  const split = srcset.split(',');
  const src =
    window.devicePixelRatio === 1 ? split[0].replace(' 1x', '') : split[1].replace(' 2x', '');
  fetchImage(src).then(() => {
    image.src = src;
  });
};

export const fetchImage = url => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = resolve;
    image.onerror = reject;
  });
};

export const handleIntersection = (entries, observer) => {
  entries.forEach(function(entry) {
    // in viewport?
    if (entry.intersectionRatio > 0) {
      // stop watching
      observer.unobserve(entry.target);
      // load image
      loadImage(entry.target);
    }
  });
};

export const startIntersectionObserver = () => {
  /**
   * Lazy loading images via Intersection Observer
   */
  const options = {
    rootMargin: '0px',
    threshold: [0.1]
  };
  const observer = new IntersectionObserver(handleIntersection, options);
  // get all images we are watching
  const images = document.querySelectorAll('img.restaurant-img');
  images.forEach(img => {
    // watch image
    observer.observe(img);
  });
};

/**
 * Restaurant page URL.
 */
export const urlForRestaurant = id => `./restaurant.html?id=${id}`;

/**
 * Calculate rating by reviews
 */
export const calculateRatingByReviews = reviews => {
  if (reviews) {
    let rating = reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length;
    return rating.toFixed(1);
  }
  return '-';
};

/**
 * Get operating hours of current weekday
 */
export const getOperatingHours = operatingHours => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (operatingHours) {
    const d = new Date();
    const hours = operatingHours[days[d.getDay()]];
    return hours.replace(',', ' &');
  }
  return 'N.A.';
};

export const convertUnixTimeStampToHuman = unixTimeStamp => {
  if (Number.isInteger(unixTimeStamp)) {
    return new Date(unixTimeStamp).toLocaleString();
  }

  return new Date().toLocaleString();
};

/**
 * Map marker for a restaurant.
 */
export const mapMarkerForRestaurant = (restaurant, map) => {
  if (typeof google === 'undefined') {
    return null;
  } else {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: urlForRestaurant(restaurant.id),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
};

/**
 * Enables the ability to add reviews while offline and sync with server when online again.
 * Works just with the 'Offline' flag in the DevTools
 */
export const offlineReviewSupport = () => {
  // flag needed to prevent the first run when online
  let firstRun = navigator.onLine;

  function backOnline() {
    if (firstRun) return;
    // update reviews when online again
    const _dbHelper = new DBHelper();
    _dbHelper.updateReviews().then(() => {
      firstRun = !firstRun;
    });
  }

  function goneOffline() {
    firstRun = !firstRun;
  }

  window.addEventListener('online', backOnline);
  window.addEventListener('offline', goneOffline);
};
