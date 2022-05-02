
const shell = require('shelljs');
const Request = require('../../../public/js/utils/request.js');
const utils = require('./utils');
const API_KEY = shell.exec('pst value OpenWeather apiKey').stdout.trim();
console.log('API_KEY:', API_KEY);

class Weather {
  constructor() {
    const data = {};
    function get(type, areaOzipOnumber, success, failure) {
      const date = new Date();
      console.log(areaOzipOnumber);
      const zip = utils.areaOzipOnumberToZip(areaOzipOnumber);
      const quarter = Math.floor(date.getMinutes() / 10) + 1;
      const dateHourKey = `${zip}-${date.getDate()}-${date.getHours()}-${quarter}`;
      function filter(weatherData) {
        if (weatherData) {
          weatherData.hourly = weatherData.hourly.splice(0, 24);
          weatherData.hours15 = weatherData.hourly.splice(0, 15);
          weatherData.daily = weatherData.daily.splice(0, weatherData.daily.length - 1);
          data[dateHourKey] = weatherData;
        }
        if (data[dateHourKey]) {
          if (data[dateHourKey][type] === undefined) failure(new Error(`Invalid data type '${type}'`));
          success({dateHourKey, weatherData: data[dateHourKey][type]});
          return true;
        }
        return false;
      }

      if (!filter()) {
        let coords = utils.zipToCoords(zip);
        const latitude = coords.latitude;
        const longitude = coords.longitude;
        if (coords === undefined) throw new Error(`Invalid area or zip '${areaOzipOnumber}'`);
        let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=imperial`;
        console.log('request made');
        Request.get(url, filter, failure);
      }
    }

    this.hourly = (areaOzipOnumber, success, failure) => get('hourly', areaOzipOnumber, success, failure);
    this.hours15 = (areaOzipOnumber, success, failure) => get('hours15', areaOzipOnumber, success, failure);
    this.daily = (areaOzipOnumber, success, failure) => get('daily', areaOzipOnumber, success, failure);
  }
}

module.exports = new Weather();
