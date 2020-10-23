


function send (data, callback) {
  function respond (error, body) {
    if (error) {
      throw new Error('mailgun email failed to send\n' + error.msg);
    }
    if ((typeof callback) === 'function') {
      callback(body);
    }
  }
  mg.messages().send(data, respond);
}

function sendActivationEmail(to, callback) {
  send({
    from: 'CE <ce@jozsefmorrissey.com>',
    to,
    subject: 'Activate Account',
    html: `<p>Thanks for creating an account to activate it simply
              <br>
              <button>Click Here</button>` },
    callback);
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
