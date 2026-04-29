/*

# How to use this script in Google Earth Engine (GEE)

1. Upload your CSV (example file) to GEE

---

* Go to: https://code.earthengine.google.com/

* Open the "Assets" tab (left panel)

* Click "NEW" → "Table upload"

* Upload your CSV file (must contain columns like: point_id, lat, lon)

* After upload finishes, click the asset and copy its path, e.g.:
  "projects/your-username/assets/example"

* Replace the path in this script:
  var rawSites = ee.FeatureCollection('YOUR_ASSET_PATH');

---

2. Run the script

---

* Click "Run" in the Code Editor
* The script will create multiple export tasks (one per year)

---

3. Export tasks (VERY IMPORTANT)

---

* Go to the "Tasks" tab (right panel)
* You MUST manually click "RUN" for each task
* Choose Google Drive folder if prompted
* Wait until all tasks finish

---

4. Output format

---

Each CSV will contain:

* point_id   : your original point ID
* date       : YYYY-MM-DD
* temp_c     : daily mean temperature (°C)

---

5. Performance tips (important for large datasets)

---

* Too many points will make the script slow or fail

* Recommended:
  • Split your dataset by country or region
  • Run each country separately
  • Or limit number of points per run (< 5,000 suggested)

* You can also:
  • Reduce number of years
  • Export fewer points per batch

---

6. Common issues

---

* Empty point_id column:
  → usually caused by BOM in CSV header
  → fix by saving CSV as "UTF-8 (no BOM)"

* Tasks fail:
  → too many points or too large area
  → split into smaller groups

===========================================================
*/

// Years to process (each year will be exported as a separate CSV)
var YEARS = [2018, 2019, 2020, 2021, 2022];

// Load uploaded CSV asset as a FeatureCollection
var rawSites = ee.FeatureCollection('projects/ee-hecheng1111/assets/example');

// Inspect original properties (important for debugging field names)
var first = ee.Feature(rawSites.first());
var propNames = ee.List(first.propertyNames());
print('Raw property names:', propNames);

// Automatically detect the ID field
// Removes known columns (lat, lon, system:index)
// The remaining field is assumed to be the point identifier
var idField = ee.String(
  propNames
    .remove('lat')
    .remove('lon')
    .remove('system:index')
    .get(0)
);

print('Detected id field:', idField);
print('Raw first feature:', first);

// Convert table rows to point geometries
// Also standardize the ID field to "point_id"
var sites = rawSites.map(function(f) {
  f = ee.Feature(f);

  // Convert coordinates (handle string or numeric input)
  var lon = ee.Number.parse(ee.String(f.get('lon')));
  var lat = ee.Number.parse(ee.String(f.get('lat')));

  // Extract ID using detected field (robust to BOM issues)
  var pointId = ee.String(f.get(idField));

  // Create point geometry and attach standardized ID
  return ee.Feature(ee.Geometry.Point([lon, lat]))
    .set('point_id', pointId);
});

// Debug: verify point_id is correctly assigned
print('Clean first site:', sites.first());
print('Point IDs preview:', sites.aggregate_array('point_id').slice(0, 10));

// Loop over each year and export separately
YEARS.forEach(function(year) {

  var start = ee.Date.fromYMD(year, 1, 1);
  var end = start.advance(1, 'year');

  // Load ERA5-Land daily temperature and convert Kelvin → Celsius
  var era5Year = ee.ImageCollection('ECMWF/ERA5_LAND/DAILY_AGGR')
    .filterDate(start, end)
    .select('temperature_2m')
    .map(function(img) {
      return img
        .subtract(273.15)
        .rename('temp_c')
        .copyProperties(img, ['system:time_start']);
    });

  // Extract temperature for each point for each day
  var results = era5Year.map(function(img) {

    var date = ee.Date(img.get('system:time_start')).format('YYYY-MM-dd');

    // Use reduceRegions to preserve input feature properties (point_id)
    var daily = img.reduceRegions({
      collection: sites,
      reducer: ee.Reducer.first(),  // extract pixel value
      scale: 11132                  // ERA5 resolution (~0.1 degree)
    });

    // Reformat output structure
    return daily.map(function(f) {
      return ee.Feature(null, {
        point_id: ee.String(f.get('point_id')),
        date: date,
        temp_c: f.get('first')  // reducer output
      });
    });
  }).flatten();

  // Preview a few rows for sanity check
  print('Preview ' + year, results.limit(5));

  // Export one CSV per year to Google Drive
  Export.table.toDrive({
    collection: results,
    description: 'ERA5_' + year,
    folder: 'ERA5_by_site',
    fileNamePrefix: 'ERA5_' + year,
    fileFormat: 'CSV',
    selectors: ['point_id', 'date', 'temp_c']
  });
});

// Summary info
print('Total sites:', sites.size());
print('Tasks created:', YEARS.length);
