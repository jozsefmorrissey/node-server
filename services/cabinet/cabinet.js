
const fs = require('fs');
const shell = require('shelljs');
const { User, UnAuthorized } = require('./src/user');
const { emailSvc } = require('./src/email');
const { EPNTS } = require('./src/EPNTS');

const success = (res) => () => res.send('success');
const fail = (next) => (e) => next(e);

const getUser = (req) => {
  const authStr = req.headers['authorization'];
  console.log('as:', authStr);
  const split = authStr.split(':');

  const user = new User(split[0], split[1]);
  user.validate();
  return user;
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

  app.post(prefix + '/:id', function (req, res) {
    const user = getUser();
    user.saveAttribute('cabinet', req.params.id, cabinet);
    res.send('success');
  });

  app.get(prefix + '/all', function (req, res) {
    const user = getUser();
    res.setHeader('Content-Type', 'application/json');
    res.send(user.loadData('cabinet'));
  });

  //  ---------------------------- Order -----------------------------//

  app.get(prefix + '/list/orders', function (req, res) {
    res.send(getUser().list('order'));
  });

  app.post(prefix + '/save/order/:id', function (req, res) {
    const orderId = req.params.id.replace(/[^a-z^A-Z^0-9^ ]/g, '');
    getUser().saveData(`order.${orderId}`);
    res.send('success');
  });
}

exports.endpoints = endpoints;
