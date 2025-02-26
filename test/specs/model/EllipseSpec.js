define([
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
  // Code under test.
  'atlas/model/Ellipse'
], function(GeoPoint, Vertex, Ellipse) {
  describe ('An Ellipse', function() {
    var ellipse,
        data,
        args;

    beforeEach (function() {
      data = {
        centroid: new GeoPoint(0, 0, 0),
        semiMajor: 20,
        semiMinor: 10,
        show: false
      };

    });

    afterEach (function() {
      ellipse = null;
      args = null;
    });

    describe ('can be constructed', function() {
      it ('when all expected constructor args are given', function() {
        data.rotation = 10;
        ellipse = new Ellipse('id', data, {});
        expect(ellipse).not.toBeNull();
        expect(ellipse.getId()).toEqual('id');
        expect(ellipse.getCentroid()).toEqual(data.centroid);
        expect(ellipse.getRotation().equals({x: 10, y: 0, z: 0})).toBe(true);
        expect(ellipse.getSemiMajorAxis()).toEqual(data.semiMajor);
        expect(ellipse.getSemiMinorAxis()).toEqual(data.semiMinor);
      });

      it ('with the id in the ellipse data', function() {
        data.id = 'id';
        ellipse = new Ellipse('id', data, {});
        expect(ellipse.getId()).toEqual('id');
        expect(ellipse.getCentroid()).toEqual(data.centroid);
        expect(ellipse.getRotation().equals({x: 0, y: 0, z: 0})).toBe(true);
        expect(ellipse.getSemiMajorAxis()).toEqual(data.semiMajor);
        expect(ellipse.getSemiMinorAxis()).toEqual(data.semiMinor);
      });
    }); // End 'can be constructed'

    describe ('cannot be constructed when', function() {
      it ('an ID is not provided', function() {
        var noId = function() {
          ellipse = new Ellipse(data, {});
        };
        expect(noId).toThrow();
      });

      it ('a centroid is not provided', function() {
        delete data.centroid;
        var fails = function() {
          new Ellipse('id', data);
        };
        expect(fails).toThrow();
      })

      it ('the semi major or minor axis is not provided', function() {
        var noSemiMajor = function() {
              delete data.semiMajor;
              new Ellipse('id', data);
            },
            noAxes = function() {
              delete data.semiMajor;
              delete data.semiMinor;
              new Ellipse('id', data);
            };
        expect(noSemiMajor).toThrow();
        expect(noAxes).toThrow();
      })
    }); // End 'cannot be constructed when'

    describe ('can be modified', function() {
      beforeEach (function() {
        ellipse = new Ellipse('id', data);
      });

      describe ('by translation', function() {
        it ('in both axis', function() {
          ellipse.translate({latitude: 5, longitude: 10});
          expect(ellipse.getCentroid()).toEqual(new GeoPoint(10, 5, 0));
        });

        it ('in semi major axis', function() {
          ellipse.translate({latitude: 5});
          expect(ellipse.getCentroid()).toEqual(new GeoPoint(0, 5, 0));
        });

        it ('in semi minor axis', function() {
          ellipse.translate({longitude: 10});
          expect(ellipse.getCentroid()).toEqual(new GeoPoint(10, 0, 0));
        });
      }); // End 'by translation'

      describe ('by scale', function() {

        it ('in both axis', function() {
          ellipse.scale({x: 2, y: 0.5});
          expect(ellipse.getSemiMajorAxis()).toEqual(2 * data.semiMajor);
          expect(ellipse.getSemiMinorAxis()).toEqual(0.5 * data.semiMinor);
        });

        it ('in the semi major axis', function() {
          ellipse.scale({x: 2});
          expect(ellipse.getSemiMajorAxis()).toEqual(2 * data.semiMajor);
          expect(ellipse.getSemiMinorAxis()).toEqual(data.semiMinor);
        });

        it ('in the semi minor axis', function() {
          ellipse.scale({y: 0.5});
          expect(ellipse.getSemiMinorAxis()).toEqual(0.5 * data.semiMinor);
        });

        it ('and flips semi major and semi minor axis if required', function() {
          ellipse.scale({x: 1, y: 3});
          expect(ellipse.getSemiMajorAxis()).toEqual(3 * data.semiMinor);
          expect(ellipse.getSemiMinorAxis()).toEqual(data.semiMajor);
          expect(ellipse.getRotation()).toEqual(new Vertex({z: 90}));
        });
      }); // End 'by scale'
    }); // End 'can be modified'
  }); // End 'An Ellipse'
});
