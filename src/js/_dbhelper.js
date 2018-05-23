import 'babel-polyfill';
import idb from 'idb';
import { urlForRestaurant } from './_utils.js';

const IDB_VERSION = 2;

/**
 * Common database helper functions.
 */
class DBHelper {
  static get dbPromise() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('fressen-db', IDB_VERSION, function(upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          if (!upgradeDb.objectStoreNames.contains('neighborhoods')) {
            upgradeDb.createObjectStore('neighborhoods', { keyPath: 'id' });
          }
          if (!upgradeDb.objectStoreNames.contains('cuisines')) {
            upgradeDb.createObjectStore('cuisines', { keyPath: 'id' });
          }
          if (!upgradeDb.objectStoreNames.contains('restaurants')) {
            upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
          }
        case 1:
          if (!upgradeDb.objectStoreNames.contains('reviews')) {
            upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
          }
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

  static addReviews(reviews = []) {
    DBHelper._fillIdb(reviews, 'reviews');
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
      .catch(error => {
        console.error('Transaction failed: ', error);
      });
  }

  static _getCachedDataByStore(store = 'restaurants', callback) {
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
   * Database URL of restaurants.
   */
  static get DB_RESTAURANTS_REQUEST() {
    return new Request(`${DBHelper.BASE_URL}/restaurants`);
  }

  /**
   * Database URL neighborhood types.
   */
  static get DB_NEIGHBORHOOD_TYPES_REQUEST() {
    return new Request(`${DBHelper.BASE_URL}/neighborhoods`);
  }

  /**
   * Database URL of cuisine types.
   */
  static get DB_CUISINE_TYPES_REQUEST() {
    return new Request(`${DBHelper.BASE_URL}/cuisines`);
  }

  /**
   * Database URL of reviews.
   */
  static get DB_REVIEWS_REQUEST() {
    return new Request(`${DBHelper.BASE_URL}/reviews`);
  }

  static _getIDBStoreNameByRequest(request) {
    switch (request.url) {
      case DBHelper.DB_NEIGHBORHOOD_TYPES_REQUEST.url:
        return 'neighborhoods';
        break;
      case DBHelper.DB_CUISINE_TYPES_REQUEST.url:
        return 'cuisines';
        break;
      case DBHelper.DB_REVIEWS_REQUEST.url:
        return 'reviews';
        break;
      default:
        return 'restaurants';
    }
  }

  /**
   * Fetch wrapper
   */
  static _fetchData(request, callback) {
    const store = this._getIDBStoreNameByRequest(request);

    DBHelper._getCachedDataByStore(store, callback)
      .then(data => {
        if (data && data.length > 0) {
          callback(null, data);
        } else {
          throw new Error(`Database is empty: ${store}`);
        }
      })
      .catch(error => {
        fetch(request)
          .then(response => response.json())
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
   * Post method wrapper
   */
  static _postData(request, data, callback) {
    // const store = this._getIDBStoreNameByRequest(request);

    request.body = new FormData(data);
    request.method = 'POST';

    fetch(request)
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(error => callback(error, null));
  }

  /**
   * Put method wrapper
   */
  static _putData(request, formElement, callback) {
    let body = '';

    if (formElement) body = new FormData(formElement);

    fetch(request, { method: 'PUT', body })
      .then(response => response.json())
      .then(data => {
        callback(null, data);
      })
      .catch(error => callback(error, null));
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper._fetchData(DBHelper.DB_RESTAURANTS_REQUEST, callback);
  }

  /**
   * Fetch all neighborhoods.
   */
  static fetchNeighborhoodTypes(callback) {
    DBHelper._fetchData(DBHelper.DB_NEIGHBORHOOD_TYPES_REQUEST, callback);
  }

  /**
   * Fetch all cuisines.
   */
  static fetchCuisinesTypes(callback) {
    DBHelper._fetchData(DBHelper.DB_CUISINE_TYPES_REQUEST, callback);
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    DBHelper._fetchData(DBHelper.DB_REVIEWS_REQUEST, callback);
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
        const restaurant = restaurants.find(r => r.id === parseInt(id));
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
        const neighborhood = neighborhoods.find(n => n.id === parseInt(id));
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
        const cuisine = cuisines.find(c => c.id === parseInt(id));
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
   * Fetch a reviews by its ID.
   */
  static fetchReviewsById(id, callback) {
    // fetch all reviews with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.find(r => r.id === parseInt(id));
        if (review) {
          // Got the review
          callback(null, review);
        } else {
          // Review does not exist in the database
          callback('Review does not exist', null);
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
   * Fetch reviews by restaurant id with proper error handling.
   */
  static fetchReviewsByRestaurantId(restaurantId, callback) {
    // Fetch all reviews
    DBHelper.fetchAllReviews((error, reviews) => {
      if (error) {
        // Got an error
        callback(error, null);
      } else {
        let results = reviews;
        // filter
        if (restaurantId != -1) {
          // filter by restaurant
          results = results.filter(r => r.restaurant_id == restaurantId);
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
   * Fetch all reviews with proper error handling.
   */
  static fetchAllReviews(callback) {
    // Fetch all reviews
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        DBHelper.addReviews(reviews);
        callback(null, reviews);
      }
    });
  }

  static addNewReview(data) {
    return this._postData(DBHelper.DB_REVIEWS_REQUEST, data, null);
  }

  static updateReview(review, callback) {
    const { id, name, rating, comments } = review;
    const request = new URL(`${DBHelper.DB_REVIEWS_REQUEST.url}/${id}`);
    return this._putData(request, { name, rating, comments }, callback);
  }

  static updateReviews() {
    DBHelper._getCachedDataByStore('reviews', null).then(reviews => {
      return Promise.all(
        reviews
          .map(r => DBHelper.updateReview(r))
          .then(response => response.json())
          .then(data => console.log(data))
      ).catch(err => console.error(err));
    });
  }

  static updateFavoriteByRestaurantId(id, isFavorite, callback) {
    const url = new URL(`${DBHelper.DB_RESTAURANTS_REQUEST.url}/${id}/?is_favorite=${isFavorite}`);
    this._putData(url, null, callback);
  }

  /**
   * Toggle favorites status
   */
  static updateCachedFavoriteByRestaurantId(id, isFavorite) {
    return DBHelper.dbPromise.then(async db => {
      if (!db) return Promise.reject('db undefined');

      const store = 'restaurants';
      const tx = db.transaction(store, 'readwrite');
      const dataStore = tx.objectStore(store);

      const obj = await dataStore.get(parseInt(id));
      obj.is_favorite = isFavorite;
      dataStore.put(obj);

      return tx.complete;
    });
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
        url: urlForRestaurant(restaurant.id),
        map: map,
        animation: google.maps.Animation.DROP
      });
      return marker;
    }
  }
}

export default DBHelper;
