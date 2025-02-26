define([
  'atlas/visualisation/AbstractProjection',
  'atlas/model/Feature',
  // Code under test.
  'atlas/visualisation/DynamicProjection'
], function(AbstractProjection, Feature, DynamicProjection) {

  describe('A DynamicProjection', function() {
    var dynPrj,
        mockedPrj,
        someEntities,
        data = [
          { index: 0,
            values: {0: 0, 1: 10, 2: 20, 3: 30, 4: 40}
          },
          { index: 1,
            values: {0: 1, 1: 11, 2: 21, 3: 31, 4: 41}
          },
          { index: 2,
            values: {0: 2, 1: 12, 2: 22, 3: 32, 4: 42}
          }
        ];

    beforeEach(function() {
      someEntities = {
        0: new Feature(0, {id: 0}),
        1: new Feature(1, {id: 1}),
        2: new Feature(2, {id: 2}),
        3: new Feature(3, {id: 3}),
        4: new Feature(4, {id: 4})
      };
      someEntities[0].mockedValue = 0;
      someEntities[1].mockedValue = 1;
      someEntities[2].mockedValue = 2;
      someEntities[3].mockedValue = 3;
      someEntities[4].mockedValue = 4;
      mockedPrj = new AbstractProjection({values: {}, entities: someEntities});

      // Mock getting the previous state of the AbstractProjection. This has to be mocked
      // as the AbstractProjection doesn't know what state needs to be returned.
      mockedPrj.getPreviousState = function() {
        var state = {};
        Object.keys(this._entities).forEach(function(id) {
          state[id] = this._entities[id].mockedValue;
        }, this);
        return state;
      }.bind(mockedPrj);

      // Mock rendering using the abstract projection.
      mockedPrj.render = function() {
        Object.keys(this._entities).forEach(function(id) {
          var curVal = this._entities[id].mockedValue,
              newVal = this._values[id];
          this._effects[id] = {oldValue: curVal, newValue: newVal};
          this._entities[id].mockedValue = newVal;
        }, this);
      }.bind(mockedPrj);
      // Mock unrendering using the abstract projection.
      mockedPrj.unrender = function() {
        Object.keys(this._entities).forEach(function(id) {
          delete this._effects[id];
          this._entities[id].mockedValue = id;
        }, this);
      }.bind(mockedPrj);
    });

    describe('can be constructed', function() {

      it('by default', function() {
        dynPrj = new DynamicProjection(mockedPrj, data);
        expect(dynPrj).not.toBeNull();
      });
    });

    describe('once constructed', function() {
      beforeEach(function() {
        jasmine.Clock.useMock();
        dynPrj = new DynamicProjection(mockedPrj, data);
        spyOn(dynPrj, '_render').andCallThrough();
      });

      afterEach(function() {
        mockedPrj = null;
        dynPrj = null;
        someEntities = null;
      });

      it('can be started', function() {
        dynPrj.start();
        expect(dynPrj.getStatus()).toEqual('playing');
        expect(dynPrj._initial).toEqual({0: 0, 1: 1, 2: 2, 3: 3, 4: 4});
        for (var tick = 0; tick < 3; tick++) {
          jasmine.Clock.tick(1000);
          Object.keys(someEntities).forEach(function(id) {
            expect(someEntities[id].mockedValue).toEqual(data[tick].values[id]);
          });
        }
      });

      it('can be paused', function() {
        dynPrj.start();
        jasmine.Clock.tick(2000);
        dynPrj.pause();
        expect(dynPrj.getStatus()).toEqual('paused');
        // Should have rendered the second set of values, time passing shouldn't change this.
        jasmine.Clock.tick(2000);
        Object.keys(someEntities).forEach(function(id) {
          expect(someEntities[id].mockedValue).toEqual(data[1].values[id]);
        });
      });

      it('can be resumed', function() {
        dynPrj.start();
        jasmine.Clock.tick(2000);
        dynPrj.pause();
        expect(dynPrj.getStatus()).toEqual('paused');
        jasmine.Clock.tick(2000);
        dynPrj.start();
        expect(dynPrj.getStatus()).toEqual('playing');
        jasmine.Clock.tick(1000);
        // Third set of data (index = 2) should be rendered now.
        Object.keys(someEntities).forEach(function(id) {
          expect(someEntities[id].mockedValue).toEqual(data[2].values[id]);
        });
      });

      it('should end', function() {
        dynPrj.start();
        jasmine.Clock.tick(5000);
        expect(dynPrj.getStatus()).toEqual('ended');
        // Third set of data (index = 2) should still be rendered now.
        Object.keys(someEntities).forEach(function(id) {
          expect(someEntities[id].mockedValue).toEqual(data[2].values[id]);
        });
      });

      it('can be stopped', function() {
        dynPrj.start();
        jasmine.Clock.tick(1000);
        expect(dynPrj.getStatus()).toEqual('playing');
        // Third set of data (index = 1) should still be rendered now.
        Object.keys(someEntities).forEach(function(id) {
          expect(someEntities[id].mockedValue).toEqual(data[0].values[id]);
        });
        dynPrj.stop();
        expect(dynPrj.getStatus()).toEqual('stopped');
        // Effects of rendering should have been removed.
        Object.keys(someEntities).forEach(function(id) {
          expect(someEntities[id].mockedValue).toEqual(id);
        });
      });
    })
  })
});
