define([
  'atlas/model/Vertex',
  'atlas/util/AtlasMath',
  'atlas/util/Class',
  'atlas/util/mixin'
], function (Vertex, AtlasMath, Class, mixin) {

  var GeoPoint;

  /**
   * @classdesc The Point class represents a geospatial location on a globe. The location
   * is specified with latitude, longitude, and elevation.
   * @param {Number} [lat=0] - The GeoPoint's latitude in decimal degrees.
   * @param {Number} [lng=0] - The GeoPoint's longitude in decimal degrees.
   * @param {Number} [elevation=0] - The GeoPoint's elevation in decimal degrees.
   * @class atlas.model.GeoPoint
   */
  return mixin(GeoPoint = Class.extend( /** @lends atlas.model.GeoPoint# */ {
    /**
     * The GeoPoint's latitude in decimal degrees.
     * @type {Number}
     */
    latitude: null,

    /**
     * The GeoPoint's longitude in decimal degrees.
     * @type {Number}
     */
    longitude: null,

    /**
     * The GeoPoint's elevation in metres.
     * @type {Number}
     */
    elevation: null,

    /*
     * Constructs a new GeoPoint object.
     * @ignore
     */
    _init: function (lat, lng, elevation) {
      this.latitude = parseFloat(lat) || 0.0;
      this.longitude = parseFloat(lng) || 0.0;
      this.elevation = parseFloat(elevation) || 0.0;
    },

    /**
     * @returns {atlas.model.Vertex} The GeoPoint as a new Vertex object.
     */
    toVertex: function () {
      return new Vertex(this.longitude, this.latitude, this.elevation);
    },

    toDmsString: function () {
      throw 'GeoPoint.toDmsString not yet implemented.';

      var latDms = AtlasMath.toDMS(this.latitude),
          lngDms = AtlasMath.toDMS(this.longitude),
          latMarker = this.latitude < 0 ? 'S' : 'N',
          lngMarker = this.longitude < 0 ? 'W' : 'E',
          dms = '';
    }

  }),
    {
      // -------------------------------------------
      // STATICS
      // -------------------------------------------
      /**
       * Constructs a new GeoPoint from a Vertex object.
       * @param {atlas.model.Vertex} vertex - The vertex.
       * @param {Number} vertex.x - The longitude (horizontal position) in decimal degrees.
       * @param {Number} vertex.y - The latitude (vertical position) in decimal degrees.
       * @param {Number} vertex.z - The elevation in metres.
       * @returns {GeoPoint}
       */
      fromVertex: function (vertex) {
        if (!vertex) { return new GeoPoint(); }
        return new GeoPoint(vertex.y, vertex.x, vertex.y);
      },

      /**
       * Constructs a new GeoPoint from an object containing properties for latitude,
       * longitude, and height.
       * @param other - The object containing the geospatial data.
       * @returns {atlas.model.GeoPoint}
       */
      fromLatLngHeight: function (other) {
        return new GeoPoint(other.lat, other.lng, other.height);
      }
    }
  );
});