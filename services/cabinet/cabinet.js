
const fs = require('fs');
const shell = require('shelljs');


function endpoints(app, prefix) {
  app.get(prefix + '/party', function (req, res) {
    res.send('on');
  });
}

exports.endpoints = endpoints;
