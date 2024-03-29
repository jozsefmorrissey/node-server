const shell = require('shelljs');
global.WEATHER_FAX_DATA_DIR = `${global.DATA_DIRECTORY}/weather-fax`
require('./../../public/js/utils/utils.js');
const fs = require('fs');
const request = require("request-promise-native");
const OpenWeather = require('./src/open-weather');
const $t = require('../../public/js/utils/$t.js');
$t.loadFunctions(require('./generated/html-templates'))
require('./src/global-$t-funcs');
const Request = require('../../public/js/utils/request.js');
const User = require('./src/user');
const SERVICE_DIR = './services/weather-fax/';
const EPNTS = require('./src/EPNTS');
const utils = require('./src/utils');
const HTML = require('./src/html');
const reports = require('./src/report');
const Context = require('../../src/context');
const dg = require('./src/debug-gui-interface');
const faxRespLog = require('./fax-response-logic');

reports();

function generateDocument(faxNumber, type, format, res, next) {
  try {
    const user = new User(faxNumber);
    res.setHeader('Content-Type', 'application/json');
    const formatter = HTML.getFormatter(format);
    switch (type) {
      case 'hourly':
      formatter.getHourlyReportUrl(user, (retVal) => res.redirect(retVal), next);
      break;
      case 'daily':
      formatter.getDailyReportUrl(user, (retVal) => res.redirect(retVal), next);
      break;
      case 'hours12':
      formatter.get12HourReportUrl(user, (retVal) => res.redirect(retVal), next);
      break;
      case 'reportStatus':
      formatter.getReportStatus(user, (retVal) => res.redirect(retVal), next);
      break;
      case 'orderForm':
      formatter.getOrderForm(user, (retVal) => res.redirect(retVal), next);
      break;
      default:
      next(new Error(`Undefined pdf type: '${type}'`));
    }
  } catch (e) {
    console.log('generateDocument', e);
    res.status(400).send(`Invaild fax number or email '${faxNumber}'`)
  }
}

// Securing admin with new password on startup
const adminPassword = shell.exec('pst update weather-fax admin-password').stdout.trim();
const isAdmin = (req) => global.ENV === 'local' ||
                          req.query.adminPassword === adminPassword ||
                          req.header('Authorization') === adminPassword ;

function dateStr() {
  return new Date().toLocaleString().replace(/\//g, '-');
}

async function saveFile(type, from, url) {
    const dir = `${SERVICE_DIR}faxes/${type}/`;
    const filename = `${dir}${from}-${dateStr()}.pdf`;
    shell.mkdir('-p', dir);
    shell.touch(filename);
    const pdfBuffer = await request.get({
      uri: url,
      encoding: null,
    });
    fs.writeFileSync(filename, pdfBuffer);
}

function sendUnauthorized(res) {
  res.status(404).send("Unauthorized");
}

function endpoints(app, prefix) {
  const adminTemplate = new $t('admin');
  app.get(prefix + '/admin/home/', function(req, res ,next) {
    Context.fromReq(req).dg.value('called', 'url', '/admin/home');
    if (isAdmin(req))
      res.send(adminTemplate.render(req.query));
    else
      sendUnauthorized(res);
  });

  app.get(prefix + '/admin/manage/:faxNumber', function (req, res, next) {
    if (isAdmin(req))
      generateDocument(req.params.faxNumber, 'orderForm', 'html', res, next);
    else
      sendUnauthorized(res);
  });

  app.get(prefix + '/admin/debug/toggle', function (req, res, next) {
    if (isAdmin(req)) {
      res.send(dg.toggleDebug());
    } else {
      sendUnauthorized(res);
    }
  });

  app.get(prefix + '/admin/payment/:userId/:amount', function (req, res, next) {
    if (isAdmin(req)) {
      const user = new User(req.params.userId);
      const balance = user.adjustBalance(Number.parseInt(req.params.amount));
      user.save();
      res.send(balance);
    } else {
      sendUnauthorized(res);
    }
  });

  app.get(prefix + '/admin/reportStatus/toggle/:userId', function (req, res, next) {
    if (isAdmin(req)) {
      const user = new User(req.params.userId);
      user.toggleSchedualedReports();
      user.save();
      res.send(`Schedualed Reports are ${user.schedualedReportStatus()}`);
    } else {
      sendUnauthorized(res);
    }
  });

  app.get(prefix + '/admin/update/report/schedule', function (req, res, next) {
    if (isAdmin(req)){
      reports.buildReportDirs();
      res.send('success');
    }
    else
      sendUnauthorized(res);
  });

  app.post(prefix + '/admin/save', function (req, res, next) {
    if (isAdmin(req)) {
      User.update(req.body);
      res.send('Successfully Updated');
    } else
      sendUnauthorized(res);
  });

  app.post(prefix + '/webhook/', function (req, res, next) {
    faxRespLog.recieved(req.body.data);
    res.send(`processing`);
  });

  app.get(prefix + '/:type/:areaOzipOnumber', function (req, res, next) {
    const areaOzipOnumber = req.params.areaOzipOnumber;
    const type = req.params.type;
    res.setHeader('Content-Type', 'application/json');
    OpenWeather[type](areaOzipOnumber, (results) => res.send(JSON.stringify(results)), (error) => next(JSON.stringify(error)));
  });

  app.get(prefix + '/:format/:type/:faxNumber', function (req, res, next) {
    const faxNumber = req.params.faxNumber;
    const type = req.params.type;
    const format = req.params.format;
    generateDocument(faxNumber, type, format, res, next);
  });
}


exports.endpoints = endpoints;
