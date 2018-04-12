/**
 * Common database helper functions.
 */
class DBHelper {
  static get BASE_URL() {
    return 'http://localhost:1337';
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return new Request(`${DBHelper.BASE_URL}/restaurants`);
  }

  /**
   * Database URL.
   * Change this to neighborhood_types.json file location on your server.
   */
  static get DB_NEIGHBORHOOD_TYPES_URL() {
    return new Request(`${DBHelper.BASE_URL}/neighborhoods`);
  }

  /**
   * Database URL.
   * Change this to cuisine_types.json file location on your server.
   */
  static get DB_CUISINE_TYPES_URL() {
    return new Request(`${DBHelper.BASE_URL}/cuisines`);
  }

  /**
   * Fetch wrapper
   */
  static _fetchData(url, callback) {
    fetch(url)
      .then(response => {
        // Got a success response from server!
        return response.json();
      })
      .then(data => {
        if (data) callback(null, data);
      })
      .catch(error => {
        // Oops!. Got an error from server.
        callback(error, null);
      });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper._fetchData(DBHelper.DATABASE_URL, callback);
  }

  /**
   * Fetch all neighborhoods.
   */
  static fetchNeighborhoodTypes(callback) {
    DBHelper._fetchData(DBHelper.DB_NEIGHBORHOOD_TYPES_URL, callback);
  }

  /**
   * Fetch all cuisines.
   */
  static fetchCuisinesTypes(callback) {
    DBHelper._fetchData(DBHelper.DB_CUISINE_TYPES_URL, callback);
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch a neighborhood by its ID.
   */
  static fetchNeighborhoodById(id, callback) {
    // fetch all neighborhoods with proper error handling.
    DBHelper.fetchNeighborhoodTypes((error, neighborhoods) => {
      if (error) {
        callback(error, null);
      } else {
        const neighborhood = neighborhoods.find(n => n.id == id);
        if (neighborhood) {
          // Got the neigborhood
          callback(null, neighborhood);
        } else {
          // Neighborhood does not exist in the database
          callback('Neighborhood does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch a cuisine type by its ID.
   */
  static fetchCuisineById(id, callback) {
    // fetch all cuisine types with proper error handling.
    DBHelper.fetchCuisinesTypes((error, cuisines) => {
      if (error) {
        callback(error, null);
      } else {
        const cuisine = cuisines.find(c => c.id == id);
        if (cuisine) {
          // Got the cuisine
          callback(null, cuisine);
        } else {
          // Cuisine does not exist in the database
          callback('Cuisine does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(id, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type_id == id);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(id, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood_type_id == id);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisineId, neighborhoodId, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisineId != -1) {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type_id == cuisineId);
        }
        if (neighborhoodId != -1) {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood_type_id == neighborhoodId);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all neighborhoods
    DBHelper.fetchNeighborhoodTypes((error, neighborhoods) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, neighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all cuisines
    DBHelper.fetchCuisinesTypes((error, cuisines) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, cuisines);
      }
    });
  }

  /**
   * Calculate rating by reviews
   */
  static calculateRatingByReviews(reviews) {
    if (reviews) {
      let rating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
      return rating.toFixed(1);
    }
    return '-';
  }

  /**
   * Get operating hours of current weekday
   */
  static getOperatingHours(operatingHours) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (operatingHours) {
      const d = new Date();
      const hours = operatingHours[days[d.getDay()]];
      return hours.replace(',', ' &');
    }
    return 'N.A.';
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/images/${restaurant.id}-small_2x.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
