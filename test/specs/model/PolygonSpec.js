define([
  'atlas/events/EventManager',
  // Code under test
  'atlas/model/Polygon',
  'atlas/model/GeoPoint',
  'atlas/util/WKT'
], function(EventManager, Polygon, GeoPoint, WKT) {
  describe('A Polygon', function() {

    var polygon, footprint, centroid, area, constructArgs, vertices, eventManager;

    beforeEach(function() {
      footprint =
          'POLYGON ((-37.826731495464358 145.237709744708383,-37.82679037235421 145.237705952915746,-37.826788424406047 145.237562742764595,-37.826747996976231 145.237473553563689,-37.826702438444919 145.237482137149016,-37.82670417818575 145.237710588552915,-37.826731495464358 145.237709744708383))';
      centroid =
          new GeoPoint({longitude: 145.2376011191871, latitude: -37.82674343831081, elevation: 0});
      area = 184.8778;
      var id = 12345;
      var data = {
        vertices: footprint
      };
      eventManager = new EventManager({dom: {}, event: {}, render: {}});
      constructArgs = {
        renderManager: {},
        eventManager: eventManager
      };
      vertices = WKT.getInstance().geoPointsFromWKT(footprint);
      polygon = new Polygon(id, data, constructArgs);
    });

    afterEach(function() {
      polygon = eventManager = null;
    });

    describe('can be constructed', function() {
      it('with defaults', function() {
        expect(polygon.getHeight()).toEqual(0);
        expect(polygon.getElevation()).toEqual(0);
        expect(polygon.isVisible()).toEqual(false);
        expect(polygon.isRenderable()).toEqual(false);
        expect(polygon.getStyle()).toEqual(Polygon.getDefaultStyle());
      });
    });

    it('has a centroid', function() {
      expect(polygon.getCentroid()).toEqual(centroid);
    });

    it('has an area', function() {
      expect(polygon.getArea()).toBeCloseTo(area);
    });

    it('can set height', function() {
      var value = 50;
      polygon.setHeight(value);
      expect(polygon.getHeight()).toEqual(value);
    });

    it('can set elevation', function() {
      var value = 50;
      polygon.setElevation(value);
      expect(polygon.getElevation()).toEqual(value);
    });

    it('can be translated', function() {
      var oldCentroid = polygon.getCentroid();
      var value = new GeoPoint({latitude: 0.001, longitude: 0.001});
      polygon.translate(value);
      expect(polygon.getCentroid().isCloseTo(oldCentroid.translate(value))).toBe(true);
    });

    it('can be selected and deselected', function() {
      var oldStyle = polygon.getStyle();
      polygon.setSelected(true);
      expect(polygon.getStyle()).not.toEqual(oldStyle);
      // Selecting again should not lose previous style info.
      polygon.setSelected(true);
      polygon.setSelected(false);
      expect(polygon.getStyle()).toEqual(oldStyle);
      // Deselecting again should have no effect.
      polygon.setSelected(false);
      expect(polygon.getStyle()).toEqual(oldStyle);
    });

    it('can be selected', function() {
      var spy = jasmine.createSpy();
      eventManager.addEventHandler('intern', 'entity/select', spy);
      polygon.setSelected(true);
      expect(spy.calls.count()).toEqual(1);
    });

  });
});