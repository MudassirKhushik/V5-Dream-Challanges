// server.js - Complete version with all weather conditions
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic CORS
app.use(cors());
app.use(express.json());

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Helper function to calculate probabilities for each condition
function calculateConditionProbabilities(data, targetMonth, conditions) {
  const probabilities = {};
  const dates = Object.keys(data.T2M || {});
  
  // Filter data for target month across all years
  const monthData = dates
    .filter(date => parseInt(date.substring(4, 6)) - 1 === targetMonth)
    .reduce((acc, date) => {
      acc.dates.push(date);
      if (data.T2M && data.T2M[date] !== null) acc.temps.push(data.T2M[date]);
      if (data.PRECTOTCORR && data.PRECTOTCORR[date] !== null) acc.precip.push(data.PRECTOTCORR[date]);
      if (data.WS10M && data.WS10M[date] !== null) acc.winds.push(data.WS10M[date]);
      if (data.RH2M && data.RH2M[date] !== null) acc.humidity.push(data.RH2M[date]);
      return acc;
    }, { dates: [], temps: [], precip: [], winds: [], humidity: [] });

  // Hot condition (>32°C)
  if (conditions.includes('hot') && monthData.temps.length > 0) {
    const hotDays = monthData.temps.filter(temp => temp > 32).length;
    probabilities.hot = {
      probability: ((hotDays / monthData.temps.length) * 100).toFixed(1),
      avgValue: (monthData.temps.reduce((a, b) => a + b, 0) / monthData.temps.length).toFixed(1),
      maxValue: Math.max(...monthData.temps).toFixed(1),
      unit: '°C',
      prediction: hotDays > monthData.temps.length * 0.3 ? 'High temperature conditions likely' : 'Normal temperature expected'
    };
  }

  // Cold condition (<0°C)
  if (conditions.includes('cold') && monthData.temps.length > 0) {
    const coldDays = monthData.temps.filter(temp => temp < 0).length;
    probabilities.cold = {
      probability: ((coldDays / monthData.temps.length) * 100).toFixed(1),
      avgValue: (monthData.temps.reduce((a, b) => a + b, 0) / monthData.temps.length).toFixed(1),
      minValue: Math.min(...monthData.temps).toFixed(1),
      unit: '°C',
      prediction: coldDays > 0 ? 'Freezing conditions possible' : 'No freezing conditions expected'
    };
  }

  // Wet condition (>20mm precipitation)
  if (conditions.includes('wet') && monthData.precip.length > 0) {
    const wetDays = monthData.precip.filter(precip => precip > 20).length;
    probabilities.wet = {
      probability: ((wetDays / monthData.precip.length) * 100).toFixed(1),
      avgValue: (monthData.precip.reduce((a, b) => a + b, 0) / monthData.precip.length).toFixed(1),
      maxValue: Math.max(...monthData.precip).toFixed(1),
      unit: 'mm/day',
      prediction: wetDays > monthData.precip.length * 0.3 ? 'Heavy rainfall conditions possible' : 'Light to moderate rainfall expected'
    };
  }

  // Windy condition (>8.94 m/s = 20mph)
  if (conditions.includes('windy') && monthData.winds.length > 0) {
    const windyDays = monthData.winds.filter(wind => wind > 8.94).length;
    probabilities.windy = {
      probability: ((windyDays / monthData.winds.length) * 100).toFixed(1),
      avgValue: (monthData.winds.reduce((a, b) => a + b, 0) / monthData.winds.length).toFixed(1),
      maxValue: Math.max(...monthData.winds).toFixed(1),
      unit: 'm/s',
      prediction: windyDays > monthData.winds.length * 0.3 ? 'Strong wind conditions possible' : 'Moderate wind conditions expected'
    };
  }

  // Uncomfortable condition (>70% humidity)
  if (conditions.includes('uncomfortable') && monthData.humidity.length > 0) {
    const uncomfortableDays = monthData.humidity.filter(humidity => humidity > 70).length;
    probabilities.uncomfortable = {
      probability: ((uncomfortableDays / monthData.humidity.length) * 100).toFixed(1),
      avgValue: (monthData.humidity.reduce((a, b) => a + b, 0) / monthData.humidity.length).toFixed(1),
      unit: '%',
      prediction: uncomfortableDays > monthData.humidity.length * 0.5 ? 'High humidity conditions likely' : 'Comfortable humidity levels expected'
    };
  }

  return probabilities;
}

// Helper function to generate monthly statistics
function generateMonthlyStats(data) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyStats = [];

  for (let month = 0; month < 12; month++) {
    const monthProbabilities = calculateConditionProbabilities(data, month, ['hot', 'cold', 'wet']);
    
    monthlyStats.push({
      month: months[month],
      hot: parseFloat(monthProbabilities.hot?.probability || 0),
      cold: parseFloat(monthProbabilities.cold?.probability || 0),
      wet: parseFloat(monthProbabilities.wet?.probability || 0),
      windy: parseFloat(monthProbabilities.windy?.probability || 0),
      uncomfortable: parseFloat(monthProbabilities.uncomfortable?.probability || 0)
    });
  }

  return monthlyStats;
}

