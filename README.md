# Getting ERA5-Land Data from Google Earth Engine

This repository provides a simple workflow to extract **daily ERA5-Land 2m air temperature** for a set of geographic points using **Google Earth Engine (GEE)**.

---

## Repository Structure

```
.
├── README.md          # Documentation
├── example.csv        # Example input points
└── main_code.js       # GEE script for data extraction
```

---

## Input Data Format

The input CSV must contain the following columns:

```csv
point_id,lat,lon
1,34.5,105.2
2,35.1,106.3
```

### Requirements:

* `point_id`: Unique identifier for each location
* `lat`: Latitude (WGS84)
* `lon`: Longitude (WGS84)

 **Important:**
Save the CSV as **UTF-8 (without BOM)** to avoid field name issues in GEE.

---

## How to Use

### Step 1: Upload CSV to Google Earth Engine

1. Go to: https://code.earthengine.google.com/
2. Open the **Assets** tab (left panel)
3. Click **NEW → Table upload**
4. Upload `example.csv`
5. After upload, copy the asset path (e.g.):

```
projects/your-username/assets/example
```

---

### Step 2: Run the GEE Script

1. Open GEE Code Editor
2. Create a new script
3. Copy contents of `main_code.js`
4. Replace the asset path:

```javascript
var rawSites = ee.FeatureCollection('YOUR_ASSET_PATH');
```

5. Click **Run**

---

### Step 3: Export Data

1. Go to the **Tasks** tab (right panel)
2. Click **RUN** for each task (one per year)
3. Choose your Google Drive folder
4. Wait for exports to complete

---

## Output

Each exported CSV contains:

| Column   | Description                 |
| -------- | --------------------------- |
| point_id | Input point identifier      |
| date     | Date (YYYY-MM-DD)           |
| temp_c   | Daily mean temperature (°C) |

---

## Data Source

* Dataset: **ERA5-Land Daily Aggregated Data**
* Provider: ECMWF
* GEE ID: `ECMWF/ERA5_LAND/DAILY_AGGR`
* Variable: `temperature_2m`

---

## ⚡ Performance Tips

Processing large numbers of points can be slow or fail in GEE.

Recommended strategies:

* Split data by **country or region**
* Process in **batches (< 5000 points)**
* Export **one year at a time** (already implemented)

---

## Common Issues

### 1. Empty `point_id` column

Cause:

* CSV saved with BOM encoding

Fix:

* Save file as **UTF-8 (no BOM)**

---

### 2. Export tasks fail

Cause:

* Too many points or too large dataset

Fix:

* Reduce number of points
* Split into batches
* Run fewer tasks simultaneously

---

## 📬 Notes

* All processing is done in **Google Earth Engine**
* Output is exported to **Google Drive**

---


