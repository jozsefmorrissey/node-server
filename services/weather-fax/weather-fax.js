const shell = require('shelljs');
global.DATA_DIRECTORY = `${shell.exec('realpath ~').stdout.trim()}/.opsc/weather-fax`;

require('./../../public/js/utils/utils.js');
const fs = require('fs');
const request = require("request-promise-native");
const Weather = require('./src/weather');
const $t = require('../../public/js/utils/$t.js');
$t.loadFunctions(require('./generated/html-templates'))
require('./src/global-$t-funcs');
const Request = require('../../public/js/utils/request.js');
const User = require('./src/user');
const SERVICE_DIR = './services/weather-fax/';
const HTML = require('./src/html');
const PDF = HTML.PDF;
const EPNTS = require('./src/EPNTS');
const reports = require('./src/report');
const Context = require('../../src/context');
const dg = require('./src/debug-gui-interface');

reports();

function generateDocument(faxNumber, type, format, res, next) {
  try {
    const user = new User(faxNumber);
    res.setHeader('Content-Type', 'application/json');
    const formatter = format === 'pdf' ? PDF : HTML;
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
    dg.exception('generateDocument', e);
    res.status(400).send(`Invaild fax number or email '${faxNumber}'`)
  }
}

// Securing admin with new password on startup
const adminPassword = shell.exec('pst update weather-fax admin-password').stdout.trim();
const isAdmin = (req) => global.ENV === 'local' || req.query.adminPassword === adminPassword;

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
    const filename = `${SERVICE_DIR}hooks/${dateStr()}.json`;
    shell.touch(filename);
    try {
      const eventType = req.body.data.event_type;
      if (eventType === 'fax.sending.started') {
        const mediaUrl = req.body.data.payload.original_media_url;
        const from = req.body.data.payload.from;
        saveFile('incoming', from, mediaUrl);
      }
      fs.writeFile(`${SERVICE_DIR}faxes/test.pdf`, templates.test());
    } catch (e) {console.error(e)};
    fs.writeFile(filename, JSON.stringify(req.body, null, 2), console.log);
    res.send(`success: ${filename}`);
  });

  app.get(prefix + '/:type/:areaOzipOnumber', function (req, res, next) {
    const areaOzipOnumber = req.params.areaOzipOnumber;
    const type = req.params.type;
    res.setHeader('Content-Type', 'application/json');
    Weather[type](areaOzipOnumber, (results) => res.send(JSON.stringify(results)), (error) => next(JSON.stringify(error)));
  });

  app.get(prefix + '/:format/:type/:faxNumber', function (req, res, next) {
    const faxNumber = req.params.faxNumber;
    const type = req.params.type;
    const format = req.params.format;
    generateDocument(faxNumber, type, format, res, next);
  });
}


exports.endpoints = endpoints;
