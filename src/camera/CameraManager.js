define([
  'atlas/camera/Camera',
  'atlas/core/Manager',
  'atlas/model/GeoPoint',
  'atlas/model/Rectangle',
  'atlas/lib/Q',
  'atlas/lib/utility/Counter',
  'atlas/lib/utility/Log',
  'atlas/lib/utility/Setter',
  'atlas/util/DeveloperError',
  'underscore'
], function(Camera, Manager, GeoPoint, Rectangle, Q, Counter, Log, Setter,
            DeveloperError, _) {

  /**
   * @typedef atlas.camera.CameraManager
   * @ignore
   */
  var CameraManager;

  /**
   * @classdesc The CameraManager manages the current camera and exposes a API for creating
   * and removing 'Bookmarks' which contain a snapshot of a Camera position and orientation.
   * The Camera manager also links the current Camera object to the Atlas event system.
   *
   * @param {Object} managers - A mapping of Atlas manager types to the Manager instance.
   * @param {Object} [options] - Options to control the CameraManager's behaviour.
   *
   * @class atlas.camera.CameraManager
   * @extends atlas.core.Manager
   */
  CameraManager = Manager.extend(/** @lends atlas.camera.CameraManager# */ {

    _id: 'camera',

    /**
     * The current Camera.
     * @type atlas.camera.Camera
     */
    _current: null,

    /**
     * List of currently saved Bookmarks.
     * @type Object
     */
    _bookmarks: null,

    _init: function(managers, options) {
      this._super.apply(this, arguments);
      this._options = Setter.mixin({
        forceCustomControl: true
      }, options);
    },

    /**
     * Used to set up parts of the CameraManager that require other Atlas managers to already
     * be created.
     */
    setup: function() {
      this._current = new Camera({renderManager: this._managers.render});
      this._bindEvents();
    },

    // Binds event handlers with the Event Manager
    _bindEvents: function() {
      var handlers = [
        {
          source: 'extern',
          name: 'camera/zoomTo',
          /**
           * @param {ExternalEvent#event:camera/zoomTo} args
           * @listens ExternalEvent#camera/zoomTo
           */
          callback: function(args) {
            var df = Q.defer();
            var position = args.position;
            var ids = args.ids;
            var promise;
            if (position) {
              // Use the default elevation if only latitude and longitude are provided.
              if (position.elevation === undefined) {
                position.elevation = Camera.getDefaultPosition().elevation;
              }
              args.position = new GeoPoint(position);
              promise = this._current.zoomTo(args);
            } else if (args.address) {
              promise = this._current.zoomToAddress(args.address);
            } else if (args.rectangle) {
              args.rectangle = new Rectangle(args.rectangle);
              promise = this._current.zoomTo(args);
            } else if (ids) {
              var entityManager = this._managers.entity;
              var rootIds = _.filter(ids, function(id) {
                var entity = entityManager.getById(id);
                return entity && !entity.getParent();
              });
              var collection = entityManager.createCollection(null, {entities: rootIds});
              collection.ready().then(function() {
                var boundingBox = collection.getBoundingBox({
                  useCentroid: Setter.def(args.useCentroid, rootIds.length > 300)
                });
                if (boundingBox) {
                  args.rectangle = boundingBox.scale(Setter.def(args.boundingBoxScale, 1.5));
                  promise = this._current.zoomTo(args);
                } else {
                  promise = Q.reject('Could not zoom to collection - no bounding box');
                }
                // Remove children before reming the
                _.each(collection.getChildren(), function(child) {
                  collection.removeEntity(child.getId());
                });
                collection.remove();
                df.resolve(promise);
              }.bind(this));
            } else {
              promise = Q.reject('Invalid arguments for event "camera/zoomTo"');
            }
            // "ids" are handled asynchronously, so this resolves the promise only if it is defined.
            promise && df.resolve(promise);
            args.callback && args.callback(df.promise);
          }.bind(this)
        },
        {
          source: 'extern',
          name: 'camera/current',
          callback: function(args) {
            args.callback(this._current);
          }.bind(this)
        },
        {
          source: 'extern',
          name: 'camera/zoomIn',
          callback: function(args) {
            this._current.zoom(Setter.merge({direction: -1}, args));
          }.bind(this)
        },
        {
          source: 'extern',
          name: 'camera/zoomOut',
          callback: function(args) {
            this._current.zoom(Setter.merge({direction: 1}, args));
          }.bind(this)
        }
      ];
      this._managers.event.addEventHandlers(handlers);
    },

    _bindControlEvents: function() {
      var handlers = [
        {
          source: 'intern',
          name: 'input/leftdown',
          callback: this._updateControl.bind(this)
        },
        {
          source: 'intern',
          name: 'input/rightdown',
          callback: this._updateControl.bind(this)
        },
        {
          source: 'intern',
          name: 'input/middledown',
          callback: this._updateControl.bind(this)
        },
        {
          source: 'intern',
          name: 'input/leftup',
          callback: this._stopControl.bind(this)
        },
        {
          source: 'intern',
          name: 'input/rightup',
          callback: this._stopControl.bind(this)
        },
        {
          source: 'intern',
          name: 'input/middleup',
          callback: this._stopControl.bind(this)
        }
      ];
      this._managers.event.addEventHandlers(handlers);
    },

    /**
     * @return {atlas.model.Camera} The currently active camera.
     */
    getCurrentCamera: function() {
      return this._current;
    },

    getCameraMetrics: function() {
      return this._current.getStats();
    },

    _updateControl: function(event) {
      var pos = event.pos
      this._control = this._control || {};

      if (this._managers.entity.getAt(pos).length > 0) {
        return;
      }

      this._control.inControl = true;
      this._control.action = event.button;
      Log.debug('CameraManager', 'updating control', this._control.action);
      this._control.curPos = pos;
      var handler = this._current.inputHandlers[this._control.action];
      handler && handler(event);
    },

    _stopControl: function(event) {
      if (this._control && this._control.inControl) {
        Log.debug('CameraManager', 'stop control', this._control.action);
        this._control.inControl = false;
        this._current.inputHandlers[this._control.action](event);
      }
    },

    createBookmark: function() {
      var bookmark = {
        id: this._bookmarks.length,
        camera: this.getCameraMetrics
      };
      Log.debug('Created bookmark ' + id);
      this._bookmarks.push(bookmark);
      return bookmark;
    },

    removeBookmark: function() {
      throw new DeveloperError('CameraManager.removeBookmark not yet implemented.');
    },

    gotoBookmark: function(id) {
      if (!this._bookmarks[id]) {
        Log.debug('Tried to go to non-existent bookmark ' + id);
        return;
      }
      this._current.zoomTo(Setter.mixin({duration: 0}, this._bookmarks[id]));
    },

    lockCamera: function() {
    },

    unlockCamera: function() {
    }

  });

  return CameraManager;
});
