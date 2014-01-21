define([
  'atlas/model/GeoEntity',
  'atlas/model/Feature',
  'atlas/model/Polygon',
  'atlas/model/Mesh'
], function (GeoEntity, Feature, Polygon, Mesh) {

  var EntityManager = function (atlasManagers) {
    this._atlasManagers = atlasManagers;
    this._atlasManagers.entity = this;

    /**
     * Contains a mapping of ID to GeoEntity of all GeoEntities in atlas.
     * @type {Object.<String,atlas.model.GeoEntity>}
     */
    this._entities = {};

    /**
     * Contains a mapping of GeoEntity subclass names to the constructor object
     * used to create that GeoEntity. Allows overriding of the default atlas GeoEntities
     * without having to subclass the EntityManager.
     * @type {Object.<String,Function>}
     */
    this._entityTypes = {
      "Feature": Feature,
      "Polygon": Polygon,
      "Mesh": Mesh
    };
  };

  EntityManager.prototype.initialise = function (args) {
    if (args.constructors) {
      this.setGeoEntityTypes(args.constructors);
    }
  };

  // Allows overriding of the default atlas GeoEntity types with implementation specific ones.
  EntityManager.prototype.setGeoEntityTypes = function (constructors) {
    for (key in constructors) {
      if (key in this._entityTypes) {
        this._entityTypes[key] = constructors[key];
      }
    }
  };

  EntityManager.prototype.createFeature = function (id, args) {
    if (typeof id === 'object') {
      args = id;
      id = args.id;
    }
    if (id === undefined) {
      throw new DeveloperError('Can not add Feature without specifying ID');
    } else if (id in this._entities) {
      throw new DeveloperError('Can not add Feature with a duplicate ID');
    } else {
      // Add EventManger to the args for the feature.
      args.eventManager = this._atlasManagers.event;
      // Add the RenderManager to the args for the feature.
      args.renderManager = this._atlasManagers.render;
      return new this._entityTypes.Feature(id, args);
    }
  };

  /**
   * Adds a new GeoEntity into the EntityManager.
   * @param {String} id - The ID of the new GeoEntity.
   * @param {atlas.model.GeoEntity} entity - The new GeoEntity;
   * @returns {Boolean} True if the GeoEntity was added, false otherwise.
   */
  EntityManager.prototype.add = function (id, entity) {
    if (id in this._entities) {
      console.log('tried to add entity', id, 'which already exists.');
      return false;
    }
    if (!entity instanceof GeoEntity) {
      throw new DeveloperError('Can not add entity which is not a subclass of atlas/model/GeoEntity.');
    }
    console.debug('entityManager: added entity', id);
    this._entities[id] = entity;
    return true;
  };

  /**
   * Removes the given GeoEntity from the EntityManager.
   * @param {String} id - The ID of the GeoEntity to remove.
   */
  EntityManager.prototype.remove = function (id) {
    if (id in this._entities) {
      console.debug('entityManager: deleted entity', id);
      this._entities[id].cleanUp();
      delete this._entities[id];
    }
  };

  /**
   * Returns the GeoEntity instance corresponding to the given ID.
   * @param {String} id - The ID of the GeoEntity to return.
   * @returns {atlas.model.GeoEntity|undefined} The corresponding GeoEntity or
   * <code>undefined</code> if there is no such GeoEntity.
   */
  EntityManager.prototype.getById = function (id) {
    // TODO(bpstudds): Accept either a single id or an array of IDs and return an either a
    //      single entity or an array or Entities
    console.debug('entityManager: got entity', id);
    return this._entities[id];
  };

  /**
   * Returns the GeoEntity instances corresponding to the given IDs.
   * @param {Array.<String>} ids - The ID of the GeoEntity to return.
   * @returns {Array.<atlas.model.GeoEntity>} The corresponding GeoEntity instances mapped by their
   * IDs.
   */
  EntityManager.prototype.getByIds = function (ids) {
    console.debug('entityManager: got entities', ids);
    return ids.map(function (id) {
      return this.getById(id);
    }.bind(this));
  };

  /**
   * Returns the GeoEntity that intersects the given Vertex or undefined.
   * @param {atlas.model.Vertex} point - The point of interest.
   * @returns {atlas.model.GeoEntity|undefined} The GeoEntity located at the given point, or
   * <code>undefined</code> if there is no such GeoEntity.
   */
  EntityManager.prototype.getAt = function (point) {
    // TODO
    // See mutopia-gui cesium extensions. Aram converted the target point and visible polygons
    // to WKT and then used OpenLayers to find the intersecting entities.
    throw 'EntityManager.getAt not yet implemented.'
  };

  /**
   * Returns the GeoEntities located within the given Polygon.
   * @param {atlas.model.Polygon} boundingPoly - The polygon defining the geographic area to
   * retrieve GeoEntities.
   * @param {Boolean} [intersects] - If true, GeoEntities which intersect the boundingBox are
   * returned as well. Otherwise, only wholly contains GeoEntities are returned.
   * @returns {atlas.model.GeoEntity|undefined} The GeoEntities located in the bounding box,
   * or <code>undefined</code> if there are no such GeoEntities.
   */
  EntityManager.prototype.getInPoly = function (boundingPoly, intersects) {
    // TODO
    // See mutopia-gui cesium extensions. Aram converted the target point and visible polygons
    // to WKT and then used OpenLayers to find the intersecting entities.
    throw 'EntityManager.getInPoly not yet implemented.'
  };

  EntityManager.prototype.getInRect = function (start, end) {
    // TODO
    // See mutopia-gui cesium extensions. Aram converted the target point and visible polygons
    // to WKT and then used OpenLayers to find the intersecting entities.
    throw 'EntityManager.getInRect not yet implemented.'
  };

  return EntityManager;
});