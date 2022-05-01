const emailSvc = require("./email");
const shell = require('shelljs');
const fs = require('fs');

const utils = require('./utils');
const HTML = require('./html');
const PDF = HTML.PDF;

const apiKey = shell.exec('pst value talnyx apiKey').stdout.trim();

// TODO: reference single email reg throughtout project
const emailReg = /^\s*([^@]{1,})@([^@^.]{1,})(\.([^@^.]{1,}))*\s*$/;

console.log(apiKey);

function sendFax(fromNumber, toNumber, pdfUrl) {
  shell.exec(`curl -X POST https://api.telnyx.com/v2/faxes \
  --data-urlencode "media_url=${pdfUrl}" \
  --data-urlencode "connection_id=1878532170411149172" \
  --data-urlencode "to=${toNumber}" \
  --data-urlencode "from=${fromNumber}" \
  --header "Authorization: Bearer $${apiKey}"`)
}

const faxnumReg = /^(\+1|)((\(|)[0-9]{3}(\)|)[0-9]{3}(-|)[0-9]{4})$/;
function send(user, data) {

  if (user.isFax()) {
    console.log('sending fax');
    // faxSvc.send(user.faxNumber(), data.url);
  } else {
    emailSvc.sendHtml(user.email(), data.html, console.log, console.error);
  }
}

function awaitAll(callback, ...keys) {
  const responses = {};
  if (keys.length === 0) callback();
  return (key) => {
    return (data) => {
      responses[key] = data;
      let finished = true;
      console.log('awaiting', key, keys)
      keys.forEach((k) => finished = finished && responses[k] !== undefined);
      if (finished) callback(responses);
    }
  }
}

function combinePdfs(...pdfUrls) {
  console.log('combining pdfs');
  const pdfLocation = utils.randFileLocation('combined/pdf', 'pdf');
  let pdfLocations = pdfUrls.map((pdfUrl) => utils.getProjectFilePath(pdfUrl));
  pdfLocations = pdfLocations.filter((loc) => loc !== false);
  const combineCmd = `pdftk '${pdfLocations.join("' '")}' cat output ${pdfLocation}`;
  console.log(combineCmd);
  shell.mkdir('-p', pdfLocation.replace(/(.*)\/.*/, '$1'))
  shell.exec(combineCmd);
  return {url: utils.getUrlPath(pdfLocation), file: pdfLocation};
}

function combineHtml(...htmlUrls) {
  console.log('combining htmls', htmlUrls);
  let html = '';
  for (let index = 0; index < htmlUrls.length; index += 1) {
    const filePath = utils.getProjectFilePath(htmlUrls[index]);
    console.log(htmlUrls[index], '=>', filePath);
    if (filePath) {
      html += shell.cat(filePath).stdout;
      if (index < htmlUrls.length - 1) html += '<br><br></br>';
    }
  }
  const htmlLocation = utils.randFileLocation('combined/html', 'html');
  shell.mkdir('-p', htmlLocation.replace(/(.*)\/.*/, '$1'))
  fs.writeFileSync(htmlLocation, html);
  return {url: utils.getUrlPath(htmlLocation), file: htmlLocation, html};
}

function combine(user, ...urls) {
  console.log('combine urls', urls);
  if (user.isFax()) {
    return combinePdfs.apply(null, urls);
  } else {
    return combineHtml.apply(null, urls);
  }
}

class Sender {
  constructor() {
    const runOn = {};

    const getFormatter = (user) => user.isFax() ? PDF : HTML;

    function initialResponse(user, success) {
      function onComplete(responses) {
        success(combine(user, responses.order, responses.hourly, responses.daily));
      }
      const awAll = awaitAll(onComplete, 'hourly', 'daily', 'order');

      const formatter = getFormatter(user);
      formatter.getHourlyReportUrl(user, awAll('hourly'));
      formatter.getDailyReportUrl(user, awAll('daily'));
      formatter.getOrderForm(user, awAll('order'));
    }

    function weatherReport(user, type, success) {
      console.log('building weather report');
      function onComplete(responses) {
        console.log('weather report built', responses);
        success(combine(user, responses.order, responses.hourly, responses.daily));
      }
      let types = ['hourly', 'daily'];
      if (type === 'hourly') types = ['hourly'];
      if (type === 'daily') types = ['daily']

      const awAll = awaitAll(onComplete, ...types);

      const formatter = getFormatter(user);
      if (type === 'both' || type === 'hourly')
        formatter.getHourlyReportUrl(user, awAll('hourly'), console.err);
      if (type === 'both' || type === 'daily')
        formatter.getDailyReportUrl(user, awAll('daily'), console.err);
    }

    function information(user, type, success) {
      const formatter = getFormatter(user);
      formatter.getOrderForm(user, success);
    }

    function toggledSchedualed(user, success) {
      const formatter = getFormatter(user);
      formatter.getOrderForm(user, success);
    }

    this.weatherReport = (user, type) => weatherReport(user, type, (data) => send(user, data));
  }
}

module.exports = new Sender();