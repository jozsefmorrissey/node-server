const testing = require('testing');
const xmlhr = require('xmlhttprequest').XMLHttpRequest;



const { randomString } = require('../services/tools.js');
const { CallbackTree } = require('../services/callbackTree.js');
const { EPNTS } = require('../services/EPNTS.js');

const users = [];

function sleep(time) {
  return new Promise(resolve => setTimeout(() => resolve(), time));
}

function errorHandler(expected, callback) {
  return function (error) {
    if (!expected) {
      testing.fail(error, callback);
    }
  };
}

function checkLength(length, callback) {
  return function (results) {
    testing.assertEquals(results.length, length);
    if (callback) testing.success(callback);
  }
}

function testSuccess(callback) {
  return function (response) {
    testing.success(callback);
  }
}

function testFail(callback) {
  return function (response) {
    testing.fail(response, callback);
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

let hasFailed = false;
let returned;
function handler (list, status, count, index, success, fail) {
  return function () {
      if (this.readyState != 4) return;

      if (this.status == status) {
        if (list) {
          try {
            const jsonObj = JSON.parse(this.responseText);
            list[index] = jsonObj.length === 1 ? jsonObj[0] : jsonObj;
          } catch (e) {
            list[index] = this.responseText;
          }
        }
        if (++returned >= count && !hasFailed) {
          success(this.responseText);
        }
      } else {
        hasFailed = true;
        fail(this.responseText);
      }
  };
}

const host = process.argv[2];
function getUrl(suffix) {
  return `${host}${suffix}`;
}

function insertUser(username, email, userAgent, count, callback) {
  var xhr = new xmlhr();
  xhr.onreadystatechange = handler(undefined, 200, count, 0, testSuccess(callback), testFail(callback));
  xhr.open("POST", getUrl(EPNTS.user.add()), {async: false});
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('user-agent', userAgent);
  userObj.activationSecrets.push(`${email}-${userAgent}`);
  xhr.send(JSON.stringify({username, email}));
}

const email1 = 'test@jozsefmorrissey.com';
const email2 = 'test0@jozsefmorrissey.com';
function init1(callback) {
  returned = 0;
  const count = 1;
  let username = randomString(64, /[a-zA-Z0-9]/, /.{1,}/);
  insertUser(username, email1, userObj.userAgent, count, callback);
}

function init2(callback) {
  returned = 0;
  const count = 1;
  const username = randomString(64, /[a-zA-Z0-9]/, /.{1,}/);
  insertUser(username, email2, userObj.removeUserAgent, count, callback);
}

const userObj= {emails: ['test1@jozsefmorrissey.com',
  'test2@jozsefmorrissey.com',
  'test3@jozsefmorrissey.com',
  'test4@jozsefmorrissey.com'],
  updatedUserNames: [`${randomString(50, /[a-zA-Z0-9]/, /.{1,}/)}-test-name-1`,
    `${randomString(50, /[a-zA-Z0-9]/, /.{1,}/)}-test-name-2`,
    `${randomString(50, /[a-zA-Z0-9]/, /.{1,}/)}-test-name-3`,
    `${randomString(50, /[a-zA-Z0-9]/, /.{1,}/)}-test-name-4`],
  userAgent: 'CE-data-api-test',
  removeUserAgent: 'CE-data-api-test-remove',
  secrets: [], ids: [], removeSecets: [], authored: [], activationUrls: [],
  activationSecrets: []
};

function testInsertUsers(callback) {
  const count = userObj.emails.length;
  for (let index = 0; index < count; index += 1) {
    returned = 0;
    const email = userObj.emails[index];
    const username = randomString(64, /[a-zA-Z0-9]/, /.{1,}/);
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(userObj.secrets, 200, count, index, testSuccess(callback), testFail(callback));
    userObj.activationSecrets.push(`${email}-${userObj.userAgent}`);
    xhr.open("POST", getUrl(EPNTS.user.add()), {async: false});
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.send(JSON.stringify({username, email}));
  }
}

function testGetUsers(callback) {
  const count = userObj.secrets.length;
  userObj.users = [];
  for (let index = 0; index < count; index += 1) {
    returned = 0;
    const secret = userObj.secrets[index];
    const id = Number.parseInt(secret.replace(/^User ([0-9]*)-.*$/, '$1'));
    userObj.ids[index] = id;
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(userObj.users, 200, count, index, testSuccess(callback), testFail(callback));
    xhr.open("GET", getUrl(EPNTS.user.get(id)), {async: false});
    xhr.send();
  }
}

function validateUserId(callback) {
  for (let index = 0; index < userObj.ids.length; index += 1) {
    const id = userObj.ids[index];
    const user = userObj.users[index];
    testing.assertEquals(id, user.id, callback);
  }
  testing.success(callback);
}

function testLoginUsers(callback) {
  const len = userObj.secrets.length;
  for (let index = 0; index < len; index += 1) {
    returned = 0;
    const secret = userObj.secrets[index];
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 200, len, index, testSuccess(callback), testFail(callback));
    xhr.open("GET", getUrl(EPNTS.user.login()));
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send();
  }
}

function testGetIds(callback) {
  function checkLength(results) {
    testing.assertEquals(JSON.parse(results).length, userObj.ids.length);
    testing.success(callback);
  }
  returned = 0;
  var xhr = new xmlhr();
  xhr.onreadystatechange = handler(undefined, 200, 1, 0, checkLength, testFail(callback));
  xhr.open("GET", getUrl(EPNTS.user.get(userObj.ids.join())));
  xhr.send();
}

function testCreateCredentials(callback) {
  const len = userObj.ids.length;
  for (let index = 0; index < len; index += 1) {
    returned = 0;
    const id = userObj.ids[index];
    const secret = userObj.secrets[index];
    const email = userObj.emails[index];
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(userObj.removeSecets, 200, len, index, testSuccess(callback), testFail(callback));
    const url = getUrl(EPNTS.credential.add(id));
    xhr.open("GET", url);
    userObj.activationSecrets.push(`${email}-${userObj.removeUserAgent}`);
    xhr.setRequestHeader('user-agent', userObj.removeUserAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send();
  }
}

function getActivationUrls(callback) {
  const len = userObj.activationSecrets.length;
  for (let index = 0; index < len; index += 1) {
    const activationSecret = userObj.activationSecrets[index];
    returned = 0;
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(userObj.activationUrls, 200, len, index, testSuccess(callback), testFail(callback));
    const url = getUrl(EPNTS.credential.activationUrl(activationSecret));
    xhr.open("GET", url);
    xhr.send();
  }
}

function testActivateUsers(callback) {
  const len = userObj.activationUrls.length;
  for (let index = 0; index < len; index += 1) {
    returned = 0;
    const url = userObj.activationUrls[index].replace(/https:/, 'http:').replace(':3001', ':3000');
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 200, len, index, testSuccess(callback), testFail(callback));
    xhr.open("GET", url);
    xhr.send();
  }
}

function testActivateUserFailure(callback) {
  returned = 0;
  const id = userObj.ids[0];
  var xhr = new xmlhr();
  xhr.onreadystatechange = handler(undefined, 401, 2, 0, testSuccess(callback), testFail(callback));
  xhr.open("GET", getUrl(EPNTS.credential.activate(id, 'shhhh')));
  xhr.send();
  var xhr = new xmlhr();
  xhr.onreadystatechange = handler(undefined, 401, 2, 0, testSuccess(callback), testFail(callback));
  xhr.open("GET", getUrl(EPNTS.credential.activate(1000, 'shhh')));
  xhr.send();
}

const removeCredIds = [];
async function testGetCredentials(callback) {
  const runOne = removeCredIds.length === 0;
  const credCount = runOne ? 2 : 1;
  let callCount = 0;
  function checkLength(results) {
    testing.assertEquals(results.length, credCount);
    if (runOne) removeCredIds.push(results[1].id);
    if (++callCount === 2) testing.success(callback);
  }
  let id = userObj.ids[3];
  var xhr = new xmlhr();
  xhr.onreadystatechange = simpleHandler(200, checkLength, testFail(callback));
  xhr.open("GET", getUrl(EPNTS.credential.get(id)));
  xhr.send();

  xhr = new xmlhr();
  xhr.onreadystatechange = simpleHandler(200, checkLength, testFail(callback));
  id = userObj.ids[2];
  xhr.open("GET", getUrl(EPNTS.credential.get(id)));
  xhr.send();
}

function testDeleteCredFailure(callback) {
  const len = removeCredIds.length;
  returned = 0;
  for (let index = 0; index < len; index += 1) {
    const id = removeCredIds[index];
    const inActive = index % 2 === 0;
    const secret = inActive ? userObj.removeSecets[index] : randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
    const status = inActive ? 400 : 401;
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, status, len, index, testSuccess(callback), testFail(callback));
    xhr.open("DELETE", getUrl(EPNTS.credential.delete(id)));
    xhr.setRequestHeader('user-agent', userObj.removeUserAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send();
  }
}

function testDeleteCred(callback) {
  const len = removeCredIds.length;
  returned = 0;
  for (let index = 0; index < len; index += 1) {
    const id = removeCredIds[index];
    const secret = userObj.secrets[index];
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 200, len, index, testSuccess(callback), testFail(callback));
    xhr.open("DELETE", getUrl(EPNTS.credential.delete(id)));
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send();
  }
}