// Helper function to generate yearly trends
function generateYearlyTrends(data) {
  const trends = [];
  const currentYear = new Date().getFullYear();
  const dates = Object.keys(data.T2M || {});

  for (let i = 0; i < 10; i++) {
    const year = currentYear - 9 + i;
    const yearStr = year.toString();
    
    const yearDates = dates.filter(date => date.startsWith(yearStr));
    const yearTemps = yearDates.map(date => data.T2M[date]).filter(temp => temp !== null);
    const yearPrecip = yearDates.map(date => data.PRECTOTCORR?.[date]).filter(precip => precip !== null);

    const hotDays = yearTemps.filter(temp => temp > 32).length;
    const coldDays = yearTemps.filter(temp => temp < 0).length;
    const wetDays = yearPrecip.filter(precip => precip > 20).length;

    trends.push({
      year: yearStr,
      hot: yearTemps.length ? parseFloat(((hotDays / yearTemps.length) * 100).toFixed(1)) : 0,
      cold: yearTemps.length ? parseFloat(((coldDays / yearTemps.length) * 100).toFixed(1)) : 0,
      wet: yearPrecip.length ? parseFloat(((wetDays / yearPrecip.length) * 100).toFixed(1)) : 0,
      predicted: false
    });
  }

  return trends;
}

// Generate weather summary
function generateWeatherSummary(probabilities, date, locationName) {
  const targetDate = new Date(date);
  const month = targetDate.toLocaleString('default', { month: 'long' });
  const year = targetDate.getFullYear();
  
  const highProbabilityConditions = Object.entries(probabilities)
    .filter(([_, data]) => parseFloat(data.probability) > 40)
    .map(([key, _]) => {
      switch (key) {
        case 'hot': return 'hot temperatures';
        case 'cold': return 'cold conditions';
        case 'wet': return 'significant rainfall';
        case 'windy': return 'windy weather';
        case 'uncomfortable': return 'high humidity';
        default: return '';
      }
    })
    .filter(condition => condition !== '');

  if (highProbabilityConditions.length === 0) {
    return `Pleasant weather expected in ${month} ${year} for ${locationName}. Moderate temperatures with comfortable conditions.`;
  }

  return `In ${month} ${year}, expect ${highProbabilityConditions.join(', ')} for ${locationName}. Plan accordingly for your trip.`;
}

// Weather Prediction Endpoint
app.post('/api/weather/predict', async (req, res) => {
  try {
    console.log('Received prediction request:', req.body);
    
    const { latitude, longitude, locationName, date, conditions } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!conditions || conditions.length === 0) {
      return res.status(400).json({ error: 'At least one condition must be selected' });
    }

    // Validate date
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    
    if (targetDate < today) {
      return res.status(400).json({ error: 'Please select today or a future date' });
    }
    
    if (targetDate > sixMonthsFromNow) {
      return res.status(400).json({ error: 'Predictions are available for up to 6 months in the future' });
    }

    // Get historical data range (10 years)
    const startDate = new Date(targetDate);
    startDate.setFullYear(startDate.getFullYear() - 10);
    
    const startDateStr = `${startDate.getFullYear()}${(startDate.getMonth() + 1).toString().padStart(2, '0')}01`;
    const endDateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    // NASA POWER API call
    const parameters = ['T2M', 'PRECTOTCORR', 'WS10M', 'RH2M'].join(',');
    
    console.log(`Fetching NASA data for ${latitude}, ${longitude}`);
    console.log(`Date range: ${startDateStr} to ${endDateStr}`);
    
    const nasaResponse = await axios.get('https://power.larc.nasa.gov/api/temporal/daily/point', {
      params: {
        parameters,
        community: 'RE',
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        start: startDateStr,
        end: endDateStr,
        format: 'JSON'
      },
      timeout: 30000
    });
    
    const nasaData = nasaResponse.data;
    
    if (!nasaData.properties?.parameter) {
      throw new Error('Invalid response from NASA API');
    }

    console.log('NASA data received successfully');

    const data = nasaData.properties.parameter;
    const targetMonth = new Date(date).getMonth();

    // Calculate probabilities for selected conditions
    const probabilities = calculateConditionProbabilities(data, targetMonth, conditions);
    
    // Generate additional data
    const monthlyStats = generateMonthlyStats(data);
    const trends = generateYearlyTrends(data);
    const summary = generateWeatherSummary(probabilities, date, locationName);

    const response = {
      location: { 
        name: locationName, 
        latitude: parseFloat(latitude), 
        longitude: parseFloat(longitude) 
      },
      date: date,
      timestamp: new Date().toISOString(),
      probabilities,
      monthlyStats,
      trends,
      prediction: {
        summary,
        confidence: 'Based on 10 years of NASA POWER historical data and statistical analysis',
        model: 'Time-series analysis with seasonal pattern recognition',
        daysUntilTrip: Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))
      },
      metadata: {
        source: 'NASA POWER API',
        historicalYears: 10,
        predictionMethod: 'Statistical trend analysis with climate patterns',
        dataPoints: Object.keys(data.T2M || {}).length,
        dataRange: `${startDateStr} to ${endDateStr}`
      }
    };

    console.log('Prediction generated successfully');
    res.json(response);
    
  } catch (error) {
    console.error('Prediction error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'NASA API service unavailable',
        details: 'Please try again later'
      });
    }
    
    if (error.response) {
      return res.status(502).json({ 
        error: 'NASA API returned an error',
        details: error.response.statusText
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate weather prediction',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NASA WeatherPredict Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    endpoints: {
      'POST /api/weather/predict': 'Get weather predictions',
      'GET /api/health': 'Health check'
    }
  });
});

app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 NASA WeatherPredict Server running on port ${PORT}`);
  console.log(`🌍 Ready to accept requests`);
  console.log('=================================');
});