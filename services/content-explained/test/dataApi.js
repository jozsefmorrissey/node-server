const testing = require('testing');
const xmlhr = require('xmlhttprequest').XMLHttpRequest;



const { randomString } = require('../services/tools.js');
const { CallbackTree } = require('../services/callbackTree.js');
const { EPNTS } = require('../services/EPNTS.js');

const startTime = new Date().getTime();
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
  secrets: [], ids: [], removeSecets: [], authored: []};

function testInsertUsers(callback) {
  const count = userObj.emails.length;
  for (let index = 0; index < count; index += 1) {
    returned = 0;
    const username = randomString(64, /[a-zA-Z0-9]/, /.{1,}/);
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(userObj.secrets, 200, count, index, testSuccess(callback), testFail(callback));
    xhr.open("POST", getUrl(EPNTS.user.add()), {async: false});
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('user-agent', userObj.userAgent);
    xhr.send(JSON.stringify({username, email: userObj.emails[index]}));
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
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(userObj.removeSecets, 200, len, index, testSuccess(callback), testFail(callback));
    const url = getUrl(EPNTS.credential.add(id));
    xhr.open("POST", url);
    xhr.setRequestHeader('user-agent', userObj.removeUserAgent);
    xhr.setRequestHeader('authorization', secret);
    xhr.send();
  }
}

function testActivateUsers(callback) {
  const len = userObj.ids.length;
  for (let index = 0; index < len; index += 1) {
    returned = 0;
    const id = userObj.ids[index];
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 200, len, index, testSuccess(callback), testFail(callback));
    const url = getUrl(EPNTS.credential.activate(id, 'shhh'));
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
    const secret = index % 2 === 0 ? userObj.removeSecets[index] : randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
    var xhr = new xmlhr();
    xhr.onreadystatechange = handler(undefined, 401, len, index, testSuccess(callback), testFail(callback));
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
    for (let index = 0; index < explanations.length; index += 1) {
      const explId = explanations[index % explanations.length].id;
      const siteId = siteObj.ids[Math.floor(Math.random() * siteObj.urls.length)].id;
      const url = Math.random() < 0.2 ? EPNTS.opinion.dislike(explId, siteId) : EPNTS.opinion.like(explId, siteId);
      let xhr = new xmlhr();
      xhr.onreadystatechange = handler(undefined, 200, count, 0, testSuccess(callback), testFail(callback));
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




function finishTests(callback) {
  const endTime = new Date().getTime();
  testing.success(`Tests ran for ${(endTime - startTime) / 1000} seconds`, callback);
}

testing.run([init1, init2, testInsertUsers, testGetUsers, testGetIds, validateUserId,
            testActivateUsers, testLoginUsers, testCreateCredentials,
            testActivateUserFailure, testGetCredentials,
            testDeleteCredFailure, testDeleteCred, testGetCredentials,
            testUpdateUsers, testLoginUsers, testGetUsers, validateUserNames,
            testAddSite, testGetSite, testAddExplanation,
            testAddMoreExplanations, testGetExplanations, testUpdateExplanations,
            testUpdateExplanationsWrongUser, testUpdateExplanationsNotLoggedIn,
            testUpdateExplanationsInvalidExplId, testUpdatedExplanations,
            testAddSiteExpl, testAddExistingSiteExpl, testOpinionUrls,
            testOpinionNotLoggedIn,


            finishTests]);