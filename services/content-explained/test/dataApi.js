const testing = require('testing');
const shell = require('shelljs');
const xmlhr = require('xmlhttprequest').XMLHttpRequest;



const { randomString } = require('../services/tools.js');
const { CallbackTree } = require('../services/callbackTree.js');
const { EPNTS } = require('../services/EPNTS.js');

const users = [];

function req(method, url, handler, secret, body, userAgent, contentType) {
  body = body ? JSON.stringify(body) : undefined;
  userAgent = userAgent || userObj.userAgent;
  contentType = contentType || 'application/json';
  let xhr = new xmlhr();
  xhr.onreadystatechange = handler;
  url = url.trim().indexOf('/') !== 0 ? url : getUrl(url);
  xhr.open(method, url, {async: false});
  if (userAgent) xhr.setRequestHeader('user-agent', userAgent);
  if (secret) xhr.setRequestHeader('authorization', secret);
  xhr.setRequestHeader('Content-Type', contentType);
  xhr.send(body);
}

function sleep(time) {
  return new Promise(resolve => setTimeout(() => resolve(), time));
}

function errorHandler(expected, cb) {
  return function (error) {
    if (!expected) {
      testing.fail(error, cb);
    }
  };
}

function checkLength(length, cb) {
  return function (results) {
    testing.assertEquals(results.length, length);
    if (cb) testing.success(cb);
  }
}

function testS(cb) {
  return function (response) {
    testing.success(cb);
  }
}

function testF(cb) {
  return function (response) {
    testing.fail(response, cb);
  }
}

function simpleHandler (status, success, fail) {
  return function () {
      if (this.readyState != 4) return;

      if (this.status == status) {
        try {
          success(JSON.parse(this.responseText));
        } catch (e) {
          success(this.responseText);
        }
      } else {
        fail(this.responseText);
      }
  };
}

let highestRatio = 0;
function testTimeString(calls, time) {
  const ratio = Math.floor((time / calls) * 1000) / 1000;
  if (ratio > highestRatio) {
    highestRatio = ratio;
    console.log(`Highest Ratio!! (${highestRatio})`);
  }

  return `${calls} requests @ ${time} seconds - (${ratio})`
}

function bulkHandler (count, process, cb) {
  let returned = 0;
  let failed = false;
  let start = new Date().getTime();
  return function (status) {
    return function () {
      if (this.readyState != 4) return;

      returned++;
      if (this.status == status) {
        if (process) {
          try {
            process(JSON.parse(this.responseText));
          } catch (e) {
            process(this.responseText);
          }
        }
      } else {
        failed = true;
        console.error(this.responseText);
      }

      if (returned === count) {
        if (failed) {
          testing.fail(cb);
        } else {
          const end = new Date().getTime();
          const time = (end - start) / 1000;
          testing.success(testTimeString(count, time), cb);
        }
      }
    };
  };
}

const urlExplObj = {
  'http://www.amazon.com/': {
    'amazon': 'shopping goliath',
    'deal': 'a price that is better than usual',
    'book': 'the internet on paper',
    'prime': 'somthing you dont need'
  },
  'https://www.ebay.com/': {
    'motors': 'the only section that matters',
    'toys': 'for babies',
    'ebay': 'online auction site',
    'stores': 'Not physical locations'
  },
  'https://www.restapitutorial.com/httpstatuscodes.html?poop=stinky&DebugGui.debug=true#PEEPEE': {
    'fake': randomString(128, /[a-zA-Z0-9]/, /.{1,}/),
    'values': randomString(128, /[a-zA-Z0-9]/, /.{1,}/),
    'doesnt': randomString(128, /[a-zA-Z0-9]/, /.{1,}/),
    'matter': randomString(128, /[a-zA-Z0-9]/, /.{1,}/)
  }
}

let urlExplList;

function randInt(min, max, exclude) {
  min = min !== undefined ? min : 0;
  max = max !== undefined ? max : Number.MAX_SAFE_INTEGER;
  let index;
  while (index === undefined || (exclude && exclude.indexOf(index) !== -1))
    index = min + Math.floor(Math.random() * (max - min));
  return index;
}

function randBool() {
  return Math.random() > .5 ? true : false;
}

function randomElement(arr, notIndexs) {
  let index = randInt(0, arr.length,  notIndexs);
  return arr[index];
}

function url(index) {
  return index !== undefined ? Object.keys(urlExplObj)[index] : randomElement(Object.keys(urlExplObj));
}

function randSpaceCharacter() {
  const rand = Math.random();
  return rand > .8 ? '\n' : (rand > .6 ? '\t' : ' ');
}

const cmd = `grep -oP "^[a-z].*$" ../../../public/json/word-list.json`;
const wordList = shell.exec(cmd, {silent: true}).split('\n');
function randomWord() {
  return randomElement(wordList);
}

function randomWords() {
  const count = Math.floor(Math.random() * 5);
  if (count === 0) return '';
  let str = randomWord();
  for (let index = 1; index < count; index += 1) str += ` ${randomWord()}`;
  return str;
}

const tagObj = {tags: ['http', 'status', 'https', 'html', 'css', 'error']};
function randHashTagStr (auditDetail) {
  const count = Math.floor(Math.random() * 8);
  let str = '\n';
  let usedTags = [];
  for (let index = 0; index < count; index += 1) {
    const tag = randomElement(tagObj.tags);
    usedTags.push(tag);
    const deadStr = randSpaceCharacter() + randomWords();
    str += `${deadStr}#${tag}`;
  }
  if (auditDetail) {
      return {tags: usedTags, str};
  }

  return str;
}

