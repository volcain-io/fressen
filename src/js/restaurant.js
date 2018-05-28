import DBHelper from './_dbhelper_promises.js';
import BtnFavorite from './_btn-favorite.js';
import BtnAdd from './_btn-add.js';
import Modal from './_modal.js';
import {
  calculateRatingByReviews,
  convertUnixTimeStampToHuman,
  getParameterByName
} from './_utils.js';

class Restaurant {
  constructor() {
    this._restaurant = '';
    this._reviews = [];
    this._modalDialog = new Modal(this._postData.bind(this));
    this._dbHelper = new DBHelper();
  }

  /**
   * Get current restaurant from page URL.
   */
  fetchRestaurantFromURL(callback) {
    if (this._restaurant) {
      // restaurant already fetched!
      return Promise.resolve(this._restaurant);
    }

    const id = getParameterByName('id');
    if (!id) {
      // no id found in URL
      return Promise.reject(`Restaurant id undefined: '${id}'`);
    } else {
      return this._dbHelper
        .fetchRestaurantById(id)
        .then(restaurant => {
          this._restaurant = restaurant;
          document.getElementById('title').textContent += restaurant.name;
          document.getElementById('name').textContent = restaurant.name;
          document.getElementById('breadcrumb-name').textContent = restaurant.name;
          return this._dbHelper
            .fetchReviewsByRestaurantId(this._restaurant.id)
            .then(reviews => {
              this._reviews = reviews;
              this._fillRestaurantHTML();
              return this._restaurant;
            })
            .catch(error => console.error(error));
        })
        .catch(error => console.error(error));
    }
  }

  /**
   * Create restaurant HTML and add it to the webpage
   */
  _fillRestaurantHTML() {
    const template = document.getElementById('restaurant-template').innerHTML;
    const r = this._restaurant;

    let rHTML = '';
    const rating = calculateRatingByReviews(this._reviews);

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
  }

  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   */
  _fillRestaurantHours() {
    const hours = document.getElementById('operating-hours-all');
    if (this._restaurant.operating_hours) {
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
    if (this._restaurant.neighborhood_type_id) {
      const id = this._restaurant.neighborhood_type_id;
      this._dbHelper
        .fetchNeighborhoodById(id)
        .then(neighborhood => {
          const name = document.getElementById('neighborhood-name');
          if (name) name.textContent = `in ${neighborhood.name}`;
        })
        .catch(error => console.error(error));
    }
  }

  /**
   * Fill in the data of the cuisine type
   */
  _fillCuisine() {
    if (this._restaurant.cuisine_type_id) {
      const id = this._restaurant.cuisine_type_id;
      this._dbHelper
        .fetchCuisineById(id)
        .then(cuisine => {
          const name = document.getElementById('cuisine-name');
          if (name) name.textContent = cuisine.name;
        })
        .catch(error => console.error(error));
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
      let id = 0;
      for (let r of this._reviews) {
        rHTML += template
          .replace(/{id}/g, id++)
          .replace(/{name}/g, r.name)
          .replace(/{date}/g, convertUnixTimeStampToHuman(r.updatedAt))
          .replace(/{rating}/g, r.rating)
          .replace(/{comments}/g, r.comments);
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
      // add entry to server
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
                return Promise.reject('Unable to register Background Sync');
              });
          } else {
            // serviceworker/sync not supported
            return Promise.reject('ServiceWorker and Background Sync not supported');
          }
        })
        .then(review => {
          // close modal
          this._modalDialog.close();
          // update ui
          this._reviews.push(review);
          this._fillReviewsHTML();
        })
        .catch(error => {
          console.error(error);
          this._dbHelper.addReview(newReview, false).catch(error => console.error(error));
        });
    }
  }
}

export default Restaurant;