function testUpdateUsers(callback) {
  const count = userObj.users.length;
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    const secret = userObj.secrets[index];
    const user = JSON.parse(JSON.stringify(userObj.users[index]));
    user.username = userObj.updatedUserNames[index];
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(userObj.updatedUsers, 200, count, index, testSuccess(callback), testFail(callback));
    xhr.open("PUT", getUrl(EPNTS.user.update()), {async: false});
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send(JSON.stringify(user));
  }
}

function validateUserNames(callback) {
  for (let index = 0; index < userObj.ids.length; index += 1) {
    const username = userObj.updatedUserNames[index];
    const user = userObj.users[index];
    testing.assertEquals(username, user.username, callback);
  }
  testing.success(callback);
}

const siteObj = {
  urls: [`${randomString(64, /[a-zA-Z0-9]/, /.{1,}/)}`,
    `${randomString(50, /[a-zA-Z0-9]/, /.{1,}/)}`,
    `${randomString(50, /[a-zA-Z0-9]/, /.{1,}/)}`,
    `${randomString(50, /[a-zA-Z0-9]/, /.{1,}/)}`],
  ids: []
}

function testAddSite(callback) {
  const secret = userObj.secrets[0];
  const count = siteObj.urls.length;
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    const url = siteObj.urls[index];
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 200, count, index, testSuccess(callback), testFail(callback));
    xhr.open("POST", getUrl(EPNTS.site.add()), {async: false});
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send(JSON.stringify({url}));
  }
}