function handler (list, count, cb) {
  let hasFailed = false;
  let returned = 0;
  let start = new Date().getTime();
  return function (status, index) {
    const funcName = arguments.callee.caller.name;
    return function () {
      if (this.readyState != 4) return;

      if (this.status == status) {
        if (list) {
          try {
            const jsonObj = JSON.parse(this.responseText);
            list[index] = jsonObj;
          } catch (e) {
            list[index] = this.responseText;
          }
        }
        if (++returned >= count && !hasFailed) {
          const end = new Date().getTime();
          const time = (end - start) / 1000;
          testing.success(testTimeString(count, time), cb);
        }
      } else {
        hasFailed = true;
        testing.fail(this.responseText, cb);
      }
    };
  };
}

const host = process.argv[2];
function getUrl(suffix) {
  return `${host}${suffix}`;
}

function randomSubSet(arr, size) {
  if (arr.length < size) return arr;
  const subSet = [];
  const added = {};
  while (subSet.length < size) {
    const index = Math.floor(Math.random() * arr.length);
    if (!added[index]) {
      added[index] = true;
      subSet.push(arr[index]);
    }
  }
  return subSet;
}

function insertUser(username, email, userAgent, count, cb) {
  const h = handler(null, count, cb)(200, 0);
  const body = {username, email};
  userObj.activationSecrets.push(`${email}-${userAgent}`);
  req('post', EPNTS.user.add(), h, null, body, userAgent);
}

const email1 = 'test@jozsefmorrissey.com';
const email2 = 'test0@jozsefmorrissey.com';
function init1(cb) {
  const count = 1;
  let username = randomString(64, /[a-zA-Z0-9]/, /.{1,}/);
  insertUser(username, email1, userObj.userAgent, count, cb);
}

function init2(cb) {
  const count = 1;
  const username = randomString(64, /[a-zA-Z0-9]/, /.{1,}/);
  insertUser(username, email2, userObj.removeUserAgent, count, cb);
}

const userObj= {emails: ['test1@jozsefmorrissey.com',
  'test2@jozsefmorrissey.com',
  'test3@jozsefmorrissey.com',
  'test4@jozsefmorrissey.com',
  'test5@jozsefmorrissey.com',
  'test6@jozsefmorrissey.com',
  'test7@jozsefmorrissey.com',
  'test8@jozsefmorrissey.com',
  'test9@jozsefmorrissey.com',
  'test10@jozsefmorrissey.com'],
  updatedUserNames: [],
  userAgent: 'CE-data-api-test',
  removeUserAgent: 'CE-data-api-test-remove',
  secrets: [], ids: [], removeSecets: [], authored: [], activationUrls: [],
  activationSecrets: []
};

function secretByUserId(userId) {
  for (let index = 0; index < userObj.ids.length; index += 1) {
    if (userObj.ids[index] === userId) {
      return userObj.secrets[index];
    }
  }
  throw new Error('Unkown userId: ' + userId);
}

const userCount = 4;

userObj.emails.forEach((item, i) =>
  userObj.updatedUserNames.push(`${randomString(50, /[a-zA-Z0-9]/, /.{1,}/)}-test-name-${i}`)
);


function testInsertUsers(cb) {
  const count = userObj.emails.length;
  const h = handler(userObj.secrets, count, cb);
  for (let index = 0; index < count; index += 1) {
    const email = userObj.emails[index];
    const username = randomString(64, /[a-zA-Z0-9]/, /.{1,}/);
    h(count, 200, index);
    const body = {username, email};
    userObj.activationSecrets.push(`${email}-${userObj.userAgent}`);
    req('post', EPNTS.user.add(), h(200, index), null, body);
  }
}

function testGetUsers(cb) {
  const count = userObj.secrets.length;
  userObj.users = [];
  const h = handler(userObj.users, count, cb);
  for (let index = 0; index < count; index += 1) {
    const secret = userObj.secrets[index];
    const id = Number.parseInt(secret.replace(/^User ([0-9]*)-.*$/, '$1'));
    userObj.ids[index] = id;
    req('get', EPNTS.user.get(id), h(200, index), secret);
  }
}

function validateUserId(cb) {
  for (let index = 0; index < userObj.ids.length; index += 1) {
    const id = userObj.ids[index];
    const user = userObj.users[index];
    testing.assertEquals(id, user.id, cb);
  }
  testing.success(cb);
}

function testLoginUsers(cb) {
  const len = userObj.secrets.length;
  const h = handler(undefined, len, cb);
  for (let index = 0; index < len; index += 1) {
    const secret = userObj.secrets[index];
    req('get', EPNTS.user.login(), h(200, index), secret);
  }
}

function testGetIds(cb) {
  function checkLength(results) {
    testing.assertEquals(JSON.parse(results).length, userObj.ids.length);
  }
  const h = bulkHandler(1, checkLength, cb);
  req('get', EPNTS.user.get(userObj.ids.join()), h(200, 0));
}

function testCreateCredentials(cb) {
  const len = userObj.ids.length;
  const h = handler(userObj.removeSecets, len, cb);
  for (let index = 0; index < len; index += 1) {
    const id = userObj.ids[index];
    const secret = userObj.secrets[index];
    const email = userObj.emails[index];
    const url = EPNTS.credential.add(id);
    const uAgent = userObj.removeUserAgent;
    userObj.activationSecrets.push(`${email}-${uAgent}`);
    req('get', url, h(200, index), secret, null, uAgent);
  }
}

