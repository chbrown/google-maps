/*jslint browser: true */ /*globals $, _, Backbone, google, Point, Polygon */

var gmap_optionset = {
  frozen: {
    draggable: false,
    zoomControl: false,
    scrollwheel: false,
    disableDoubleClickZoom: true
  },
  interactive: {
    draggable: true,
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false
  }
};

var google_map_events = [
  'bounds_changed',
  'center_changed',
  'click',
  'dblclick',
  'drag',
  'dragend',
  'dragstart',
  'heading_changed',
  'idle',
  'maptypeid_changed',
  'mousemove',
  'mouseout',
  'mouseover',
  'projection_changed',
  'resize',
  'rightclick',
  'tilesloaded',
  'tilt_changed',
  'zoom_changed',
  // undocumented, but otherwise standard DOM-level-2 MouseEvents:
  'mousedown',
  'mouseup'
];

function KeyState() {
  var down = this.down = {};
  window.addEventListener('keydown', function(ev) {
    down[ev.which] = true;
  }, false);
  window.addEventListener('keyup', function(ev) {
    down[ev.which] = false;
  }, false);
}
window.key_state = new KeyState();

/**
                                   MODELS
                                                                            */

// All GeoJSON is (lon, lat), opposite of Google (GOOG uses latLng pairs)
var Feature = Backbone.Model.extend({
  // has fields: [type, geometry, properties]
  toJSON: function() {
    return _.extend({type: 'feature'}, this.attributes);
  },
  toString: function() {
    return this.get('geometry').toString();
  },
  parse: function(response, options) {
    // have to type-boost to get a versatile Backbone model
    if (response.geometry.type == 'Point') {
      response.geometry = new Point(response.geometry);
    }
    else if (response.geometry.type == 'Polygon') {
      response.geometry = new Polygon(response.geometry);
    }
    else {
      throw new Error('Unrecognized Geometry type');
    }

    return response;
  }
});
var FeatureCollection = Backbone.Collection.extend({
  model: Feature,
  initialize: function(opts) {
    if (localStorage.features) {
      this.reset(JSON.parse(localStorage.features), {parse: true});
    }

    this.on('add remove reset', this.persist, this);
  },
  persist: function() {
    localStorage.features = JSON.stringify(this.toJSON());
  }
});

/**
                                   VIEWS
                                                                            */
var FeaturesTable = Backbone.View.extend({
  // collection: FeatureCollection
  initialize: function(opts) {
    this.render();

    this.collection.on('add', this.addFeature, this);
  },
  render: function() {
    var html = _.template($('#FeaturesTable').html(), {});
    this.$el.html(html);
    this.collection.each(this.addFeature, this);
  },
  addFeature: function(feature) {
    var feature_row = new FeatureRow({model: feature});
    this.$('tbody').append(feature_row.el);
    return feature_row;
  },
  events: {
    'click button[name="clear"]': function(ev) {
      this.collection.reset();
      this.render();
    },
    'click button[name="edit"]': function(ev) {
      var replacement = new FeaturesEditor({collection: this.collection});
      this.$el.replaceWith(replacement.el);
    }
  }
});
var FeatureRow = Backbone.View.extend({
  tagName: 'tr',
  // model: Feature
  initialize: function(opts) {
    this.render();
  },
  render: function() {
    var properties = this.model.get('properties') || {};
    var html = _.template($('#FeatureRow').html(), {
      type: this.model.get('geometry').type,
      coordinates: this.model.toString(),
      label: properties.label
    });
    this.$el.html(html);
  },
  events: {
    mouseover: function(ev) {
      this.model.get('geometry').get('type');
      // center always returns a lon,lat pair.
    },
    click: function(ev) {
      if (window.key_state.down[16]) { // 16 = shift key
        this.model.collection.remove(this.model);
        this.remove();
      }
      else {
        this.model.trigger('focus');
      }
    }
  }
});
var FeaturesEditor = Backbone.View.extend({
  // collection: FeatureCollection
  initialize: function(opts) {
    this.render();
  },
  render: function() {
    var html = _.template($('#FeaturesEditor').html(), {
      json: JSON.stringify(this.collection, null, '  ')
    });
    this.$el.html(html);

    var self = this;
    setTimeout(function() {
      self.$('textarea').flexible();
    }, 50);
  },
  events: {
    'click button[name="save"]': function(ev) {
      var json_string = this.$('textarea').val();
      this.collection.reset(JSON.parse(json_string), {parse: true});
      var replacement = new FeaturesTable({collection: this.collection});
      this.$el.replaceWith(replacement.el);
    }
  }
});

var FeaturesMap = Backbone.View.extend({
  // collection: FeatureCollection
  initialize: function(opts) {
    this.map = opts.map;
    this.render();
    this.collection.on('add', this.addFeature, this);
  },
  render: function() {
    this.collection.each(this.addFeature, this);
  },
  addFeature: function(feature) {
    return new MappedFeature({model: feature, map: this.map});
  }
});
var MappedFeature = Backbone.View.extend({
  // model: Feature
  initialize: function(opts) {
    var geometry = this.model.get('geometry');
    var shape = geometry.googleShape();
    shape.setMap(opts.map);
    this.model.on('remove', function() {
      shape.setMap(null);
    });
    this.model.on('focus', function() {
      geometry.focus(opts.map);
    });
  }
});

var MouseCoordinatesView = Backbone.View.extend({
  initialize: function(opts) {
    var precision = opts.precision || 8;
    this.$el.html(_.template($('#MouseCoordinatesView').html()));

    var self = this;
    opts.map.addListener('mousemove', function(ev) {
      self.$('.latitude').text(ev.latLng.lat().toFixed(precision));
      self.$('.longitude').text(ev.latLng.lng().toFixed(precision));
    });
  }
});

var SearchView = Backbone.View.extend({
  initialize: function(opts) {
    this.geocoder = new google.maps.Geocoder();
    this.$el.html(_.template($('#SearchView').html()));
  },
  events: {
    'submit form': function(ev) {
      ev.preventDefault();

      var self = this;
      var query = this.$('input').val();
      this.geocoder.geocode({address: query}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK && results.length) {
          var result = results[0];
          // console.log('Search found', result);

          // geometry will be a box, if it's given, otherwise just a point (for addresses)
          var geometry = null;
          if (result.geometry.bounds) {
            geometry = Polygon.fromLatLngBounds(result.geometry.bounds);
          }
          else {
            geometry = Point.fromLatLng(result.geometry.location);
          }

          var feature = new Feature({
            geometry: geometry,
            properties: {label: result.formatted_address}
          });
          self.trigger('feature', feature);

          self.$('p').html(result.formatted_address);
        }
        else {
          self.$('p').html('Geocoder failed. ' + status.toString());
        }
      });
    }
  }
});
