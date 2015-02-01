/*jslint browser: true */ /*globals _, google */

/** new Polygon(properties: {type: string, coordinates: number[]})

A standard GeoJSON Polygon representing a rectangle on a cartesian plane.
*/
function Polygon(properties) {
  this.type = properties.type || 'Polygon';
  this.coordinates = properties.coordinates || [];
}
Polygon.prototype.toString = function() {
  var longitudes_latitudes = _.zip.apply(null, this.coordinates);
  return [
    _.min(longitudes_latitudes[0]).toFixed(4),
    _.min(longitudes_latitudes[1]).toFixed(4),
    _.max(longitudes_latitudes[0]).toFixed(4),
    _.max(longitudes_latitudes[1]).toFixed(4)
  ].join(',');
};
Polygon.prototype.googleShape = function() {
  var longitudes_latitudes = _.zip.apply(null, this.coordinates);
  // center always returns a lon,lat pair.
  // assume all Polygons are Rectangles, for now.
  return new google.maps.Rectangle({
    // LatLngBounds(sw?:LatLng, ne?:LatLng)
    bounds: new google.maps.LatLngBounds(
      new google.maps.LatLng(_.min(longitudes_latitudes[1]), _.min(longitudes_latitudes[0])),
      new google.maps.LatLng(_.max(longitudes_latitudes[1]), _.max(longitudes_latitudes[0]))
    ),
    clickable: false
    // strokeColor: '#FF0000',
    // strokeOpacity: 0.8,
    // strokeWeight: 2,
    // fillColor: '#FF0000',
    // fillOpacity: 0.35
  });
};
Polygon.prototype.focus = function(map) {
  map.fitBounds(this.googleShape().getBounds());
};
Polygon.fromLatLngBounds = function(latLngBounds) {
  var sw = latLngBounds.getSouthWest();
  var ne = latLngBounds.getNorthEast();
  return new Polygon({
    coordinates: [
      [sw.lng(), ne.lat()], // nw
      [ne.lng(), ne.lat()], // ne
      [ne.lng(), sw.lat()], // se
      [sw.lng(), sw.lat()]  // sw
    ]
  });
};

/** new Point(properties: {type: string, coordinates: number[]})

A standard GeoJSON Point representing a single point on a cartesian plane.
*/
function Point(properties) {
  this.type = properties.type || 'Point';
  this.coordinates = properties.coordinates || [];
}
Point.prototype.toString = function() {
  return [
    this.coordinates[0].toFixed(4),
    this.coordinates[1].toFixed(4)
  ].join(',');
};
Point.prototype.googleShape = function() {
  return new google.maps.Marker({
    // GeoJSON is [longitude, latitude]
    position: new google.maps.LatLng(this.coordinates[1], this.coordinates[0]),
    clickable: false
  });
};
Point.prototype.focus = function(map) {
  map.setCenter(this.googleShape().getPosition());
};
Point.fromLatLng = function(latLng) {
  return new Point({
    coordinates: [latLng.lng(), latLng.lat()]
  });
};
