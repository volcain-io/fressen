import 'babel-polyfill';
import idb from 'idb';

const IDB_VERSION = 2;

/**
 * Common database helper functions.
 */
class DBHelper {
  constructor() {
    if (typeof DBHelper.instance === 'object') {
      return DBHelper.instance;
    }

    this._baseUrl = 'http://localhost:1337';
    this._dbRestaurantsRequest = new Request(`${this._baseUrl}/restaurants`);
    this._dbNeighborhoodTypesRequest = new Request(`${this._baseUrl}/neighborhoods`);
    this._dbCuisineTypesRequest = new Request(`${this._baseUrl}/cuisines`);
    this._dbReviewsRequest = new Request(`${this._baseUrl}/reviews`);
    this._stores = {
      restaurants: 'restaurants',
      neighborhoods: 'neighborhoods',
      cuisines: 'cuisines',
      reviews: 'reviews'
    };
    DBHelper.instance = this;

    return this;
  }

  get dbPromise() {
    return idb.open('fressen-db', IDB_VERSION, upgradeDb => {
      switch (upgradeDb.oldVersion) {
        case 0:
          if (!upgradeDb.objectStoreNames.contains(this._stores.restaurants)) {
            upgradeDb.createObjectStore(this._stores.restaurants, { keyPath: 'id' });
          }
          if (!upgradeDb.objectStoreNames.contains(this._stores.neighborhoods)) {
            upgradeDb.createObjectStore(this._stores.neighborhoods, { keyPath: 'id' });
          }
          if (!upgradeDb.objectStoreNames.contains(this._stores.cuisines)) {
            upgradeDb.createObjectStore(this._stores.cuisines, { keyPath: 'id' });
          }
        case 1:
          if (!upgradeDb.objectStoreNames.contains(this._stores.reviews)) {
            upgradeDb.createObjectStore(this._stores.reviews, {
              keyPath: 'id',
              autoIncrement: true
            });
          }
      }
    });
  }

  _fillIdb(data = [], store = this._stores.restaurants) {
    return this.dbPromise
      .then(db => {
        if (!db) return Promise.reject('db undefined');

        const tx = db.transaction(store, 'readwrite');
        const dataStore = tx.objectStore(store);

        if (data) {
          if (Array.isArray(data)) {
            data.forEach(function(item) {
              dataStore.put(item);
            });
          } else {
            dataStore.put(data);
          }
        }

        return tx.complete;
      })
      .then(() => data);
  }

  /**
   * add restaurants
   */
  _addRestaurants(restaurants = []) {
    return this._fillIdb(restaurants);
  }

  /**
   * add neighborhoods
   */
  _addNeighborhoods(neighborhoods = []) {
    return this._fillIdb(neighborhoods, this._stores.neighborhoods);
  }

  /**
   * add cuisines
   */
  _addCuisines(cuisines = []) {
    return this._fillIdb(cuisines, this._stores.cuisines);
  }

  /**
   * add reviews
   */
  _addReviews(reviews = []) {
    return this._fillIdb(reviews, this._stores.reviews);
  }

  /**
   * add review
   */
  addReview(review, isCache) {
    if (isCache) {
      return this._fillIdb(review, this._stores.reviews);
    } else {
      return this._postData(this._dbReviewsRequest, review);
    }
  }

  /**
   * get data from IndexedDB by store
   */
  _getCachedDataByStore(store = this._stores.restaurants) {
    return this.dbPromise
      .then(async db => {
        if (!db) return Promise.reject('db undefined');

        const tx = db.transaction(store);
        const dataStore = tx.objectStore(store);

        return await dataStore.getAll();
      })
      .then(data => {
        if (data && data.length > 0) return data;
        else return Promise.reject('db info: store ${store} empty');
      });
  }

  _getIDBStoreNameByRequest(request) {
    switch (request.url) {
      case this._dbNeighborhoodTypesRequest.url:
        return this._stores.neighborhoods;
        break;
      case this._dbCuisineTypesRequest.url:
        return this._stores.cuisines;
        break;
      case this._dbReviewsRequest.url:
        return this._stores.reviews;
        break;
      default:
        return this._stores.restaurants;
    }
  }

