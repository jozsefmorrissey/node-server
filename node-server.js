var express = require("express");
var fs = require("fs");
var shell = require("shelljs")
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

var http = require('http');
var https = require('https');


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

app.get("/git", function (req, res) {
  res.redirect('https://github.com/jozsefmorrissey/node-server');
});

var services = shell.ls('./services/');
for (let i = 0; i < services.length; i += 1) {
  var id = services[i];
  var loc = '/' + id;
  var dir = './services' + loc;
  var project = dir + loc;
  app.use(loc, express.static(dir + '/public'))
  require(project).endpoints(app, loc);
}

var httpServer = http.createServer(app);
var httpsServer = https.createServer(https_options, app);

httpServer.listen(3000);
httpsServer.listen(3001);
