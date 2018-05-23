import DBHelper from './_dbhelper.js';
import BtnFavorite from './_btn-favorite.js';
import { calculateRatingByReviews, convertToHuman, getParameterByName } from './_utils.js';

class Restaurant {
  constructor() {
    this._restaurant = '';
    this._reviews = [];
  }

  /**
   * Get current restaurant from page URL.
   */
  fetchRestaurantFromURL(callback) {
    if (this._restaurant) {
      // restaurant already fetched!
      callback(null, this._restaurant);
      return;
    }

    const id = getParameterByName('id');
    if (!id) {
      // no id found in URL
      callback(`Restaurant id undefined: '${id}'`, null);
    } else {
      DBHelper.fetchRestaurantById(id, (error, restaurant) => {
        if (!restaurant) {
          console.error(error);
          return;
        }
        this._restaurant = restaurant;
        document.getElementById('title').textContent += restaurant.name;
        document.getElementById('name').textContent = restaurant.name;
        document.getElementById('breadcrumb-name').textContent = restaurant.name;
        DBHelper.fetchReviewsByRestaurantId(this._restaurant.id, (error, reviews) => {
          if (error) {
            console.error(error);
          } else {
            this._reviews = reviews;
          }
          this._fillRestaurantHTML();
          callback(null, this._restaurant);
        });
      });
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
  }

  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   */
  _fillRestaurantHours() {
    if (this._restaurant.operating_hours) {
      const operatingHours = this._restaurant.operating_hours;
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
    } else {
      console.info('No operating hours');
    }
  }

  /**
   * Fill in the name of the neighborhood
   */
  _fillNeighborhood() {
    if (this._restaurant.neighborhood_type_id) {
      const id = this._restaurant.neighborhood_type_id;
      DBHelper.fetchNeighborhoodById(id, (error, neighborhood) => {
        if (!neighborhood) {
          console.error(error);
          return;
        }
        const name = document.getElementById('neighborhood-name');
        name.textContent = `in ${neighborhood.name}`;
      });
    }
  }

  /**
   * Fill in the data of the cuisine type
   */
  _fillCuisine() {
    if (this._restaurant.cuisine_type_id) {
      const id = this._restaurant.cuisine_type_id;
      DBHelper.fetchCuisineById(id, (error, cuisine) => {
        if (!cuisine) {
          console.error(error);
          return;
        }
        const name = document.getElementById('cuisine-name');
        name.textContent = cuisine.name;
      });
    }
  }

  /**
   * Create all reviews HTML and add them to the webpage.
   */
  _fillReviewsHTML() {
    if (this._reviews) {
      const template = document.getElementById('review-template').innerHTML;

      let rHTML = '';
      let id = 0;
      for (let r of this._reviews) {
        rHTML += template
          .replace(/{id}/g, id++)
          .replace(/{name}/g, r.name)
          .replace(/{date}/g, convertToHuman(r.updatedAt))
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
    }
  }

  _fillBtnFavorite() {
    const btnFavorite = new BtnFavorite(this._restaurant.id, this._restaurant.is_favorite, 'white');
    document
      .getElementsByTagName('nav')
      .item(0)
      .appendChild(btnFavorite.node);
    btnFavorite.addEventListener();
  }
}

export default Restaurant;