function getActivationUrls(cb) {
  const len = userObj.activationSecrets.length;
  const h = handler(userObj.activationUrls, len, cb);
  for (let index = 0; index < len; index += 1) {
    const activationSecret = userObj.activationSecrets[index];
    const url = EPNTS.credential.activationUrl(activationSecret);
    req('get', url, h(200, index));
  }
}

function testActivateUsers(cb) {
  const len = userObj.activationUrls.length;
  const h = handler(undefined, len, cb);
  for (let index = 0; index < len; index += 1) {
    const url = userObj.activationUrls[index].replace(/https:/, 'http:').replace(':3001', ':3000');
    req('get', url, h(200));
  }
}

function testActivateUserFailure(cb) {
  const id = userObj.ids[0];
  const h = handler(undefined, 2, cb);

  req('get', EPNTS.credential.activate(id, 'shhhh'), h(401));
  req('get', EPNTS.credential.activate(1000, 'shhh'), h(401));
}

const removeCredIds = [];
async function testGetCredentials(cb) {
  const runOne = removeCredIds.length === 0;
  const credCount = runOne ? 2 : 1;
  let callCount = 0;
  function checkLength(results) {
    testing.assertEquals(results.length, credCount);
    if (runOne) removeCredIds.push(results[1].id);
    if (++callCount === 2) testing.success(cb);
  }
  const h = simpleHandler(200, checkLength, testF(cb));

  let id = userObj.ids[3];
  req('get', EPNTS.credential.get(id), h);
  id = userObj.ids[2];
  req('get', EPNTS.credential.get(id), h);
}

function testDeleteCredFailure(cb) {
  const len = removeCredIds.length;
  const h = handler(undefined, len, cb);
  for (let index = 0; index < len; index += 1) {
    const id = removeCredIds[index];
    const inActive = index % 2 === 0;
    const secret = inActive ? userObj.removeSecets[index] : randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
    const status = inActive ? 400 : 401;
    const url = EPNTS.credential.delete(id);
    req('delete', url, h(status), secret, null, userObj.removeUserAgent);
  }
}

function testDeleteCred(cb) {
  const len = removeCredIds.length;
  const h = handler(undefined, len, cb);
  for (let index = 0; index < len; index += 1) {
    const id = removeCredIds[index];
    const secret = userObj.secrets[index];
    req('delete', EPNTS.credential.delete(id), h(200), secret);
  }
}

function testUpdateUsers(cb) {
  const count = userObj.users.length;
  const h = handler(userObj.updatedUsers, count, cb);
  for (let index = 0; index < count; index += 1) {
    const secret = userObj.secrets[index];
    const user = JSON.parse(JSON.stringify(userObj.users[index]));
    user.username = userObj.updatedUserNames[index];
    req('put', EPNTS.user.update(), h(200, index), secret, user);
  }
}

function validateUserNames(cb) {
  for (let index = 0; index < userObj.ids.length; index += 1) {
    const username = userObj.updatedUserNames[index];
    const user = userObj.users[index];
    testing.assertEquals(username, user.username, cb);
  }
  testing.success(cb);
}

siteObjs = []

function testAddSite(cb) {
  const secret = userObj.secrets[0];
  const urls = Object.keys(urlExplObj);
  const count = urls.length;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const url = urls[index];
    req('post', EPNTS.site.add(), h(200), secret, {url});
  }
}

function testGetSite(cb) {
  const urls = Object.keys(urlExplObj);
  const count = urls.length;
  const h = handler(siteObjs, count, cb);
  for (let index = 0; index < count; index += 1) {
    const url = urls[index];
    req('post', EPNTS.site.get(), h(200, index), null, {url});
  }
}

function addExplanation(siteUrl, words, content, tagStr, secret, handle, cb) {
  const body = {siteUrl, words, content, tagStr};
  req('post', EPNTS.explanation.add(), handle, secret, body);
}

const pageExpls = {};
function addAllTags(cb) {
  const siteUrl = url();
  const words = 'all tags';
  const content = 'none ya';
  pageExpls[content] = {siteUrl};
  const tagStr = '#' + tagObj.tags.join('#');
  const secret = userObj.secrets[0];
  const h = handler(undefined, 1, cb);
  addExplanation(siteUrl, words, content, tagStr, secret, h(200), cb);
}

const wordsCount = 20;
function testAddExplanation(cb, offset, count) {
  offset = offset || 0;
  const len = userObj.ids.length;
  if (count === undefined) {
    count = 0;
    Object.values(urlExplObj).forEach((list) =>
      Object.keys(list).forEach(() => count += 2));
  }
  const urls = Object.keys(urlExplObj);
  const h = handler(undefined, count, cb);
  for (let index = 0; index < urls.length; index += 1) {
    const siteUrl = urls[index];
    const wordList = Object.keys(urlExplObj[siteUrl]);
    for (let wIndex = 0; wIndex < wordList.length; wIndex += 1) {
      const uIndex = (index + wIndex) % userObj.users.length;
      const author = userObj.users[uIndex];
      const secret = userObj.secrets[uIndex];
      const words = wordList[wIndex];
      const content = `${urlExplObj[siteUrl][words]}-${wIndex}`;
      pageExpls[content] = {siteUrl};
      addExplanation(siteUrl, words, content, randHashTagStr(), secret, h(200), cb);
      addExplanation(siteUrl, words, content, randHashTagStr(), 'User 1000-hello', h(401), cb);
    }
  }
}

function testGetExplanations(cb) {
  const count = userObj.users.length
  const h = handler(userObj.authored, count, cb);
  for (let index = 0; index < count; index += 1) {
    let authorId = userObj.users[index].id;
    req('get', EPNTS.explanation.author(authorId), h(200, index));
  }
}

