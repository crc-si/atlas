define([
  'atlas/core/ItemStore',
  'atlas/model/GeoEntity',
  'atlas/model/Line',
  'atlas/lib/utility/Log',
  'atlas/lib/utility/Setter',
  'atlas/util/DeveloperError'
], function(ItemStore, GeoEntity, Line, Log, Setter, DeveloperError) {
  /**
   * @typedef atlas.model.LineNetwork
   * @ignore
   */
  var LineNetwork;

  /**
   * @classdesc A LineNetwork represents a 2D network of lines. The network is described using a
   * set of nodes and line data. The nodes are a set of {@link atlas.model.GeoPoint geographic
   * points}. The line data describes an individual line in the network. It consists of an array of
   * node indices which describe the geographic shape, and parameters which affect how the line is
   * rendered (color, texture, width, ...).
   * @class atlas.model.LineNetwork
   * @extends atlas.model.GeoEntity
   */
  LineNetwork = GeoEntity.extend(/** @lends atlas.model.LineNetwork# */ {
    /**
     * An ItemStore containing data required to construct and render the lines of the line network.
     * @type {atlas.core.ItemStore}
     * @private
     */
    _lineData: null,

    /**
     * @typedef {object} atlas.model.LineNetwork#LineData
     * @property {string} [id] - The ID of the Line. A unique ID will be assigned.
     * @property {number} nodeIds - The IDs into the <code>nodeData</code> array of the points
     *     constructing the line.
     */

    /**
     * An ItemStore of the {@link atlas.model.Line|Lines} constructing the LineNetwork.
     * @type {atlas.core.ItemStore}
     * @private
     */
    _lines: null,

    /**
     * The default width of each line in the network if one is not explicitly set for it.
     * @type {number|string}
     * @private
     */
    _lineDefaultWidth: '3px',

    /**
     * This is an array of all the vertices that are present in the LineNetwork.
     * @type {Array.<atlas.model.GeoPoint>}
     * @private
     */
    _nodeData: null,

    /**
     * The next unique ID used for a Line.
     * @type {number}
     * @private
     */
    _nextLineId: 100000,

    _setup: function(id, networkData, args) {
      this._super(id, args);
      this._lineData = new ItemStore();
      this._lines = new ItemStore();

      networkData = Setter.mixin({
        nodeData: [],
        lineData: []
      }, networkData);

      if (networkData.lineData.length > 0 && networkData.nodeData.length < 2) {
        Log.warn('Tried to initialise a LineNetwork with lineData but insufficent nodeData.');
      }

      // Construct an array from the nodeData.
      this._nodeData = networkData.nodeData.map(function(data) {
        return Setter.clone(data);
      });
      // Construct an ItemStore from the lineData.
      networkData.lineData.forEach(function(data) {
        var clonedData = Setter.cloneDeep(data);
        // Assign an ID for the line if one was not supplied.
        clonedData.id = Setter.def(data.id, this._getNextLineId()).toString();
        clonedData.getId = function() { return this.id; };
        this._lineData.add(clonedData);
      }, this);
      this._lineDefaultWidth = networkData.lineWidth || this._lineDefaultWidth;

      // Construct the line network
      this._build();
    },

    /**
     * Constructs all of the lines making up the LineNetwork. This should only be called once after
     * initialisation. Otherwise, all lines are constructed on the fly as required.
     */
    _build: function() {
      if (this.isConstructed()) {
        // Die if the network is already constructed.
        return;
      }
      var defaultLineWidth = this.getDefaultLineWidth();

      // Construct the Line objects.
      this._lineData.forEach(function(lineData) {
        // Don't construct over an existing line.
        if (this._lines.get(lineData)) { return; }

        // Retrieve the GeoPoints constructing the line.
        var lineGeoPoints = this._getLineGeoPoints(lineData),
            width = lineData.width || defaultLineWidth,
            color = lineData.color,
            style = lineData.style;
        // Construct the line object.
        var line = this._createLineObj(
          lineData.id,
          {vertices: lineGeoPoints, width: width, color: color, style: style},
          this._bindDependencies({parent: this}));
        this._lines.add(line);
      }, this);
    },

    /**
     * @returns {Array.<atlas.model.GeoPoint>} The GeoPoints constructing a the given line.
     * @param lineData - The line data containing the line definition.
     * @protected
     */
    _getLineGeoPoints: function(lineData) {
      var nodes = this.getNodeData();
      return lineData.nodeIds.map(function(id) {
        return nodes[id];
      });
    },

    // -------------------------------------------
    // Getters and Setters
    // -------------------------------------------

    getDefaultLineWidth: function() {
      return this._lineDefaultWidth;
    },

    getLineData: function(lineId) {
      if (lineId !== undefined) {
        return this._lineData.get(lineId);
      } else {
        return this._lineData.asArray();
      }
    },

    getNodeData: function() {
      return this._nodeData;
    },

    /**
     * @returns {atlas.model.Line|null} A Line in the network with the given ID, null if no such
     *     Line exists.
     * @param {string} id - The ID of the Line.
     */
    getLine: function(id) {
      return this._lines.get(id);
    },

    /**
     * @returns {Array.<atlas.model.Line>} All of the lines in the LineNetwork as an array.
     */
    getLines: function() {
      return this._lines.asArray();
    },

    /**
     * Returns the next available unique ID.
     * @returns {string}
     * @private
     */
    _getNextLineId: function() {
      return 'network_line_' + this._nextLineId++;
    },

    /**
     * @returns {boolean} Whether the LineNetwork has been constructed. A <code>LineNetwork</code>
     * is constructed if for all defined <code>lineData</code> there is a corresponding
     * <code>Line</code> object, with no Line objects existing without a LineData object.
     */
    isConstructed: function() {
      return this._lines.getCount() == this._lineData.getCount();
    },

    /**
     * @returns {boolean} Whether the <code>LineNetwork</code> is ready to be rendered, ie. all
     * component lines have be re-constructed and updated as necessary.
     */
    isRenderable: function() {
      return !this.isDirty() && this.isConstructed();
    },

    // -------------------------------------------
    // Line and Node Management
    // -------------------------------------------

    /**
     * Adds a new node that can then be added to lines.
     * @param {atlas.model.GeoPoint} node - The GeoPoint to add a node at.
     * @returns {number} The ID of the new node.
     */
    addNode: function(node) {
      this._nodeData.push(Setter.clone(node));
      return this._nodeData.length - 1;
    },

    /**
     * Inserts the given node into the given line at a specific position.
     * @param {string} lineId - The ID of the line to insert the node into.
     * @param {number} nodeId - The ID of the node to insert.
     * @param {number} [position=0] - The index to insert the node at, 0 being at the start of the
     *     line. If <code>position</code> is negative, it is inserted relative to the end of the
     *     line, with -1 being the last index, -2 being the second last etc.
     */
    insertNodeIntoLine: function(lineId, nodeId, position) {
      position = Setter.def(position, 0);
      var lineData = this._lineData.get(lineId),
          nodeIds = lineData.nodeIds,
          node = this._nodeData[nodeId];

      if (!lineData) {
        throw new DeveloperError('Must specify line to insert node into');
      }
      if (!node) {
        throw new DeveloperError('Given nodeId does not exist.');
      }
      if (position > nodeIds.length || position < (-1 - nodeIds.length)) {
        Log.warn('Tried to insert a node outside of a line.');
        return;
      }

      position = position < 0 ? nodeIds.length + 1 + position : position;
      nodeIds.splice(position, 0, nodeId);

      this._rebuildLine(lineId, 'vertices');
    },

    removeNodeFromLine: function(lineId, position) {
      var lineData = this._lineData.get(lineId);
      if (lineData) {
        lineData.nodeIds.splice(position, 1);
      }
      this._rebuildLine(lineId, 'vertices');
    },

    /**
     * Constructs a new Line object. This should be overridden in any Atlas implementations to
     * construct a renderable Line object.
     * @param args Parameters as per @link{atlas.model.Line}
     * @private
     */
    _createLineObj: function(id, lineData, args) {
      return new Line(id, lineData, args);
    },

    /**
     * Rebuilds a Line object after the corresponding Line Data has been modified.
     * @param {string} lineId - The ID of the line modified.
     * @param {string} modified - Specifies what has been modified and therefore what needs to be
     *     done to rebuild the line object. Can be "entity" (rebuild entire line), "vertices" (only
     *     vertices of line have changed), "style" (appearance of line changed).
     * @private
     */
    _rebuildLine: function(lineId, modified) {
      // TODO(bpstudds): Support changing color, width, etc.
      var lineObj = this._lines.get(lineId),
          lineData = this._lineData.get(lineId);
      if (modified === 'vertices' || modified === 'entity') {
        lineObj.setVertices(this._getLineGeoPoints(lineData));
      }
      this.setDirty(lineId);
      this._update();
      this.setClean(lineId);
    },

    // -------------------------------------------
    // Rendering
    // -------------------------------------------
    /**
     * Shows the line network.
     */
    show: function() {
      // Re-build the LineNetwork if it can't be rendered immediately.
      if (!this.isConstructed()) {
        throw new Error('LineNetwork ' + this.getId() + ' not properly constructed before show() called.'
          + 'This should not occur.'
        );
      }

      // If a line is not shown, show it. Else if it is dirty, show it which will cause the
      // LineObj to update itself as necessary.
      this._lines.forEach(function(line) {
        if (!line.isVisible()) {
          line.show();
        } else if (this.isDirty(line.getId())) {
          line.show();
          this.setClean(line.getId());
        }
      }, this);
      this._super();
    },

    hide: function() {
      this._lines.forEach(function(line) {
        line.hide();
      });
      this._super();
    }
  });

  return LineNetwork;
});
