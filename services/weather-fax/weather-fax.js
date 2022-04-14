
const shell = require('shelljs');
require('./../../public/js/utils/utils.js')
const fs = require('fs');

const SERVICE_DIR = './services/weather-fax/';

function endpoints(app, prefix) {
  app.post(prefix + '/webhook/', function (req, res, next) {
    const dateStr = new Date().toLocaleString().replace(/\//g, '-');
    const fileName = `${SERVICE_DIR}/hooks/${dateStr}.json`;
    console.log(fileName);
    shell.touch(fileName);
    fs.writeFile(fileName, JSON.stringify(req.body, null, 2), console.log);
    res.send(`success: ${fileName}`);
  });
  app.get(prefix + '/webhook/', function (req, res, next) {
    const dateStr = new Date().toLocaleString().replace(/\//g, '-');
    const fileName = `${SERVICE_DIR}/hooks/${dateStr}.json`;
    console.log(fileName);
    shell.touch(fileName);
    fs.writeFile(fileName, JSON.stringify(req.body, null, 2), console.log);
    res.send(`success: ${fileName}`);
  });
}


exports.endpoints = endpoints;
