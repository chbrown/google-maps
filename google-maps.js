function KeyState() {
  var down = this.down = {};

  window.addEventListener('keydown', function(ev) {
    down[ev.which] = true;
  }, false);

  window.addEventListener('keyup', function(ev) {
    down[ev.which] = false;
  }, false);
}

function getPosition(callback) {
  // simply flatten the weird dual-callback getCurrentPosition API
  // to the normal function(err, ...) paradigm.
  navigator.geolocation.getCurrentPosition(function(position) {
    callback(null, position);
  }, callback);
}

var opts_frozen = {
  draggable: false,
  zoomControl: false,
  scrollwheel: false,
  disableDoubleClickZoom: true
};

var opts_interactive = {
  draggable: true,
  zoomControl: true,
  scrollwheel: true,
  disableDoubleClickZoom: false
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

function eavesdrop(emitter, events) {
  events.forEach(function(event) {
    emitter.addListener(event, function() {
      console.info(event, arguments);
      window.last_event = event;
    });
  });
}
