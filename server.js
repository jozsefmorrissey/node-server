var express = require("express");
var fs = require("fs");
var shell = require("shelljs")
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
const cookieParser = require("cookie-parser");
require('./public/js/utils/utils.js')

const Context = require('./src/context');

const path = require('path');
global.SERVER_ROOT = path.resolve(__dirname);
global.DATA_DIRECTORY = `${shell.exec('realpath ~').stdout.trim()}/.opsc`;

require('./public/js/utils/parse-arguments');
try{

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

var http = require('http');
var https = require('https');
const serverId = Math.floor(Math.random() * 1000000000);

function getIp() {
  var ipconfig = shell.exec('ipconfig', {silent: true}).stdout;
  var lines = ipconfig.split('\r\n')
  var index = 0;
  var line = lines[index].replace(/(.*IPv4.*?: ([0-9.]*).*)/g, '$2');
  while (line == lines[index]) {
    index++;
    line = lines[index].replace(/(.*IPv4.*?: ([0-9.]*).*)/g, '$2');
  }
  return line;
}

function getUser() {
  var user = shell.exec('echo %UserProfile%', {silent: true}).stdout.replace(/^.*\\([^\\]*)$/, '$1').trim();
  if (user.indexOf('%UserProfile%') === -1) {
    return user;
  }
  return shell.exec('echo ${UserProfile}', {silent: true}).stdout.replace(/^.*\\([^\\]*)$/, '$1').trim();
}

if (shell.exec('[ -d ~/.cert ] && echo true', {silent: true}).stdout.trim() !== 'true') {
  shell.exec('mkdir ~/.cert/ && cp ./cert/* ~/.cert/');
}

var https_options = {};
https_options.agent = false;
https_options.rejectUnauthorized = false;
try {
  https_options.key = fs.readFileSync(shell.exec("realpath ~/.cert/__jozsefmorrissey_com.key").stdout.trim());
  https_options.cert = fs.readFileSync(shell.exec("realpath ~/.cert/__jozsefmorrissey_com.crt").stdout.trim());
} catch (e) {
  console.error('failed to read https cert/key');
}

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(express.static('./public'));

app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));

app.all('/*',function(req,res,next){
  res.header('ce-server-id', serverId);
  new Context(req);
  next();
});

app.get("/git", function (req, res) {
  res.redirect('https://github.com/jozsefmorrissey/node-server');
});

const protectError = new Error('This needs to be protected');

app.post('/upload', function(req, res) {
  throw protectError;
  var file = req.files.newFile;
  fs.writeFileSync('./uploads/' + file.name, file.data);
  res.send('success');
});

// let loadersPath = './public/js/loaders/';
//
// function getAllLoaders() {
//   return shell.ls(loadersPath);
// }
//
// app.get('/transfer-fill/list', function (req, res) {
//   res.setHeader('Content-Type', 'application/json');
//   res.send(getAllLoaders());
// });
//
// const transferFillFile = './transfer-fill.js';
// app.get('/transfer-fill', function(req, res) {
//   let allLoaders = loadersPath + getAllLoaders().join(' ' + loadersPath);
//   let dontModify = "// DO NOT MODIFY: file is generated\n\n"
//   catCmd = 'cat ./public/js/load.js ' + allLoaders;
//   var text = shell.exec(catCmd);
//   fs.writeFileSync(transferFillFile, dontModify + text);
//   var loadersJs = fs.readFileSync(transferFillFile, 'utf8');
//   res.setHeader('Content-Type', 'text/javascript');
//   res.send(loadersJs);
// });

// --------------- Evan Motivation ----//



var dirReg = /(^.*\/).*$/;
app.post('/copy', function(req, res) {
  throw protectError;
  if (req.body.name.match(dirReg)) {
    shell.mkdir('-p', './uploads/' + req.body.name.replace(dirReg, '$1'));
  }
  fs.writeFileSync('./uploads/' + req.body.name, req.body.text);
  res.send('success');
});

function saveLocation(name) {
  return `./public/json/${name}.json`;
}

app.get('/load/json/:name', function (req, res) {
  throw protectError;
    const name = req.params.name;
    res.send(JSON.parse(fs.readFileSync(saveLocation(name))));
});

app.post('/save/json', function (req, res) {
  throw protectError;
  const name = req.body.name;
  const contents = JSON.stringify(req.body.json);
  fs.writeFileSync(saveLocation(name), contents);
  res.send('success');
});

function printCall(method) {
  return (req, res) => {
    console.log(`Request Method: ${method}`);
    console.log('Parameters:', req.query);
    console.log('Body:', req.body);
    res.send('success');
  }
}

app.get('/print/body', printCall('GET'));
app.post('/print/body', printCall('POST'));
app.put('/print/body', printCall('PUT'));
app.delete('/print/body', printCall('DELETE'));


var ip = '192.168.254.10';
var services = global.service ? [global.service] : shell.ls('./services/');
var exclude = ['uss', 'uus', 'mitch', 'weather-fax', 'content-explained', 'premier', 'info-directory', 'homework-help', 'debug-gui'];
try {
  for (let i = 0; i < services.length; i += 1) {
    var id = services[i];
    if (exclude.indexOf(id) == -1) {
      console.log(`Attempting To Start ${id}`);
      var loc = '/' + id;
      var dir = './services' + loc;
      var project = dir + loc;
      app.use(loc, express.static(dir + '/public'));
      const flags = global.ENV === 'local' ? '' : '-build';
      const buildCmd = `cd ${dir} && node ./watch.js ENV='${global.ENV}' ${flags}`;
      console.log(`Started ${id} - build command '${buildCmd}'`);
      try {
        shell.exec(buildCmd, {async: true, silent: true});
      } catch (e) {}
      require(project).endpoints(app, loc, ip);
    }
  }
} catch (e) { console.error(e); }

app.get("", function (req, res) {
  res.redirect(`/${services[0]}`);
});

var httpServer = http.createServer(app);
var httpsServer = https.createServer(https_options, app);
httpServer.listen(3000);
httpsServer.listen(3001);

var user = getUser();
//shell.exec("xdg-open \"https://localhost:3001/debug-gui/html/debug-gui-client-test.html?DebugGui.id=" + user + "\"");

} catch (e) { console.error(e); }
