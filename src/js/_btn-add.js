class BtnAdd {
  constructor(id, modal, description = 'Add') {
    this._elementId = `btn-add-${id}`;
    this._description = description;
    this._modal = modal;

    /**
     * Handle click
     */
    this._handleClick = event => {
      if (this._modal) this._modal.open();
    };
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

    btn.id = this._elementId;
    btn.classList.add('btn-add');
    btn.setAttribute('aria-label', this._description);
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

  addEventListener() {
    document.getElementById(this._elementId).addEventListener('click', this._handleClick);
  }

  removeEventListener() {
    document.getElementById(this._elementId).removeEventListener('click', this._handleClick);
  }
}

export default BtnAdd;
