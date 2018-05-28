import DBHelper from './_dbhelper_promises.js';
import { updateFavorite } from './_utils.js';

class BtnFavorite {
  constructor(data, flag, color = 'red') {
    this._data = data;
    this._id = data.id;
    this._flag = flag;
    this._color = color;
    this._dbHelper = new DBHelper();
  }

  // Node represenation
  get node() {
    return this._createBtn();
  }

  get id() {
    return this._id;
  }

  /**
   * Toggle favorites icon to mark the current state
   */
  toggle(flag) {
    this._flag = flag;
    this.removeEventListener();

    const oldNode = document.getElementById(`favorite-${this._id}`);
    const newNode = this._createBtn();

    oldNode.replaceWith(newNode);

    this.addEventListener();
  }

  /**
   * Create button
   */
  _createBtn() {
    const btn = document.createElement('button');
    const isFavorite = this._flag === 'true';
    const txtAddOrRemove = isFavorite ? 'Remove' : 'Add';
    const txtToOrFrom = isFavorite ? 'from' : 'to';
    const description = `${txtAddOrRemove} restaurant ${txtToOrFrom} favorites`;

    btn.id = `favorite-${this._id}`;
    btn.setAttribute('data-isfavorite', isFavorite);
    btn.setAttribute('aria-label', description);
    btn.append(this._createImg(description));

    return btn;
  }

  /**
   * Create image which is placed inside the button
   */
  _createImg(description) {
    // img inside button element
    const img = document.createElement('img');
    const isFavorite = this._flag === 'true';
    const icon = isFavorite ? 'favorite' : 'favorite-border';
    img.setAttribute('alt', description);
    img.setAttribute('src', `./img/material-icons/${icon}-${this._color}.svg`);

    return img;
  }

  /**
   * Update the database, cache and toggle the state of the button
   */
  _update(event) {
    const elem = document.getElementById(`favorite-${this._id}`);
    if (elem) {
      const isFavorite = elem.getAttribute('data-isfavorite');
      const invertFlag = !(isFavorite === 'true');
      // update entry on server
      this._dbHelper
        .updateFavoriteByRestaurant(this._data, invertFlag, false)
        .then(restaurant => {
          // update entry on IndexedDB
          this._dbHelper
            .updateFavoriteByRestaurant(restaurant, restaurant.is_favorite, true)
            .then(data => this.toggle(data.is_favorite))
            .catch(error => console.error(error));
        })
        .catch(error => console.error(error));
    }
  }

  addEventListener() {
    const elem = document.getElementById(`favorite-${this._id}`);
    if (elem) elem.addEventListener('click', event => this._update(event));
  }

  removeEventListener() {
    const elem = document.getElementById(`favorite-${this._id}`);
    if (elem) elem.removeEventListener('click', event => this._update(event));
  }
}

export default BtnFavorite;
