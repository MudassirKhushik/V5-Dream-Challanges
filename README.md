# Astro Forecast

<div align="center">

![NASA POWER Data](https://img.shields.io/badge/NASA-POWER%2520Data-blue?style=for-the-badge\&logo=nasa)
![React](https://img.shields.io/badge/React-18.2.0-61dafb?style=for-the-badge\&logo=react)
![Node.js + Express](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge\&logo=node.js)

</div>

---

**Astro Forecaste** is a MERN-stack web application that provides probabilistic, location-based weather outlooks up to **6 months (180 days)** ahead using NASA's POWER (Prediction Of Worldwide Energy Resources) dataset. It blends historical climatology with statistical time-series and probabilistic methods to present seasonal forecasts for temperature, precipitation, wind, humidity and solar radiation.

---

## Live Demo
https://v5-dream-challanges-afbe.vercel.app/

## Table of contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Demo Badges](#demo-badges)
* [Installation](#installation)

  * [Prerequisites](#prerequisites)
  * [Setup](#setup)
* [Usage](#usage)

  * [Select Location](#select-location)
  * [Choose Date & Conditions](#choose-date--conditions)
  * [Generate Prediction](#generate-prediction)
* [API Endpoints](#api-endpoints)
* [Data & Methods](#data--methods)
* [Data Export & Reports](#data-export--reports)
* [Deployment](#deployment)
* [Contributing](#contributing)
* [License](#license)
* [Acknowledgments](#acknowledgments)

---

## Features

* **Interactive Location Selection**

  * Click on the OpenStreetMap to pick a location
  * Smart place search (Nominatim) with autocomplete
  * "Use Current Location" via browser geolocation
  * Live lat/lon display and map sync

* **Advanced Weather Prediction**

  * 6-month (180-day) probabilistic outlooks
  * Multiple conditions: very hot, very cold, very wet, very windy, humid
  * Leverages NASA POWER historical & climatology data (daily/monthly)
  * Probability analysis and percentile bands (P10/P50/P90)

* **Data Visualization**

  * 10-year historical trends
  * Monthly / seasonal pattern charts
  * Responsive charts using Recharts
  * Condition cards with probability indicators

* **Data Export**

  * CSV and JSON export
  * Full report generation (PDF/HTML export can be added)

* **UX / Accessibility**

  * Mobile-first responsive design with Tailwind
  * ARIA labels and keyboard navigation support

---

## Tech Stack

**Frontend**

* React 18 + hooks
* Tailwind CSS
* Lucide React (icons)
* Recharts (visualizations)
* Leaflet + OpenStreetMap (interactive maps)

**Backend**

* Node.js + Express
* Axios (HTTP client)
* CORS
* MongoDB (optional; recommended for caching and saved locations)

**APIs & Data**

* NASA POWER API – meteorological datasets (temperature, precipitation, wind, humidity, solar radiation)
* OpenStreetMap Nominatim – geocoding / reverse geocoding
* Leaflet tile layers – map rendering

---

## Demo Badges

You can copy these markdown badges into your README or product page:

```
https://img.shields.io/badge/NASA-POWER%2520Data-blue?style=for-the-badge&logo=nasa
https://img.shields.io/badge/React-18.2.0-61dafb?style=for-the-badge&logo=react
https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js
```

---

## Installation

### Prerequisites

* Node.js v16 or higher
* npm or yarn
* (Optional) MongoDB for caching, saved locations, and analytics

### Setup

1. Clone the repository

```bash
git clone https://github.com/your-username/astro-forecaste.git
cd astro-forecaste
```

2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
```

Example `.env` (edit values accordingly):

```
MONGODB_URI=mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.2
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
NASA_POWER_API_URL=https://power.larc.nasa.gov/api/temporal/daily/point
NOMINATIM_URL=https://nominatim.openstreetmap.org/search
```

3. Frontend setup

```bash
cd ../frontend
npm install
```

4. Run locally

```bash
# Backend
cd backend
npm start
# Backend runs on http://localhost:5000

# Frontend
cd ../frontend
npm start
# Frontend runs on http://localhost:3000
```

---

## Usage

### Select Location

* Click on the map
* Use the search bar to find places (Nominatim)
* Click "Use Current Location" for browser geolocation

### Choose Date & Conditions

* Date picker limits selection to today → up to 6 months ahead
* Conditions available:

  * 🔥 Very Hot (>32°C)
  * ❄️ Very Cold (<0°C)
  * 💧 Very Wet (>20mm precipitation)
  * 💨 Very Windy (>20 mph / 8.94 m/s)
  * 💦 Humid (>70%)

### Generate Prediction

* Click **Predict Weather** to call the backend prediction endpoint.
* Results include probability cards, a short natural-language summary, historic trend charts, and export options.

---

## API Endpoints

**Base path:** `/api`

| Method | Endpoint               | Description                                                                            |
| ------ | ---------------------- | -------------------------------------------------------------------------------------- |
| POST   | `/api/weather/predict` | Main endpoint to request a weather prediction for a point, date and list of conditions |
| GET    | `/api/health`          | Health check                                                                           |
| GET    | `/api/test`            | Test endpoint returning sample data                                                    |

**Prediction request example**

```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "locationName": "New York City",
  "date": "2024-06-15",
  "conditions": ["hot", "wet", "windy"]
}
```

**Response outline (example)**

```json
{
  "location": { "latitude": 40.7128, "longitude": -74.0060, "name": "New York City" },
  "date": "2024-06-15",
  "predictions": {
    "hot": { "probability": 0.34, "p10": 28.3, "p50": 31.2, "p90": 34.6 },
    "wet": { "probability": 0.12, "expected_mm": 6.2 }
  },
  "charts": {
    "historic": "url-or-base64-chart",
    "monthly": "url-or-base64-chart"
  },
  "metadata": { "dataSource": "NASA POWER", "powerQuery": "..." }
}
```

---

## Data & Methods

* **Data Source:** NASA POWER (Prediction Of Worldwide Energy Resources) — daily/monthly/climatology endpoints for meteorological parameters.
* **Baseline:** compute local monthly climatology (normals) from POWER historic data.
* **Forecasting approach:** ensemble of statistical time-series (SARIMA/Prophet) and probabilistic methods with optional ML refinement. 6-month output presented as probabilistic outlooks (not deterministic daily forecasts).
* **Validation:** backtest on hold-out years, compute skill metrics and show them in the UI.

**Important:** NASA POWER provides modeled and reanalysis-derived historical data; Astro Forecaste **creates** the probabilistic 6-month outlooks using statistical/ML methods on this base data — POWER itself is not an operational 6-month forecasting service.

---

## Data Export & Reports

* **CSV** – friendly for spreadsheets and offline analysis
* **JSON** – structured data for integrations and automation
* **Report** – aggregated PDF/HTML report (optional enhancement)

---

## Deployment

### Build

```bash
# Frontend build
cd frontend
npm run build

# Backend production start
cd ../backend
npm start
```

### Environment

* Set `NODE_ENV=production`
* Configure `MONGODB_URI` for production MongoDB (Atlas or managed DB)
* Configure `ALLOWED_ORIGINS` for your deployed frontend domains
* Monitor and respect NASA POWER API rate limits; implement caching for repeated queries

---

## Contributing

We welcome contributions! Please follow this flow:

1. Fork the repo
2. Create a feature branch (`feature/your-feature`)
3. Make changes and add tests where applicable
4. Open a Pull Request with a clear description

Refer to `CONTRIBUTING.md` in the repo for coding style and PR guidelines.

---

## License

This project is released under the **MIT License**. See `LICENSE` for details.

---

## Acknowledgments

* NASA — POWER API and datasets
* OpenStreetMap / Nominatim — geocoding and map tiles
* Leaflet — interactive mapping
* Recharts — charts and visualizations

---

<div align="center">

Built with ❤️ using NASA POWER Data

Accurate weather outlooks powered by space technology

</div>
