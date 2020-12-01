var fs = require("fs");
var shell = require("shelljs");
var config = require('./config.json');

const { UsernameAlreadyTaken, ExplanationNotFound, MerriamRequestFailed } =
        require('./services/exceptions.js');

const { EPNTS } = require('./services/EPNTS');
const { Context } = require('./services/context');

global.ENV = process.argv[2];
const serverId = Math.floor(Math.random() * 1000000000);

const merriamApiKey = shell.exec('pst value CE merriamApiKey', {silent: true}).trim();

function ensureLength(str, length, prefix, suffix) {
  str = str.length > length ? str.substr(0, length) : str + '';
  prefix = prefix === undefined ? '' : prefix + '';
  suffix = suffix === undefined ? '' : suffix + '';
  for (let index = str.length; str.length < length; index += 1) {
      str = `${prefix}${str}${suffix}`;
  }
  return str;
}

const cleanRegEx = /[^a-z/]|((e|)s|ed|ing)$/gi;
function cleanStr(str) {
  if ((typeof str) !== 'string') {
    return undefined;
  }
  return str.replace(/\s{1,}/g, '/').replace(cleanRegEx, '').toLowerCase();
}

function hash(string) {
  let hash = 0;
  for (let i = 0; string && i < string.length; i += 1) {
    const character = string.charCodeAt(i);
    hash = ((hash << 11) - hash) + character;
  }
  return hash;
}

// TODO: Create a articles determinars and quantifiers list
function getFile(string, directory) {
  string = cleanStr(string);
  const hashed = ensureLength(hash(string), 6, 0);
  const len = hashed.length;
  return `${directory}${hashed.substr(len - 6,2)}/${hashed.substr(len - 4,2)}/${hashed.substr(len - 2, 2)}.json`;
}


function getMerriamResponse(searchText, res, next) {
  const XMLhr = require('xmlhttprequest').XMLHttpRequest;
  const xhr = new XMLhr();

  const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${searchText}?key=${merriamApiKey}`;
  xhr.onreadystatechange = function () {
      if (this.readyState != 4) return;

      if (this.status == 200) {
          res.setHeader('Content-Type', 'application/json');
          var data = JSON.parse(this.responseText);
          res.send(data);
      } else {
        next(new MerriamRequestFailed());
      }
  };

  xhr.open('GET', url, true);
  xhr.send();
}



function endpoints(app, prefix, ip) {
  app.all(prefix + '/*',function(req,res,next){
    res.header('ce-server-id', serverId);
    new Context(req);
    next();
  });

  app.get(prefix + EPNTS.endpoints.EPNTS(), function(req, res, next) {
    let endpoints, enpts;
    const jsonFile = './services/content-explained/public/json/endpoints.json';
    const jsFile = './services/content-explained/services/EPNTS.js';
    res.header('ce-server-id', serverId);
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
          const host = req.params.env || EPNTS._envs[global.ENV];
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

  app.get(prefix + EPNTS.merriam.search(), function (req, res, next) {
    getMerriamResponse(req.params.searchText, res, next);
  });

  require('./services/dataApi.js').endpoints(app, prefix, ip);
}


exports.endpoints = endpoints;
exports.cleanStr = cleanStr;
exports.getFile = getFile;
