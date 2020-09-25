var fs = require("fs");
var shell = require("shelljs");
var config = require('./config.json');

const EXP_DIR = './services/content-explained/explanations/';

class ExplanationNotFound extends Error {
  constructor(words) {
    super(`No explanation found for '${words}'.`);
    this.name = "ExplanationNotFound";
    this.status = 404;
  }
}

class InvalidRequestError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "InvalidRequestError";
    this.status = 400;
  }
}

function consistentType(array, type) {
  for (let index = 0; index < array.length; index += 1)  {
    if ((typeof array[index]) !== type) {
      return false;
    }
  }
  return true;
}

class Explanation {
  constructor(req) {
    this.words = req.params.words;
    this.explanation = req.body.explanation;
    this.author = req.body.author;
    this.tags = req.body.tags;
    if ((typeof this.words) !== 'string' ||
        (typeof this.explanation) !== 'string' ||
        (typeof this.author) !== 'string' ||
        !Array.isArray(this.tags) || !consistentType(this.tags, 'string')) {
      throw new InvalidRequestError('Type constraints violated: words(string) explanation(string) author(string) tags(array[of strings])')
        }
  }
}

const explanationNotFound = new Error('No explanations found');

function atleast(str, length, prefix, suffix) {
  str = str + '';
  prefix = prefix === undefined ? undefined : prefix + '';
  suffix = suffix === undefined ? undefined : suffix + '';
  for (let index = str.length; str.length < length; index += 1) {
    if (prefix) {
      str = `${prefix}${str}`;
    }
    if (suffix) {
      str += suffix;
    }
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

// TODO: Create a articles determinars and quantifiers list
function getFile(string) {
  string = cleanStr(string);
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    const character = string.charCodeAt(i);
    hash = ((hash << 1) - hash) + character;
  }
  hash = atleast(hash, 4, 0);
  return `${EXP_DIR}${hash.substr(0,2)}/${hash.substr(2)}.json`;
}

function sendData(words, res, next) {
  function send(err, contents) {
    console.log(err);
    if (err) {
      next(new ExplanationNotFound(words));
    } else {
      console.log('contents: ' + contents)
      const obj = JSON.parse(contents);
      const data = obj[cleanStr(words)];
      if (!data) {
        next(new ExplanationNotFound(words));
      }
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    }
  }

  return send;
}

function saveData(req, res, next) {
  function saved(err) {
    if (err) {
      next(err);
    } else {
      res.send('success');
    }
  }

  function modify(obj) {
    try {
      const expl = new Explanation(req);
      const key = cleanStr(expl.words);
      if (obj[key]) {
        obj[key].push(expl);
      } else {
        obj[key] = [expl];
      }
      console.log('file: ' + getFile(expl.words))
      var filename = getFile(expl.words);

      console.log(filename.replace(/^(.*\/).*$/, '$1'));
      shell.mkdir('-p', filename.replace(/^(.*\/).*$/, '$1'));
      fs.writeFile(filename, JSON.stringify(obj, null, 2), saved)
    } catch (e) {
      next(e);
    }
  }

  function read(err, contents) {
    let obj;
    if (err) {
      console.log('not')
      obj = {};
    } else {
      obj = JSON.parse(contents);
    }
    modify(obj);
  }

  return read;

}

function endpoints(app, prefix, ip) {
  app.post(prefix + "/:words", function (req, res, next) {
    const words = req.params.words;
    const file = getFile(words);
    console.log('readingFile: ' + file);
    fs.readFile(file, saveData(req, res, next));
  });

console.log('prefix: ' + prefix)
  app.get(prefix + "/:words", function (req, res, next) {
    const words = req.params.words;
    const file = getFile(words);
    fs.readFile(file, sendData(words, res, next));
  });
}

exports.endpoints = endpoints;
exports.cleanStr = cleanStr;
exports.getFile = getFile;