function testGetSite(callback) {
  const count = siteObj.urls.length;
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    const url = siteObj.urls[index];
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(siteObj.ids, 200, count, index, testSuccess(callback), testFail(callback));
    xhr.open("POST", getUrl(EPNTS.site.get()));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({url}));
  }
}

function addExplanation(words, content, author, secret, status, count, callback) {
  var xhr = new xmlhr();
  xhr.onreadystatechange = handler(undefined, status, count, 0, testSuccess(callback), testFail(callback));
  xhr.open("POST", getUrl(EPNTS.explanation.add()));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('user-agent', userObj.userAgent);
  xhr.setRequestHeader('authorization', secret);
  xhr.send(JSON.stringify({words, content}));
}

const wordsCount = 20;
function testAddExplanation(callback, offset, count) {
  offset = offset || 0;
  const len = userObj.ids.length;
  if (count === undefined) {
    count = wordsCount * 2;
    returned = 0;
  }
  for (let index = 0; index < wordsCount; index += 1) {
    const author = userObj.users[index % len];
    const secret = userObj.secrets[index % len];
    const words = 'my words-' + ((index + offset) % (wordsCount));
    const content = `My explanation-${index}\n\t${author.username}`;
    addExplanation(words, content, author.id, secret, 200, count, callback)
    addExplanation(words, content, author.id, 'User 1000-hello', 401, count, callback)
  }
}

