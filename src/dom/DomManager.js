define([
  'atlas/util/DeveloperError',
  'atlas/util/default',
  'atlas/util/dom/DomClass',
  'atlas/util/dom/DomChild'
], function(DeveloperError, defaultValue, DomClass, DomChild) {
  "use strict";

  /**
   * Object to manage the DOM node that Atlas is rendered into.
   * @author Brendan Studds
   *
   * @param {Object} atlasManagers - A mapping of every manager type in Atlas to the manager instance.
   * @param {String} [domId] - The ID of the DOM element to attach Atlas to.
   *
   * @alias atlas.dom.DomManager
   * @constructor
   */
  var DomManager = function (atlasManagers, domId) {

    /**
     * A mapping of every manager type in Atlas to the manager instance. This
     * object is created on Atlas, but the manager instances are set by each
     * manager upon creation.
     * @type {Object}
     */
    this._atlasManagers = atlasManagers;
    this._atlasManagers.dom = this;

    this._currentDomId = defaultValue(domId, null);
    this._rendered = false;
    this._visible = false;

    if (this._currentDomId !== null) {
      this.setDom(this._currentDomId, true);
    }
  };

  /**
   * Changes the DOM node which Atlas is displayed in.
   * If Atlas is currently displayed changing the DOM automatically causes
   * it to be re-rendered in the new DOM element.
   *
   * @param {String|HTMLElement} elem - Either the ID of a DOM element or the element itself.
   * @param {Boolean} [show=true] - Whether the object should be displayed immediately in this new location.
   */
  DomManager.prototype.setDom = function (elem, show) {
    var showNow = defaultValue(show, true);
    var newDomNode = typeof elem === 'string' ? document.getElementById(elem) : elem;
    if (!newDomNode) {
      throw new DeveloperError('DOM node not found: ' + elem);
    }
    var newDomNodeId = newDomNode.id;

    // Move existing DOM if there is one.
    console.debug('setting DOM with current ID', this._currentDomId, 'to', newDomNodeId);
    if (this._currentDomId !== null) {
      // Always show in the new position if Atlas is being moved.
      showNow = true;
      console.debug('moving atlas from', this._currentDomId, 'to', newDomNodeId);
      var curDomNode = document.getElementById(this._currentDomId);
      var childDomNode = DomChild.getChildren(curDomNode);
      DomChild.addChildren(newDomNode, childDomNode);
      console.debug('moved atlas into', newDomNodeId);
    }
    this._currentDomId = newDomNodeId;
    // Show in new location if required.
    if (showNow) {
      DomClass.remove(newDomNode, "hidden");
      this._visible = true;
    } else {
      DomClass.add(newDomNode, "hidden");
      this._visible = false;
    }
    // Cause the set DOM element to be populated with the Atlas visualisation.
    this.populateDom(this._currentDomId);
  };

  /**
   * Populates the Atlas DOM element.
   * Implemenetation defined.
   * @abstract
   */
  DomManager.prototype.populateDom = function (id) {
    throw new DeveloperError('Can not call abstract method atlas/dom/DomManager.populateDom');
  };

  /**
   * Shows the Atlas DOM element.
   */
  DomManager.prototype.show = function () {
    if (!this._visible) {
      var domNode = document.getElementById(this._currentDomId);
      DomClass.remove(domNode, 'hidden');
      this._visible = true;
    }
  };

  /**
   * Hides the Atlas DOM element.
   */
  DomManager.prototype.hide = function () {
    if (this._visible) {
      var domNode = document.getElementById(this._currentDomId);
      DomClass.add(domNode, 'hidden');
      this._visible = false;
    }
  };

  /**
   * Toggles the visiblity of the Atlas DOM element.
   */
  DomManager.prototype.toggleVisibility = function () {
    if (this._visible) {
      this.hide();
    } else {
      this.show();
    }
  };

  return DomManager;
});