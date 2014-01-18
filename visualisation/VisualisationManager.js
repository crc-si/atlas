define([
  'atlas/util/DeveloperError',
  'atlas/visualisation/AbstractProjection'
], function (DeveloperError, Projection) {

  /**
   * Constructs a new VisualisationManager
   * @param {Object.<String, Object>} atlasManagers - A map of Atlas manager names to
   *      the current instance of that manager.
   *
   * @alias atlas.visualisation.VisualisationManager
   * @constructor
   */
  var VisualisationManager = function (atlasManagers) {
    // TODO(bpstudds): Refactor this class to 'GeoChartFactory'? or 'ProjectionFactory'?
    this._atlasManagers = atlasManagers;

    /**
     * The defined projections currently affecting Atlas.
     * @type {Object.<String, atlas.visualisation.AbstractProjection>}
     * @private
     */
    this._projections = {};
  };

  /**
   * Adds a Projection to be managed by the VisualisationManager. Only one projection can be active
   * per artifact. If a Projection that is bound to an artifact that is already in use, the old
   * Projection is unrendered and removed.
   * @param {atlas.visualisation.AbstractProjection} projection - The New Projection instance to add.
   * @returns {atlas.visualisation.AbstractProjection|undefined} The existing Projection bound
   *    to same artifact as the new Projection, if it exists.
   */
  VisualisationManager.prototype.add = function (projection) {
    var target = projection.ARTIFACT,
        old = this._projections[projection.ARTIFACT],
        ret;
    if (old !== undefined) {
      console.debug('Overriding projection on', target, 'with new projection.');
      old.unrender();
      ret = old;
    }
    this._projections[target] = projection;
    return ret;
  };

  /**
   * Removes the projection affecting the given artifact.
   * @param {String} artifact - The artifact of the projection object to be removed.
   * @returns {atlas.visualisation.AbstractProjection|null} The Projection removed, or null
   *    if a projection does not existing for the given artifact.
   */
  VisualisationManager.prototype.remove = function (artifact) {
    var removedProjection = this._projections[artifact];
    if (removedProjection) {
      removedProjection.unrender();
      this._projections[artifact] = null;
    }
    return removedProjection;
  };

  /**
   * Renders the effects of the Projection currently Affect the given artifact.
   * @param {Object} artifact - The artifact to render.
   */
  VisualisationManager.prototype.render = function (artifact) {
    // TODO(bpstudds): Add function to render all currently managed Projections.
    // TODO(bpstudds): Add support for rendering a subset of entities.
    if (!this._projections[artifact]) {
      throw new DeveloperError('Tried to render projection', artifact, 'without adding a projection object.');
    } else {
      this._projections[artifact].render();
    }
  };

  /**
   * Unrenders the effects of the Projection currently affecting the given artifact.
   * @param {Object} artifact - The artifact to unrender.
   */
  VisualisationManager.prototype.unrender = function (artifact) {
    // TODO(bpstudds): Add function to unrender all currently managed Projections.
    // TODO(bpstudds): Add support for unrendering a subset of entities.
    if (!this._projections[artifact]) {
      throw new DeveloperError('Tried to unrender projection', artifact, 'without adding a projection object.');
    } else {
      this._projections[artifact].unrender();
    }
  };

  return VisualisationManager;
});