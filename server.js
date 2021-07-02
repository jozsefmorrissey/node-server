var express = require("express");
var fs = require("fs");
var shell = require("shelljs")
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
const cookieParser = require("cookie-parser");

const trueReg = /^true$/;
const falseReg = /^false$/;
const numberReg = /^[0-9]{1,}$/;
const arrayReg = /^(.*[,].*(,|)){1,}$/;

function getValue(str) {
  if (str === '') return undefined;
  if (str.match(trueReg)) return true;
  if (str.match(falseReg)) return false;
  if (str.match(numberReg)) return Number.parseInt(str);
  if (str.match(arrayReg)) {
    const arr = [];
    const elems = str.split(',');
    for (let index = 0; index < elems.length; index += 1) {
      arr.push(getValue(elems[index]));
    }
    return arr;
  }
  return str;
}

const valueRegex = /[A-Z.a-z]{1,}=.*$/;
function argParser() {
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg.match(valueRegex)) {
      const varName = arg.split('=', 1)[0];
      const valueStr = arg.substr(varName.length + 1);
      global[varName] = getValue(valueStr.trim());
    }
  }
}

try{
global.__basedir = __dirname;
argParser();

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

// --------------- Evan Motivation ----//

function incrementalAdd(initial, increment, percentGrowth) {
  let total = 0;
  let totalDays = 0;
  let cost = initial;
  percentGrowth = !Number.isFinite(percentGrowth) ? 0 : percentGrowth;
  return {
    increment: (count) => {
      count = !Number.isFinite(count) || count < 1 ? 1 : count;
      for (let index = 0; index < count; index += 1) {
        total += cost
        cost += increment;
        increment *= 1+(percentGrowth/100);
      }
      totalDays += count;
      cost = Math.floor(cost * 100) / 100;
      total = Math.floor(total * 100) / 100
      return total;
    },
    adjustBalance: ((value) => total = Math.round((total + value) * 100) / 100),
    total: () => new String(total).replace(/\.([1-9])$/, '.$10').replace(/^(-[0-9]*)$/, '$1.00'),
    cost: () => new String(cost).replace(/\.([1-9])$/, '.$10').replace(/^(-[0-9]*)$/, '$1.00'),
    percentGrowth: () => percentGrowth,
    incrementValue: () => increment,
    clone: () => incrementalAdd(cost, increment, percentGrowth),
    perjection: (count) => {
      const clone = incrementalAdd(cost, increment, percentGrowth)
      clone.increment(count);
      return clone;
    },
    totalDays: () => totalDays
  }
}

function randomString(len) {
  len = len || 7;
  let str = '';
  while (str.length < len) str += Math.random().toString(36).substr(2);
  return str.substr(0, len);
}

function evanHtml(id) {
  const ia = incrementalAddObjs[id];
  const increments = [1,1,1,1,1,5,5,5,5,10,10];
  let perjections = '';
  let day = 0;
  for (let index = 0; index < increments.length; index += 1) {
    day += increments[index];
    const perjection = ia.perjection(day);
    perjections += `<br><b>Day ${day + ia.totalDays()} - \$${perjection.cost()} | \$${ia.total() + perjection.total()}</b>`;
  }
  const adjustUrl = `/evan/adjust`;
  const incUrl = `/evan/increment/${id}`;
  const increment = `<a href='${incUrl}'>Increment</a>`;
  const adjust = `
  <form action="${adjustUrl}" method='POST'>
    <input hidden name='incId' value='${id}'>
    <input name='change'>
    <button type="submit">Update Total</button>
  </form>`;
  const html = `<h1>Days ${ia.totalDays()} \$${ia.cost()} | \$${ia.total()}</h1>${increment}<br/>${adjust}<br/><br/>${perjections}`;

  return html;
}

app.get('/evan/view/:randId', function(req, res) {
  res.send(evanHtml(req.params.randId));
});

const incrementalAddObjs = {};
app.get('/evan/setup/:initial/:increment/:percentGrowth', function(req, res) {
  const randId = randomString(128);
  const initial = Number.parseFloat(req.params.initial);
  const inc = Number.parseFloat(req.params.increment);
  const percent = Number.parseFloat(req.params.percentGrowth);
  incrementalAddObjs[randId] = incrementalAdd(initial, inc, percent);
  res.redirect(301, `/evan/view/${randId}`);
});http://localhost:3000/evan/adjust


app.get('/evan/increment/:incId', function(req, res) {
  incrementalAddObjs[req.params.incId].increment();
  res.redirect(301, `/evan/view/${req.params.incId}`);
});

app.post('/evan/adjust', function(req, res, next) {
  const incId = req.body.incId;
  const change = Number.parseFloat(req.body.change);
  if (!Number.isFinite(change)) {
    next(new Error('Invalid change value'));
  } else {
    incrementalAddObjs[incId].adjustBalance(change);
    res.redirect(301, `/evan/view/${incId}`);
  }
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