const siteExplList = [];
function buildSiteExplList(cb) {
  userObj.authored.forEach((list) => list.forEach((expl) => {
    pageExpls[expl.content].expl = expl;
    siteExplList.push(pageExpls[expl.content]);
  }));


  testing.success(cb);
}

function testUpdateExplanations(cb) {
  const count = userCount;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const userIndex = 4 + (index % 2);
    const author = userObj.users[userIndex];
    const secret = userObj.secrets[userIndex];
    const authored = userObj.authored[userIndex];
    const expl = randomElement(authored);
    const content = `${expl.content} (updated)`;
    expl.content = content;
    const body = {id: expl.id, content, authorId: author.id};
    req('put', EPNTS.explanation.update(), h(200), secret, body);
  }
}

function testUpdateExplanationsWrongUser(cb) {
  const count = userCount;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const author = userObj.users[(index + 1) % count];
    const secret = userObj.secrets[(index + 1) % count];
    const expl = userObj.authored[index][0];
    const content = `This value should not exist in database`;
    const body = {id: expl.id, content, authorId: author.id};
    req('put', EPNTS.explanation.update(), h(401), secret, body);
  }
}

function testUpdateExplanationsNotLoggedIn(cb) {
  const count = userCount;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const author = userObj.users[(index + 1) % count];
    const expl = userObj.authored[index][0];
    const content = `This value should not exist in database`;
    const body = {id: expl.id, content, authorId: author.id};
    req('put', EPNTS.explanation.update(), h(401), null, body);
  }
}

function testUpdateExplanationsInvalidExplId(cb) {
  const count = userCount;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const author = userObj.users[(index + 1) % count];
    const expl = userObj.authored[index][0];
    const content = `This value should not exist in database`;
    const secret = userObj.secrets[(index + 1) % count];
    const body = {id: -1, content, authorId: author.id};
    req('put', EPNTS.explanation.update(), h(404, 0), secret, body);
  }
}

function testUpdatedExplanations(cb) {
  let responses = 0;
  const count = userObj.users.length
  function equalExpl(localExpls) {
    return function (remoteExpls) {
      testing.assertEquals(localExpls.length, remoteExpls.length, cb);
      for (let index = 1; index < localExpls.length; index += 1) {
        const localExpl = localExpls[index];
        const remoteExpl = remoteExpls[index];
        testing.assertEquals(localExpl.content, remoteExpl.content, cb);
        testing.assertEquals(localExpl.author.id, remoteExpl.author.id, cb);
        testing.assertEquals(localExpl.words.id, remoteExpl.words.id, cb);
      }
      if (count === ++responses) {
        testing.success(cb);
      }
    }
  }
  for (let index = 0; index < count; index += 1) {
    const hand = simpleHandler(200, equalExpl(userObj.authored[index]), testF(cb));
    let authorId = userObj.users[index].id;
    req('get', EPNTS.explanation.author(authorId), hand);
  }
}

// function testAddSiteExpl(cb) {
//   const eCount = 20;
//   const urls = Object.keys(urlExpl);
//   const count = eCount * urls.length;
//   const user = userObj.users[0];
//   const secret = userObj.secrets[0];
//   for (let index = 0; index < urls.length; index += 1) {
//     const siteUrl = urls[index];
//     for (let eIndex = 0; eIndex < eCount; eIndex += 1) {
//       let explId = userObj.authored[eIndex % userObj.users.length][eIndex].id;
//       let xhr = new xmlhr();
// const h = handler(undefined, count, cb);
// h(200, 0);
//       xhr.open("POST", getUrl(EPNTS.siteExplanation.add(explId)));
//       xhr.setRequestHeader('Content-Type', 'application/json');
//       xhr.setRequestHeader('user-agent', userObj.userAgent);
//       xhr.setRequestHeader('authorization', secret);
//       xhr.send(JSON.stringify({siteUrl}));
//     }
//   }
// }

function testAddExistingSiteExpl(cb) {
  function checkResp(resp) {
    testing.assertNotEquals(resp.indexOf(':'), -1, cb);
    testing.success(cb);
  };
  const urls = Object.keys(urlExplObj);
  const user = userObj.users[0];
  const secret = userObj.secrets[0];
  const siteUrl = urls[0];
  let explId = userObj.authored[0][1].id;
  const hand = simpleHandler(200, checkResp, testF(cb));
  req('post', EPNTS.siteExplanation.add(explId), hand, secret, {siteUrl});
}

function testOpinionUrls(cb) {
  let explanations = []
  for (let index = 0; index < userObj.users.length; index += 1) {
    explanations = explanations.concat(userObj.authored[index]);
  }
  const count = explanations.length * userObj.users.length;
  const h = handler(undefined, count, cb);
  for (let uIndex = 0; uIndex < userObj.users.length; uIndex += 1) {
    const secret = userObj.secrets[uIndex];
    const userId = userObj.users[uIndex].id;
    for (let index = 0; index < explanations.length; index += 1) {
      const expl = explanations[index % explanations.length];
      const explId = expl.id;
      const status = expl.author.id === userId ? 401 : 200;
      const siteId = siteObjs[Math.floor(Math.random() * siteObjs.length)].id;
      const url = Math.random() < 0.2 ? EPNTS.explanation.opinion.dislike(explId, siteId) : EPNTS.explanation.opinion.like(explId, siteId);
      req('get', url, h(status), secret);
    }
  }
}

