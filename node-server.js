var express = require("express");
var fs = require("fs");
var shell = require("shelljs")
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
const cookieParser = require("cookie-parser");
try{
global.__basedir = __dirname;
global.ENV = process.argv[2];

console.log(process.argv);

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

var http = require('http');
var https = require('https');

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

var https_options = {
  key: fs.readFileSync(shell.exec("realpath ~/.cert/jozsefmorrissey_com.key").stdout.trim()),
  cert: fs.readFileSync(shell.exec("realpath ~/.cert/jozsefmorrissey_com.crt").stdout.trim()),
  ca: []
};

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

app.get("/git", function (req, res) {
  res.redirect('https://github.com/jozsefmorrissey/node-server');
});

app.post('/upload', function(req, res) {
  console.log(req.files.newFile); // the uploaded file object
  var file = req.files.newFile;
  fs.writeFileSync('./uploads/' + file.name, file.data);
  res.send('success');
});

let loadersPath = './public/js/loaders/';

function getAllLoaders() {
  return shell.ls(loadersPath);
}

app.get('/transfer-fill/list', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(getAllLoaders());
});

const transferFillFile = './transfer-fill.js';
app.get('/transfer-fill', function(req, res) {
  let allLoaders = loadersPath + getAllLoaders().join(' ' + loadersPath);
  let dontModify = "// DO NOT MODIFY: file is generated\n\n"
  catCmd = 'cat ./public/js/load.js ' + allLoaders;
  var text = shell.exec(catCmd);
  fs.writeFileSync(transferFillFile, dontModify + text);
  var loadersJs = fs.readFileSync(transferFillFile, 'utf8');
  res.setHeader('Content-Type', 'text/javascript');
  res.send(loadersJs);
});

var dirReg = /(^.*\/).*$/;
app.post('/copy', function(req, res) {
  console.log(req.body.name.replace(/(^.*\/).*$/, '$1'));
  if (req.body.name.match(dirReg)) {
    shell.mkdir('-p', './uploads/' + req.body.name.replace(dirReg, '$1'));
  }
  fs.writeFileSync('./uploads/' + req.body.name, req.body.text);
  res.send('success');
});

var ip = '192.168.254.10';
var services = shell.ls('./services/');
var exclude = ['uss', 'uus'];
try {
  for (let i = 0; i < services.length; i += 1) {
    var id = services[i];
    if (exclude.indexOf(id) == -1) {
      var loc = '/' + id;
      var dir = './services' + loc;
      var project = dir + loc;
      app.use(loc, express.static(dir + '/public'))
      require(project).endpoints(app, loc, ip);
    }
  }
} catch (e) { console.log('error: ', e); }

var httpServer = http.createServer(app);
var httpsServer = https.createServer(https_options, app);
httpServer.listen(3000);
httpsServer.listen(3001);

var user = getUser();
//shell.exec("xdg-open \"https://localhost:3001/debug-gui/html/debug-gui-client-test.html?DebugGui.id=" + user + "\"");

} catch (e) { console.log('error:ssss ', e); }
