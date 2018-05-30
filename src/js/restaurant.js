import DBHelper from './_dbhelper_promises.js';
import BtnFavorite from './_btn-favorite.js';
import BtnAdd from './_btn-add.js';
import Modal from './_modal.js';
import {
  calculateRatingByReviews,
  convertUnixTimeStampToHuman,
  getParameterByName,
  loadMap,
  mapMarkerForRestaurant
} from './_utils.js';

class Restaurant {
  constructor() {
    // define vars
    this._restaurant = '';
    this._neighborhood = '';
    this._cuisine = '';
    this._reviews = [];
    this._map = null;
    this._modalDialog = new Modal(this._postData.bind(this));
    this._dbHelper = new DBHelper();

    // init data
    this._init();
  }

  /**
   * Initialize data with values from IndexedDB
   */
  _init() {
    this._dbHelper
      .initData()
      .then(() => {
        const id = getParameterByName('id');
        this._restaurant = this._dbHelper.getRestaurantById(id);
        if (this._restaurant) {
          this._neighborhood = this._dbHelper.getNeighborhoodById(
            this._restaurant.neighborhood_type_id
          );
          this._cuisine = this._dbHelper.getCuisineById(this._restaurant.cuisine_type_id);
          this._reviews = this._dbHelper.getReviewsByRestaurantId(this._restaurant.id);
        }
        // update UI
        this._updateUI();
      })
      .catch(error => console.error(error));
  }

  _updateUI() {
    if (this._restaurant) {
      document.getElementById('title').textContent += this._restaurant.name;
      document.getElementById('restaurant-name').textContent = this._restaurant.name;
      document.getElementById('breadcrumb-name').textContent = this._restaurant.name;
      this._fillRestaurantHTML();
    }
  }

  /**
   * Make map visible
   */
  _showMap() {
    if (this._restaurant) {
      if (!this._map) this._map = loadMap();
      if (this._map) {
        this._map.setCenter(this._restaurant.latlng);
        mapMarkerForRestaurant(this._restaurant, this._map);
      }
    }
  }

  /**
   * Create restaurant HTML and add it to the webpage
   */
  _fillRestaurantHTML() {
    const template = document.getElementById('restaurant-template').innerHTML;
    let rHTML = '';

    if (template) {
      const rating = calculateRatingByReviews(this._reviews);
      // fill template with data
      rHTML += template
        .replace(/{id}/g, this._restaurant.id)
        .replace(/{name}/g, this._restaurant.name)
        .replace(/{lat}/g, this._restaurant.latlng.lat)
        .replace(/{lng}/g, this._restaurant.latlng.lng)
        .replace(/{address}/g, this._restaurant.address)
        .replace(/{rating}/g, rating);
    }

    const container = document.getElementById('restaurant-container');
    // set list
    if (container) container.innerHTML = rHTML;

    // fill operating hours
    this._fillRestaurantHours();
    // fill neighborhood
    this._fillNeighborhood();
    // fill cuisine
    this._fillCuisine();
    // fill reviews
    this._fillReviewsHTML();
    // fill favorite button
    this._fillBtnFavorite();
    // fill add button
    this._fillBtnAdd();
    // make map visible
    this._showMap();
  }

  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   */
  _fillRestaurantHours() {
    const hours = document.getElementById('operating-hours-all');
    if (this._restaurant && this._restaurant.operating_hours) {
      const operatingHours = this._restaurant.operating_hours;
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
    } else {
      const row = document.createElement('tr');
      row.setAttribute('aria-label', 'No Operating Hours available.');

      const info = document.createElement('td');
      info.textContent = 'No Operating Hours available.';
      row.appendChild(info);

      hours.appendChild(row);
    }
  }

  /**
   * Fill in the name of the neighborhood
   */
  _fillNeighborhood() {
    if (this._neighborhood) {
      const neighborhood = this._dbHelper.getNeighborhoodById(this._neighborhood.id);
      const name = document.getElementById('neighborhood-name');
      if (name) name.textContent = `in ${neighborhood.name}`;
    }
  }

  /**
   * Fill in the data of the cuisine type
   */
  _fillCuisine() {
    if (this._cuisine) {
      const cuisine = this._dbHelper.getCuisineById(this._cuisine.id);
      const name = document.getElementById('cuisine-name');
      if (name) name.textContent = cuisine.name;
    }
  }

  /**
   * Create all reviews HTML and add them to the webpage.
   */
  _fillReviewsHTML() {
    const reviewList = document.getElementById('reviews');
    if (this._reviews && this._reviews.length > 0) {
      const template = document.getElementById('review-template').innerHTML;

      let rHTML = '';
      for (let review of this._reviews) {
        rHTML += template
          .replace(/{id}/g, review.id)
          .replace(/{name}/g, review.name)
          .replace(/{date}/g, convertUnixTimeStampToHuman(review.updatedAt))
          .replace(/{rating}/g, review.rating)
          .replace(/{comments}/g, review.comments);
      }

      // set list
      if (reviewList) reviewList.innerHTML = rHTML;
    } else {
      if (reviewList) reviewList.innerHTML = document.getElementById('empty-view').innerHTML;
    }
  }

  _fillBtnFavorite() {
    const btnFavorite = new BtnFavorite(this._restaurant, this._restaurant.is_favorite, 'white');
    document
      .getElementsByTagName('nav')
      .item(0)
      .appendChild(btnFavorite.node);
    btnFavorite.addEventListener();
  }

  _fillBtnAdd() {
    const btnAdd = new BtnAdd(this._restaurant.id, this._modalDialog, 'Add a new review');
    document
      .getElementsByTagName('main')
      .item(0)
      .appendChild(btnAdd.node);
    btnAdd.addEventListener();
  }

  _postData(event) {
    const form = document.getElementById('form-review');
    // get form data
    const formData = new FormData(form);
    formData.append('restaurant_id', this._restaurant.id);
    const [name, rating, comments, restaurant_id] = [...formData.values()];
    const newReview = { restaurant_id, name, rating, comments };
    // if everything is setup try to send data to server
    if (newReview.restaurant_id && newReview.name && newReview.rating && newReview.comments) {
      event.preventDefault();
      // add entry to IndexedDB
      this._dbHelper
        .addReview(newReview, true)
        .then(review => {
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            return navigator.serviceWorker.ready
              .then(reg => {
                return reg.sync.register('syncIndexedDB');
              })
              .then(() => Promise.resolve(review))
              .catch(() => {
                // system was unable to register for a sync, this could be an OS-level restriction
                console.warn('Unable to register Background Sync');
                //  try to update data on server
                return this._dbHelper.updateReviews().then(() => Promise.resolve(review));
              });
          } else {
            // serviceworker/sync not supported
            console.warn('ServiceWorker and Background Sync not supported');
            //  try to update data on server
            return this._dbHelper.updateReviews().then(() => Promise.resolve(review));
          }
        })
        .then(review => {
          // close modal
          this._modalDialog.close();
          // update ui
          this._reviews = this._dbHelper.getReviewsByRestaurantId(restaurant_id);
          this._fillReviewsHTML();
        })
        .catch(error => {
          console.error(error);
        });
    }
  }
}

export default Restaurant;
