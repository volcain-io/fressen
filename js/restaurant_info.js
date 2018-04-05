let restaurant;
let map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, r) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: r.latlng,
        scrollwheel: false
      });
      DBHelper.mapMarkerForRestaurant(r, map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (restaurant) {
    // restaurant already fetched!
    callback(null, restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      if (!restaurant) {
        console.error(error);
        return;
      }
      document.getElementById('title').textContent += restaurant.name;
      document.getElementById('name').textContent = restaurant.name;
      document.getElementById('breadcrumb-name').textContent = restaurant.name;
      fillRestaurantHTML(restaurant);
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = r => {
  const template = document.getElementById('restaurant-template').innerHTML;

  let rHTML = '';
  const rating = DBHelper.calculateRatingByReviews(r.reviews);

  // fill template with data
  rHTML += template
    .replace(/{id}/g, r.id)
    .replace(/{name}/g, r.name)
    .replace(/{lat}/g, r.latlng.lat)
    .replace(/{lng}/g, r.latlng.lng)
    .replace(/{address}/g, r.address)
    .replace(/{rating}/g, rating);

  const container = document.getElementById('restaurant-container');
  // set list
  container.innerHTML = rHTML;

  // fill operating hours
  if (r.operating_hours) fillRestaurantHours(r.operating_hours);
  // fill neighborhood
  fillNeighborhood(r.neighborhood_type_id);
  // fill cuisine
  fillCuisine(r.cuisine_type_id);
  // fill reviews
  if (r.reviews) fillReviewsHTML(r.reviews);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHours = operatingHours => {
  const hours = document.getElementById('operating-hours-all');
  for (let weekDay in operatingHours) {
    const row = document.createElement('tr');
    row.setAttribute('aria-label', `${weekDay} open from ${operatingHours[weekDay]}`);

    const day = document.createElement('td');
    day.innerHTML = weekDay;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[weekDay];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Fill in the name of the neighborhood
 */
fillNeighborhood = id => {
  DBHelper.fetchNeighborhoodById(id, (error, neighborhood) => {
    if (!neighborhood) {
      console.error(error);
      return;
    }
    const name = document.getElementById('neighborhood-name');
    name.textContent = `in ${neighborhood.name}`;
  });
};

/**
 * Fill in the data of the cuisine type
 */
fillCuisine = id => {
  DBHelper.fetchCuisineById(id, (error, cuisine) => {
    if (!cuisine) {
      console.error(error);
      return;
    }
    const name = document.getElementById('cuisine-name');
    name.textContent = cuisine.name;
  });
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = reviews => {
  const template = document.getElementById('review-template').innerHTML;

  let rHTML = '';
  let id = 0;
  for (let r of reviews) {
    rHTML += template
      .replace(/{id}/g, id++)
      .replace(/{name}/g, r.name)
      .replace(/{date}/g, r.date)
      .replace(/{rating}/g, r.rating)
      .replace(/{comments}/g, r.comments);
  }

  // set list
  const reviewList = document.getElementById('reviews');
  if (rHTML) {
    reviewList.innerHTML = rHTML;
  } else {
    const emptyViewTempl = document.getElementById('empty-view').innerHTML;
    reviewList.innerHTML = emptyViewTempl;
  }
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