const len = 10;
function testAddMoreExplanations(callback) {
  const count = len * 2 * wordsCount;
  returned = 0;
  for (let index = 0; index < len; index += 1) {
    const offset = Math.floor(Math.random() * wordsCount);
    testAddExplanation(callback, offset, count);
  }
}

function testGetExplanations(callback) {
  const count = userObj.users.length
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    let authorId = userObj.users[index].id;
    let xhr = new xmlhr();
    xhr.onreadystatechange = handler(userObj.authored, 200, count, index, testSuccess(callback), testFail(callback));
    xhr.open("GET", getUrl(EPNTS.explanation.author(authorId)));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
  }
}

function testUpdateExplanations(callback) {
  const count = userObj.users.length
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    const author = userObj.users[index];
    const secret = userObj.secrets[index];
    const expl = userObj.authored[index][0];
    const content = `My explanation (updated)-${index}\n\t${author.username}`;
    expl.content = content;
    let xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 200, count, 0, testSuccess(callback), testFail(callback));
    xhr.open("PUT", getUrl(EPNTS.explanation.update()));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send(JSON.stringify({id: expl.id, content, authorId: author.id}));
  }
}

function testUpdateExplanationsWrongUser(callback) {
  const count = userObj.users.length
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    const author = userObj.users[(index + 1) % count];
    const secret = userObj.secrets[(index + 1) % count];
    const expl = userObj.authored[index][0];
    const content = `This value should not exist in database`;
    let xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 401, count, 0, testSuccess(callback), testFail(callback));
    xhr.open("PUT", getUrl(EPNTS.explanation.update()));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send(JSON.stringify({id: expl.id, content, authorId: author.id}));
  }
}

function testUpdateExplanationsNotLoggedIn(callback) {
  const count = userObj.users.length
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    const author = userObj.users[(index + 1) % count];
    const expl = userObj.authored[index][0];
    const content = `This value should not exist in database`;
    let xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 401, count, 0, testSuccess(callback), testFail(callback));
    xhr.open("PUT", getUrl(EPNTS.explanation.update()));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.send(JSON.stringify({id: expl.id, content, authorId: author.id}));
  }
}

function testUpdateExplanationsInvalidExplId(callback) {
  const count = userObj.users.length
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    const author = userObj.users[(index + 1) % count];
    const expl = userObj.authored[index][0];
    const content = `This value should not exist in database`;
    const secret = userObj.secrets[(index + 1) % count];
    let xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 404, count, 0, testSuccess(callback), testFail(callback));
    xhr.open("PUT", getUrl(EPNTS.explanation.update()));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send(JSON.stringify({id: -1, content, authorId: author.id}));
  }
}

function testUpdatedExplanations(callback) {
  let checked = 0;
  function equalExpl(localExpls) {
    return function (remoteExpls) {
      testing.assertEquals(localExpls.length, remoteExpls.length);
      for (let index = 0; index < localExpls.length; index += 1) {
        const localExpl = localExpls[index];
        const remoteExpl = remoteExpls[index];
        testing.assertEquals(localExpl.content, remoteExpl.content);
        testing.assertEquals(localExpl.author.id, remoteExpl.author.id);
        testing.assertEquals(localExpl.words.id, remoteExpl.words.id);
        checked++;
        if (checked === count) {
          testing.success(callback);
        }
      }
    }
  }
  const count = userObj.users.length
  for (let index = 0; index < count; index += 1) {
    let authorId = userObj.users[index].id;
    let xhr = new xmlhr();
    xhr.onreadystatechange = simpleHandler(200, equalExpl(userObj.authored[index]), testFail(callback));
    xhr.open("GET", getUrl(EPNTS.explanation.author(authorId)));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
  }
}

