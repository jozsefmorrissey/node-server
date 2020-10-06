var fs = require("fs");
var shell = require("shelljs");
var config = require('./config.json');

const EXPL_DIR = './services/content-explained/explanations/';
const USER_DIR = './services/content-explained/users/';

class UsernameAlreadyTaken extends Error {
  constructor(username) {
    super(`Username '${username}' has already been taken`);
    this.name = "UsernameAlreadyTaken";
    this.status = 400;
  }
}

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

function saved(res, next, data) {
  data ? data : {status: 'success'};
  function callback(err) {
    if (err) {
      next(err);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    }
  }
  return callback
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
    this.likes = 0;
    this.dislikes = 0;
    this.pageLikes = {};
    this.pageDislikes = {};
    this.tags = req.body.tags;
    if ((typeof this.words) !== 'string' ||
        (typeof this.explanation) !== 'string' ||
        (typeof this.author) !== 'string' ||
        !Array.isArray(this.tags) || !consistentType(this.tags, 'string')) {
      throw new InvalidRequestError('Type constraints violated: words(string) explanation(string) author(string) tags(array[of strings])')
    }
  }
}

function randomString(length, characterSetRegEx, regEx) {
  let generatedString = "";
  while (!generatedString.match(regEx)) {
    generatedString = "";
    for (let i = 0; i < length; i ++) {
      let character = "";
      while (character.length != 1 || !character.match(characterSetRegEx)) {
        character = String.fromCharCode(Math.floor(Math.random() * 107 + 20));
      }
      generatedString += character;
    }
  }
    return generatedString;
}

class Opinion {
  constructor(site, favorable) {
    this.site = site;
    this.favorable = favorable;
  }
}

class User {
  constructor(username) {
    this.username = username
    this.favoriteLists = [];
    this.explanations = [];
    this.siteOpinions = {};
    this.likes = 0;
    this.dislikes = 0;
    this.secret = randomString(64, /[a-zA-Z0-9]/, /.{64}/);
  }
}

const explanationNotFound = new Error('No explanations found');

function ensureLength(str, length, prefix, suffix) {
  str = str.length > length ? str.substr(0, length) : str + '';
  prefix = prefix === undefined ? '' : prefix + '';
  suffix = suffix === undefined ? '' : suffix + '';
  for (let index = str.length; str.length < length; index += 1) {
      str = `${prefix}${str}${suffix}`;
  }
  return str;
}

function cleanUrl(url) {
  return url.replace(/(.*?)\?.*/, '$1');
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
  for (let i = 0; i < string.length; i += 1) {
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

function getUser(username, callback) {
  const file = getFile(username, USER_DIR);
  fs.readFile(file, callback);
}

function increment(likeDis, req, res, next) {
  const words = req.params.words;
  let alreadyVoted = false;
  const file = getFile(words, EXPL_DIR);
  const url = cleanUrl(req.query.url);
  let targetElem, index, obj, author;
  function updateUser(err, contents) {
    if (err) {
      next(err);
      return;
    } else {
      const obj = JSON.parse(contents);
      console.log(JSON.stringify(obj, null, 2))
      if (obj[author].siteOpinions[url] === undefined) {
        obj[author].siteOpinions[url] = {}
      } else if (obj[author].siteOpinions[url][words] !== undefined) {
        if (obj[author].siteOpinions[url][words] === likeDis) {
          next(new Error('You have already voted for this word on this site.'));
          return;
        }
        alreadyVoted = true;
      }
      obj[author].siteOpinions[url][words] = likeDis;
      updateObjectLikes();
      fs.writeFile(getFile(author, USER_DIR), JSON.stringify(obj, null, 2));
    }
  }
  function updateLikes(targetElem, likes, value) {
    const pageLikeDis = likes ? `likesPage` : 'dislikesPage';
    targetElem[likes ? 'likes' : 'dislikes'] += value;
    if (targetElem[pageLikeDis][url] === undefined) {
      targetElem[pageLikeDis][url] = 0;
    }
    targetElem[pageLikeDis][url] += value;

  }
  function getObject(err, contents) {
    if (err) {
      next(err);
    } else {
      obj = JSON.parse(contents);
      index = req.params.index;
      targetElem = obj[cleanStr(words)][index];
      author = targetElem.author;
      getUser(author, updateUser);
    }
  }
  function updateObjectLikes() {
    updateLikes(targetElem, likeDis, 1);
    if (alreadyVoted) {
      updateLikes(targetElem, !likeDis, -1);
    }

    fs.writeFile(file, JSON.stringify(obj, null, 2), saved(res, next, targetElem));
  }
  fs.readFile(file, getObject);
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
  function modify(obj) {
    try {
      const expl = new Explanation(req);
      const key = cleanStr(expl.words);
      if (obj[key]) {
        obj[key].push(expl);
      } else {
        obj[key] = [expl];
      }
      console.log('file: ' + getFile(expl.words, EXPL_DIR))
      var filename = getFile(expl.words, EXPL_DIR);

      console.log(filename.replace(/^(.*\/).*$/, '$1'));
      shell.mkdir('-p', filename.replace(/^(.*\/).*$/, '$1'));
      fs.writeFile(filename, JSON.stringify(obj, null, 2), saved(res, next));
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

function saveUser(username, res, next) {
  function save(err, contents) {
    if (err) {
      contents = '{}';
    }
    const userObj = JSON.parse(contents);
    if (userObj[username] !== undefined) {
      next(new UsernameAlreadyTaken(username));
      return;
    }

    try {
      const user = new User(username);
      userObj[username] = user;
      var filename = getFile(username, USER_DIR);
      shell.mkdir('-p', filename.replace(/^(.*\/).*$/, '$1'));
      fs.writeFile(filename, JSON.stringify(userObj, null, 2), saved(res, next));
    } catch (e) {
      next(e);
    }
  }
  return save;
}

function endpoints(app, prefix, ip) {
  app.post(prefix + "/:words", function (req, res, next) {
    const words = req.params.words;
    const file = getFile(words, EXPL_DIR);
    console.log('readingFile: ' + file);
    fs.readFile(file, saveData(req, res, next));
  });

console.log('prefix: ' + prefix)
  app.get(prefix + "/:words", function (req, res, next) {
    const words = req.params.words;
    const file = getFile(words, EXPL_DIR);
    fs.readFile(file, sendData(words, res, next));
  });

  app.get(prefix + "/like/:words/:index", function(req, res, next) {
    increment(true, req, res, next);
  });
  app.get(prefix + "/dislike/:words/:index", function(req, res, next) {
    increment(false, req, res, next);
  });

  app.get(prefix + "/add/user/:username", function (req, res, next) {
    const username = req.params.username;
    getUser(username, saveUser(username, res, next));
  });
}

console.log(getFile('hash', EXPL_DIR));

exports.endpoints = endpoints;
exports.cleanStr = cleanStr;
exports.getFile = getFile;
