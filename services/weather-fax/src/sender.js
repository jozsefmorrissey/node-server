const emailSvc = require("./email");
const shell = require('shelljs');
const fs = require('fs');

const utils = require('./utils');
const HTML = require('./html');
const numbers = require('./numbers');

const dg = require('./debug-gui-interface');

// TODO: reference single email reg throughtout project
const emailReg = /^\s*([^@]{1,})@([^@^.]{1,})(\.([^@^.]{1,}))*\s*$/;

const faxnumReg = /^(\+1|)((\(|)[0-9]{3}(\)|)[0-9]{3}(-|)[0-9]{4})$/;

function success(type, user) {
  return () => {
    console.log('Successfully sent ${type} to user: ${user.userId}');
  }
}

function failure(type, user) {
  return (e) => {
    console.log('Failed to send ${type} to user: ${user.userId}');
    dg.exception(`sender.${type}`, e);
  }
}

function send(user, data) {

  if (user.isFax()) {
    console.log('sending fax', data.url);
    faxSvc(numbers.WEATHER_REQUEST, user.faxNumber(), data.url);
  } else {
    emailSvc.sendPdf('Weather-Fax', 'Report', data.file, user.email(), success('pdf', user), failure('pdf', user));
  }
}

function awaitAll(callback, ...keys) {
  const responses = {};
  if (keys.length === 0) callback();
  dg.object('awaitAll.keys', keys);
  return (key) => {
    dg.value('awaitAll', 'awaiting', key);
    return (data) => {
      responses[key] = data;
      let finished = true;
      dg.value('awaitAll', 'awaited', key);
      keys.forEach((k) => finished = finished && responses[k] !== undefined);
      if (finished) {
        dg.value('awaitAll', 'allReturned', true);
        callback(responses);
      }
    }
  }
}

function combinePdfs(...pdfUrls) {
  const pdfLocation = utils.randFileLocation('combined/pdf', 'pdf');
  pdfUrls._DESTINATION = pdfLocation;
  dg.object('pdf.urls', pdfUrls);
  let pdfLocations = pdfUrls.map((pdfUrl) => utils.getProjectFilePath(pdfUrl));
  pdfLocations = pdfLocations.filter((loc) => loc !== false);
  const combineCmd = `pdftk '${pdfLocations.join("' '")}' cat output ${pdfLocation}`;
  shell.mkdir('-p', pdfLocation.replace(/(.*)\/.*/, '$1'))
  shell.exec(combineCmd);
  return {url: utils.getUrlPath(pdfLocation), file: pdfLocation};
}

function combineHtml(...htmlUrls) {
  let html = '';
  const htmlLocation = utils.randFileLocation('combined/html', 'html');
  htmlUrls._DESTINATION = htmlLocation;
  dg.object('html.urls', htmlUrls);
  for (let index = 0; index < htmlUrls.length; index += 1) {
    const filePath = utils.getProjectFilePath(htmlUrls[index]);
    if (filePath) {
      html += shell.cat(filePath).stdout;
      if (index < htmlUrls.length - 1) html += '<br><br></br>';
    }
  }
  shell.mkdir('-p', htmlLocation.replace(/(.*)\/.*/, '$1'))
  fs.writeFileSync(htmlLocation, html);
  return {url: utils.getUrlPath(htmlLocation), file: htmlLocation, html};
}

function combine(user, ...urls) {
  if (true || user.isFax()) {
    return combinePdfs.apply(null, urls);
  } else {
    return combineHtml.apply(null, urls);
  }
}

class Sender {
  constructor() {
    const runOn = {};

    function initialResponse(user, success) {
      function onComplete(responses) {
        success(combine(user, responses.order, responses.hourly, responses.daily));
      }
      const awAll = awaitAll(onComplete, 'hourly', 'daily', 'order');

      const formatter = HTML.getFormatter('pdf');
      formatter.getHourlyReportUrl(user, awAll('hourly'));
      formatter.getDailyReportUrl(user, awAll('daily'));
      formatter.getOrderForm(user, awAll('order'));
    }

    function weatherReport(user, type, success) {
      console.log('building weather report');
      function onComplete(responses) {
        console.log('weather report built');
        success(combine(user, responses.order, responses.hours12, responses.hourly, responses.daily));
      }
      let types = ['hours12', 'daily'];
      if (type === 'hourly') types = ['hourly'];
      if (type === 'daily') types = ['daily']

      const awAll = awaitAll(onComplete, ...types);

      const formatter = HTML.getFormatter('pdf');
      if (types.indexOf('hourly') !== -1 === 'hourly')
        formatter.getHourlyReportUrl(user, awAll('hourly'));
      if (types.indexOf('hours12') !== -1)
        formatter.get12HourReportUrl(user, awAll('hours12'));
      if (types.indexOf('daily') !== -1)
        formatter.getDailyReportUrl(user, awAll('daily'));
    }

    function awaitFunctions(user, success, ...funcIds) {
      console.log('Awaiting functions', funcIds.length);
      if (funcIds.length === 0) return;
      function onComplete(responses) {
        console.log('Functions Complete');

        success(combine(user, ...Object.values(responses)));
      }

      const awAll = awaitAll(onComplete, ...funcIds);

      const formatter = HTML.getFormatter('pdf');
      for (let index = 0; index < funcIds.length; index += 1) {
        const funcId = funcIds[index];
        formatter[funcId](user, awAll(funcId));
      }
    }

    const userSend = (user) => (data) => send(user, data);
    this.weatherReport = (user, type) => weatherReport(user, type, userSend(user));
    this.status = (user) => awaitFunctions(user, userSend(user), 'getReportStatus');
    this.orderForm = (user) =>
      awaitFunctions(user, userSend(user), 'getOrderForm');
    this.initialResponse = (user) =>
      awaitFunctions(user, userSend(user), 'getOrderForm', 'get12HourReportUrl', 'getDailyReportUrl');
    this.weatherRequest = (user) =>
      awaitFunctions(user, userSend(user), 'get12HourReportUrl', 'getDailyReportUrl');
    this.requestsCapped = (user) =>
      awaitFunctions(user, userSend(user), 'requestCapped');
  }
}

module.exports = new Sender();
