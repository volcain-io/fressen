import regeneratorRuntime from 'regenerator-runtime';
import idb from 'idb';

const IDB_VERSION = 2;

/**
 * Common database helper functions.
 */
class DBHelper {
  constructor() {
    // singleton pattern
    if (typeof DBHelper.instance === 'object') {
      return DBHelper.instance;
    }

    // define vars
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
    // this variables are used to reduce http request.
    // we make one request inside the '_initIndexedDB' function
    // and store all relevant information in these variables
    // if there is a newer version on the server we have to update these variables also
    this._restaurants = [];
    this._neighborhoods = [];
    this._cuisines = [];
    this._reviews = [];

    // store instance
    DBHelper.instance = this;

    // return instance
    return this;
  }

  get restaurants() {
    return this._restaurants;
  }

  get neighborhoods() {
    return this._neighborhoods;
  }

  get cuisines() {
    return this._cuisines;
  }

  get reviews() {
    return this._reviews;
  }

  get stores() {
    return this._stores;
  }

  /**
   * Fill indexed db with data on first load
   */
  async initData(store = 'all') {
    switch (store) {
      case this._stores.restaurants:
        return await this._fetchRestaurants()
          .then(restaurants => {
            this._restaurants.push(...restaurants);
          })
          .then(() => this._addRestaurants(this._restaurants));

      case this._stores.neighborhoods:
        return this._fetchNeighborhoods()
          .then(neighborhoods => {
            this._neighborhoods.push(...neighborhoods);
          })
          .then(() => this._addNeighborhoods(this._neighborhoods));
      case this._stores.cuisines:
        return this._fetchCuisines()
          .then(cuisines => {
            this._cuisines.push(...cuisines);
          })
          .then(() => this._addCuisines(this._cuisines));
      case this._stores.reviews:
        return this._fetchReviews()
          .then(reviews => {
            this._reviews.push(...reviews);
          })
          .then(() => this._addReviews(this._reviews));
      default:
        return await Promise.all([
          // get data from server
          this._fetchRestaurants().then(restaurants => {
            this._restaurants.push(...restaurants);
          }),
          this._fetchNeighborhoods().then(neighborhoods => {
            this._neighborhoods.push(...neighborhoods);
          }),
          this._fetchCuisines().then(cuisines => {
            this._cuisines.push(...cuisines);
          }),
          this._fetchReviews().then(reviews => {
            this._reviews.push(...reviews);
          })
        ]).then(() => {
          // add to IndexedDB
          this._addRestaurants(this._restaurants);
          this._addNeighborhoods(this._neighborhoods);
          this._addCuisines(this._cuisines);
          this._addReviews(this._reviews);
          return Promise.resolve(true);
        });
    }
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
  addReview(review, isIdb) {
    if (isIdb) {
      return this._fillIdb(review, this._stores.reviews).then(review => {
        this._reviews.push(review);
        return review;
      });
    } else {
      return this._postData(this._dbReviewsRequest, review).then(review => {
        this._reviews.push(review);
        return review;
      });
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

  /**
   * get data from IndexedDB by store
   */
  _getCachedDataByKey(key, store = this._stores.restaurants) {
    return this.dbPromise
      .then(async db => {
        if (!db) return Promise.reject('db undefined');

        const tx = db.transaction(store);
        const dataStore = tx.objectStore(store);

        return await dataStore.get(key);
      })
      .then(data => {
        if (data) return data;
        else return Promise.reject('db info: data not found');
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
   * Fetch data by key
   */
  _fetchDataByKey(request, key) {
    const store = this._getIDBStoreNameByRequest(request);

    return this._getCachedDataByKey(key, store).catch(error =>
      fetch(request).then(response => {
        if (response.ok) return response.json();
        return Promise.reject(response.status);
      })
    );
  }

  /**
   * Fetch all restaurants.
   */
  _fetchRestaurants() {
    return this._fetchData(this._dbRestaurantsRequest);
  }

  /**
   * Fetch restaurant by its ID.
   */
  _fetchRestaurantById(id) {
    return this._fetchDataByKey(this._dbRestaurantsRequest, id);
  }

  /**
   * Fetch all neighborhoods.
   */
  _fetchNeighborhoods() {
    return this._fetchData(this._dbNeighborhoodTypesRequest);
  }

  /**
   * Fetch all cuisines.
   */
  _fetchCuisines() {
    return this._fetchData(this._dbCuisineTypesRequest);
  }

  /**
   * Fetch all reviews.
   */
  _fetchReviews() {
    return this._fetchData(this._dbReviewsRequest);
  }

  /**
   * Get a restaurant by its ID.
   */
  getRestaurantById(id) {
    return this._restaurants.find(restaurant => restaurant.id === parseInt(id));
  }

  /**
   * Get a neighborhood by its ID.
   */
  getNeighborhoodById(id) {
    return this._neighborhoods.find(neighborhood => neighborhood.id === parseInt(id));
  }

  /**
   * Get a cuisine type by its ID.
   */
  getCuisineById(id) {
    return this._cuisines.find(cuisine => cuisine.id === parseInt(id));
  }

  /**
   * Filter restaurants by a cuisine and a neighborhood
   */
  filterRestaurantByCuisineAndNeighborhood(cuisineId, neighborhoodId) {
    if (this._restaurants) {
      let results = this._restaurants;
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
    }
    return null;
  }

  /**
   * Fetch reviews by restaurant id
   */
  getReviewsByRestaurantId(id) {
    // filter by restaurant id
    return this._reviews.filter(review => review.restaurant_id == id);
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
              if (response && response.ok) {
                return this._updateReview(review).then(review => {
                  const idx = this._reviews.findIndex(elem => elem.id === review.id);
                  this._reviews.splice(idx, 1, review);
                  return review;
                });
              } else {
                const { restaurant_id, name, rating, comments } = review;
                return this.addReview({ restaurant_id, name, rating, comments }, false).then(
                  review => {
                    this._reviews.push(review);
                    return review;
                  }
                );
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
  updateFavoriteByRestaurant(restaurant, isFavorite, isIdb) {
    // store in IndexedDB
    if (isIdb) {
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
        .then(() => {
          return this._fetchRestaurantById().then(restaurants => {
            // update restaurant list (local variable)
            this._restaurants.splice(0).push(restaurants);
            return restaurants.find(elem => elem.id === restaurant.id);
          });
        });
    } else {
      // store on server
      const url = new URL(
        `${this._dbRestaurantsRequest.url}/${restaurant.id}/?is_favorite=${isFavorite}`
      );
      return this._putData(url).then(restaurant => {
        // replace restaurant inside our local variable (this._restaurants)
        const idx = this._restaurants.findIndex(elem => elem.id === restaurant.id);
        this._restaurants.splice(idx, 1, restaurant);
        return restaurant;
      });
    }
  }
}

// singleton pattern
const instance = new DBHelper();
Object.freeze(instance);

export default DBHelper;
