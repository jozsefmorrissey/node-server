

class Weather {
  constrructor() {

    this.hourly = (latitude, longitude) =>
      `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${latitude}&cnt=24&lon=${longitude}&appid=${API_KEY}&units=imperial`;
    this.daily7day = (latitude, longitude) =>
      `api.openweathermap.org/data/2.5/forecast/daily?lat=${latitude}&lon=${longitude}&cnt=7&appid=${API_KEY}&units=imperial`;
    this.radarr = (latitude, longitude) =>
      `http://api.openweathermap.org/data/2.5/solar_radiation?lat=${latitude}&lon=${longitude}&appid={API key}`;
  }
}