function testAddSiteExpl(callback) {
  const eCount = 20;
  const count = eCount * siteObj.urls.length;
  const user = userObj.users[0];
  const secret = userObj.secrets[0];
  returned = 0;
  for (let index = 0; index < siteObj.urls.length; index += 1) {
    const siteUrl = siteObj.urls[index];
    for (let eIndex = 0; eIndex < eCount; eIndex += 1) {
      let explId = userObj.authored[eIndex % userObj.users.length][eIndex].id;
      let xhr = new xmlhr();
      xhr.onreadystatechange = handler(undefined, 200, count, 0, testSuccess(callback), testFail(callback));
      xhr.open("POST", getUrl(EPNTS.siteExplanation.add(explId)));
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('user-agent', userObj.userAgent);
      xhr.setRequestHeader('authorization', secret);
      xhr.send(JSON.stringify({siteUrl}));
    }
  }
}

function testAddExistingSiteExpl(callback) {
  function checkResp(resp) {
    testing.assertNotEquals(resp.indexOf(':'), -1);
    testing.success(callback)
  };
  const user = userObj.users[0];
  const secret = userObj.secrets[0];
  const siteUrl = siteObj.urls[0];
  let explId = userObj.authored[0][0].id;
  let xhr = new xmlhr();
  xhr.onreadystatechange = simpleHandler(200, checkResp, testFail(callback));
  xhr.open("POST", getUrl(EPNTS.siteExplanation.add(explId)));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('user-agent', userObj.userAgent);
  xhr.setRequestHeader('authorization', secret);
  xhr.send(JSON.stringify({siteUrl}));
}

function testOpinionUrls(callback) {
  let explanations = []
  for (let index = 0; index < userObj.users.length; index += 1) {
    explanations = explanations.concat(userObj.authored[index]);
  }
  returned = 0;
  const count = explanations.length * userObj.users.length;
  for (let uIndex = 0; uIndex < userObj.users.length; uIndex += 1) {
    const secret = userObj.secrets[uIndex];
    const userId = userObj.users[uIndex].id;
    for (let index = 0; index < explanations.length; index += 1) {
      const expl = explanations[index % explanations.length];
      const explId = expl.id;
      const status = expl.author.id === userId ? 401 : 200;
      const siteId = siteObj.ids[Math.floor(Math.random() * siteObj.urls.length)].id;
      const url = Math.random() < 0.2 ? EPNTS.opinion.dislike(explId, siteId) : EPNTS.opinion.like(explId, siteId);
      let xhr = new xmlhr();
      xhr.onreadystatechange = handler(undefined, status, count, 0, testSuccess(callback), testFail(callback));
      xhr.open("GET", getUrl(url));
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('user-agent', userObj.userAgent);
      xhr.setRequestHeader('authorization', secret);
      xhr.send();
    }
  }
}

function testOpinionNotLoggedIn(callback) {
  const explId = userObj.authored[0].id;
  const siteId = siteObj.ids[0].id;
  const secret = userObj.secrets[0];
  const url = EPNTS.opinion.like(explId, siteId);
  let xhr = new xmlhr();
  xhr.onreadystatechange = simpleHandler(401, testSuccess(callback), testFail(callback));
  xhr.open("GET", getUrl(url));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('user-agent', userObj.userAgent);
  xhr.setRequestHeader('authorization', secret + '3');
  xhr.send();
}

function addRealExpl(userAgent, secret, expl, count, callback) {
  let xhr = new xmlhr();
  xhr.onreadystatechange = handler(undefined, 200, count, 0, testSuccess(callback), testFail(callback));
  const url = EPNTS.explanation.add();
  xhr.open("POST", getUrl(url));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('user-agent', userAgent);
  xhr.setRequestHeader('authorization', secret);
  xhr.send(JSON.stringify(expl));
}

