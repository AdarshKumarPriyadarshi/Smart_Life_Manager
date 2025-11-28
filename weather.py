import requests
import datetime
import logging
from db import DBHelper

class WeatherManager:
    def __init__(self, db: DBHelper):
        self.db = db

    def geocode_city(self, city):
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {"q": city, "format": "json", "limit": 1}
            headers = {"User-Agent": "SmartLifeManagerApp/1.0 (adarsh123150@gmail.com)"}
            resp = requests.get(url, params=params, headers=headers, timeout=5, verify=False)
            resp.raise_for_status()
            data = resp.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
        except requests.RequestException as e:
            logging.error(f"Geocoding API call failed: {e}")
        return None, None

    def check_weather(self, city):
        lat, lon = self.geocode_city(city)
        if lat is None or lon is None:
            return "Failed to get geolocation for city"
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current_weather": True
        }
        try:
            resp = requests.get(url, params=params, timeout=5, verify=False)
            resp.raise_for_status()
            data = resp.json()
            current = data.get("current_weather")
            if current:
                temperature = current.get("temperature")
                windspeed = current.get("windspeed")
                weather_str = f"{city}: {temperature}°C, wind {windspeed} m/s"
                # Store in weather_history
                today = datetime.date.today().isoformat()
                self.db.execute(
                    "INSERT INTO weather_history (city, date, weather) VALUES (?, ?, ?)",
                    (city, today, weather_str), commit=True)
                return weather_str
            else:
                return "Weather data not available"
        except requests.RequestException as e:
            logging.error(f"Open-Meteo API call failed: {e}")
            return "Failed to get weather"

    def get_weather_history(self):
        c = self.db.execute("SELECT id, city, date, weather FROM weather_history ORDER BY date DESC")
        return c.fetchall() if c else []
    
    def clear_weather_history(self):
        self.db.execute("DELETE FROM weather_history", commit=True)