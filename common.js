"use strict"; /*jslint indent: 2, browser: true, devel: true */ /*globals $ */

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

function eavesdrop(emitter, events) {
  events.forEach(function(event) {
    emitter.addListener(event, function() {
      console.info(event, arguments);
      window.last_event = event;
    });
  });
}
