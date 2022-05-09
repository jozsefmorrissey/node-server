
const fs = require('fs');
const shell = require('shelljs');
const pdf = require('html-pdf');
const EPNTS = require('./EPNTS');
const $t = require('../../../public/js/utils/$t.js');
const Weather = require('./weather.js');
const plans = require('./plan.js').plans;
const utils = require('./utils.js');

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
      instance.urlsMap[path] = utils.getUrlPath(path);
      success(instance.urlsMap[path]);
    }

    this.getPath = (templateName, dateHourKey) =>
        `/html/${templateName}/${dateHourKey}.html`;

    function build(templateName, user, success, failure) {
      // purgeDirectories.purge();
      if (failure === undefined) failure = success;
      const htmlTemplate = HTML[`${templateName}Template`];
      if (instance.urlsMap[templateName] === undefined) instance.urlsMap[templateName] = {};
      return (data) => {
        data.user = user;
        const path = instance.getPath(templateName, data.dateHourKey);
        if (instance.urlsMap[path]) return success(instance.urlsMap[path]);
        data.isPdf = instance instanceof PDF;
        var html = htmlTemplate.render(data);
        instance.format(html, path, success, failure);
      }
    }

    this.getHourlyReportUrl = (user, success, failure) => {
      Weather.hourly(user.zipCode(), build('hourlyReport', user, success), failure);
    }
    this.get15HourReportUrl = (user, success, failure) => {
      Weather.hours15(user.zipCode(), build('hours15Report', user, success), failure);
    }
    this.getDailyReportUrl = (user, success, failure) => {
      Weather.daily(user.zipCode(), build('dailyReport', user, success), failure);
    }
    this.getOrderForm = (user, success, failure) => {
      const scope = {user, plans, dateHourKey: `order-form-${String.random()}`};
      build('orderForm', user, success, failure)(scope);
    }
    this.getReportStatus = (user, succes, failure) => {
      build('schedualed', user, success, failure)(user);
    }
  }
}

HTML.hourlyReportTemplate = new $t('weather-reports/hourly');
HTML.hours15ReportTemplate = new $t('weather-reports/hourly');
HTML.dailyReportTemplate = new $t('weather-reports/daily');
HTML.orderFormTemplate = new $t('order-form');
HTML.schedualedReportsStatusTemplate = new $t('schedualed');

const options = { format: 'Letter' };

class PDF extends HTML {
  constructor() {
    super();
    const instance = this;
    this.getPath = (templateName, dateHourKey) =>
        `/pdf/${templateName}/${dateHourKey}.pdf`;

    this.format = (html, path, success, failure) => {
      pdf.create(html, options).toFile(utils.getProjectFilePath(path), function(err, res) {
        if (err) return failure(err);
        instance.urlsMap[path] = utils.getUrlPath(path);
        success(instance.urlsMap[path]);
      });
    }
  }
}


const inst = new HTML();
inst.PDF = new PDF();
module.exports = inst;
