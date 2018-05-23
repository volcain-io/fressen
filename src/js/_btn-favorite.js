import DBHelper from './_dbhelper.js';
import { updateFavorite } from './_utils.js';

class BtnFavorite {
  constructor(id, flag, color = 'red') {
    this.id = id;
    this.flag = flag;
    this.color = color;
  }

  // Node represenation
  get node() {
    return this._createBtn();
  }

  /**
   * Toggle favorites icon to mark the current state
   */
  toggle(flag) {
    this.flag = flag;
    this.removeEventListener();

    const oldNode = document.getElementById(`favorite-${this.id}`);
    const newNode = this._createBtn();

    oldNode.replaceWith(newNode);

    this.addEventListener();
  }

  /**
   * Create button
   */
  _createBtn() {
    const btn = document.createElement('button');
    const isFavorite = this.flag === 'true';
    const txtAddOrRemove = isFavorite ? 'Remove' : 'Add';
    const txtToOrFrom = isFavorite ? 'from' : 'to';
    const description = `${txtAddOrRemove} restaurant ${txtToOrFrom} favorites`;

    btn.id = `favorite-${this.id}`;
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
    const isFavorite = this.flag === 'true';
    const icon = isFavorite ? 'favorite' : 'favorite-border';
    img.setAttribute('alt', description);
    img.setAttribute('src', `./img/material-icons/${icon}-${this.color}.svg`);

    return img;
  }

  /**
   * Update the database, cache and toggle the state of the button
   */
  _update(event) {
    const data = document.getElementById(`favorite-${this.id}`).getAttribute('data-isfavorite');
    const invertFlag = !(data === 'true');
    // update entry on server
    DBHelper.updateFavoriteByRestaurantId(this.id, invertFlag, (error, restaurant) => {
      if (error) {
        console.error(error);
      } else {
        // update IndexedDB entry
        DBHelper.updateCachedFavoriteByRestaurantId(restaurant.id, restaurant.is_favorite)
          .then(() => this.toggle(restaurant.is_favorite))
          .catch(error => console.error(error));
      }
    });
  }

  addEventListener() {
    document
      .getElementById(`favorite-${this.id}`)
      .addEventListener('click', event => this._update(event));
  }

  removeEventListener() {
    document
      .getElementById(`favorite-${this.id}`)
      .removeEventListener('click', event => this._update(event));
  }
}

export default BtnFavorite;