function testOpinionNotLoggedIn(cb) {
  const explId = userObj.authored[0].id;
  const siteId = siteObjs[0].id;
  const secret = userObj.secrets[0];
  const url = EPNTS.explanation.opinion.like(explId, siteId);
  const handler = simpleHandler(401, testS(cb), testF(cb));
  req('get', url, handler, secret + '3');
}

function addRealExpl(userAgent, secret, expl, handler, cb) {
  const postUrl = EPNTS.explanation.add();
  expl.siteUrl = url();
  req('post', postUrl, handler, secret, expl, userAgent);
}

const siteUrl = 'https://www.restapitutorial.com/httpstatuscodes.html?poop=stinky&DebugGui.debug=true#PEEPEE';
function addCode(cb) {
  const secret = userObj.secrets[0];
  const userAgent = userObj.userAgent;
  const count = 1;
  const body = {content: "a system of principles or rules\n\n#og#right", words: "code", siteUrl};
  const h = handler(undefined, count, cb);
  addRealExpl(userAgent, secret, body, h(200, 0), cb);
}


const explanations = [];
function addExplanations(cb) {
  const authorId = userObj.users[0].id;
  explanations.push({content: `the person, thing, or idea that is present or near in place, time, or thought or that has just been mentioned ${randHashTagStr()}`, words: "this"});
  explanations.push({content: `the block of information found at a single World Wide Web address${randHashTagStr()}`, words: "page"});
  explanations.push({content: `present tense third-person singular of be${randHashTagStr()}`, words: "is"});
  explanations.push({content: `to produce or bring about by a course of action or behavior${randHashTagStr()}`, words: "created"});
  explanations.push({content: `used as a function word to indicate a starting point of a physical movement or a starting point in measuring or reckoning or in a statement of limits${randHashTagStr()}`, words: "from"});
  explanations.push({content: `hypertext transfer protocol; hypertext transport protocol${randHashTagStr()}`, words: "http"});
  explanations.push({content: `state or condition with respect to circumstances${randHashTagStr()}`, words: "status"});
  explanations.push({content: `the attribute inherent in and communicated by one of two or more alternative sequences or arrangements of something (such as nucleotides in DNA or binary digits in a computer program) that produce specific effects${randHashTagStr()}`, words: "information"});
  explanations.push({content: `having all usual, standard, or reasonably expected equipment${randHashTagStr()}`, words: "found"});
  explanations.push({content: `used as a function word to indicate the goal of an indicated or implied action${randHashTagStr()}`, words: "at"});
  explanations.push({content: `A website not for the faint of heart${randHashTagStr()}`, words: "ietf.org"});
  explanations.push({content: `used as a function word to indicate connection or addition especially of items within the same class or type —used to join sentence elements of the same grammatical rank or function${randHashTagStr()}`, words: "and"});
  explanations.push({content: `croud sourced information, thats all linked up${randHashTagStr()}`, words: "wikipedia"});
  explanations.push({content: `to change or move through (channels) especially by pushing buttons on a remote control${randHashTagStr()}`, words: "click"});
  explanations.push({content: `used as a function word to indicate position in contact with and supported${randHashTagStr()}`, words: "on"});
  explanations.push({content: `a division within a system of classification ${randHashTagStr()}`, words: "category heading"});
  explanations.push({content: `the equivalent or substitutive character of two words or phrases${randHashTagStr()}`, words: "or"});
  explanations.push({content: `used as a function word to indicate that a following noun or noun equivalent is definite or has been previously specified by context or by circumstance${randHashTagStr()}`, words: "the"});
  explanations.push({content: `one of the standardized divisions of a surveyor's chain that is 7.92 inches (20.1 centimeters) long and serves as a measure of length${randHashTagStr()}`, words: "link"});
  explanations.push({content: `used as a function word to indicate movement or an action or condition suggestive of movement toward a place, person, or thing reached${randHashTagStr()}`, words: "to"});
  explanations.push({content: `to receive or take in the sense of (letters, symbols, etc.) especially by sight or touch${randHashTagStr()}`, words: "read"});
  explanations.push({content: `to a greater or higher degree —often used with an adjective or adverb to form the comparative${randHashTagStr()}`, words: "more"});
  explanations.push({content: `coded language : a word or phrase chosen in place of another word or phrase in order to communicate an attitude or meaning without stating it explicitly${randHashTagStr()}`, words: "code"});
  explanations.push({content: `a system of symbols (such as letters or numbers) used to represent assigned and often secret meanings${randHashTagStr()}`, words: "code"});
  explanations.push({content: `a system of signals or symbols for communication${randHashTagStr()}`, words: "coded"});
  explanations.push({content: `a systematic statement of a body of law ${randHashTagStr()}`, words: "code"});
  explanations.push({content: `instructions for a computer (as within a piece of software)${randHashTagStr()}`, words: "codes"});

  const count = explanations.length;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const userIndex = Math.floor(Math.random() * userObj.secrets.length);
    const secret = userObj.secrets[userIndex];
    addRealExpl(userObj.userAgent, secret, explanations[index], h(200, 0), cb);
  }
}

let expls = {};
function getRealExpls(cb) {
  const count = explanations.length;
  function addExpls(result) {
    result.map((e) => {expls[e.id] = e});
  }

  const bh = bulkHandler (count, addExpls, cb);
  for (let index = 0; index < count; index += 1) {
    const words = explanations[index].words;
    req('get', EPNTS.explanation.get(words), bh(200), null, {url: siteUrl});
  }
}

function addRealExplsToSite(cb) {
  expls = Object.values(expls);
  const count = expls.length;
  const secret = userObj.secrets[0];
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const id = expls[index].id;
    req('post', EPNTS.siteExplanation.add(id), h(200), secret, {siteUrl});
  }
}