const siteUrl = 'https://www.restapitutorial.com/httpstatuscodes.html';
function addCode(callback) {
  returned = 0;
  const secret = userObj.secrets[0];
  const userAgent = userObj.userAgent;
  const count = 2;
  const body = {content: "a system of principles or rules\n\n#og#right", words: "code"};
  addRealExpl(userAgent, secret, body, count, callback);
  let xhr = new xmlhr();
  xhr.onreadystatechange = handler(undefined, 200, count, 0, testSuccess(callback), testFail(callback));
  xhr.open("POST", getUrl(EPNTS.site.add()), {async: false});
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('user-agent', userAgent);
  xhr.setRequestHeader('authorization', secret);
  xhr.send(JSON.stringify({url: siteUrl}));
}


const explanations = [];
function addExplanations(callback) {
  const authorId = userObj.users[0].id;
  const tags = ['http', 'status', 'https', 'html', 'css', 'error'];
  function randHashTag () {return `\n\n#${tags[Math.floor(Math.random() * tags.length)]}#${tags[Math.floor(Math.random() * tags.length)]}`}
  // explanations.push({content: `a system of principles or rules${randHashTag()}`, words: "code"});
  explanations.push({content: `the person, thing, or idea that is present or near in place, time, or thought or that has just been mentioned ${randHashTag()}`, words: "this"});
  explanations.push({content: `the block of information found at a single World Wide Web address${randHashTag()}`, words: "page"});
  explanations.push({content: `present tense third-person singular of be${randHashTag()}`, words: "is"});
  explanations.push({content: `to produce or bring about by a course of action or behavior${randHashTag()}`, words: "created"});
  explanations.push({content: `used as a function word to indicate a starting point of a physical movement or a starting point in measuring or reckoning or in a statement of limits${randHashTag()}`, words: "from"});
  explanations.push({content: `hypertext transfer protocol; hypertext transport protocol${randHashTag()}`, words: "http"});
  explanations.push({content: `state or condition with respect to circumstances${randHashTag()}`, words: "status"});
  explanations.push({content: `the attribute inherent in and communicated by one of two or more alternative sequences or arrangements of something (such as nucleotides in DNA or binary digits in a computer program) that produce specific effects${randHashTag()}`, words: "information"});
  explanations.push({content: `having all usual, standard, or reasonably expected equipment${randHashTag()}`, words: "found"});
  explanations.push({content: `used as a function word to indicate the goal of an indicated or implied action${randHashTag()}`, words: "at"});
  explanations.push({content: `A website not for the faint of heart${randHashTag()}`, words: "ietf.org"});
  explanations.push({content: `used as a function word to indicate connection or addition especially of items within the same class or type —used to join sentence elements of the same grammatical rank or function${randHashTag()}`, words: "and"});
  explanations.push({content: `croud sourced information, thats all linked up${randHashTag()}`, words: "wikipedia"});
  explanations.push({content: `to change or move through (channels) especially by pushing buttons on a remote control${randHashTag()}`, words: "click"});
  explanations.push({content: `used as a function word to indicate position in contact with and supported${randHashTag()}`, words: "on"});
  explanations.push({content: `a division within a system of classification ${randHashTag()}`, words: "category heading"});
  explanations.push({content: `the equivalent or substitutive character of two words or phrases${randHashTag()}`, words: "or"});
  explanations.push({content: `used as a function word to indicate that a following noun or noun equivalent is definite or has been previously specified by context or by circumstance${randHashTag()}`, words: "the"});
  explanations.push({content: `one of the standardized divisions of a surveyor's chain that is 7.92 inches (20.1 centimeters) long and serves as a measure of length${randHashTag()}`, words: "link"});
  explanations.push({content: `used as a function word to indicate movement or an action or condition suggestive of movement toward a place, person, or thing reached${randHashTag()}`, words: "to"});
  explanations.push({content: `to receive or take in the sense of (letters, symbols, etc.) especially by sight or touch${randHashTag()}`, words: "read"});
  explanations.push({content: `to a greater or higher degree —often used with an adjective or adverb to form the comparative${randHashTag()}`, words: "more"});
  explanations.push({content: `coded language : a word or phrase chosen in place of another word or phrase in order to communicate an attitude or meaning without stating it explicitly${randHashTag()}`, words: "code"});
  explanations.push({content: `a system of symbols (such as letters or numbers) used to represent assigned and often secret meanings${randHashTag()}`, words: "code"});
  explanations.push({content: `a system of signals or symbols for communication${randHashTag()}`, words: "coded"});
  explanations.push({content: `a systematic statement of a body of law ${randHashTag()}`, words: "code"});
  explanations.push({content: `instructions for a computer (as within a piece of software)${randHashTag()}`, words: "codes"});

  const secret = userObj.secrets[0];
  const count = explanations.length;
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    addRealExpl(userObj.userAgent, secret, explanations[index], count, callback);
  }
}