  /**
   * Post method wrapper
   */
  async _postData(request, data = {}) {
    return await fetch(request, {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(response => response.json());
  }

  /**
   * Put method wrapper
   */
  async _putData(request, data = {}) {
    return await fetch(request, {
      method: 'PUT',
      body: JSON.stringify(data)
    }).then(response => response.json());
  }

  /**
   * Fetch wrapper
   */
  _fetchData(request) {
    const store = this._getIDBStoreNameByRequest(request);

    return this._getCachedDataByStore(store).catch(error =>
      fetch(request).then(response => {
        if (response.ok) return response.json();
        return Promise.reject(response.status);
      })
    );
  }

  /**
   * Fetch all restaurants.
   */
  fetchRestaurants() {
    return this._fetchData(this._dbRestaurantsRequest).then(restaurants =>
      // add to IndexedDB
      this._addRestaurants(restaurants)
    );
  }

  /**
   * Fetch all neighborhoods.
   */
  fetchNeighborhoods() {
    return this._fetchData(this._dbNeighborhoodTypesRequest).then(neighborhoods =>
      // add to IndexedDB
      this._addNeighborhoods(neighborhoods)
    );
  }

  /**
   * Fetch all cuisines.
   */
  fetchCuisines() {
    return this._fetchData(this._dbCuisineTypesRequest).then(cuisines =>
      // add to IndexedDB
      this._addCuisines(cuisines)
    );
  }

  /**
   * Fetch all reviews.
   */
  fetchReviews() {
    return this._fetchData(this._dbReviewsRequest).then(reviews =>
      // add to IndexedDB
      this._addReviews(reviews)
    );
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id) {
    // fetch all restaurants
    return this.fetchRestaurants().then(restaurants =>
      restaurants.find(restaurant => restaurant.id === parseInt(id))
    );
  }

  /**
   * Fetch a neighborhood by its ID.
   */
  fetchNeighborhoodById(id) {
    return this.fetchNeighborhoods().then(neighborhoods =>
      neighborhoods.find(neighborhood => neighborhood.id === parseInt(id))
    );
  }

  /**
   * Fetch a cuisine type by its ID.
   */
  fetchCuisineById(id) {
    return this.fetchCuisines().then(cuisines =>
      cuisines.find(cuisine => cuisine.id === parseInt(id))
    );
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisineId, neighborhoodId) {
    return this.fetchRestaurants().then(restaurants => {
      let results = restaurants;
      // filter
      if (cuisineId != -1) {
        // filter by cuisine
        results = results.filter(restaurant => restaurant.cuisine_type_id == cuisineId);
      }
      if (neighborhoodId != -1) {
        // filter by neighborhood
        results = results.filter(restaurant => restaurant.neighborhood_type_id == neighborhoodId);
      }
      return results;
    });
  }

  /**
   * Fetch reviews by restaurant id
   */
  fetchReviewsByRestaurantId(id) {
    // Fetch all reviews
    return this.fetchReviews().then(reviews =>
      reviews.filter(review => review.restaurant_id == id)
    );
  }

  /**
   * Update review
   */
  _updateReview(review) {
    const { id, name, rating, comments } = review;
    const request = new URL(`${this._dbReviewsRequest.url}/${id}`);
    return this._putData(request, { name, rating, comments });
  }

  /**
   * Update reviews
   */
  updateReviews() {
    return this._getCachedDataByStore(this._stores.reviews).then(reviews => {
      return Promise.all(
        reviews.map(review => {
          const request = new URL(`${this._dbReviewsRequest.url}/${review.id}`);
          return fetch(request)
            .then(response => {
              if (response.ok) {
                return this.updateReview(review);
              } else {
                const { restaurant_id, name, rating, comments } = review;
                return this.addReview({ restaurant_id, name, rating, comments }, false);
              }
            })
            .catch(error => error => console.error(error));
        })
      ).catch(error => console.error(error));
    });
  }

  /**
   * Toggle favorites status
   */
  updateFavoriteByRestaurant(restaurant, isFavorite, isCache) {
    // store in cache
    if (isCache) {
      return this.dbPromise
        .then(async db => {
          if (!db) return Promise.reject('db undefined');

          const tx = db.transaction(this._stores.restaurants, 'readwrite');
          const dataStore = tx.objectStore(this._stores.restaurants);

          const obj = await dataStore.get(parseInt(restaurant.id));
          obj.is_favorite = isFavorite;
          dataStore.put(obj);

          return tx.complete;
        })
        .then(() => this.fetchRestaurantById(restaurant.id));
    } else {
      // store on server
      const url = new URL(
        `${this._dbRestaurantsRequest.url}/${restaurant.id}/?is_favorite=${isFavorite}`
      );
      return this._putData(url);
    }
  }
}

const instance = new DBHelper();
Object.freeze(instance);

export default DBHelper;