const comments = [];
function addCommentsToExpls(cb) {
  expls.forEach((expl) => siteExplList.push({expl, siteUrl}));
  const count = siteExplList.length * 3;
  const h = handler(comments, count, cb);
  for (let index = 0; index < count; index += 1) {
    const value = randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
    const siteExpl = siteExplList[index % siteExplList.length];
    const explanationId = siteExpl.expl.id;
    const tagStr = randHashTagStr();
    const siteUrl = siteExpl.siteUrl;
    const secret = userObj.secrets[Math.floor(userObj.secrets.length * Math.random())];
    const body = {value, siteUrl, explanationId, tagStr};
    req('post', EPNTS.comment.explanation.add(), h(200, index), secret, body);
  }
}

let subSet;
const siteById = {};
function addCommentsToComments(cb) {
  siteObjs.forEach((site) => siteById[site.id] = site);
  const count = 20;
  subSet = subSet || randomSubSet(comments, count);
  const h = handler(subSet, count, cb);
  for (let index = 0; index < count; index += 1) {
    const comment = randomElement(subSet);
    const value = randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
    const explanationId = comment.explanationId;
    const commentId = comment.id;
    const tagStr = randHashTagStr();
    const siteUrl = siteById[comment.siteId].url;
    const secret = userObj.secrets[Math.floor(userObj.secrets.length * Math.random())];
    const body = {value, siteUrl, explanationId, commentId, tagStr};
    req('post', EPNTS.comment.explanation.add(), h(200, subSet.length + index - 1), secret, body);
  }
}

const questions = {init: [], db: [], updated: []};
function testAddQuestions(cb) {
  let url = Object.keys(urlExplObj)[0];
  let wordList = Object.keys(urlExplObj[url]);
  questions.init.push({siteUrl: url, words: wordList[0], elaboration: 'elab-0'});
  questions.init.push({siteUrl: url, words: wordList[1], elaboration: randomString(250, /[a-zA-Z0-9]/, /.{1,}/)});
  questions.init.push({siteUrl: url, words: 'gift', elaboration: 'elab-3'});
  questions.init.push({siteUrl: url, words: 'service', elaboration: 'elab-3'});

  url = Object.keys(urlExplObj)[1];
  wordList = Object.keys(urlExplObj[url]);
  questions.init.push({siteUrl: url, words: wordList[0], elaboration: 'elab-4'});
  questions.init.push({siteUrl: url, words: wordList[3]});

  questions.init.push({siteUrl: url, words: 'sell', elaboration: randomString(250, /[a-zA-Z0-9]/, /.{1,}/)});
  questions.init.push({siteUrl: url, words: 'buy'});


  const count = questions.init.length;
  const h = handler(questions.db, count, cb);
  for (let index = 0; index < count; index += 1) {
    const question = questions.init[index];
    question.tagStr = randHashTagStr();
    const secret = randomElement(userObj.secrets);
    req('post', EPNTS.question.add(), h(200, index), secret, question);
  }
}

const questionComments = [];
function addCommentsToQuestions(cb) {
  const count = questions.db.length;
  const h = handler(questionComments, count, cb);
  for (let index = 0; index < count; index += 1) {
    const value = randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
    const i = index % count;
    const questionId = questions.db[i].id;
    const tagStr = randHashTagStr();
    const siteUrl = questions.init[i].siteUrl;
    const secret = userObj.secrets[Math.floor(userObj.secrets.length * Math.random())];
    const body = {value, siteUrl, questionId, tagStr};
    const url = EPNTS.comment.question.add();
    req('post', url, h(200, index), secret, body);
  }
}

function addCommentsToQuestionComments(cb) {
  const count = 5;
  const h = handler(questionComments, count, cb);
  for (let index = 0; index < count; index += 1) {
    const comment = randomElement(questionComments);
    const value = randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
    const questionId = comment.question.id;
    const commentId = comment.id;
    const tagStr = randHashTagStr();
    const siteUrl = siteById[comment.question.siteId].url;
    const secret = userObj.secrets[Math.floor(userObj.secrets.length * Math.random())];
    const body = {value, siteUrl, questionId, commentId, tagStr};
    req('post', EPNTS.comment.question.add(), h(200, questionComments.length + index - 1), secret, body);
  }
}

function testUpdateExplComments(cb) {
  const count = Math.floor(comments.length / 6);
  const h = handler(comments, count, cb);
  for (let index = 0; index < count; index += 1) {
    const i = randInt(0, comments.length);
    const comment = comments[i];
    const currValue = comment.value ? comment.value : '';
    const value = currValue.substr(0, 16) + ' (updated!)';
    const tagStr = randHashTagStr();
    const id = comment.id;
    const siteUrl = siteById[comment.siteId].url;
    const secret = secretByUserId(comment.author.id);
    const body = {value, siteUrl, id, tagStr};
    req('post', EPNTS.comment.explanation.update(), h(200, i), secret, body);
  }
}

function testUpdateQuestionComments(cb) {
  const count = Math.floor(questionComments.length / 6);
  const h = handler(questionComments, count, cb);
  for (let index = 0; index < count; index += 1) {
    const i = randInt(0, questionComments.length);
    const comment = questionComments[i];
    const currValue = comment.value ? comment.value : '';
    const value = currValue.substr(0, 16) + ' (updated!)';
    const tagStr = randHashTagStr();
    const id = comment.id;
    const secret = secretByUserId(comment.author.id);
    const body = {value, id, tagStr};
    req('post', EPNTS.comment.question.update(), h(200, i), secret, body);
  }
}

