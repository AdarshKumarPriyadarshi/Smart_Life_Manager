import requests
import datetime
import logging
from db import DBHelper


class WeatherManager:
    def __init__(self, db: DBHelper):
        self.db = db

    def map_code(self, code: int) -> str:
        mapping = {
            0: "Clear Sky ☀️",
            1: "Mainly Clear 🌤️",
            2: "Partly Cloudy ⛅",
            3: "Overcast ☁️",
            45: "Fog 🌫️",
            48: "Rime Fog 🌫️",
            51: "Light Drizzle 🌦️",
            53: "Drizzle 🌧️",
            55: "Heavy Drizzle 🌧️",
            61: "Light Rain 🌧️",
            63: "Rain 🌧️",
            65: "Heavy Rain ⛈️",
            71: "Snowfall 🌨️",
            80: "Rain Showers 🌧️",
            95: "Thunderstorm ⛈️",
        }
        return mapping.get(code, "Weather Unknown")

    def geocode_city(self, city: str):
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {"q": city, "format": "json", "limit": 1}
            headers = {
                "User-Agent": "SmartLifeManagerApp/1.0 (adarsh123150@gmail.com)"
            }
            resp = requests.get(
                url, params=params, headers=headers, timeout=5, verify=False
            )
            resp.raise_for_status()
            data = resp.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
        except requests.RequestException as e:
            logging.error(f"Geocoding API call failed: {e}")
        return None, None

    def check_weather(self, city: str):
        lat, lon = self.geocode_city(city)
        if lat is None or lon is None:
            return "Failed to get geolocation for city"

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current_weather": True,
            "windspeed_unit": "kmh",  # km/h
        }
        try:
            resp = requests.get(url, params=params, timeout=5, verify=False)
            resp.raise_for_status()
            data = resp.json()
            current = data.get("current_weather")
            if not current:
                return "Weather data not available"

            temperature = current.get("temperature")
            windspeed = current.get("windspeed")
            code = current.get("weathercode")
            description = self.map_code(code)

            # Use system local time (your machine is IST)
            now = datetime.datetime.now()
            date_str = now.date().isoformat()
            time_str = now.strftime("%H:%M")

            weather_str = (
                f"{city}: {temperature}°C, {description}, "
                f"wind {windspeed} km/h at {time_str} IST"
            )

            self.db.execute(
                "INSERT INTO weather_history (city, date, weather) VALUES (?, ?, ?)",
                (city, date_str, weather_str),
                commit=True,
            )
            return weather_str

        except requests.RequestException as e:
            logging.error(f"Open-Meteo API call failed: {e}")
            return "Failed to get weather"

    def get_weather_history(self):
        c = self.db.execute(
            "SELECT id, city, date, weather FROM weather_history ORDER BY date DESC"
        )
        return c.fetchall() if c else []

    def clear_weather_history(self):
        self.db.execute("DELETE FROM weather_history", commit=True)
