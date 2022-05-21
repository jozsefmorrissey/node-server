
const fs = require('fs');
const shell = require('shelljs');
const pdf = require('html-pdf');
const EPNTS = require('./EPNTS');
const $t = require('../../../public/js/utils/$t.js');
const Weather = require('./weather.js');
const plans = require('./plan.js').plans;
const utils = require('./utils');

const directories = require('./temporary-directories');
const purgeDirectories = new (require('./purge-directories'))(1, ...directories);

class HTML {
  constructor() {
    this.urlsMap = {};
    const instance = this;

    purgeDirectories.on(() => instance.urlsMap = {});

    this.format = (html, path, success, failure) => {
      const filename = utils.getProjectFilePath(path);
      const dir = filename.replace(/(^.*\/).*$/, '$1');
      shell.mkdir('-p', dir);
      fs.writeFileSync(filename, html);
      console.log('written')
      instance.urlsMap[path] = utils.getUrlPath(path);
      success(instance.urlsMap[path]);
    }

    this.getPath = (templateName, dateHourKey) =>
        `/html/${templateName}/${dateHourKey}.html`;

    const tempDirRegs = {};
    function build(templateName, user, success, failure) {
      console.log('building...');
      if (tempDirRegs[templateName] === undefined)
        tempDirRegs[templateName] = new RegExp(`.*/${templateName}/.*`);
      purgeDirectories.purge(tempDirRegs[templateName]).forEach(
              (file) => instance.urlsMap[utils.getPublicPath(file)] = undefined);
      if (failure === undefined) failure = success;
      const htmlTemplate = HTML[`${templateName}Template`];
      if (instance.urlsMap[templateName] === undefined) instance.urlsMap[templateName] = {};
      return (data) => {
        data.user = user;
        const path = instance.getPath(templateName, data.dateHourKey);
        if (instance.urlsMap[path]) return success(instance.urlsMap[path]);
        data.isPdf = instance instanceof PDF;
        var html = htmlTemplate.render(data);
        console.log('built');
        instance.format(html, path, success, failure);
      }
    }

    this.getHourlyReportUrl = (user, success, failure) => {
      Weather.hourly(user.zipCode(), build('hourlyReport', user, success), failure);
    }
    this.get12HourReportUrl = (user, success, failure) => {
      Weather.hours12(user.zipCode(), build('hours12Report', user, success), failure);
    }
    this.getDailyReportUrl = (user, success, failure) => {
      Weather.daily(user.zipCode(), build('dailyReport', user, success), failure);
    }
    this.getOrderForm = (user, success, failure) => {
      const scope = {user, plans, dateHourKey: `order-form-${String.random()}`};
      build('orderForm', user, success, failure)(scope);
    }
    this.getReportStatus = (user, success, failure) => {
      user.dateHourKey = `${user.userId()}`;
      build('reportStatus', user, success, failure)(user);
    }
    this.requestCapped = (user, success, failure) => {
      user.dateHourKey = `${user.userId()}`;
      build('userCapped', user, success, failure)(user);
    }
  }
}

HTML.hourlyReportTemplate = new $t('weather-reports/hourly');
HTML.hours12ReportTemplate = new $t('weather-reports/hourly');
HTML.dailyReportTemplate = new $t('weather-reports/daily');
HTML.orderFormTemplate = new $t('order-form');
HTML.reportStatusTemplate = new $t('reportStatus');
HTML.userCappedTemplate = new $t('user-capped');

const options = { format: 'Letter' };

class PDF extends HTML {
  constructor() {
    super();
    const instance = this;
    this.getPath = (templateName, dateHourKey) =>
        `/pdf/${templateName}/${dateHourKey}.pdf`;

    this.format = (html, path, success, failure) => {
      console.log('pdf create:', path)
      console.log('dir', __dirname);
      console.log('utils', JSON.stringify(utils, null, 2));
      console.log(`'${utils.getAbsoluteFilePath(path)}'`);
      pdf.create(html, options).toFile(utils.getAbsoluteFilePath(path), function(err, res) {
        if (err) return failure(err);
        instance.urlsMap[path] = utils.getUrlPath(path);
        success(instance.urlsMap[path]);
      });
    }
  }
}


const inst = new HTML();
inst.PDF = new PDF();
inst.getFormatter = (format) =>
  format === 'pdf' ? inst.PDF : inst;
module.exports = inst;
