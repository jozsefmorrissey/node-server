const shell = require('shelljs');
const mailgun = require("mailgun-js");
const { EPNTS } = require('./EPNTS.js');
const { Context } = require('./context.js');
const ENV = require('./properties').ENV;
const apiKey = shell.exec('pst value mailgun apiKey').stdout.trim();
const domain = shell.exec('pst value mailgun domain').stdout.trim();
const emailServiceActive = global.ENV === 'prod';
const mg = emailServiceActive ? mailgun({ apiKey, domain }) : undefined;


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

function sendActivationEmail(user, credential, success, failure) {
  const id = credential.getId();
  const userId = credential.userId;
  const actSecret = credential.activationSecret;
  const activationUrl = `${EPNTS.getHost(global.ENV)}${EPNTS.credential.activate(id,userId,actSecret)}`;
  if (global.ENV === 'local') {
    console.log('activation url:', activationUrl);
    Context.fromFunc(success).dg.link('User', 'activationUrl', activationUrl);
  }

  send({
    from: 'CE <ce@jozsefmorrissey.com>',
    to: user.getEmail(),
    subject: 'Activate Account',
    html: `<p>Thanks for creating an account to activate it simply
              <br>
              <a href='${activationUrl}' target='_blank'>Click Here</button>`
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

function sendUpdateUserEmail(user, secret, success, failure) {
  const id = user.id;
  const username = user.username;
  const email = user.getEmail();
  const updateConfirmationUrl = `${EPNTS.getHost(global.ENV)}${EPNTS.user.update(secret)}`;
  if (global.ENV === 'local') {
    console.log('update email:', updateConfirmationUrl);
    Context.fromFunc(success)
        .dg.link('User', 'updateConfirmationUrl', updateConfirmationUrl);
  }
  send({
    from: 'CE <ce@jozsefmorrissey.com>',
    to: user.getEmail(),
    subject: 'Activate Account',
    html: `<p>User update requested please confirm.
              <br>
              <button onclick='window.open("${updateConfirmationUrl}","_blank")'>Confirm</button>`
    }, success, failure);
}

function sendContributorUpdateEmail(confirmationUrl, user, groupContributor, group, remove, success, failure) {
  const username = groupContributor.user.username;
  const admin = groupContributor.admin;
  const email = user.getEmail();

  let subject, html;
  if(remove) {
    subject = `Remove Contrigutor From ${group}`;
    html = `<h4>${user.username} has requested that ${username} be removed from ${group.name}</h4>
            <h4><a href='${confirmationUrl}'>Click Here</a> to confirm</h4>`;
  } else {
    subject = `Add contributor To ${group}`
    html = `<h4>${user.username} has requested that ${username} be added to ${group.name}</h4>
            <h4><a href='${confirmationUrl}'>Click Here</a> to confirm</h4>`;
  }
  const updateConfirmationUrl = `${EPNTS.getHost(global.ENV)}${EPNTS.user.update(secret)}`;
  if (global.ENV === 'local') {
    console.log('update email:', confirmationUrl);
    Context.fromFunc(success)
        .dg.link('GroupcContributorUrl', 'confirmationUrl', confirmationUrl);
  }

  send({
    from: 'CE <ce@jozsefmorrissey.com>',
    to: user.getEmail(),
    subject, html}, success, failure);
}


exports.sendActivationEmail = sendActivationEmail;
exports.sendUpdateUserEmail = sendUpdateUserEmail;
exports.sendResetSecret = sendResetSecret;
exports.send = send;
