const shell = require('shelljs');
const mailgun = require("mailgun-js");
const ENV = require('./properties').ENV;
const apiKey = 'hello';//shell.exec('pst value mailgun apiKey').stdout.trim();
const domain = 'shishkabab';//shell.exec('pst value mailgun domain').stdout.trim();
const mg = mailgun({ apiKey, domain });


function send (data, success, failure) {
  function respond (error, body) {
    if (error) {
      // TODO: unncomment// failure(error);
      success();
    }
    if ((typeof callback) === 'function') {
      success(body);
    }
  }
  mg.messages().send(data, respond);
}

function sendActivationEmail(user, credential, success, failure) {
  const userId = credential.userId;
  const actSecret = credential.activationSecret;
  const activationUrl = `${ENV.get('host')}/data/credential/activate/${userId}/${actSecret}`;
  // console.log('activation url:', activationUrl);
  send({
    from: 'CE <ce@jozsefmorrissey.com>',
    to: user.getEmail(),
    subject: 'Activate Account',
    html: `<p>Thanks for creating an account to activate it simply
              <br>
              <button onclick='window.open("${activationUrl}","_blank")'>Click Here</button>`
    }, success, failure);
}

function sendResetSecret(to, callback) {
  send({
    from: 'CE <ce@jozsefmorrissey.com>',
    to,
    subject: 'Reset Secret',
    html: `<h3>This will disconect all other devices that are connected to your
            account.</h3>
            <p>If you are unfamiliar to share access simply use the sync
            functionality, from a connected device.</p>
            <br/><button>Reset Secret</button>` }, callback);
}



exports.sendActivationEmail = sendActivationEmail;
exports.sendResetSecret = sendResetSecret;
exports.send = send;
