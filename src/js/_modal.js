class Modal {
  constructor(
    btnOkCallback = event => {
      event.preventDefault();
      console.warn('No callback defined.');
    },
    modalId = 'modal',
    modalOverlayId = 'modal-overlay'
  ) {
    // modal dialog parameters
    this._btnOkCallback = btnOkCallback;
    this._modal = document.getElementById(modalId);
    this._modalOverlay = document.getElementById(modalOverlayId);
    // will hold previously focused element;
    this._focusedElementBeforeModal = null;
    // define focusable elements
    this._focusableElementsString =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    this._firstTabStop = null;
    this._lastTabStop = null;
    // ok button
    this._btnOk = null;
    // close button
    this._btnClose = null;
    // flag to indicate to state of the dialog (open || close)
    this._isClosed = true;

    // defince event listeners
    this._trapTabKey = event => {
      // check for TAB key press
      if (event.keyCode === 9) {
        // SHIFT + TAB
        if (event.shiftKey) {
          if (document.activeElement === this._firstTabStop) {
            event.preventDefault();
            this._lastTabStop.focus();
          }
        } else {
          if (document.activeElement === this._lastTabStop) {
            event.preventDefault();
            this._firstTabStop.focus();
          }
        }
      }

      // escape
      if (event.keyCode === 27) this._closeModal(event);
    };

    this._closeModal = event => {
      // remove all listeners
      this._removeEventListeners();
      // reset form
      this._resetForms();
      // hide modal and overlay
      this._hide();
      // flag
      this._isClosed = true;
      // set focus back to element that had it before the modal was opened
      if (this._focusedElementBeforeModal) this._focusedElementBeforeModal.focus();
    };

    // keep dialog closed on initial start
    this._closeModal();
  }

  open() {
    // prevent from reopening
    if (this._isClosed) {
      // save current focus
      this._focusedElementBeforeModal = document.activeElement;
      // ok button
      this._btnOk = document.getElementById('modal-btn-ok');
      // close button
      this._btnClose = document.getElementById('modal-btn-close');

      // add event listeners
      this._addEventListeners();

      // find all focusable children and convert to array of elements
      let focusableElements = null;
      if (this._modal && this._focusableElementsString)
        focusableElements = [...this._modal.querySelectorAll(this._focusableElementsString)];

      // show the modal and overlay
      this._show();

      // define first and last element to navigate via tab
      if (focusableElements) {
        this._firstTabStop = focusableElements[0];
        this._lastTabStop = focusableElements[focusableElements.length - 1];
      }

      // focus first child
      if (this._firstTabStop) this._firstTabStop.focus();
    }
  }

  close() {
    this._closeModal();
  }

  /**
   * Check if any children is a FORM element
   */
  _hasFormAsChildren() {
    let formElems = null;
    if (this._modal) {
      const elems = [...this._modal.childNodes];
      if (elems && elems.length > 0) {
        formElems = elems.filter(elem => elem.tagName === 'FORM');
      }
    }
    return formElems;
  }

  /**
   * Reset all forms
   */
  _resetForms() {
    const formElems = this._hasFormAsChildren();
    if (formElems) formElems.forEach(form => form.reset());
  }

  _addEventListeners() {
    // listen for and trap the keyboard
    if (this._modal) this._modal.addEventListener('keydown', this._trapTabKey);
    // listen for button clicks
    if (this._btnOk) this._btnOk.addEventListener('click', this._btnOkCallback);
    if (this._btnClose) this._btnClose.addEventListener('click', this._closeModal);
  }

  _removeEventListeners() {
    if (this._modal) this._modal.removeEventListener('keydown', this._trapTabKey);
    if (this._btnOk) this._btnOk.removeEventListener('click', this._btnOkCallback);
    if (this._btnClose) this._btnClose.removeEventListener('click', this._closeModal);
  }

  _show() {
    if (this._modal) this._modal.style.display = 'block';
    if (this._modalOverlay) this._modalOverlay.style.display = 'block';
    this._isClosed = false;
  }

  _hide() {
    if (this._modal) this._modal.style.display = 'none';
    if (this._modalOverlay) this._modalOverlay.style.display = 'none';
  }
}

export default Modal;
