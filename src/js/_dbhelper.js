import idb from 'idb';

const IDB_VERSION = 1;

/**
 * Common database helper functions.
 */
class DBHelper {
  static get dbPromise() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('fressen-db', IDB_VERSION, function(upgradeDb) {
      if (!upgradeDb.objectStoreNames.contains('neighborhoods')) {
        const neighborhoodsOS = upgradeDb.createObjectStore('neighborhoods', { keyPath: 'id' });
      }
      if (!upgradeDb.objectStoreNames.contains('cuisines')) {
        const cuisinesOS = upgradeDb.createObjectStore('cuisines', { keyPath: 'id' });
      }
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        const restaurantsOS = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
      }
    });
  }

  static addRestaurants(restaurants = []) {
    DBHelper._fillIdb(restaurants);
  }

  static addNeighborhoods(neighborhoods = []) {
    DBHelper._fillIdb(neighborhoods, 'neighborhoods');
  }

  static addCuisines(cuisines = []) {
    DBHelper._fillIdb(cuisines, 'cuisines');
  }

  static _fillIdb(data = [], store = 'restaurants') {
    DBHelper.dbPromise
      .then(db => {
        if (!db) return Promise.reject('db undefined');

        const tx = db.transaction(store, 'readwrite');
        const dataStore = tx.objectStore(store);

        if (data) {
          data.forEach(function(item) {
            dataStore.put(item);
          });
        }

        return tx.complete;
      })
      .then(() => {
        console.log('Transaction successful');
      })
      .catch(error => {
        console.error('Transaction failed: ', error);
      });
  }

  static _showCachedData(store = 'restaurants', callback) {
    return DBHelper.dbPromise.then(db => {
      if (!db) return Promise.reject('db undefined');

      const tx = db.transaction(store);
      const dataStore = tx.objectStore(store);

      return dataStore.getAll();
    });
  }

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
    let store;
    switch (url.url) {
      case DBHelper.DB_NEIGHBORHOOD_TYPES_URL.url:
        store = 'neighborhoods';
        break;
      case DBHelper.DB_CUISINE_TYPES_URL.url:
        store = 'cuisines';
        break;
      default:
        store = 'restaurants';
    }

    DBHelper._showCachedData(store, callback)
      .then(data => {
        if (data && data.length > 0) {
          callback(null, data);
        } else {
          throw new Error(`Database is empty: ${store}`);
        }
      })
      .catch(error => {
        fetch(url)
          .then(response => {
            // Got a success response from server!
            return response.json();
          })
          .then(data => {
            if (data) {
              callback(null, data);
            } else {
              throw new Error(`No data available: ${store}`);
            }
          })
          .catch(error => {
            // Oops!. Got an error from server.
            callback(error, null);
          });
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
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisineId, neighborhoodId, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        // add restaurants to IndexedDB
        DBHelper.addRestaurants(results);
        // filter
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
        // add neighborhoods to IndexedDB
        DBHelper.addNeighborhoods(neighborhoods);
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
        // add cuisines to IndexedDB
        DBHelper.addCuisines(cuisines);
        callback(null, cuisines);
      }
    });
  }

  /**
   * Calculate rating by reviews
   */
  static calculateRatingByReviews(reviews) {
    if (reviews) {
      let rating = reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length;
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
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    if (typeof google === 'undefined') {
      return null;
    } else {
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
}

export default DBHelper;
