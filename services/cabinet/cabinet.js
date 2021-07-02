
const fs = require('fs');
const shell = require('shelljs');
const dxfDownloadLink = require('./src/export/dxf').downloadLink;
const { User, UnAuthorized } = require('./src/user');
const { emailSvc } = require('./src/email');
const { EPNTS } = require('./src/EPNTS');
// require('./src/scrape/scrape');

const success = (res) => () => res.send('success');
const fail = (next) => (e) => next(e);

const getUser = (req, soft) => {
  const authStr = req.headers['authorization'];
  console.log('as:', authStr);
  const split = authStr.split(':');

  const user = new User(split[0], split[1]);
  if (!soft) user.validate();
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

  app.get(prefix + EPNTS.user.status(), function (req, res, next) {
    res.send(getUser(req, true).status());
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

  app.post(prefix + EPNTS.cabinet.add(), function (req, res) {
    const user = getUser(req);
    user.saveAttribute('cabinet', req.params.id, req.body);
    res.send('success');
  });

  app.get(prefix + EPNTS.cabinet.list(), function (req, res) {
    const user = getUser(req);
    res.setHeader('Content-Type', 'application/json');
    res.send(user.loadData('cabinet') || '[]');
  });

  //  ---------------------------- Order -----------------------------//

  app.get(prefix + EPNTS.order.list(), function (req, res) {
    res.send(getUser(req).list('order'));
  });

  app.get(prefix + EPNTS.order.get(), function (req, res) {
    const orderId = req.params.id.replace(/[^a-z^A-Z^0-9^ ]/g, '');
    res.setHeader('Content-Type', 'application/json');
    res.send(getUser(req).loadData(`order.${orderId}`));
  });

  app.post(prefix + EPNTS.order.add(), function (req, res) {
    console.log('here')
    const orderId = req.params.id.replace(/[^a-z^A-Z^0-9^ ]/g, '');
    getUser(req).saveData(`order.${orderId}`, req.body);
    res.send('success');
  });

  //  ---------------------------- Cost -----------------------------//

  app.post(prefix + EPNTS.costs.save(), function (req, res) {
    getUser(req).saveData(`costs`, req.body);
    res.send('success');
  });

  app.get(prefix + EPNTS.costs.get(), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Type', 'application/json');
    res.send(getUser(req).loadData('costs') || []);
  });

  //  ---------------------------- Template -----------------------------//

  app.post(prefix + EPNTS.templates.save(), function (req, res) {
    getUser(req).saveData(`templates`, req.body);
    res.send('success');
  });

  app.get(prefix + EPNTS.templates.get(), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Type', 'application/json');
    res.send(getUser(req).loadData('templates') || []);
  });

  //  ---------------------------- Properties -----------------------------//

  app.post(prefix + EPNTS.properties.save(), function (req, res) {
    getUser(req).saveData(`properties`, req.body);
    res.send('success');
  });

  app.get(prefix + EPNTS.properties.get(), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Type', 'application/json');
    res.send(getUser(req).loadData('properties') || []);
  });

  //  ---------------------------- Pattern -----------------------------//

  app.post(prefix + EPNTS.patterns.save(), function (req, res) {
    getUser(req).saveData(`patterns`, req.body);
    res.send('success');
  });

  app.get(prefix + EPNTS.patterns.get(), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Type', 'application/json');
    res.send(getUser(req).loadData('patterns') || []);
  });

  //  ---------------------------- Export -----------------------------//

  app.post(prefix + EPNTS.export.dxf(), function (req, res, next) {
    const user = getUser(req);
    const order = req.body.order;
    const csg = req.body.csg;
    try {
      const link = dxfDownloadLink(user, order, csg, {});
      res.send(link);
    } catch (e) {
      next(e);
    }
  });

  //  ---------------------------- Endpoints -----------------------------//

  app.get(prefix + '/endpoints', function(req, res, next) {
  let endpoints, enpts;
  const jsonFile = './services/cabinet/public/json/endpoints.json';
  const jsFile = './services/cabinet/src/EPNTS.js';
  function returnJs(file) {
    return function (err, contents) {
      switch (file) {
        case jsonFile:
          endpoints = contents;
          break;
        case jsFile:
          enpts = contents;
          break;
      }
      if (endpoints && enpts) {
        const host = EPNTS._envs[global.ENV];
        const newEnpts = `new Endpoints(${endpoints}, '${host}')`;
        const exportBlock = '\ntry {exports.EPNTS = EPNTS;}catch(e){}'
        const js = `${enpts}\nconst EPNTS = ${newEnpts}.getFuncObj();${exportBlock}`;
        res.setHeader('Content-Type', 'text/plain');
        res.send(js);
      }
    }
  }
  fs.readFile(jsonFile, returnJs(jsonFile));
  fs.readFile(jsFile, returnJs(jsFile));
});
}

exports.endpoints = endpoints;