let expls = {};
function getRealExpls(callback) {
  const count = explanations.length;
  function addExpls(result) {
    result.map((e) => {expls[e.id] = e});
    if (++returned >= count) testing.success(callback);
  }

  returned = 0;
  // await sleep(2000);
  for (let index = 0; index < count; index += 1) {
    const words = explanations[index].words;
    let xhr = new xmlhr();
    xhr.onreadystatechange = simpleHandler(200, addExpls, testFail(callback));
    xhr.open("GET", getUrl(EPNTS.explanation.get(words)), {async: false});
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({url: siteUrl}));
  }
}

function addRealExplsToSite(callback) {
  expls = Object.values(expls);
  const count = expls.length;
  const secret = userObj.secrets[0];
  returned = 0;
  for (let index = 0; index < count; index += 1) {
    const id = expls[index].id;
    let xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 200, count, 0, testSuccess(callback), testFail(callback));
    xhr.open("POST", getUrl(EPNTS.siteExplanation.add(id)), {async: false});
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({siteUrl}));
  }
}

function addCommentsToExpls(callback) {
  const count = expls.length * 3;
  returned = 0;
  const commentId = undefined;
  for (let index = 0; index < count; index += 1) {
    const value = randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
    const explanationId = expls[Math.floor(expls.length * Math.random())].id;
    const siteId = siteObj.ids[Math.floor(siteObj.ids.length * Math.random())].id;
    const secret = userObj.secrets[Math.floor(userObj.secrets.length * Math.random())];
    let xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 200, count, 0, testSuccess(callback), testFail(callback));
    xhr.open("POST", getUrl(EPNTS.comment.add()), {async: false});
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.setRequestHeader('Content-Type', 'application/json');
    const body = {value, siteId, explanationId, commentId};
    xhr.send(JSON.stringify(body));
  }
}

const startTime = new Date().getTime();
function finishTests(callback) {
  const endTime = new Date().getTime();
  testing.success(`Tests ran for ${(endTime - startTime) / 1000} seconds`, callback);
}

testing.run([init1, init2, testInsertUsers, testGetUsers, testGetIds, validateUserId,
            getActivationUrls, testActivateUsers, testLoginUsers, testCreateCredentials,
            testActivateUserFailure, testGetCredentials,
            testDeleteCredFailure, testDeleteCred, testGetCredentials,
            /*testUpdateUsers,*/ testLoginUsers, testGetUsers, /*validateUserNames,*/
            testAddSite, testGetSite, testAddExplanation,
            testAddMoreExplanations, testGetExplanations, testUpdateExplanations,
            testUpdateExplanationsWrongUser, testUpdateExplanationsNotLoggedIn,
            testUpdateExplanationsInvalidExplId, testUpdatedExplanations,
            testAddSiteExpl, testAddExistingSiteExpl, testOpinionUrls,
            testOpinionNotLoggedIn, addCode, addExplanations, getRealExpls,
            addRealExplsToSite, addCommentsToExpls,


            finishTests]);
