
const fs = require('fs');
const shell = require('shelljs');
const { User } = require('./src/user');
const { emailSvc } = require('./src/email');
const { EPNTS } = require('./src/EPNTS');

const success = (res) => () => res.send('success');
const fail = (next) => (e) => next(e);

class UnAuthorized extends Error {
  constructor(msg) {
    super(msg);
    this.status = 401;
    this.msg = msg;
  }
}

const getUser = (req) => {
  const authStr = req.headers['authorization'];
  console.log('as:', authStr);
  const split = authStr.split(':');

  const user = new User(split[0], split[1]);
  if (user.validate()) {
    return user;
  }
  throw new UnAuthorized('Invalid User Authorization');
}

const setCredentials = (res, email, secret) => {
  res.header('authorization', `${email}:${secret}`);
}

function endpoints(app, prefix) {

  //  ---------------------------- User -----------------------------//
  app.post(prefix + EPNTS.user.register(), function (req, res, next) {
    const email = req.body.email;
    const secret = new User(email, undefined, req.body.password).register();
    emailSvc.activation(email, secret, success(res), fail(next));
  });

  app.post(prefix + EPNTS.user.resendActivation(), function (req, res, next) {
    const email = req.body.email;
    const secret = new User(email).activationSecret();
    emailSvc.activation(email, secret, success(res), fail(next));
  });

  app.get(prefix + EPNTS.user.activate(), function (req, res, next) {
    new User(req.params.email, req.params.secret).activate();
    res.send('success');
  });

  app.get(prefix + EPNTS.user.validate(), function (req, res, next) {
    getUser(req);
    res.send('success');
  });

  app.post(prefix + EPNTS.user.login(), function (req, res, next) {
    const email = req.body.email;
    const secret = new User(email, undefined, req.body.password).login();
    setCredentials(res, email, secret);
    res.send('success');
  });

  app.post(prefix + EPNTS.user.resetPasswordRequest(), function (req, res, next) {
    const email = req.body.email;
    const secret = new User(email).resetPasswordToken(req.body.newPassword);
    emailSvc.resetPassword(email, secret, success(res), fail(next));
  });

  app.get(prefix + EPNTS.user.resetPassword(), function (req, res, next) {
    const email = req.params.email;
    const secret = req.params.secret;
    new User(email, secret).resetPassword();
    res.send('success');
  });

  //  ---------------------------- Cabinet -----------------------------//

  app.get(prefix + '/id', function (req, res) {
    const user = getUser();
    res.send('on');
  });

  app.get(prefix + '/list', function (req, res) {
    res.send('on');
  });

  app.post(prefix + '/save', function (req, res) {
    res.send('on');
  });

  app.get(prefix + '/room/id', function (req, res) {
    res.send('on');
  });

  app.post(prefix + '/room/save', function (req, res) {
    res.send('on');
  });
}

exports.endpoints = endpoints;
