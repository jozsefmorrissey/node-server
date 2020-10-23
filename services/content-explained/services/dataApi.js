const bcrypt = require('bcryptjs');
const Crud = require('./database/mySqlWrapper').Crud;
const { User, Explanation, Site, Opinion, List, ListItem } =
        require('./database/objects');
const { randomString } = require('./tools.js');
const email = require('./email.js');

const crud = new Crud({silent: false, mutex: true});

function returnQuery(res, next) {
  return function (results, error) {
    if (error) {
      next(new Error(error));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(results);
    }
  }
}

function endpoints(app, prefix, ip) {
  app.get(prefix + "/user/:id", function (req, res, next) {
    const id = Number.parseInt(req.params.id);
    crud.select(new User(id), returnQuery(res, next));
  });

  app.post(prefix + "/user/:username", function (req, res, next) {
    const username = req.params.username;
    const secret = randomString(256, /[a-zA-Z0-9]/, /.{1,}/);
    crud.insert(new User(username, secret), returnQuery(res, next));
  });

  app.get(prefix + "/list/:id", function (req, res, next) {
    crud.select(new List(Number.parseInt(req.params.id)), returnQuery(res, next));
  });

  app.post(prefix + "/list/:name", function (req, res, next) {
    crud.insert(new List(req.params.name), returnQuery(res, next));
  });

  app.get(prefix + "/send", function (req, res, next) {
    res.send("Hi to " + req.device.type + ' running ' + req.headers['user-agent'] + ' at ' + req.ip + " User");
    // email.sendActivationEmail('jozsef.morrissey@gmail.com');
    // email.sendResetSecret('jozsef.morrissey@gmail.com');
    // email.sendActivationEmail('me@jozsefmorrissey.com');
    // email.sendResetSecret('me@jozsefmorrissey.com');
    // res.send('success');
  })
}


exports.endpoints = endpoints;
