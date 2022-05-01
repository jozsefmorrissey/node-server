
const zoneToZip = require('../public/json/zone-to-zip.json');
const areaToZipJson = require('../public/json/area-to-zip.json');
const zipToCoordsJson = require('../public/json/zip-to-lon-lat.json');
const zones = Object.keys(zoneToZip);
const EPNTS = require('./EPNTS');
const LOCAL_DIR = './services/weather-fax';
const PUBLIC_DIR = `${LOCAL_DIR}/public`;




const utils = {timeZoneList : []};

utils.javascriptTimeZone = (normalTZ) => {
  const keys = Object.keys(zoneToZip);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const split = key.split(':');
    if (split[0] === normalTZ) return split[1];
  }
  throw new Error(`Unkown time zone ${normalTZ}`);
};

Object.keys(zoneToZip).forEach((key) => utils.timeZoneList.push(key.split(':')[0]))

utils.getDateStr = (value) => {
  return new Date(value * 1000).toString().replace(/(^.*? .*? .*?) .*$/, '$1');
}

utils.getTimeStr = (value) => {
  return new Date(value * 1000).toTimeString().substr(0,5);
}

utils.iconUrl = (iconCode) => {
  return `http://openweathermap.org/img/w/${iconCode}.png`;
}

const directions = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
utils.getDirection = (deg) => {
  deg = (deg + 11.25) % 360;
  let index = 0;
  let pos = 22.5;
  while (deg > pos) {
    pos += 22.5;
    index++;
  }
  return directions[index];
}

utils.getTimeZone = (zipCode, javascript) => {
  for (let index = 0; index < zones.length; index += 1)
    if (zoneToZip[zones[index]].indexOf(zipCode) !== -1) {
      const split = zones[index].split(':');
      return javascript ? split[1] : split[0];
    }
}

utils.areaCodeToZip = (areaCode) => areaToZipJson[areaCode];
utils.zipToCoords = (zip) => zipToCoordsJson[zip];


const zipCodeReg = /^[0-9]{5}$/;
const areaCodeReg = /^[0-9]{3}$/;
const faxNumberReg = /\+1([0-9]{3})[0-9]{7}/;

utils.validTimeZone = (tz) => utils.timeZoneList.indexOf(tz) !== -1;
utils.validZipCode = (zc) => zc.toString().trim().match(zipCodeReg) !== null;

utils.areaOzipOnumberToZip = (areaOzipOnumber) => {
  areaOzipOnumber = areaOzipOnumber + '';
  areaOzipOnumber = areaOzipOnumber.replace(/[-\(\)\s]/g, '');
  const numberMatch = areaOzipOnumber.match(faxNumberReg);
  if (numberMatch) areaOzipOnumber = numberMatch[1];

  let zip;
  if (areaOzipOnumber.trim().match(areaCodeReg)) {
    zip = utils.areaCodeToZip(areaOzipOnumber);
  } else zip = areaOzipOnumber;
  return zip;
}

const urlReg = new RegExp(`^\s*${EPNTS.getHost()}(.*)`);
const pathReg = new RegExp(`^\s*${PUBLIC_DIR}(.*)`)
utils.getPublicPath = (urlOpath) => {
  let match = urlOpath.match(urlReg);
  if (!match) match = urlOpath.match(pathReg);
  return match ? match[1] : urlOpath;
}

const gpp = utils.getPublicPath;
utils.getUrlPath = (urlOpath) =>
    (typeof urlOpath) === 'string' && `${EPNTS.getHost()}${gpp(urlOpath)}`;
utils.getProjectFilePath = (urlOpath) =>
    (typeof urlOpath) === 'string' && `${PUBLIC_DIR}${gpp(urlOpath)}`;
utils.getServiceFilePath = (urlOpath) =>
    (typeof urlOpath) === 'string' && `./public${gpp(urlOpath)}`;

utils.randFileLocation = (subDirectory, extension) =>
  `${PUBLIC_DIR}/${subDirectory}/${String.random()}.${extension}`;

module.exports = utils;
