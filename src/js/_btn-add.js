import DBHelper from './_dbhelper.js';

class BtnAdd {
  constructor(id, description = 'Add a new review') {
    this.id = id;
    this.description = description;
    this.elementId = `add-${this.id}`;
  }

  // Node represenation
  get node() {
    return this._createNode();
  }

  /**
   * Create button
   */
  _createNode() {
    const btn = document.createElement('button');

    btn.id = this.elementId;
    btn.classList.add('btn-review');
    btn.setAttribute('aria-label', this.description);
    btn.append(this._createText());

    return btn;
  }

  /**
   * Create text which is placed inside the button
   */
  _createText() {
    // span inside button element
    const span = document.createElement('span');
    span.classList.add('text-center');
    span.classList.add('text-bigger');
    span.textContent = '+';

    return span;
  }

  /**
   * Update the database, cache and toggle the state of the button
   */
  _update(event) {
    document.getElementById('hidden-form').style.display = 'block';
  }

  addEventListener() {
    document.getElementById(this.elementId).addEventListener('click', event => this._update(event));
  }

  removeEventListener() {
    document
      .getElementById(this.elementId)
      .removeEventListener('click', event => this._update(event));
  }
}

export default BtnAdd;
