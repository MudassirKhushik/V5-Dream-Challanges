import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Loader2,
  MapPin,
  Calendar,
  Download,
  Share2,
  Sun,
  Snowflake,
  CloudRain,
  Home,
  BarChart3,
  Info,
  Search,
  History,
  Trash2,
  Mail,
  MessageCircle,
  Twitter,
  Facebook,
  Copy,
  CheckCircle,
  Menu,
  X,
  CloudSun,
  CloudDrizzle,
  Wind,
  Droplets,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const WeatherPredict = () => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);

  const getDateLimits = () => {
    const today = new Date();
    const minDate = today.toISOString().split("T")[0];
    const max = new Date();
    max.setMonth(max.getMonth() + 6);
    const maxDate = max.toISOString().split("T")[0];
    return { minDate, maxDate };
  };
  const { minDate, maxDate } = getDateLimits();

  // Popular cities for quick search
  const popularCities = [
    { name: "Hyderabad, India", lat: 17.385, lon: 78.4867 },
    { name: "Mumbai, India", lat: 19.076, lon: 72.8777 },
    { name: "Delhi, India", lat: 28.7041, lon: 77.1025 },
    { name: "Bangalore, India", lat: 12.9716, lon: 77.5946 },
    { name: "Chennai, India", lat: 13.0827, lon: 80.2707 },
    { name: "Kolkata, India", lat: 22.5726, lon: 88.3639 },
    { name: "New York, USA", lat: 40.7128, lon: -74.006 },
    { name: "London, UK", lat: 51.5074, lon: -0.1278 },
    { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
    { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  ];

  // Enhanced color scheme
  const colors = {
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
    secondary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    weather: {
      hot: {
        bg: "bg-gradient-to-br from-orange-50 to-red-50",
        border: "border-orange-200",
        text: "text-orange-700",
        icon: "text-orange-500",
        probability: {
          high: "text-red-600",
          medium: "text-orange-600",
          low: "text-yellow-600",
        },
      },
      cold: {
        bg: "bg-gradient-to-br from-blue-50 to-cyan-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: "text-blue-500",
        probability: {
          high: "text-blue-600",
          medium: "text-cyan-600",
          low: "text-sky-600",
        },
      },
      wet: {
        bg: "bg-gradient-to-br from-indigo-50 to-purple-50",
        border: "border-indigo-200",
        text: "text-indigo-700",
        icon: "text-indigo-500",
        probability: {
          high: "text-purple-600",
          medium: "text-indigo-600",
          low: "text-violet-600",
        },
      },
      windy: {
        bg: "bg-gradient-to-br from-gray-50 to-slate-50",
        border: "border-gray-200",
        text: "text-gray-700",
        icon: "text-gray-500",
        probability: {
          high: "text-gray-600",
          medium: "text-slate-600",
          low: "text-stone-600",
        },
      },
      humid: {
        bg: "bg-gradient-to-br from-green-50 to-emerald-50",
        border: "border-green-200",
        text: "text-green-700",
        icon: "text-green-500",
        probability: {
          high: "text-emerald-600",
          medium: "text-green-600",
          low: "text-lime-600",
        },
      },
    },
  };

  // Auto-detect location on component mount
  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("weatherSearchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("weatherSearchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Load Leaflet dynamically
  useEffect(() => {
    if (!document.querySelector("#leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize or update map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    if (mapInstanceRef.current) return; // prevent multiple initializations

    const map = window.L.map(mapRef.current, { zoomControl: false }).setView(
      [20, 0],
      2
    );
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    map.on("click", (e) => handleMapClick(e.latlng));
    mapInstanceRef.current = map;
  }, [mapLoaded]);

  // --- Functions ---
  const handleMapClick = (latlng) => {
    const lat = latlng.lat;
    const lon = latlng.lng;
    setCoordinates({ lat, lon });
    updateMapMarker(lat, lon, "Selected location");
    reverseGeocode(lat, lon);
  };

  const updateMapMarker = (lat, lon, title = "Location") => {
    if (!mapInstanceRef.current) return;
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
    }
    markerRef.current = window.L.marker([lat, lon])
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${title}</b><br>${lat.toFixed(4)}, ${lon.toFixed(4)}`)
      .openPopup();
    mapInstanceRef.current.setView([lat, lon], 10);
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      const data = await res.json();
      if (data?.display_name) {
        setSelectedLocation(data.display_name);
      } else {
        setSelectedLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch {
      setSelectedLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  };

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setSearchSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationSelect = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);

    setSelectedLocation(suggestion.display_name);
    setCoordinates({ lat, lon });
    updateMapMarker(lat, lon, suggestion.display_name);
    setShowSuggestions(false);

    // Focus back on input but clear suggestions
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleCitySelect = (city) => {
    setSelectedLocation(city.name);
    setCoordinates({ lat: city.lat, lon: city.lon });
    updateMapMarker(city.lat, city.lon, city.name);
    setShowSuggestions(false);
  };

  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordinates({ lat: latitude, lon: longitude });
        updateMapMarker(latitude, longitude, "You are here");
        await reverseGeocode(latitude, longitude);
        setLocationLoading(false);
      },
      () => {
        setError("Could not get location");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const addToSearchHistory = (location, date, data) => {
    const newSearch = {
      id: Date.now(),
      location,
      date,
      coordinates: coordinates,
      timestamp: new Date().toLocaleString(),
      data: {
        probabilities: data.probabilities,
        summary: `Hot: ${data.probabilities.hot.probability}%, Cold: ${data.probabilities.cold.probability}%, Wet: ${data.probabilities.wet.probability}%`,
      },
    };

    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (item) => !(item.location === location && item.date === date)
      );
      return [newSearch, ...filtered].slice(0, 10); // Keep only last 10 searches
    });
  };

  const handleAnalyze = async () => {
    if (!coordinates.lat || !coordinates.lon)
      return setError("Select a location first");
    if (!selectedDate) return setError("Select a date");

    setLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 800)); // mock delay

    // Generate 10-day forecast data
    const generate10DayForecast = () => {
      const forecast = [];
      const today = new Date();

      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        forecast.push({
          date: date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          temperature: 20 + Math.sin(i / 3) * 10 + Math.random() * 5,
          condition: ["Sunny", "Cloudy", "Partly Cloudy", "Rainy"][
            Math.floor(Math.random() * 4)
          ],
          precipitation: Math.random() * 10,
          humidity: 40 + Math.random() * 40,
          windSpeed: 5 + Math.random() * 20,
        });
      }
      return forecast;
    };

    const fakeData = {
      location: {
        name: selectedLocation,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
      },
      date: selectedDate,
      probabilities: {
        hot: {
          probability: Math.floor(Math.random() * 50) + 30,
          avgValue: 25 + Math.floor(Math.random() * 15),
          unit: "°C",
          prediction: "Mostly warm with clear skies",
        },
        cold: {
          probability: Math.floor(Math.random() * 40),
          avgValue: 5 + Math.floor(Math.random() * 10),
          unit: "°C",
          prediction: "Cool evenings expected",
        },
        wet: {
          probability: Math.floor(Math.random() * 60),
          avgValue: 5 + Math.floor(Math.random() * 20),
          unit: "mm",
          prediction: "Scattered showers possible",
        },
        windy: {
          probability: Math.floor(Math.random() * 70),
          avgValue: 15 + Math.floor(Math.random() * 25),
          unit: "km/h",
          prediction: "Moderate winds expected",
        },
        humid: {
          probability: Math.floor(Math.random() * 80),
          avgValue: 40 + Math.floor(Math.random() * 40),
          unit: "%",
          prediction: "Moderate to high humidity",
        },
      },
      trends: Array.from({ length: 10 }).map((_, i) => ({
        year: 2016 + i,
        hot: 20 + Math.random() * 30,
        cold: Math.random() * 15,
        wet: Math.random() * 25,
        windy: 10 + Math.random() * 20,
      })),
      monthlyStats: Array.from({ length: 12 }).map((_, i) => ({
        month: new Date(0, i).toLocaleString("en-US", { month: "short" }),
        hot: 15 + Math.random() * 35,
        cold: Math.random() * 20,
        wet: Math.random() * 30,
        windy: 5 + Math.random() * 25,
      })),
      hourly: Array.from({ length: 24 }).map((_, i) => ({
        hour: `${i}:00`,
        temperature: 20 + Math.sin((i / 24) * Math.PI * 2) * 10,
        precipitation: Math.random() * 5,
        humidity: 40 + Math.random() * 40,
        windSpeed: 5 + Math.random() * 20,
      })),
      tenDayForecast: generate10DayForecast(),
    };

    setWeatherData(fakeData);
    addToSearchHistory(selectedLocation, selectedDate, fakeData);
    setShowResults(true);
    setLoading(false);
  };

  const handleExport = (format) => {
    if (!weatherData) return;
    const filename = `astroforecast-${selectedLocation.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    )}-${selectedDate}`;

    if (format === "json") {
      const blob = new Blob([JSON.stringify(weatherData, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${filename}.json`;
      a.click();
    } else {
      // Enhanced CSV export with ALL data
      let csv = "Category,Type,Probability,Average Value,Unit,Prediction\n";

      // Add probabilities data
      Object.entries(weatherData.probabilities).forEach(([condition, data]) => {
        csv += `Weather,${condition},${data.probability},${data.avgValue},${data.unit},"${data.prediction}"\n`;
      });

      // Add trends data
      weatherData.trends.forEach((trend) => {
        csv += `Trend,${trend.year},,,,\n`;
        Object.entries(trend).forEach(([key, value]) => {
          if (key !== "year") {
            csv += `,,${key},${value},,\n`;
          }
        });
      });

      // Add monthly stats
      weatherData.monthlyStats.forEach((month) => {
        csv += `Monthly,${month.month},,,,\n`;
        Object.entries(month).forEach(([key, value]) => {
          if (key !== "month") {
            csv += `,,${key},${value},,\n`;
          }
        });
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${filename}.csv`;
      a.click();
    }
  };

  const loadFromHistory = (searchItem) => {
    setSelectedLocation(searchItem.location);
    setSelectedDate(searchItem.date);
    setCoordinates(searchItem.coordinates);
    setWeatherData(searchItem.data);
    setShowResults(true);
    setShowHistory(false);

    if (
      mapInstanceRef.current &&
      searchItem.coordinates.lat &&
      searchItem.coordinates.lon
    ) {
      updateMapMarker(
        searchItem.coordinates.lat,
        searchItem.coordinates.lon,
        searchItem.location
      );
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("weatherSearchHistory");
  };

  const deleteHistoryItem = (id) => {
    setSearchHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleShare = () => {
    setShareModal(true);
  };

  const copyShareLink = () => {
    const shareText = `Check out this weather forecast for ${selectedLocation} on ${selectedDate}!\n\nHot: ${weatherData.probabilities.hot.probability}% | Cold: ${weatherData.probabilities.cold.probability}% | Wet: ${weatherData.probabilities.wet.probability}%\n\nGenerated via Astro Forecast`;

    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareViaEmail = () => {
    const subject = `Weather Forecast for ${selectedLocation} - ${selectedDate}`;
    const body = `Check out this weather forecast:\n\nLocation: ${selectedLocation}\nDate: ${selectedDate}\n\nWeather Probabilities:\n- Hot: ${weatherData.probabilities.hot.probability}% (${weatherData.probabilities.hot.avgValue}${weatherData.probabilities.hot.unit})\n- Cold: ${weatherData.probabilities.cold.probability}% (${weatherData.probabilities.cold.avgValue}${weatherData.probabilities.cold.unit})\n- Wet: ${weatherData.probabilities.wet.probability}% (${weatherData.probabilities.wet.avgValue}${weatherData.probabilities.wet.unit})\n\nGenerated via Astro Forecast`;

    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
      )}`
    );
  };

  const shareViaWhatsApp = () => {
    const text = `Check out this weather forecast for ${selectedLocation} on ${selectedDate}!\n\nHot: ${weatherData.probabilities.hot.probability}% | Cold: ${weatherData.probabilities.cold.probability}% | Wet: ${weatherData.probabilities.wet.probability}%\n\nGenerated via Astro Forecast`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const shareViaTwitter = () => {
    const text = `Check out this weather forecast for ${selectedLocation}! Hot: ${weatherData.probabilities.hot.probability}% | Cold: ${weatherData.probabilities.cold.probability}% | Wet: ${weatherData.probabilities.wet.probability}%`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    );
  };

  const shareViaFacebook = () => {
    const url = window.location.href;
    const text = `Weather forecast for ${selectedLocation} on ${selectedDate}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}&quote=${encodeURIComponent(text)}`
    );
  };

  const getProbabilityColor = (condition, probability) => {
    const colorSet = colors.weather[condition];
    if (probability > 60) return colorSet.probability.high;
    if (probability > 30) return colorSet.probability.medium;
    return colorSet.probability.low;
  };

  const formatLocationName = (displayName) => {
    // Extract city and country from display name
    const parts = displayName.split(",");
    if (parts.length >= 2) {
      return `${parts[0].trim()}, ${parts[parts.length - 1].trim()}`;
    }
    return displayName;
  };

  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case "sunny":
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case "cloudy":
        return <Cloud className="w-5 h-5 text-gray-500" />;
      case "partly cloudy":
        return <CloudSun className="w-5 h-5 text-blue-400" />;
      case "rainy":
        return <CloudDrizzle className="w-5 h-5 text-blue-500" />;
      default:
        return <CloudSun className="w-5 h-5 text-gray-500" />;
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "forecast", label: "Forecast", icon: BarChart3 },
    { id: "history", label: "History", icon: History },
    { id: "about", label: "About", icon: Info },
  ];

  const handleNavClick = (navId) => {
    setActiveNav(navId);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeNav) {
      case "home":
        return (
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Smart Trip ForeCast <span className="text-yellow-200">🌤️</span>
              </h1>

              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      searchLocation(e.target.value);
                    }}
                    onFocus={() => {
                      if (selectedLocation) {
                        searchLocation(selectedLocation);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    className="w-full border border-slate-300 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all bg-white"
                    placeholder="Search for a city or location..."
                  />

                  {/* Search Suggestions */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 mt-1 max-h-60 overflow-y-auto">
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                          onClick={() => handleLocationSelect(suggestion)}
                        >
                          <div className="font-medium text-slate-800">
                            {formatLocationName(suggestion.display_name)}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{suggestion.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* <button
                  onClick={handleGetCurrentLocation}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl w-full flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  <span>
                    {locationLoading
                      ? "Getting location..."
                      : "Use my current location"}
                  </span>
                </button> */}

                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-slate-300 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all bg-white"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl w-full flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25 font-semibold"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>
                    {loading
                      ? "Analyzing Weather Patterns..."
                      : "Predict Weather"}
                  </span>
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 mt-4 p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>

            {/* Map */}
            {mapLoaded && (
              <div
                className="bg-white rounded-2xl shadow-xl p-4 border border-slate-200"
                style={{ zIndex: 1 }}
              >
                <h3 className="font-semibold mb-3 text-slate-700 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Select Location on Map</span>
                </h3>
                <div
                  ref={mapRef}
                  className="w-full h-80 rounded-xl border-2 border-slate-300"
                />
              </div>
            )}

            {/* Results Section */}
            {showResults && weatherData && (
              <div className="space-y-6">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-8 rounded-2xl shadow-xl"
                >
                  <h2 className="text-2xl font-bold mb-2">
                    Weather Forecast for {selectedDate}
                  </h2>
                  <p className="text-blue-100 flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{formatLocationName(weatherData.location.name)}</span>
                    <span>•</span>
                    <span>
                      📊 {weatherData.location.latitude.toFixed(4)},{" "}
                      {weatherData.location.longitude.toFixed(4)}
                    </span>
                  </p>
                </motion.div>

                {/* Probability Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(weatherData.probabilities).map(
                    ([key, data]) => {
                      const weatherConfig =
                        colors.weather[key] || colors.weather.windy;
                      const probabilityColor = getProbabilityColor(
                        key,
                        data.probability
                      );

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`${weatherConfig.bg} p-6 rounded-2xl shadow-lg border ${weatherConfig.border} hover:shadow-xl transition-all`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`p-2 rounded-lg ${weatherConfig.bg}`}
                              >
                                {key === "hot" && (
                                  <Sun
                                    className={`w-5 h-5 ${weatherConfig.icon}`}
                                  />
                                )}
                                {key === "cold" && (
                                  <Snowflake
                                    className={`w-5 h-5 ${weatherConfig.icon}`}
                                  />
                                )}
                                {key === "wet" && (
                                  <CloudRain
                                    className={`w-5 h-5 ${weatherConfig.icon}`}
                                  />
                                )}
                                {key === "windy" && (
                                  <Wind
                                    className={`w-5 h-5 ${weatherConfig.icon}`}
                                  />
                                )}
                                {key === "humid" && (
                                  <Droplets
                                    className={`w-5 h-5 ${weatherConfig.icon}`}
                                  />
                                )}
                              </div>
                              <span
                                className={`capitalize font-semibold ${weatherConfig.text}`}
                              >
                                {key}
                              </span>
                            </div>
                            <div
                              className={`text-lg font-bold ${probabilityColor}`}
                            >
                              {data.probability}%
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-slate-800 mb-1">
                            {data.avgValue}
                            {data.unit}
                          </p>
                          <p className={`text-sm ${weatherConfig.text}`}>
                            {data.prediction}
                          </p>
                        </motion.div>
                      );
                    }
                  )}
                </div>

                {/* Enhanced Charts */}
                <div className="space-y-6">
                  {/* 10-Year Trend - Larger */}
                  <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
                    <h4 className="font-semibold mb-4 text-lg text-slate-800">
                      10-Year Climate Trend
                    </h4>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={weatherData.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="year" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="hot"
                          stackId="1"
                          stroke="#ef4444"
                          fill="#fecaca"
                          name="Hot Days"
                        />
                        <Area
                          type="monotone"
                          dataKey="cold"
                          stackId="1"
                          stroke="#3b82f6"
                          fill="#93c5fd"
                          name="Cold Days"
                        />
                        <Area
                          type="monotone"
                          dataKey="wet"
                          stackId="1"
                          stroke="#8b5cf6"
                          fill="#ddd6fe"
                          name="Rainy Days"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Monthly Pattern - Larger */}
                  <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
                    <h4 className="font-semibold mb-4 text-lg text-slate-800">
                      Monthly Weather Patterns
                    </h4>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={weatherData.monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="hot"
                          fill="#ef4444"
                          name="Hot Days"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="cold"
                          fill="#3b82f6"
                          name="Cold Days"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="wet"
                          fill="#8b5cf6"
                          name="Rainy Days"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Hourly Forecast */}
                  <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
                    <h4 className="font-semibold mb-4 text-lg text-slate-800">
                      24-Hour Detailed Forecast
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weatherData.hourly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="hour" stroke="#64748b" />
                        <YAxis yAxisId="left" stroke="#64748b" />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#64748b"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="temperature"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Temperature (°C)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="precipitation"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Precipitation (mm)"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="humidity"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Humidity (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "history":
        return (
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Search History
                </h1>
                {searchHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="flex items-center space-x-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {searchHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">
                    No search history yet
                  </p>
                  <p className="text-slate-400">
                    Your weather searches will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchHistory.map((search) => (
                    <motion.div
                      key={search.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group"
                      onClick={() => loadFromHistory(search)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <h3 className="font-semibold text-slate-800">
                              {formatLocationName(search.location)}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{search.date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Cloud className="w-3 h-3" />
                              <span>{search.data.summary}</span>
                            </div>
                            <span>{search.timestamp}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(search.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        );

      case "forecast":
      case "about":
      default:
        return (
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {activeNav === "forecast"
                  ? "Weather Forecast"
                  : "About Astro Forecast"}
              </h1>
              <div className="prose prose-slate max-w-none">
                {activeNav === "forecast" ? (
                  <>
                    {/* 10-Day Forecast */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200 mb-20">
                      <h4 className="font-semibold mb-4 text-lg text-slate-800 flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span>10-Day Weather Forecast</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {weatherData.tenDayForecast.map((day, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center"
                          >
                            <div className="font-semibold text-slate-700 text-sm mb-2">
                              {day.date}
                            </div>
                            <div className="flex justify-center mb-2">
                              {getWeatherIcon(day.condition)}
                            </div>
                            <div className="text-lg font-bold text-slate-800 mb-1">
                              {Math.round(day.temperature)}°C
                            </div>
                            <div className="text-xs text-slate-600 mb-1">
                              {day.condition}
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>💧 {Math.round(day.precipitation)}mm</span>
                              <span>💨 {Math.round(day.windSpeed)}km/h</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <p className="text-lg text-slate-600 mb-6">
                      Get accurate weather predictions and climate analysis for
                      any location worldwide. Our advanced forecasting system
                      uses historical data and machine learning algorithms to
                      provide reliable weather insights.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-3">
                          Features
                        </h3>
                        <ul className="space-y-2 text-blue-700">
                          <li>• 10-year climate trends</li>
                          <li>• Monthly weather patterns</li>
                          <li>• 24-hour detailed forecasts</li>
                          <li>• Probability analysis</li>
                        </ul>
                      </div>
                      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                        <h3 className="font-semibold text-green-800 mb-3">
                          Coverage
                        </h3>
                        <ul className="space-y-2 text-green-700">
                          <li>• Global locations</li>
                          <li>• 6-month forecast range</li>
                          <li>• Multiple weather parameters</li>
                          <li>• Historical data comparison</li>
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg text-slate-600 mb-6">
                      Astro Forecast is an advanced weather prediction platform
                      that combines meteorological data with artificial
                      intelligence to deliver accurate and reliable weather
                      forecasts.
                    </p>
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
                      <h3 className="font-semibold mb-3">Our Technology</h3>
                      <p>
                        Using state-of-the-art machine learning models and
                        real-time data from trusted sources, we provide weather
                        predictions that help you plan your activities with
                        confidence.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 text-slate-800">
      {/* Enhanced Navbar */}
      <nav
        className="fixed w-full top-0 left-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm"
        style={{ zIndex: 1000 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-2 rounded-2xl shadow-lg">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                AstroForecast
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all  cursor-pointer ${
                  activeNav === item.id
                    ? "bg-white text-blue-600 shadow-sm border border-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-700" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-200"
          >
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeNav === item.id
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </nav>

      <main className="pt-24 max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {renderContent()}

          {/* Enhanced Right Sidebar */}
          <aside className="space-y-6 sticky top-28">
            {/* Popular Cities - Moved to Top */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
              <h4 className="font-semibold mb-4 text-slate-800 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Popular Cities</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {popularCities.slice(0, 6).map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySelect(city)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center space-x-1 border border-blue-200 hover:border-blue-300"
                  >
                    <MapPin className="w-3 h-3" />
                    <span className="truncate text-xs">
                      {city.name.split(",")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Metrics Guide - Below Popular Cities */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
              <h4 className="font-semibold mb-4 text-slate-800 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span>10-Day Weather Guide</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <CloudSun className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-700">Partly Cloudy</span>
                  </div>
                  <span className="text-blue-600 font-semibold">18-25°C</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <Sun className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-700">Sunny</span>
                  </div>
                  <span className="text-orange-600 font-semibold">25-32°C</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center space-x-3">
                    <CloudDrizzle className="w-4 h-4 text-indigo-500" />
                    <span className="text-indigo-700">Rainy</span>
                  </div>
                  <span className="text-indigo-600 font-semibold">15-22°C</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Cloud className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">Cloudy</span>
                  </div>
                  <span className="text-gray-600 font-semibold">16-24°C</span>
                </div>
              </div>
            </div>

            {weatherData && (
              <>
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
                  <h4 className="font-semibold mb-4 text-slate-800 flex items-center space-x-2">
                    <Download className="w-4 h-4 text-blue-500" />
                    <span>Export Data</span>
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleExport("json")}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
                    >
                      <Download className="w-4 h-4" />
                      <span className="cursor-pointer">Export JSON</span>
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25"
                    >
                      <Download className="w-4 h-4" />
                      <span className="cursor-pointer">Export CSV</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full border border-slate-300 text-slate-700 py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-50 transition-all bg-white"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="cursor-pointer">Share Report</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-2xl shadow-xl p-6">
                  <h4 className="font-semibold mb-4">Forecast Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Confidence Score</span>
                      <span className="font-bold text-lg">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Data Points Analyzed</span>
                      <span className="font-bold text-lg">1,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Forecast Accuracy</span>
                      <span className="font-bold">High</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Updated</span>
                      <span className="font-bold text-sm">Just now</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </main>

      {/* Share Modal */}
      {shareModal && weatherData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Share Weather Report
                </h3>
                <button
                  onClick={() => setShareModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <p className="text-sm text-blue-700">
                  Share this weather forecast for{" "}
                  {formatLocationName(selectedLocation)} on {selectedDate}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={shareViaWhatsApp}
                  className="flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/25"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={shareViaEmail}
                  className="flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </button>

                <button
                  onClick={shareViaTwitter}
                  className="flex items-center justify-center space-x-2 bg-sky-500 text-white py-3 rounded-lg hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/25"
                >
                  <Twitter className="w-5 h-5" />
                  <span>Twitter</span>
                </button>

                <button
                  onClick={shareViaFacebook}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </button>
              </div>

              <button
                onClick={copyShareLink}
                className="w-full flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 transition-all border border-slate-300"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enhanced Footer */}
      <footer className="bg-slate-800 text-white py-12 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-white p-2 rounded-2xl">
                  <Cloud className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-xl">Astro Forecast</div>
                  <div className="text-sm text-slate-400">
                    Advanced Weather Predictions
                  </div>
                </div>
              </div>
              <p className="text-slate-400 max-w-md">
                Providing accurate weather predictions and climate analysis
                using advanced meteorological data and machine learning
                algorithms.
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Forecast
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Historical Data
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors  cursor-pointer"
                  >
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Resources</h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Weather Maps
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Climate Research
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>
              © 2024 Astro Forecast. All rights reserved. | Built with ❤️ for
              accurate weather predictions
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WeatherPredict;
