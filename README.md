## maps

Tools for doing things with the Google API more quickly and/or easily than with plain Google Maps.

### [chbrown.github.io/maps/](http://chbrown.github.io/maps/)

Features:

1. Memory. Current map `center` and `zoom` level persist across page loads.
2. Stateful. Saves queries, drawn shapes, and marked points.
3. Standard. GeoJSON: all coordinates are given in (longitude, latitude) pairs.
    * This is what Twitter's streaming API requires, for example.
4. Search. Uses Google's Geocoder to navigate to new places quickly, Automatically saving them as features.

<!--- Google API Key: AIzaSyCDYwRP0wOSFFgzJDr73JtketDW335C234 -->

## Standards (GeoJSON vs Google, Twitter, etc.)

Pairs of coordinates in the [GeoJSON spec](http://www.geojson.org/geojson-spec.html) are always `(long, lat)`.
This is backwards from Google, Twitter, and Leaflet pairs.

**GeoJSON ordering** for a `[0, 1]` pair:

|    | 0, | 1 |
|:---|:---|:--|
| cartesian | x | y |
| projected | easting | northing |
| geographic | longitude | latitude |

Twitter has two formal geolocation attributes:

* `geo` (_deprecated_): backwards from GeoJSON (long, lat). This pretends to be a geometry object but gets it wrong.
* `coordinates`: This is a GeoJSON geometry object, fully GeoJSON-compliant. Most often, `coordinates.type` will be "Point".
    + `coordinates.coordinates`, where supplied, is a `[longitude, latitude]` pair.

GeoJSON features can have `bbox` fields, which are always 2N-long, where N = the number of dimensions.
For most geolocation, N = 2, so this field is 4-long. The order is:

|  | 0, | 1, | 2, | 3 |  |
|:-|:---|:---|:---|:--|:-|
| [ | southwest longitude | southwest latitude | northeast longitude | northeast latitude | ] |
| [ | minimum longitude | minimum latitude | maximum longitude | maximum latitude | ] |

Southwest is the minimum (for both latitudes and longitudes), northeast is maximum.

E.g., here's a simple little snippet of GeoJSON for the whole earth:

```json
{
  "type": "Feature",
  "bbox": [-180.0, -90.0, 180.0, 90.0],
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
        [-180.0, -90.0, 180.0, 90.0]
    ]]
  },
  "properties": {
    "name": "The whole world"
  }
}
```

Luckily, Twitter got the order right in the streaming API locations query.

So, we can query from the whole globe with the following url:

    https://stream.twitter.com/1.1/statuses/filter.json?locations=-180,-90,180,90


### Twitter

`geo` and `coordinates` might both be null, or other types of geometries, but those parts of a tweet might look like this:

```json
{
  "geo": {
    "type": "Point",
    "coordinates": [
      <latitude>,
      <longitude>
    ]
  },
  "coordinates": {
    "type": "Point",
    "coordinates": [
      <longitude>,
      <latitude>
    ]
  }
}
```

Twitter sometimes only returns ["place"](https://dev.twitter.com/docs/platform-objects/places) [attributes](https://dev.twitter.com/docs/about-geo-place-attributes). This is kind of like a GeoJSON feature, but has a predictable set of values:

```json
{
  "place": {
    "id": "1d9a5370a355ab0c",
    "url": "https://api.twitter.com/1.1/geo/id/1d9a5370a355ab0c.json",
    "place_type": "city",
    "name": "Chicago",
    "full_name": "Chicago, IL",
    "country_code": "US",
    "country": "United States",
    "attributes": {},
    "bounding_box": {
      "type": "Polygon",
      "coordinates": [[
        [-88.097, 37.771],
        [-88.097, 41.761],
        [-84.784, 41.761],
        [-84.784, 37.771]
      ]]
    }
  },
  ...
}
```

The `bounding_box` sub-object above is a true GeoJSON geometry, with `[long, lat]` pairs.
You can tell pretty quickly with this one because, if a place had latitudes around -84 or -88, it'd be in the Antarctic. Not impossible, but unlikely.
Of course, no latitudes are greater than 90 or less than -90, and most tweets come from somewhere between the Arctic (+66 latitude) and Antarctic (-66 latitude) circles.


### Google maps

When you search for a coordinate pair, Google expects _latitude,longitude_ pairs.


## Links

Sources

* https://developers.google.com/maps/documentation/javascript/
    * https://developers.google.com/maps/documentation/javascript/reference
    * https://developers.google.com/maps/documentation/javascript/examples/drawing-tools
* http://mapscripting.com/how-to-use-geolocation-in-mobile-safari

Alternatives

* http://boundingbox.klokantech.com/

Other cool maps

* https://github.com/moshen/node-googlemaps.git
* http://hpneo.github.io/gmaps/

## License

Copyright 2011-2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).
