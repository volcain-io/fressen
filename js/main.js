let restaurants, neighborhoods, cuisines;
let map;
let markers = [];
let selectedNeighborhoodId = -1;
let selectedCuisineId = -1;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

/**
 * Get id of element
 */
getId = elem => {
  const neighborhood = 'neighborhood-';
  const cuisine = 'cuisine-';
  const restaurant = 'restaurant-';
  if (elem) {
    if (elem.id) {
      if (elem.id.startsWith(neighborhood)) return elem.id.replace(neighborhood, '');
      if (elem.id.startsWith(cuisine)) return elem.id.replace(cuisine, '');
      if (elem.id.startsWith(restaurant)) return elem.id.replace(restaurant, '');

      return getId(elem.parentElement);
    }
    return getId(elem.parentElement);
  }
  return -1;
};

/**
 * Toggle selection state to mark the current selected card and update id
 */
updateSelection = (elem, category = 'neighborhood') => {
  // get new selection
  id = getId(elem);
  // we have to toggle the selection
  if (id && id != -1) {
    const cElem = document.getElementById(`${category}-${id}`);
    const cList = cElem.classList;
    cList.toggle('selected');
    // remove old selection
    const oldId = category === 'neighborhood' ? selectedNeighborhoodId : selectedCuisineId;
    if (oldId && oldId != -1 && oldId != id) {
      const oldElem = document.getElementById(`${category}-${oldId}`);
      oldElem.classList.remove('selected');
      oldElem.setAttribute('aria-selected', 'false');
    }
    cList.contains('selected')
      ? cElem.setAttribute('aria-selected', 'true')
      : cElem.setAttribute('aria-selected', 'false');
    id = cList.contains('selected') ? id : -1;
  }

  return id;
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      fillNeighborhoodsHTML(neighborhoods);
    }
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      fillCuisinesHTML(cuisines);
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = neighborhoods => {
  const template = document.getElementById('neighborhood-template').innerHTML;

  let listHtml = '';
  for (let n of neighborhoods) {
    // fill template with data
    listHtml += template
      .replace(/{id}/g, n.id)
      .replace(/{name}/g, n.name)
      .replace(/{icon}/g, n.icon)
      .replace(/{altText}/g, n.altText);
  }

  // set list
  const neighborhoodList = document.getElementById('neighborhoods');
  neighborhoodList.innerHTML = listHtml;

  // add event listeners
  neighborhoodList.addEventListener('click', event => {
    event.preventDefault();

    if (!event.target.classList.contains('horizontal-scrolling')) {
      // set background color and update selection id
      selectedNeighborhoodId = updateSelection(event.target, 'neighborhood');

      updateRestaurants();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = cuisines => {
  const template = document.getElementById('cuisine-template').innerHTML;

  let listHtml = '';
  for (let c of cuisines) {
    // fill template with data
    listHtml += template
      .replace(/{id}/g, c.id)
      .replace(/{name}/g, c.name)
      .replace(/{icon}/g, c.icon)
      .replace(/{altText}/g, c.altText);
  }

  // set list
  const cuisineList = document.getElementById('cuisines');
  cuisineList.innerHTML = listHtml;

  // add event listeners
  cuisineList.addEventListener('click', event => {
    event.preventDefault();

    if (!event.target.classList.contains('horizontal-scrolling')) {
      // set background color and update selection id
      selectedCuisineId = updateSelection(event.target, 'cuisine');

      updateRestaurants();
    }
  });
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = restaurants => {
  const template = document.getElementById('restaurant-template').innerHTML;

  let listHtml = '';
  for (let r of restaurants) {
    const rating = DBHelper.calculateRatingByReviews(r.reviews);
    const operatingHours = DBHelper.getOperatingHours(r.operating_hours);

    // fill template with data
    listHtml += template
      .replace(/{id}/g, r.id)
      .replace(/{name}/g, r.name)
      .replace(/{address}/g, r.address)
      .replace(/{operatingHours}/g, operatingHours)
      .replace(/{rating}/g, rating);
  }

  const restaurantList = document.getElementById('restaurants');
  // set list
  if (listHtml) {
    restaurantList.innerHTML = listHtml;
  } else {
    const emptyViewTempl = document.getElementById('empty-view').innerHTML;
    restaurantList.innerHTML = emptyViewTempl;
  }

  addMarkersToMap(restaurants);

  // add event listeners
  restaurantList.addEventListener('click', event => {
    event.preventDefault();

    let id = getId(event.target);
    // navigate to info page
    if (id > 0) window.location.replace(`/restaurant.html?id=${id}`);
  });
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    selectedCuisineId,
    selectedNeighborhoodId,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML(restaurants);
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  restaurants = [];
  document.getElementById('restaurants').innerHTML = '';

  // Remove all map markers
  for (let m of markers) m.setMap(null);
  markers = [];
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  updateRestaurants();
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = restaurants => {
  // needed to recenter map
  let lat = 0;
  let lng = 0;

  for (let r of restaurants) {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(r, map);
    google.maps.event.trigger(map, 'resize');
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    markers.push(marker);

    // calculate new lat & lng values
    lat += r.latlng.lat;
    lng += r.latlng.lng;
  }
  // divide values by length
  lat /= restaurants.length;
  lng /= restaurants.length;

  // recenter map by new lat & lng values
  map.setCenter({ lat, lng });
};
