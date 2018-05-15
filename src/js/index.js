import DBHelper from './_dbhelper.js';
import { getId, startIntersectionObserver } from './_utils.js';

class RestaurantList {
  constructor(map = null) {
    this._map = map;
    this._restaurants = [];
    this._neighborhoods = [];
    this._cuisines = [];
    this._markers = [];
    this._selectedNeighborhoodId = -1;
    this._selectedCuisineId = -1;
  }

  /**
   * Toggle selection state to mark the current selected card and update id
   */
  _updateSelection(elem, category = 'neighborhood') {
    // get new selection
    let id = getId(elem);
    // we have to toggle the selection
    if (id && id != -1) {
      const cElem = document.getElementById(`${category}-${id}`);
      const cList = cElem.classList;
      cList.toggle('selected');
      // remove old selection
      const oldId =
        category === 'neighborhood' ? this._selectedNeighborhoodId : this._selectedCuisineId;
      if (oldId && oldId != -1 && oldId != id) {
        const oldElem = document.getElementById(`${category}-${oldId}`);
        oldElem.classList.remove('selected');
        oldElem.setAttribute('aria-selected', 'false');
      }
      cList.contains('selected')
        ? cElem.setAttribute('aria-selected', 'true')
        : cElem.setAttribute('aria-selected', 'false');
      id = cList.contains('selected') ? id : -1;
    }

    return id;
  }

  /**
   * Toggle favorites icon to mark the current state
   */
  _updateFavoritesIcon(id) {
    DBHelper.isFavorite(id)
      .then(r => {
        const isFavorite = r.is_favorite;
        const elem = document.getElementById(`favorite-${r.id}`);
        const txtAddOrRemove = isFavorite ? 'Remove' : 'Add';
        const txtToOrFrom = isFavorite ? 'from' : 'to';
        const description = `${txtAddOrRemove} ${r.name} restaurant ${txtToOrFrom} favorites`;
        elem.setAttribute('aria-label', description);
        const img = elem.children[0];
        const icon = isFavorite ? 'favorite.svg' : 'favorite-border.svg';
        img.setAttribute('alt', description);
        img.setAttribute('src', `./img/material-icons/${icon}`);
      })
      .catch(error => {
        console.error(`Couldn't add restaurant to favorites: `, error);
      });
  }

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  fetchNeighborhoods() {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
      if (error) {
        // Got an error
        console.error(error);
      } else {
        this._neighborhoods = neighborhoods;
        this._fillNeighborhoodsHTML();
      }
    });
  }

  /**
   * Fetch all cuisines and set their HTML.
   */
  fetchCuisines() {
    DBHelper.fetchCuisines((error, cuisines) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        this._cuisines = cuisines;
        this._fillCuisinesHTML();
      }
    });
  }

  /**
   * Set neighborhoods HTML.
   */
  _fillNeighborhoodsHTML() {
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

    // add event listeners
    neighborhoodList.addEventListener('click', event => {
      event.preventDefault();

      if (!event.target.classList.contains('horizontal-scrolling')) {
        // make map visible
        const mapElement = document.getElementById('map');
        if (mapElement) mapElement.classList.remove('hide');

        // set background color and update selection id
        this._selectedNeighborhoodId = this._updateSelection(event.target, 'neighborhood');

        this.updateRestaurants();
      }
    });
  }

  /**
   * Set cuisines HTML.
   */
  _fillCuisinesHTML() {
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

    // add event listeners
    cuisineList.addEventListener('click', event => {
      event.preventDefault();

      if (!event.target.classList.contains('horizontal-scrolling')) {
        // make map visible
        const mapElement = document.getElementById('map');
        if (mapElement) mapElement.classList.remove('hide');

        // set background color and update selection id
        this._selectedCuisineId = this._updateSelection(event.target, 'cuisine');

        this.updateRestaurants();
      }
    });
  }

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  _fillRestaurantsHTML() {
    const template = document.getElementById('restaurant-template').innerHTML;

    let listHtml = '';

    for (let r of this._restaurants) {
      const rating = DBHelper.calculateRatingByReviews(r.reviews);
      const operatingHours = DBHelper.getOperatingHours(r.operating_hours);
      const isFavorite = r.is_favorite;

      // fill template with data
      listHtml += template
        .replace(/{id}/g, r.id)
        .replace(/{name}/g, r.name)
        .replace(/{address}/g, r.address)
        .replace(/{operatingHours}/g, operatingHours)
        .replace(/{rating}/g, rating)
        .replace(/{txtAddOrRemove}/g, isFavorite ? 'Remove' : 'Add')
        .replace(/{txtToOrFrom}/g, isFavorite ? 'from' : 'to')
        .replace(/{favoriteIcon}/g, isFavorite ? 'favorite' : 'favorite-border');
    }

    const restaurantList = document.getElementById('restaurants');
    // set list
    if (listHtml) {
      restaurantList.innerHTML = listHtml;
    } else {
      const emptyViewTempl = document.getElementById('empty-view').innerHTML;
      restaurantList.innerHTML = emptyViewTempl;
    }

    startIntersectionObserver();

    this._addMarkersToMap();

    // add event listeners
    restaurantList.addEventListener('click', event => {
      event.preventDefault();

      let id = getId(event.target);
      // toggle favorites
      if (
        event.target.id.startsWith('favorite-') ||
        event.target.parentElement.id.startsWith('favorite-')
      ) {
        DBHelper.toggleFavorites(id)
          .then(() => {
            this._updateFavoritesIcon(id);
          })
          .catch(error => {
            console.error('Transaction failed: ', error);
          });
      } else if (id > 0) window.location.replace(`restaurant.html?id=${id}`);
      else {
      }
    });

    // requestAnimationFrame(() => {
    //   this._fillRestaurantsHTML();
    // });
  }

  /**
   * Update page and map for current restaurants.
   */
  updateRestaurants() {
    DBHelper.fetchRestaurantByCuisineAndNeighborhood(
      this._selectedCuisineId,
      this._selectedNeighborhoodId,
      (error, restaurants) => {
        if (error) {
          // Got an error!
          console.error(error);
        } else {
          this._resetRestaurants();
          this._restaurants = restaurants;
          this._fillRestaurantsHTML();
          // requestAnimationFrame(() => {
          //   this._fillRestaurantsHTML();
          // });
          // requestAnimationFrame(this._fillRestaurantsHTML.bind(this));
        }
      }
    );
  }

  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  _resetRestaurants() {
    // Remove all restaurants
    this._restaurants = [];
    document.getElementById('restaurants').innerHTML = '';

    // Remove all map markers
    for (let m of this._markers) if (m) m.setMap(null);
    this._markers = [];
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
        const marker = DBHelper.mapMarkerForRestaurant(r, this._map);
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