function testUpdateQuestions(cb) {
  const count = 3;
  const h = handler(questions.updated, count, cb);
  for (let index = 0; index < count; index += 1) {
    const question = randomElement(questions.db);
    const currElab = question.elaboration ? question.elaboration : '';
    const elaboration = currElab.substr(0, 238) + ' (updated)!';
    const id = question.id;
    const tagStr = randHashTagStr();
    const secret = secretByUserId(question.asker.id);
    const body = {elaboration, id, tagStr};
    req('put', EPNTS.question.update(), h(200, questionComments.length + index - 1), secret, body);
  }
}


function addOpenSites(cb) {
  const count = userObj.secrets.length * 2;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < userObj.secrets.length; index += 1) {
    const secret = userObj.secrets[index];
    req('post', EPNTS.site.view(true), h(200), secret, {siteUrl:  url(0)});
    req('post', EPNTS.site.view(true), h(200), secret, {siteUrl: url(1)});
  }
}

function addAlreadyOpenSites(cb) {
  const count = userObj.secrets.length;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const secret = userObj.secrets[index];
    req('post', EPNTS.site.view(true), h(200), secret, {siteUrl: url(0)});
  }
}

function removeOpenSites(cb) {
  const count = userObj.secrets.length;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < userObj.secrets.length / 2; index += 1) {
    const secret = userObj.secrets[index];
    req('post', EPNTS.site.view(false), h(200), secret, {siteUrl: url(2)});
    req('post', EPNTS.site.view(false), h(200), secret, {siteUrl: url(1)});
  }
}

userObj.viewing = [];
function getViewing(cb) {
  const count = userObj.secrets.length;
  const h = handler(userObj.viewing, count, cb);
  for (let index = 0; index < userObj.secrets.length; index += 1) {
    const secret = userObj.secrets[index];
    req('get', EPNTS.site.viewing(), h(200, index), secret, {siteUrl});
  }
}

function checkViewing(cb) {
  const lastViewing = userObj.viewing[userObj.viewing.length - 1];
  testing.assertEquals(userObj.viewing[0].length, 1, cb);
  testing.assertEquals(userObj.viewing[0][0], url(0), cb);
  testing.assertEquals(lastViewing.length, 2, cb);
  testing.assertNotEquals(lastViewing.indexOf(url(0)), -1, cb);
  testing.assertNotEquals(lastViewing.indexOf(url(1)), -1, cb);
  testing.success(cb);
}

const groupMaps = {
  'git': 'Helping to explain the wonderful git version control system',
  'spanish/english': 'a english spanish dictionary',
  'CE': 'code documentation for CE browser extension'
};
const groupObj = {groups: [], expls: {}};
function testAddGroups(cb) {
  const groupNames = Object.keys(groupMaps);
  const h = handler(groupObj.groups, groupNames.length, cb);
  for (let index = 0; index < groupNames.length; index += 1) {
    const name = groupNames[index];
    const description = groupMaps[name];
    const tagStr = randHashTagStr();
    const secret = userObj.secrets[0];
    const body = {name, description, tagStr};
    req('post', EPNTS.group.create(), h(200, index), secret, body);
  }
}

function validateGroups(cb) {
  for (let index = 0; index < groupObj.groups.length; index += 1) {
    const group = groupObj.groups[index];
    testing.assertEquals(group.description, groupMaps[group.name], cb);
  }
  testing.success(cb);
}

function testAddContributors(cb) {
  const count = 6;
  const secret = userObj.secrets[0];
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count / 2; index += 1) {
    const groupId = groupObj.groups[index].id;
    const users = userObj.users;
    const adminUserId = users[1].id;
    const regUserIds = `${users[2].id},${users[3].id}`;
    const adminlevel = 0;
    const reglevel = 4;
    const hand = h(200);
    const adminUrl = EPNTS.group.contributor.add(adminUserId, groupId, randBool(), randBool(), adminlevel);
    const regUrl = EPNTS.group.contributor.add(regUserIds, groupId, randBool(), randBool(), reglevel);
    req('post', adminUrl, hand, secret);
    req('post', regUrl, hand, secret);
  }
}

function testContAddingContributors(cb) {
  const count = 2;
  const h = handler(undefined, count, cb);
  const groupId = groupObj.groups[0].id;
  const level = 5;
  const users = userObj.users;
  const newMemberId = users[4].id;

  const regSecret = userObj.secrets[2];
  const failUrl = EPNTS.group.contributor.add(newMemberId, groupId, randBool(), randBool(), level);
  req('post', failUrl, h(400), regSecret);

  const adminSecret = userObj.secrets[1];
  const successUrl = EPNTS.group.contributor.add(newMemberId, groupId, randBool(), randBool(), level);
  req('post', successUrl, h(200), adminSecret);
}

function testAddGroupExpls(cb) {
  const addedMap = {};
  const count = groupObj.groups.length * 20;
  const h = handler(undefined, count, cb);
  for (let index = 0; index < count; index += 1) {
    const secret = userObj.secrets[randInt(0, 4)];
    const groupId = groupObj.groups[randInt(0, groupObj.groups.length)].id;
    const explId = randomElement(expls).id;
    const url = EPNTS.group.explanation.add(groupId, explId);
    const addId = `${groupId}:${explId}`;
    status = addedMap[addId] ? 400 : 200;
    addedMap[addId] = true;
    req('get', url, h(200), secret);
  }
}

