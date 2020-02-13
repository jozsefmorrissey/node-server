var express = require("express");
var fs = require("fs");
var shell = require("shelljs")
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

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
var https_options = {
  key: fs.readFileSync("./cert/jozsefmorrissey_com.key"),
  cert: fs.readFileSync("./cert/jozsefmorrissey_com.crt"),
  ca: [
      fs.readFileSync('./cert/CAcert1.crt'),
      fs.readFileSync('./cert/CAcert2.crt')
  ]
};

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(express.static('./public'))

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
for (let i = 0; i < services.length; i += 1) {
  var id = services[i];
  var loc = '/' + id;
  var dir = './services' + loc;
  var project = dir + loc;
  app.use(loc, express.static(dir + '/public'))
  require(project).endpoints(app, loc, ip);
}

var httpServer = http.createServer(app);
var httpsServer = https.createServer(https_options, app);

httpServer.listen(3000);
httpsServer.listen(3001);

var user = getUser();
shell.exec("xdg-open \"https://localhost:3001/debug-gui/html/debug-gui-client-test.html?DebugGui.id=" + user + "\"");
