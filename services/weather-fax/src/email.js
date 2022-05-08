const shell = require('shelljs');
const mailgun = require("mailgun-js");
const apiKey = shell.exec('pst value mailgun apiKey').stdout.trim();
const domain = shell.exec('pst value mailgun domain').stdout.trim();
const emailServiceActive = global.ENV === 'prod';
const mg = emailServiceActive ? mailgun({ apiKey, domain }) : undefined;
const ENPTS = require('./EPNTS');

class EmailFailedToSend extends Error {
  constructor(error) {
    super(error.msg);
    this.name = this.constructor.name;
    this.status = 500;
  }
}

function print(message) {
  if (global.ENV === 'local') {
    console.log.apply(null, arguments);
  }
}
function send (data, success, failure) {
  function respond (error, body) {
    if (error) {
      failure(error);
    } else if ((typeof success) === 'function') {
      success(body);
    }
  }
  if (emailServiceActive) {
    console.log('sending: ', data);
    mg.messages().send(data, respond);
  } else {
    respond();
  }
}

function sendHtml(email, html, success, failure) {
  const subject = html.replace(/.*<title>(.*?)<\/title>.*/, '$1');
  console.log('trying to send', subject);
  send({
    from: 'Weather-Fax <weather-fax@jozsefmorrissey.com>',
    to: email,
    subject, html
  }, success, failure);
}

function sendPdf(subject, name, url, email, success, failure) {
  console.log('trying to send', subject);
  send({
    from: 'Weather-Fax <weather-fax@jozsefmorrissey.com>',
    to: email,
    html: 'Weather-Fax Report',
    subject,
    MIMEType: 'multipart/form-data',
    attachments:{
      url, name,
      "content-type": 'application/pdf'
    }
  }, success, failure);
}

module.exports = {sendHtml, sendPdf};