function testGetGroupExpls(cb) {
  const count = groupObj.groups.length;
  const process = (res) => groupObj.expls[res.groupId] = res.explanations;
  const bh = bulkHandler (count, process, cb);
  for (let index = 0; index < count; index += 1) {
    const groupId = groupObj.groups[index].id;
    const url = EPNTS.group.explanation.get(groupId);
    req('get', url, bh(200));
  }
}

function testUpdateGroupExpls(cb) {
  const count = groupObj.groups.length;
  const process = (res) => groupObj.expls[res.groupId] = res.explanations;
  const bh = bulkHandler (count, process, cb);
  for (let index = 0; index < count; index += 1) {
    const groupId = groupObj.groups[index].id;
    const url = EPNTS.group.explanation.get(groupId);
    req('get', url, bh(200));
  }
}

function testAddGroupOpinions(cb) {
  const alreadyCast = {};
  const len = groupObj.groups.length;
  const count = len * 40;
  const bh = bulkHandler (count, null, cb);
  for (let index = 0; index < count; index += 1) {
    let url, castId, userIndex;
    while(castId === undefined || alreadyCast[castId]) {
      const groupId = groupObj.groups[index % len].id;
      const expl = randomElement(groupObj.expls[groupId]);
      while (userIndex === undefined ||
          userObj.users[userIndex].id === expl.author.id) {
        userIndex = randInt(0, userObj.users.length);
      }
      castId = `${groupId}:${expl.id}:${userIndex}`;
      if (Math.random() > .8) {
        url = EPNTS.group.explanation.opinion.dislike(groupId, expl.id);
      } else {
        url = EPNTS.group.explanation.opinion.like(groupId, expl.id);
      }
    }
    const secret = userObj.secrets[userIndex];
    alreadyCast[castId] = true;
    req('get', url, bh(200), secret);
  }
}

function testGetTags(cb) {
  const process = (res) => tagObj.objs = res;
  const bh = bulkHandler (1, process, cb);
  req('get', EPNTS.tag.all(), bh(200));
}

function attrArray(arr, attr) {
  const retVal = [];
  arr.forEach((elem) => retVal.push(elem[attr]));
  return retVal;
}

function testAddFollowing(cb) {
  const tagIds = attrArray(tagObj.objs, 'id');
  const groupIds = attrArray(groupObj.groups, 'id');
  const userIds = attrArray(userObj.users, 'id');
  const count = 3;

  const process = (res) => tagObj.objs = res;
  const bh = bulkHandler (count, process, cb);
  for (let index = 0; index < count; index += 1) {
    const body = {};
    body.groups = randomSubSet(groupIds, 2);
    body.individuals = randomSubSet(userIds, 2);
    body.questions = randomSubSet(tagIds, 5);
    body.comments = randomSubSet(tagIds, 5);
    body.explanations = randomSubSet(tagIds, 5);

    const secret = userObj.secrets[userObj.secrets.length - index - 1];
    req('post', EPNTS.follow.update(), bh(200), secret, body);
  }
}

// function testAddGroupExplOpinions(cb) {
//   const addedMap = {};
//   const secrets = userObj.secrets;
//   const secLen = secrets.length;
//   const count = groupObj.groups.length * secLen;
//   for (let index = 0; index < count; index += 1) {
//     const secret = userObj.secrets[randInt(0, 4)];
//     const groupId = groupObj.groups[randInt(0, groupObj.groups.length)].id;
//     const explId = randomElement(expls).id;
//     const url = EPNTS.group.explanation.add(groupId, explId);
//     const addId = `${groupId}:${explId}`;
//     status = addedMap[addId] ? 400 : 200;
// const h = handler(undefined, count, cb);
// h(200, undefined);
//     addedMap[addId] = true;
//     req('get', url, hand, secret);
//   }
// }


const startTime = new Date().getTime();
function finishTests(cb) {
  const endTime = new Date().getTime();
  testing.success(`Tests ran for ${(endTime - startTime) / 1000} seconds`, cb);
}

testing.run([init1, init2, testInsertUsers, testGetUsers, testGetIds, validateUserId,
            getActivationUrls, testActivateUsers, testLoginUsers, testCreateCredentials,
            testActivateUserFailure, testGetCredentials,
            testDeleteCredFailure, testDeleteCred, testGetCredentials,
            /*testUpdateUsers,*/ testLoginUsers, testGetUsers, /*validateUserNames,*/
            testAddSite, testGetSite, addAllTags, testAddExplanation,
            testGetExplanations, buildSiteExplList, testUpdateExplanations,
            testUpdateExplanationsWrongUser, testUpdateExplanationsNotLoggedIn,
            testUpdateExplanationsInvalidExplId, testUpdatedExplanations,
            testAddExistingSiteExpl, testOpinionUrls,
            testOpinionNotLoggedIn, addCode, addExplanations, getRealExpls,
            addRealExplsToSite, addCommentsToExpls, testAddQuestions,
            addCommentsToComments, addCommentsToComments, addCommentsToComments, addCommentsToComments, addCommentsToComments,
            addCommentsToQuestions,
            addCommentsToQuestionComments, addCommentsToQuestionComments, addCommentsToQuestionComments, addCommentsToQuestionComments,
            testUpdateExplComments, testUpdateQuestionComments,
            testUpdateQuestions,
            addOpenSites, addAlreadyOpenSites, removeOpenSites,
            testUpdateExplanations, getViewing, checkViewing, testAddGroups,
            validateGroups, testAddContributors, testContAddingContributors,
            testAddGroupExpls, testGetGroupExpls, testAddGroupOpinions,
            testGetTags, testAddFollowing,




            finishTests]);
