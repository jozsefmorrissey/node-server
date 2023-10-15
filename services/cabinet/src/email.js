const shell = require('shelljs');
const mailgun = require("mailgun-js");
const apiKey = shell.exec('pst value mailgun apiKey').stdout.trim();
const domain = shell.exec('pst value mailgun domain').stdout.trim();
const emailServiceActive = global.ENV === 'prod';
const mg = emailServiceActive ? mailgun({ apiKey, domain }) : undefined;
const Endpoints = require('../../../public/js/utils/endpoints');
const ENPTS = new Endpoints(require('../public/json/endpoints.json'), global.ENV).getFuncObj();

class EmailFailedToSend extends Error {
  constructor(error) {
    super(error.msg);
    this.name = this.constructor.name;
    this.status = 500;
  }
}

function print(message) {
  if (global.ENV === 'local') {
    console.info.apply(null, arguments);
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
    console.info('sending: ', data);
    mg.messages().send(data, respond);
  } else {
    respond();
  }
}

function activation(email, secret, success, failure) {
  const activationUrl = ENPTS.user.activate(email, secret);
  print('activation url:', activationUrl);
  send({
    from: 'CE <ce@jozsefmorrissey.com>',
    to: email,
    subject: 'Activate Account',
    html: `<p>Thanks for creating an account to activate it simply
              <br>
              <a href='${activationUrl}' target='_blank'>Click Here</a>`
    }, success, failure);
}

function resetPassword(to, secret, success, fail) {
  const resetUrl = ENPTS.user.resetPassword(to, secret);
  print('reset url:', resetUrl);
  send({
    from: 'CE <ce@jozsefmorrissey.com>',
    to,
    subject: 'Reset Password',
    html: `<a href='${resetUrl}' target='_blank'>Click Here</a>
          to reset your password.`
  }, success, fail);
}

exports.emailSvc = {activation, resetPassword, send};
