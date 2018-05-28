import DBHelper from './_dbhelper_promises.js';
import BtnFavorite from './_btn-favorite.js';
import {
  calculateRatingByReviews,
  getId,
  getOperatingHours,
  mapMarkerForRestaurant,
  startIntersectionObserver,
  urlForRestaurant
} from './_utils.js';

class RestaurantList {
  constructor(map = null) {
    this._map = map;
    this._restaurants = [];
    this._neighborhoods = [];
    this._cuisines = [];
    this._reviews = [];
    this._markers = [];
    this._btnFavorites = [];
    this._selectedNeighborhoodId = -1;
    this._selectedCuisineId = -1;
    this._dbHelper = new DBHelper();
  }

  _showMap() {
    // make map visible
    const mapElement = document.getElementById('map');
    if (mapElement) mapElement.classList.remove('hide');
  }

  _addEventListeners(category = 'restaurant') {
    switch (category) {
      case 'neighborhood':
      case 'cuisine':
        const elements = document.querySelectorAll(`div[id^="${category}-"]`);
        for (const elem of elements) {
          elem.addEventListener('click', event => {
            const selectedId = elem.id.replace(`${category}-`, '');
            if (category === 'neighborhood') this._selectedNeighborhoodId = selectedId;
            if (category === 'cuisine') this._selectedCuisineId = selectedId;
            // make map visible
            this._showMap();
            // set background color and update selection id
            this._updateSelection(category);
            // update restaurant list
            this.updateRestaurants();
          });
        }
        break;
      default:
        const innerPlaces = document.querySelectorAll('div.inner-places');
        for (const innerPlace of innerPlaces) {
          const id = innerPlace.parentElement.id.replace('restaurant-', '');
          innerPlace.addEventListener('click', event => {
            window.location.replace(urlForRestaurant(id));
          });
        }
        this._btnFavorites.forEach(favorite => favorite.addEventListener());
    }
  }

  _addBtnFavorites() {
    if (this._btnFavorites) {
      this._btnFavorites.forEach(favorite => {
        if (favorite) {
          document.getElementById(`restaurant-${favorite.id}`).appendChild(favorite.node);
        }
      });
    }
  }

  _updateSelection(category = 'neighborhood') {
    const id = category === 'neighborhood' ? this._selectedNeighborhoodId : this._selectedCuisineId;
    let elements = document.querySelectorAll(`div[id^="${category}-"]`);
    for (const elem of elements) {
      if (elem.id === `${category}-${id}`) {
        elem.classList.toggle('selected');
      } else {
        elem.classList.remove('selected');
      }
      elem.setAttribute('aria-selected', elem.classList.contains('selected'));
    }
    elements = document.querySelectorAll(`div[id^="${category}-"][aria-selected="true"]`);
    if (elements.length === 0) {
      if (category === 'neighborhood') this._selectedNeighborhoodId = -1;
      if (category === 'cuisine') this._selectedCuisineId = -1;
    }
  }

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  fetchNeighborhoods() {
    this._dbHelper
      .fetchNeighborhoods()
      .then(neighborhoods => {
        this._neighborhoods = neighborhoods;
        this._fillNeighborhoodsHTML();
      })
      .catch(error => console.error(error));
  }

  /**
   * Fetch all cuisines and set their HTML.
   */
  fetchCuisines() {
    this._dbHelper
      .fetchCuisines()
      .then(cuisines => {
        this._cuisines = cuisines;
        this._fillCuisinesHTML();
      })
      .catch(error => console.error(error));
  }

  fetchReviews() {
    this._dbHelper
      .fetchReviews()
      .then(reviews => {
        this._reviews = reviews;
      })
      .catch(error => console.error(error));
  }

  /**
   * Set neighborhoods HTML.
   */
  _fillNeighborhoodsHTML() {
    if (this._neighborhoods && this._neighborhoods.length > 0) {
      const template = document.getElementById('neighborhood-template').innerHTML;

      let listHtml = '';
      for (let n of this._neighborhoods) {
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

      this._addEventListeners('neighborhood');
    }
  }

  /**
   * Set cuisines HTML.
   */
  _fillCuisinesHTML() {
    if (this._cuisines && this._cuisines.length > 0) {
      const template = document.getElementById('cuisine-template').innerHTML;

      let listHtml = '';
      for (let c of this._cuisines) {
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

      this._addEventListeners('cuisine');
    }
  }

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  _fillRestaurantsHTML() {
    const restaurantList = document.getElementById('restaurants');
    if (this._restaurants && this._restaurants.length > 0) {
      const template = document.getElementById('restaurant-template').innerHTML;

      let listHtml = '';

      for (let r of this._restaurants) {
        const rating = calculateRatingByReviews(
          this._reviews.filter(review => review.restaurant_id === r.id)
        );
        const operatingHours = getOperatingHours(r.operating_hours);

        // fill template with data
        listHtml += template
          .replace(/{id}/g, r.id)
          .replace(/{name}/g, r.name)
          .replace(/{address}/g, r.address)
          .replace(/{operatingHours}/g, operatingHours)
          .replace(/{rating}/g, rating);

        // create favorites button
        const btnFavorite = new BtnFavorite(r, r.is_favorite);
        this._btnFavorites.push(btnFavorite);
      }

      // set list
      if (restaurantList) restaurantList.innerHTML = listHtml;

      this._addBtnFavorites();

      startIntersectionObserver();

      this._addMarkersToMap();

      this._addEventListeners();
    } else {
      if (restaurantList)
        restaurantList.innerHTML = document.getElementById('empty-view').innerHTML;
    }
  }

  /**
   * Update page and map for current restaurants.
   */
  updateRestaurants() {
    this._dbHelper
      .fetchRestaurantByCuisineAndNeighborhood(
        this._selectedCuisineId,
        this._selectedNeighborhoodId
      )
      .then(restaurants => {
        this._resetRestaurants();
        this._restaurants = restaurants;
        requestAnimationFrame(() => this._fillRestaurantsHTML());
      })
      .catch(error => console.error(error));
  }

  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  _resetRestaurants() {
    // Remove all restaurants
    this._restaurants = [];
    document.getElementById('restaurants').innerHTML = '';

    // Remove all map markers
    if (this._markers) {
      for (let m of this._markers) if (m) m.setMap(null);
    }
    this._markers = [];

    // Remove all favorites
    if (this._btnFavorites) {
      this._btnFavorites.forEach(favorite => {
        if (favorite) favorite.removeEventListener();
      });
    }
    this._btnFavorites = [];
  }

  /**
   * Add markers for current restaurants to the map.
   */
  _addMarkersToMap() {
    if (typeof google !== 'undefined') {
      // needed to recenter map
      let lat = 0;
      let lng = 0;

      for (let r of this._restaurants) {
        // Add marker to the map
        const marker = mapMarkerForRestaurant(r, this._map);
        // store marker
        this._markers.push(marker);

        google.maps.event.trigger(this._map, 'resize');
        google.maps.event.addListener(marker, 'click', () => {
          window.location.href = marker.url;
        });

        // calculate new lat & lng values
        lat += r.latlng.lat;
        lng += r.latlng.lng;
      }
      // divide values by length
      lat /= this._restaurants.length;
      lng /= this._restaurants.length;

      // recenter map by new lat & lng values
      if (this._map) this._map.setCenter({ lat, lng });
    }
  }
}

export default RestaurantList;
