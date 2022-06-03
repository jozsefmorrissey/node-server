
const shell = require('shelljs');
const Request = require('../../../public/js/utils/request.js');
const utils = require('./utils');
const dg = require('./debug-gui-interface');

const API_KEY = shell.exec('pst value WeatherApi apiKey').stdout.trim();

dg.value('weather', 'API_KEY', API_KEY.obscure(22));

function filterForcastHours(startDate, endDate) {
  return (hour) => {
    const hourDate = new Date(hour.time_epoch * 1000);
    return startDate < hourDate && endDate > hourDate;
  }
}

function getHours(data, hours) {
  hours = hours || 24;
  const todaysHours = data.forecast.forecastday[0].hour;
  const tommorrowsHours = data.forecast.forecastday[1].hour;
  const fortyEightHours = todaysHours.concat(tommorrowsHours);
  const startDate = new Date();
  const endDate = new Date();
  endDate.setHours(endDate.getHours() + hours);
  return fortyEightHours.filter(filterForcastHours(startDate, endDate));
}

class WeatherApi {
  constructor() {
    const data = {};
    function get(areaOzipOnumber, success, failure) {
      const date = new Date();
      const zip = utils.areaOzipOnumberToZip(areaOzipOnumber);
      const quarter = Math.floor(date.getMinutes() / 10) + 1;
      const dateHourKey = `${zip}-${date.getDate()}-${date.getHours()}-${quarter}`;
      function filter(weatherData) {
        dg.object(`weather.${areaOzipOnumber}`, weatherData);
        if (weatherData) {
          weatherData.hourly = getHours(weatherData, 24);
          weatherData.hours12 = getHours(weatherData, 12);
          weatherData.daily = weatherData.forecast.forecastday;
          data[dateHourKey] = weatherData;
        }
        if (data[dateHourKey]) {
          // console.log(weatherData);
          success({dateHourKey, weatherData});
          return true;
        }
        return false;
      }

      if (!filter()) {
        let coords = utils.zipToCoords(zip);
        const latitude = coords.latitude;
        const longitude = coords.longitude;
        if (coords === undefined) throw new Error(`Invalid area or zip '${areaOzipOnumber}'`);
        let url = `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=61914&days=7&aqi=no&alerts=yes`;
        console.log('url:', url)
        Request.get(url, filter, failure);
      }
    }

    this.get = (areaOzipOnumber, success, failure) => get(areaOzipOnumber, success, failure);
  }
}

module.exports = new WeatherApi();
