define([
  'atlas/core/ItemStore',
  'atlas/events/Event',
  // Base class
  'atlas/events/EventTarget',
  'atlas/lib/Q',
  'atlas/lib/tinycolor',
  'atlas/lib/utility/Setter',
  'atlas/lib/utility/Strings',
  'atlas/lib/utility/Types',
  'atlas/model/Rectangle',
  'atlas/material/Color',
  'atlas/material/CheckPattern',
  'atlas/material/Gradient',
  'atlas/material/Material',
  'atlas/material/Style',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
  'atlas/util/DeveloperError',
  'atlas/util/WKT'
], function(ItemStore, Event, EventTarget, Q, tinycolor, Setter, Strings, Types, Rectangle, Color,
            CheckPattern, Gradient, Material, Style, GeoPoint, Vertex, DeveloperError, WKT) {
  /**
   * @typedef atlas.model.GeoEntity
   * @ignore
   */
  var GeoEntity;

  /**
   * @classdesc A GeoEntity is an abstract class that represents an entity that
   * has a defined place in 3D space. A GeoEntity is a purely
   * abstract module that is extended by other atlas entities that specify
   * what is this particular GeoEntity represents (eg. a polygon or a line).
   *
   * @param {Number} id - The ID of this GeoEntity.
   * @param {Object} args - Both optional and required construction parameters.
   * @param {String} args.id - The ID of the GeoEntity.
   * @param {atlas.render.RenderManager} args.renderManager - The RenderManager object responsible
   *     for the GeoEntity.
   * @param {atlas.events.EventManager} args.eventManager - The EventManager object responsible for
   *     the Event system.
   * @param {atlas.events.EventTarget} [args.parent] - The parent EventTarget object of the
   *     GeoEntity.
   *
   * @see {atlas.model.Feature}
   * @see {atlas.model.Polygon}
   * @see {atlas.model.Network}
   * @see {atlas.model.Line}
   * @see {atlas.model.GeoPoint}
   * @see {atlas.model.Vertex}
   *
   * @abstract
   * @extends atlas.events.EventTarget
   * @class atlas.model.GeoEntity
   */
  GeoEntity = EventTarget.extend(/** @lends atlas.model.GeoEntity# */ {
    /**
     * The ID of the GeoEntity
     * @type {String}
     * @protected
     */
    _id: null,

    /**
     * The RenderManager object for the GeoEntity.
     * @type {atlas.render.RenderManager}
     * @protected
     */
    _renderManager: null,

    /**
     * The EntityManager for the GeoEntity.
     * @type {atlas.entity.EntityManager}
     * @protected
     */
    _entityManager: null,

    /**
     * The centroid of the entity.
     * @type {atlas.model.GeoPoint}
     * @protected
     */
    _centroid: null,

    /**
     * The area of the GeoEntity in metres squared.
     * @type {Number}
     * @protected
     */
    _area: null,

    /**
     * The elevation of the base of the GeoEntity.
     * @type {Number}
     * @protected
     */
    _elevation: 0,

    /**
     * The translation of the GeoEntity.
     * @type {atlas.model.GeoPoint}
     */
    _translation: null,

    /**
     * The scale of the GeoEntity in each axis direction. 1 by default for all axes.
     * @type {atlas.model.Vertex}
     * @protected
     */
    _scale: null,

    /**
     * The clockwise rotation of the GeoEntity in degrees. By default all components are
     * 0.
     * @type {atlas.model.Vertex}
     * @protected
     */
    _rotation: null,

    /**
     * Whether any transformations have taken place.
     * @type {Boolean}
     */
    _isTransformed: false,

    /**
     * Whether the GeoEntity is visible.
     * @type {Boolean}
     * @protected
     */
    _visible: true,

    /**
     * Whether the GeoEntity can be rendered.
     * @type {Boolean}
     * @protected
     */
    _renderable: false,

    /**
     * Components of the GeoEntity which have been changed and need to be updated when the GeoEntity
     * is re-rendered.
     * @type {Object.<String, Boolean>}
     * @protected
     */
    _dirty: null,

    /**
     * The number of components in <code>_dirty</code>. Used for performance.
     * @type {Number}
     */
    _dirtyCount: 0,

    /**
     * Geometry data for the GeoEntity that allows it to be rendered.
     * @type {Object}
     * @protected
     */
    _geometry: null,

    /**
     * Appearance data to modified how the GeoEntity is rendered.
     * @type {Object}
     * @protected
     */
    _appearance: null,

    /**
     * The style of the GeoEntity when rendered.
     * @type {atlas.material.Style}
     * @protected
     */
    _style: null,

    /**
     * The style of the GeoEntity before it was selected or highlighted.
     * @type {atlas.material.Style}
     * @protected
     */
    _preStyle: null,

    /**
     * Properties for the GeoEntity which gives it context
     * @type {Object}
     * @protected
     */
    _properties: null,

     /* Whether the GeoEntity can be selected.
     * @type {Boolean}
     * @private
     */
    _selectable: true,

    /**
     * Whether the GeoEntity is selected.
     * @type {Boolean}
     * @protected
     */
    _selected: false,

    /**
     * Whether the entity is highlighted.
     * @type {Boolean}
     */
    _highlighted: false,

    /**
     * Whether the opacity should be preserved when the entity is selected. If false, the selected
     * opacity matches the select style opacity. Deselecting will revert to the original opacity.
     * @type {Boolean}
     */
    _preserveOpacityOnSelect: true,

    /**
     * {@link atlas.model.Handle} objects used for editing.
     * @type {atlas.core.ItemStore}
     * @protected
     */
    _handles: null,

    /**
     * The {@link atlas.model.Handle} on the entity itself.
     * @type {atlas.model.Handle}
     * @protected
     */
    _entityHandle: null,

    /**
     * Event handles which are bound to the entity and should be removed with it.
     * @type {Array.<EventListener>}
     * @protected
     */
    _eventHandles: null,

    /**
     * Whether the GeoEntity is fully set up. Rendering will be delayed until it is set up.
     * @type {Boolean}
     */
    _isSetUp: false,

    /**
     * Whether updating the GeoEntity will cause it to build its geometry. This is also applicable
     * on the initial build.
     * @type {Boolean}
     */
    _buildOnChanges: true,

    _init: function(id, data, args) {
      if (typeof id === 'object') {
        args = id;
        id = args.id;
      } else {
        args = args || {};
      }
      id = id.toString();
      if (!id || typeof id === 'object') {
        throw new DeveloperError('Can not create instance of GeoEntity without an ID');
      }
      this._id = id.toString();
      this._renderManager = Setter.def(args.renderManager);
      this._eventManager = args.eventManager;
      this._entityManager = args.entityManager;
      this._entityManager && this._entityManager.add(this);
      var parentId = args.parent;
      var parent;
      if (parentId) {
        parent = this._entityManager && this._entityManager.getById(parentId);
      }
      this._super(args.eventManager, parent);
      this.clean();
      data = data || {};
      this._setup(id, data, args);
      this._isSetUp = true;
      var buildOnChanges = data.buildOnChanges;
      buildOnChanges !== undefined && this.setBuildOnChanges(buildOnChanges);
      this.isVisible() && this.show();
    },

    /**
     * Sets up all properties on the GeoEntity on construction but before rendering.
     * @param {String} id
     * @param {Object} data - The data for construction.
     * @param {Object} args - Additional data for construction.
     */
    _setup: function(id, data, args) {
      this._handles = new ItemStore();
      this._eventHandles = [];
      this._visible = Setter.def(data.show, true);
      this.setDirty('entity');
      this._setupStyle(data, args);
      this.setElevation(data.elevation || 0);
      // Use existing values for transformations to allow subclasses to override the default setup
      // behaviour.
      this._translation = this._translation ||
          new GeoPoint(data.translation || {latitude: 0, longitude: 0, elevation: 0});
      this._scale = this._scale || new Vertex(data.scale || {x: 1, y: 1, z: 1});
      this._rotation = this._rotation || new Vertex(data.rotation || {x: 0, y: 0, z: 0});
      this._isTransformed = data.translation || data.scale || data.rotation;
      this.setProperties(data.properties || {});
      var preserveOpacityOnSelect = data.preserveOpacityOnSelect;
      preserveOpacityOnSelect !== undefined && this.setPreserveOpacityOnSelect(preserveOpacityOnSelect);
      var selectable = data.selectable;
      selectable !== undefined && this.setSelectable(selectable);
      var selected = data.selected;
      selected !== undefined && this.setSelected(selected);
    },

    _setupStyle: function(data, args) {
      var style = this._parseStyle(data, args);
      if (!style) {
        style = Style.getDefault();
      }
      this.setStyle(style);
    },

    _parseStyle: function(data, args) {
      var style;
      var styleArgs = data.style;
      if (styleArgs instanceof Style) {
        return styleArgs;
      } else {
        // Map of valid argument property names to internal Style property names.
        var styleMap = {
          color: 'fillMaterial', fillColor: 'fillMaterial', borderColor: 'borderMaterial',
          fillMaterial: 'fillMaterial', borderMaterial: 'borderMaterial'};
        if (!styleArgs) {
          styleArgs = data;
        }
        var finalStyleArgs = {};
        // Parse each style property as a material and create a style from it.
        Object.keys(styleMap).forEach(function(key) {
          var value = styleArgs[key];
          var styleProp = styleMap[key];
          if (value) {
            if (!(value instanceof Material)) {
              value = this._parseMaterial(value);
            }
            finalStyleArgs[styleProp] = value;
          }
        }, this);
        if (Object.keys(finalStyleArgs).length === 0) {
          return null;
        }
        style = new Style(finalStyleArgs);
        var borderWidth = styleArgs.borderWidth;
        if (borderWidth !== undefined) {
          style.setBorderWidth(borderWidth);
        }
        return style;
      }
    },

    // TODO(aramk) Use better dependency injection.
    /**
     * @param {Object} args - Any object used for construction.
     * @returns {Object} - The given object with manager dependencies added.
     * @protected
     */
    _bindDependencies: function(args) {
      return Setter.mixin(args, {
        renderManager: this._renderManager,
        eventManager: this._eventManager,
        entityManager: this._entityManager
      });
    },

    // -------------------------------------------
    // GETTERS AND SETTERS
    // -------------------------------------------

    /**
     * @returns {String} The ID of the GeoEntity.
     */
    getId: function() {
      return this._id;
    },

    /**
     * @returns {atlas.model.GeoPoint | null} The centre-point of this GeoEntity, or null if no
     * centroid exists.
     */
    getCentroid: function() {
      if (!this._centroid) {
        this._centroid = this._calcCentroid();
      }
      return this._centroid ? this._centroid.clone() : null;
    },

    /**
     * Translates the GeoEntity so that its centroid is the one given.
     * @param {atlas.model.GeoPoint} centroid
     */
    setCentroid: function(centroid) {
      var oldCentroid = this.getCentroid();
      if (!oldCentroid) {
        throw new Error('Cannot set centroid - no existing centroid.');
      }
      var diff = centroid.subtract(oldCentroid);
      this.translate(diff);
    },


    _calcCentroid: function(args) {
      var wkt = WKT.getInstance();
      var centroid = this.getOpenLayersGeometry(args).getCentroid();
      return centroid ? wkt.geoPointFromOpenLayersPoint(centroid) : null;
    },

    /**
     * @returns {Number} The area of the GeoEntity in metres squared, if applicable.
     */
    getArea: function() {
      if (Types.isNullOrUndefined(this._area)) {
        this._area = this._calcArea();
      }
      return this._area;
    },

    // Converts to UTM and calculates the area accurately. OpenLayers will approximate the area,
    // which can be significantly different (e.g. 2 times smaller).
    _calcArea: function() {
      return this.getOpenLayersGeometry({utm: true}).getArea();
    },

    /**
     * @params {Object} [args]
     * @params {Boolean} [args.utm=false] - Whether to use UTM coordinates for the vertices.
     * @returns {OpenLayers.Geometry}
     * @abstract
     */
    getOpenLayersGeometry: function(args) {
      throw new DeveloperError('Can not call abstract method "getOpenLayersGeometry" of GeoEntity');
    },

    /**
     * @returns {atlas.model.Rectangle}
     */
    getBoundingBox: function() {
      var geometry = this.getOpenLayersGeometry();
      var box = geometry.getBounds();
      if (box) {
        // OpenLayers points are (x,y) = (lat,lng) so the rectangle is in cartesian space.
        return new Rectangle(box.right, box.left, box.top, box.bottom);
      } else {
        return null;
      }
    },

    /**
     * Set the elevation of the base of the GeoEntity.
     * @param {Number} elevation - The elevation of the base of the GeoEntity.
     * @returns {Number|null} The previous elevation, or null if no change was made.
     */
    setElevation: function(elevation) {
      var prevElevation = this._elevation;
      if (prevElevation !== elevation) {
        this._elevation = elevation;
        this.setDirty('model');
        this._update();
        return prevElevation;
      } else {
        return null;
      }
    },

    /**
     * @returns {Number} The elevation of the base of the GeoEntity.
     */
    getElevation: function() {
      return this._elevation;
    },

    /**
     * @returns {Array.<atlas.model.Handle>} An array of Handles used to edit the GeoEntity.
     */
    createHandles: function() {
      throw new DeveloperError('Can not call abstract method "createHandles" of GeoEntity');
    },

    /**
     * @param {atlas.model.GeoPoint} [vertex] - The vertex in the entity to associate with the
     * {@link atlas.model.Handle}. If not provided, the centroid of the entity should be used.
     * @param {Number} [index] - The index of the vertex in this object. Only necessary if a vertex
     * is provided.
     * @returns {atlas.model.GeoPoint}
     */
    createHandle: function(vertex, index) {
      throw new DeveloperError('Can not call abstract method "createHandle" of GeoEntity');
    },

    /**
     * @returns {Array.<atlas.model.Handle>}
     */
    addHandles: function() {
      var handles = this.createHandles();
      this.setHandles(handles);
      return handles;
    },

    /**
     * @param {atlas.model.Handle} handle
     * @returns {atlas.model.Handle}
     */
    addHandle: function(handle) {
      this._handles.add(handle);
      return handle;
    },

    /**
     * @param {Array.<atlas.model.Handle>} handles
     */
    setHandles: function(handles) {
      this.clearHandles();
      this._handles.addArray(handles);
    },

    getHandles: function() {
      return this._handles;
    },

    getEntityHandle: function() {
      return this._entityHandle;
    },

    setEntityHandle: function(entityHandle) {
      this._entityHandle = entityHandle;
    },

    clearHandles: function() {
      this._handles.purge();
    },

    /**
     * Sets a particular component of the GeoEntity to dirty, which affects how the GeoEntity is
     * rendered.
     * @param {String|Array|Object} component - Either a single component name, or an array or
     *     object literal of component names to set to dirty.
     */
    setDirty: function(component) {
      if (Types.isString(component)) {
        this._setDirty(component);
      } else if (Types.isObjectLiteral(component)) {
        var components = component;
        if (!(component instanceof Array)) {
          components = Object.keys(component);
        }
        components.forEach(function(key) {
          this._setDirty(component);
        }, this);
      }
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        this._invalidateGeometry();
      }
    },

    _setDirty: function(component) {
      if (!this._dirty[component]) {
        this._dirtyCount++;
        this._dirty[component] = true;
      }
    },

    /**
     * Invalidates values that are calculated using the geometry of this GeoEntity.
     * @protected
     */
    _invalidateGeometry: function() {
      // Invalidate the centroid and area. They will be recalculated when requested.
      this._centroid = null;
      this._area = null;
    },

    /**
     * Set a particular component to be clean, or cleans the GeoEntity entirely.
     * @param {string} [component] - The component to clean, if absent or null the entire GeoEntity
     *     is marked clean.
     */
    setClean: function(component) {
      if (this._dirty[component]) {
        this._dirtyCount--;
        delete this._dirty[component];
      }
    },

    /**
     * @param {String} [component] A specific component to check.
     * @returns {Boolean} Whether the given <code>component</code> is dirty, or if
     * <code>component</code> is not given, the GeoEntity as a whole.
     */
    isDirty: function(component) {
      return component === undefined ? this._dirtyCount > 0 : this._dirty[component];
    },

    /**
     * Clears all of the <code>_dirty</code> flags on the GeoEntity, signifying that the
     * GeoEntity is currently correctly rendered.
     */
    clean: function() {
      this._dirty = {};
      this._dirtyCount = 0;
    },

    /**
     * Sets whether the GeoEntity can be selected.
     * @param {Boolean} selectable - True iff the GeoEntity can be selected.
     */
    setSelectable: function(selectable) {
      if (!selectable && this.isSelected()) this.setSelected(false);
      this._selectable = selectable;
    },

    /**
     * @returns {Boolean} Whether the GeoEntity can be selected.
     */
    isSelectable: function() {
      return this._selectable;
    },

    setPreserveOpacityOnSelect: function(preserve) {
      this._preserveOpacityOnSelect = preserve;
    },

    getPreserveOpacityOnSelect: function() {
      return this._preserveOpacityOnSelect;
    },

    /**
     * Sets the Style for the GeoEntity when it is not selected or highlighted.
     * @param {atlas.material.Style} style - The new style to use.
     * @returns {atlas.material.Style} The previous style, or null if it was not changed.
     */
    setStyle: function(style) {
      var previousStyle = this.getStyle();
      var result;
      if (this.isSelected() || this.isHighlighted()) {
        result = this._setPreStyle(style);
      } else {
        result = this._setStyle(style);
      }
      // Ensure the previous style provided by a call to setStyle() is returned, not the actual
      // rendered style.
      return result ? previousStyle : null;
    },

    _setStyle: function(style) {
      var previousStyle = this._style;
      if (previousStyle && previousStyle.equals(style)) {
        return null;
      }
      this.setDirty('style');
      this._style = style;
      this._update();
      return previousStyle;
    },

    /**
     * @returns {atlas.material.Style} The style of the GeoEntity before any selection or
     *     highlighting.
     */
    getStyle: function() {
      return this._preStyle || this._style;
    },

    /**
     * @returns {atlas.material.Style} The style of the GeoEntity after any selection or
     *     highlighting.
     */
    getVisibleStyle: function() {
      return this._style;
    },

    /**
     * Sets the style of the GeoEntity before it was selected or highlighted.
     * @param {atlas.material.Style} style
     * @returns {atlas.material.Style} The previous style of the GeoEntity before it was selected or
     *     highlighted.
     */
    _setPreStyle: function(style) {
      var prevPreStyle = this._preStyle;
      this._preStyle = style;
      return prevPreStyle;
    },

    /**
     * @returns {Object}
     */
    getProperties: function() {
      return Setter.clone(this._properties);
    },

    /**
     * @param {Object} New set of properties to be assigned
     */
    setProperties: function(obj) {
      // TODO(srafehi) Would type checking be needed in this case?
      this._properties = obj;
    },

    /**
     * @param {String} Name of the properties to update
     * @param {Object} Value of the property being assigned
     */
    setPropertyValue: function(name, value) {
      this._properties[name] = value;
    },

    /**
     * @returns {Boolean} Whether the GeoEntity is currently renderable.
     */
    isRenderable: function() {
      return !this.isDirty();
    },

    /**
     * @return {Promise} A promise which is resolved once the model has been loaded and is ready to
     *     be interacted with. This is a compromise to prevent the need to use promises across the
     *     entire class, which would be unnecessary once all geometries are loaded and result in a
     *     performance overhead for all models. Rather, this places the burden of ensuring models
     *     are ready on the calling code when necessary.
     */
    ready: function() {
      // Override and implement a custom deferred process as necessary.
      return Q.when();
    },

    /**
     * Returns the geometry data for the GeoEntity so it can be rendered.
     * The <code>build</code> method should be called to construct this geometry
     * data.
     * @returns {Object} The geometry data.
     */
    getGeometry: function() {
      return this._geometry;
    },

    /**
     * Returns the appearance data for the GeoEntity so it can be rendered.
     * The <code>build</code> method should be called to construct this appearance
     * data.
     * @returns {Object} The appearance data.
     */
    getAppearance: function() {
      return this._appearance;
    },

    /**
     * @return {Object} A JSON representation of the GeoEntity.
     */
    toJson: function() {
      var json = {
        id: this.getId(),
        translation: this.getTranslation().toArray(),
        scale: this.getScale().toArray(),
        rotation: this.getRotation().toArray(),
        altitude: this.getElevation(),
        show: this.isVisible(),
        properties: this.getProperties()
      };
      var style = this.getStyle();
      if (style) {
        // TODO(aramk) Do this once we migrate from c3ml to aeon. For now only "color" is supported.
        // json.style = style.toJson();
        var fillMaterial = style.getFillMaterial();
        var color = null;
        if (fillMaterial instanceof Color) {
          color = fillMaterial;
        } else if (fillMaterial instanceof CheckPattern) {
          color = fillMaterial.color1;
        }
        if (color) {
          json.color = color.toArray({floatValues: false});
        }
      }
      var parent = this.getParent();
      if (parent) {
        json.parentId = parent.getId();
      }
      return json;
    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    /**
     * Modifies specific components of the GeoEntity's style.
     * @param {atlas.model.Style|Object} updateStyle - The new values for the Style components.
     *     This should be consistent with the return of {@link atlas.material.Style#toObject()} if
     *     passed as an object. If passed as a Style, this method is called.
     * @returns {atlas.material.Style} The previous style, or null if it was not changed.
     */
    modifyStyle: function(updateStyle) {
      this.setDirty('style');
      var prevStyle = this.getStyle();
      var prevStyleJson = {};
      if (prevStyle) {
        // TODO(aramk): Use toObject() for now since toJson() cannot be parsed by Style constructor,
        // since it contains material subclasses details.
        prevStyleJson = prevStyle.toObject();
      }
      var updateStyleJson = updateStyle instanceof Style ? updateStyle.toObject() : updateStyle;
      var newStyleJson = Setter.mixin(prevStyleJson, updateStyleJson);
      var newStyle = new Style(newStyleJson);
      return this.setStyle(newStyle);
    },

    /**
     * Translates the GeoEntity by the given vector.
     * @param {atlas.model.GeoPoint} translation - The amount to move the GeoEntity in latitude,
     * longitude and elevation.
     */
    translate: function(translation) {
      this._translation = this._translation.translate(translation);
      this._isTransformed = true;
      // NOTE: Translation is handled by the subclasses, since not all models have vertices.
      this._postTransform();
    },

    /**
     * @param {atlas.model.GeoPoint} translation
     */
    setTranslation: function(translation) {
      this.translate(new GeoPoint(translation).subtract(this._translation));
    },

    /**
     * @return {atlas.mode.GeoPoint}
     */
    getTranslation: function() {
      return this._translation.clone();
    },

    /**
     * Scales the GeoEntity by the given vector. This scaling can be uniform in all axis or
     *     non-uniform.
     * A scaling factor of <code>1</code> has no effect. Factors lower or higher than <code>1</code>
     * scale the GeoEntity down or up respectively. ie, <code>0.5</code> is half as big and
     * <code>2</code> is twice as big.
     * @param {atlas.model.Vertex} scale - The vector to scale the GeoEntity by.
     * @param {Number} scale.x - The scale along the <code>x</code> axis of the GeoEntity.
     * @param {Number} scale.y - The scale along the <code>y</code> axis of the GeoEntity.
     * @param {Number} scale.z - The scale along the <code>z</code> axis of the GeoEntity.
     */
    scale: function(scale) {
      this._scale = this.getScale().componentwiseMultiply(scale);
      this._isTransformed = true;
      this._postTransform();
    },

    /**
     * @param {atlas.model.Vertex} scale
     */
    setScale: function(scale) {
      this.scale(new Vertex(scale).componentwiseDivide(this.getScale()));
    },

    /**
     * @returns {atlas.model.Vertex}
     */
    getScale: function() {
      return this._scale.clone();
    },

    /**
     * Rotates the GeoEntity by the given vector.
     * @param {atlas.model.Vertex} rotation - The vector to rotate the GeoEntity by.
     * @param {Number} rotation.x - The rotation about the <code>x</code> axis in degrees, negative
     *      rotates counterclockwise, positive rotates clockwise.
     * @param {Number} rotation.y - The rotation about the <code>y</code> axis in degrees, negative
     *      rotates counterclockwise, positive rotates clockwise.
     * @param {Number} rotation.z - The rotation about the <code>z</code> axis in degrees, negative
     *      rotates counterclockwise, positive rotates clockwise.
     * @param {GeoPoint} [centroid] - The centroid to use for rotating. By default this is the
     *      centroid of the GeoEntity obtained from {@link #getCentroid}.
     */
    rotate: function(rotation, centroid) {
      this._rotation = this.getRotation().translate(rotation);
      this._isTransformed = true;
      this._postTransform();
    },

    /**
     * @param {atlas.model.Vertex} rotation
     * @param {GeoPoint} [centroid] - The centroid to use for rotating. By default this is the
     *      centroid of the GeoEntity obtained from {@link #getCentroid}.
     */
    setRotation: function(rotation, centroid) {
      var diff = new Vertex(rotation).subtract(this.getRotation());
      this.rotate(diff, centroid);
    },

    /**
     * @returns {atlas.model.Vertex}
     */
    getRotation: function() {
      return this._rotation.clone();
    },

    /**
     * Called by transform methods after the transformation has completed. Override to prevent
     * default behaviour of rebuilding the model.
     * @protected
     */
    _postTransform: function() {
      this.setDirty('model');
      this._update();
    },

    /**
     * Resets the transformations to their defaults.
     */
    resetTransformations: function() {
      if (!this._isTransformed) { return }
      var defaults = {
        translation: new GeoPoint(0, 0, 0),
        scale: new Vertex(1, 1, 1),
        rotation: new Vertex(0, 0, 0)
      };
      if (this._isSetUp) {
        this.setTranslation(defaults.translation);
        this.setScale(defaults.scale);
        this.setRotation(defaults.rotation);
      } else {
        // Avoid calling setter methods during setup to prevent side-effects.
        this._translation = defaults.translation;
        this._scale = defaults.scale;
        this._rotation = defaults.rotation;
      }
      this._isTransformed = false;
    },

    /**
     * Builds the GeoEntity so it can be rendered. Do not be call this directly from subclasses -
     * use {@link #_update} instead.
     * @abstract
     */
    _build: function() {
      throw new DeveloperError('Can not call abstract method of GeoEntity.');
    },

    /**
     * Removes the GeoEntity from rendering. This function should be overridden on subclasses to
     * accomplish any cleanup that may be required.
     * @fires InternalEvent#entity/remove
     */
    remove: function() {
      this._super();
      // TODO(aramk) Distinguish between this and destroying the entity, which should remove all
      // contained objects.
      this.hide();
      // Ensure any selected entities are deselected so any event handlers listening are notified.
      this.setSelected(false);
      this._cancelEventHandles();
      // TODO(aramk) We should try to keep consistent with these - either all entities have
      // references to managers or none do - otherwise we could have discrepancies in the entity
      // manager like a removed entity still being referenced.
      this._entityManager && this._entityManager.remove(this._id);

      /**
       * Removal of an entity.
       *
       * @event InternalEvent#entity/remove
       * @type {atlas.events.Event}
       * @property {String} args.id - The ID of the removed entity.
       */
      this.dispatchEvent(new Event(this, 'entity/remove', {
        id: this.getId()
      }));
    },

    /**
     * Shows the GeoEntity in the current scene.
     */
    show: function() {
      this._visible = true;
      this._update();
    },

    /**
     * Updates the GeoEntity for rendering.
     * @private
     */
    _update: function() {
      if (!this._isSetUp || !this._buildOnChanges) return;
      var isVisible = this.isVisible();
      if (isVisible && !this.isRenderable()) {
        this._build();
        this.clean();
      }
      this._updateVisibility(isVisible);
    },

    /**
     * Hides the GeoEntity from the current scene.
     */
    hide: function() {
      this._visible = false;
      this._update();
    },

    /**
     * @returns {Boolean} Whether the GeoEntity is currently visible.
     */
    isVisible: function() {
      return this._visible;
    },

    /**
     * @param {Boolean} visible
     */
    setVisibility: function(visible) {
      visible ? this.show() : this.hide();
    },

    /**
     * Toggles the visibility of the GeoEntity.
     */
    toggleVisibility: function() {
      this.setVisibility(!this.isVisible());
    },

    /**
     * Overridable method to update the visibility of underlying geometries based on the given
     * visibility.
     * @param {Boolean} visible
     * @abstract
     * @private
     */
    _updateVisibility: function(visible) {
      // Override in subclasses.
    },

    /**
     * @returns {Boolean} Whether the entity is selected.
     */
    isSelected: function() {
      return this._selected;
    },

    /**
     * Sets the selection state of the entity.
     * @param {Boolean} selected
     * @returns {Boolean|null} The original selection state of the entity, or null if the state
     * is unchanged.
     */
    setSelected: function(selected) {
      if (this._selected === selected || !this.isSelectable()) {
        return null;
      }
      this._selected = selected;
      selected ? this._onSelect() : this._onDeselect();
      return !selected;
    },

    /**
     * @return {Boolean} Whether the entity is highlighted.
     */
    isHighlighted: function() {
      return this._highlighted;
    },

    setHighlighted: function(highlighted) {
      if (this._highlighted === highlighted) {
        return null;
      }
      this._highlighted = highlighted;
      highlighted ? this._onHighlight() : this._onUnhighlight();
      return !highlighted;
    },

    /**
     * @param {Boolean} Whether updating the GeoEntity will cause it to rebuild its geometry.
     */
    setBuildOnChanges: function(buildOnChanges) {
      this._buildOnChanges = buildOnChanges;
      this.getChildren().forEach(function(child) {
        child.setBuildOnChanges(buildOnChanges);
      });
    },

    // -------------------------------------------
    // EVENTS
    // -------------------------------------------

    /**
     * Handles the behaviour when this entity is selected.
     *
     * @fires InternalEvent#entity/select
     */
    _onSelect: function() {
      this._maybeSetPreStyle();
      this._updateHighlightStyle();

      /**
       * Selection of an entity.
       *
       * @event InternalEvent#entity/select
       * @type {atlas.events.Event}
       * @property {Array.<String>} args.ids - The IDs of the selected entities.
       */
      this.dispatchEvent(new Event(this, 'entity/select', {
        ids: [this.getId()]
      }));
    },

    /**
     * Handles the behaviour when this entity is selected.
     *
     * @fires InternalEvent#entity/deselect
     */
    _onDeselect: function() {
      this._updateHighlightStyle();
      // Unset after updating style to ensure it is reverted to preStyle.
      this._maybeUnsetPreStyle();

      /**
       * Deselection of an entity.
       *
       * @event InternalEvent#entity/deselect
       * @type {atlas.events.Event}
       * @property {Array.<String>} args.ids - The IDs of the selected entities.
       */
      this.dispatchEvent(new Event(this, 'entity/deselect', {
        ids: [this.getId()]
      }));
    },

    _maybeSetPreStyle: function() {
      // NOTE: Bitwise XOR to ensure the style is set before either selection or highlighting but
      // not when both are active, indicating one was active before the other and would have already
      // modified _style.
      if (this.isSelected() ^ this.isHighlighted()) {
        this._setPreStyle(this._style);
      }
    },

    _maybeUnsetPreStyle: function() {
      if (!this.isSelected() && !this.isHighlighted()) {
        this._setPreStyle(null);
      }
    },

    /**
     * Handles the logic for updating the style of the entity on selection and highlight.
     */
    _updateHighlightStyle: function() {
      var style;
      if (this.isSelected()) {
        style = Style.getDefaultSelected();
      } else if (this._preStyle) {
        // TODO(aramk) Clones the style - the parse logic should reside in Style, not GeoEntity.
        style = this._parseStyle(this._preStyle.toJson());
      } else {
        // If no preStyle exists, then the entity is not highlighted or selected.
        return;
      }
      // Applies the highlight on either the selected style or preStyle.
      if (this.isHighlighted()) {
        // TODO(aramk) Only supports Colors, not other Materials.
        var fillColor = style.getFillMaterial();
        if (fillColor instanceof Color) {
          fillColor = style.getFillMaterial();
          var newFillColor = fillColor.darken(0.1);
          style.setFillMaterial(newFillColor);
        }
      }
      // Keep the same opacity as the existing style if preserving opacity and the entity is
      // selected. Ignore when deselecting to ensure the preStyle is reverted correctly.
      if (this.isSelected() && this._preserveOpacityOnSelect) {
        var existingFillMaterial = this._style && this._style.getFillMaterial();
        if (existingFillMaterial instanceof Color && style.getFillMaterial() instanceof Color) {
          style.getFillMaterial().alpha = existingFillMaterial.alpha;
        }
      }
      this._setStyle(style);
    },

    /**
     * Handles the behaviour when this entity is highlighted.
     */
    _onHighlight: function() {
      this._maybeSetPreStyle();
      this._updateHighlightStyle();

      /**
       * Highlighting of an entity.
       *
       * @event InternalEvent#entity/highlight
       * @type {atlas.events.Event}
       * @property {Array.<String>} args.ids - The IDs of the highlighted entities.
       */
      this.dispatchEvent(new Event(this, 'entity/highlight', {
        ids: [this.getId()]
      }));
    },

    /**
     * Handles the behaviour when this entity is unhighlighted.
     */
    _onUnhighlight: function() {
      this._updateHighlightStyle();
      // Unset after updating style to ensure it is reverted to preStyle.
      this._maybeUnsetPreStyle();

      /**
       * Unhighlighting of an entity.
       *
       * @event InternalEvent#entity/unhighlight
       * @type {atlas.events.Event}
       * @property {Array.<String>} args.ids - The IDs of the unhighlighted entities.
       */
      this.dispatchEvent(new Event(this, 'entity/unhighlight', {
        ids: [this.getId()]
      }));
    },

    /**
     * Adds the given event handle to be managed by the entity.
     * @param {EventListener} handle
     */
    _bindEventHandle: function(handle) {
      this._eventHandles.push(handle);
    },

    /**
     * Cancels all event handles on the entity.
     */
    _cancelEventHandles: function() {
      this._eventHandles.forEach(function(handle) {
        handle.cancel();
      });
    },

    // -------------------------------------------
    // CONSTRUCTION
    // -------------------------------------------

    /**
     * @param {Object} args
     * @return {atlas.material.Material}
     */
    _parseMaterial: function(args) {
      if (args instanceof Material) {
        return args;
      } else if (Types.isString(args)) {
        return new Color(args);
      } else if (Types.isArrayLiteral(args)) {
        // Color arrays are assumed to be in the range [0, 255] as per C3ML.
        return Color.fromRGBA(args);
      }
      // TODO(aramk) Use injector so we don't have to include all the classes and can use the name
      // as a look up (convention over configuration).
      var type = args.type;
      var typeMap = {
        Color: Color,
        CheckPattern: CheckPattern,
        Gradient: Gradient
      };
      var MaterialClass = typeMap[type];
      if (MaterialClass) {
        return new MaterialClass(args);
      } else {
        throw new Error('Unable to parse material');
      }
    }

  });

  return GeoEntity;
});
