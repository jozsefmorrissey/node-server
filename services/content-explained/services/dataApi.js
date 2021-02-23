const bcrypt = require('bcryptjs');
const shell = require('shelljs');
const { Crud, DataObject } = require('./database/mySqlWrapper');

let user, password;
if (global.ENV !== 'local') {
  user = shell.exec('pst value ce-mysql user').stdout.trim();
  password = shell.exec('pst value ce-mysql password').stdout.trim();
  ignoreAuthintication = true;
}
const crud = Crud.set('CE', {password, user, silent: !global['debug'], mutex: false});

const { EPNTS } = require('./EPNTS');
const { Notify } = require('./notification');
const TagSvc = require('./repo/tag');
const { Context } = require('./context');
const { InvalidDataFormat, InvalidType, UnAuthorized, SqlOperationFailed,
        EmailServiceFailure, ShouldNeverHappen, DuplacateUniqueValue,
        NoSiteFound, ExplanationNotFound, NotFound, CredentialNotActive,
        InvalidRequest, BulkUpdateFailure, SignalError } =
        require('./exceptions.js');
const { Ip, UserAgent, Credential, User, PendingUserUpdate, Tag, Words,
        CommentTag, CommentTagFollower, OpenSite, Comment, GroupTag,
        Group, ExplanationTag, ExplanationTagFollower,
        Explanation, GroupContributor, GroupedOpinion, GroupedExplanation,
        GroupFollower, Follower, Opinion, SiteExplanation, SiteParts, Site,
        QuestionOpinion, QuestionComment, QuestionTag, QuestionTagFollower,
        Question, Notification, ExplanationNotification, CommentNotification,
        QuestionNotification, CommentConnections, ExplanationConnections,
        UserName, Following, GroupedExplanationDetail, AccessibleGroup,
        ConciseUser } =
                require('../services/database/objects');
const { randomString } = require('./tools.js');
const email = require('./email.js');


function returnVal(res, value) {
  return function (resVal) {
    value = value || resVal;
    if ((typeof value) === 'object') {
      res.setHeader('Content-Type', 'application/json');
    }
    res.send(value);
  }
}

function callAfter(count, getBody, success, failure) {
  getBody = getBody || ((r) => r);
  const returnArr = [];
  let processed = 0;
  return function (results) {
    returnArr.push(results);
    if (++processed === count) {
      const returnVal = getBody(returnArr);
      if (returnVal instanceof Error) {
        failure(returnVal);
      } else {
        success(returnVal);
      }
    }
  }
}

function returnQuery(res) {
  const parentArgs = arguments;
  return function (results) {
    let body;
    if (parentArgs.length === 1) {
      body = results;
    } else if (parentArgs.length === 2) {
      body = [];
      for (let index = 0; index < results.length; index += 1) {
        body.push(results[index][parentArgs[1]]);
      }
    } else {
      body = [];
      for (let index = 0; index < results.length; index += 1) {
        const elem = {};
        for (let aIndex = 1; aIndex < arguments.length; aIndex += 1) {
          const attr = parentArgs[aIndex];
          elem[attr] = result[index][attr];
        }
        body.push(elem);
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(body);
  }
}

function forEach(func, returnObj) {
  return function (list, success) {
    list.forEach((item) => func(item));
    success(returnObj);
  }
}

function returnError(next, error) {
  return function(e) {
    const err = error === undefined ? e : error;
    next(err);
  }
}

function alwaysSucceed(func) {
  return function () {
    func.apply(null, arguments);
    arguments[arguments.length - 2]();
  }
}

function conditionalFunc(condition, func) {
  return function () {
    if(condition) {
      func.apply(null, arguments)
    } else {
      const args = Array.from(arguments).splice(0, arguments.length - 2);
      arguments[arguments.length - 2].apply(null, args);
    }
  }
}

function setValue(object, fieldName) {
  return function(value, success) {
    if (object instanceof DataObject) {
      object.$d().setValueFunc(fieldName)(value);
    } else {
      object[fieldName] = value;
    }
    success(value);
  }
}

const sqlErrorFunc = (next, type, dataObject) =>
    returnError(next, new SqlOperationFailed(type, dataObject.constructor.name));

//TODO: decouple next at some point
function retrieveOrInsert(dataObject, next, success, fail) {
  const context = Context.fromFunc(success);
  function s(found) {success(found)}
  const onFail = fail || sqlErrorFunc(next, 'insert', dataObject);
  context.callbackTree(crud.selectOne, 'retrieveOrInsertDataObject', dataObject)
    .success(s)
    .fail(crud.insert, 'insert', dataObject)
    .success('insert', crud.selectOne, 'select', dataObject)
    .success('select', s)
    .fail('insert', onFail)
    .execute();
}

function retrieve(dataObject, next, success, fail) {
  const context = Context.fromFunc(success);
  function s(found) {success(found)}
  context.callbackTree(crud.selectOne, 'retrieveDataObject', dataObject)
    .success(s)
    .fail(fail)
    .execute();
}

const siteUrlReg = /^(http(s|):\/\/)(.{1,}?(\/|))((((\#|\?)([^#]*))(((\#)(.*))|)|))$/;
function parseSiteUrl(url) {
  const match = url.match(siteUrlReg);
  if (!match) return [undefined, url];
  return [match[1], match[3], match[7], match[10]];
}

function getIp(ip, next, success) {
  retrieveOrInsert(new Ip(ip), next, success);
}
function getUserAgent(userAgent, next, success) {
  retrieveOrInsert(new UserAgent(userAgent), next, success);
}
function getWords(words, next, success) {
  retrieveOrInsert(new Words(words), next, success);
}
function getSite(url, next, success) {
  const insertObj = new Site();
  const breakdown = parseSiteUrl(url);
  let count = 0;
  let insertSite = false;
  const setValue = (name) => (sitePart) => {
    insertObj.$d().setValueFunc(name)(sitePart.id);
    if (++count === 4)  {
      if (insertSite) {
        crud.insertGet(insertObj, success, sqlErrFunc('insert', insertObj));
      } else {
        retrieveOrInsert(insertObj, next, success);
      }
    }
  };
  const insert = (sitePart, attr) => () => {
    insertSite = true;
    crud.insertGet(sitePart, setValue(attr), sqlErrorFunc(insert, sitePart))
  };
  const get = (index, attr) => {
    const text = breakdown[index];
    const sp = new SiteParts(text);
    if (text) {
      retrieveOrInsert(sp, next, setValue(attr), insert(sp, attr));
    } else {
      setValue(attr)({});
    }
  }

  get(0, 'one_id');
  get(1, 'two_id');
  get(2, 'three_id');
  get(3, 'four_id');
}

function retrieveSite(url, next, success, fail) {
  retrieve(new Site(parseSiteUrl(url)[1]), next, success, fail);
}

async function buildRequestCredential(req, next) {
  const context = Context.fromReq(req);
  const cred = new Credential();
  const userAgentVal = req.headers['user-agent'];

  function setIp(ip, success) {cred.setIp(ip); success();};
  function setUserAgent (ua, success) {cred.setUserAgent(ua); success();};

  const hold = await context.callbackTree(getIp, 'tarGetIp', req.ip, next)
    .success(setIp, 'settingIp')
    .success('settingIp', getUserAgent, 'getUserAgent', userAgentVal, next)
    .success('getUserAgent', setUserAgent, 'settingUserAgent', '$cbtArg[0]')
    .success('settingUserAgent', ()=>{}, undefined, cred).terminate()
    .execute();

  return cred;
}

const authReg = /^([a-zA-Z]{1,}) ([0-9]{1,})-(.*)$/;
function authVal(type, id, secret, next, success, fail) {
  const val = `${type} ${id}-${secret}`;
  if (val.match(authReg) === null) {
    fail(new InvalidDataFormat(val, authReg));
  }
  success(val);
}
async function auth(req, next, success) {
  const context = Context.fromReq(req);

  function failure(error) {returnError(next, error)(new UnAuthorized());}
  const val = req.headers['authorization'];
  const match = val === undefined ? null : val.match(authReg);
  if (match === null) {
    failure();
    return;
  }

  const type = match[1];
  const id = int(match[2]);
  const secret = match[3];

  function validateAuthorization(user) {
    if (global['bypass.auth']) {
      success(user);
      return;
    }
    const credentials = user.getCredentials();
    for (let index = 0; index < credentials.length; index += 1) {
      const credential = credentials[index];
      const secretEq = credential.secret === secret;
      const userAgentEq = credential.userAgent === req.headers['user-agent'];
      const ipEq = credential.ip === req.ip;
      if (secretEq && userAgentEq && ipEq) {
        const isActive = credential.activationSecret === null;
        if (isActive) {
          success(user);
        } else {
          failure(new CredentialNotActive())
        }
        return;
      }
    }
    failure();
  }

  switch (type) {
    case 'User':
      const user = new User(id);
      context.callbackTree(crud.selectOne, 'authorizationTree', user)
        .success(validateAuthorization)
        .fail(failure, undefined, new UnAuthorized())
        .execute();
      break;
    default:
      throw new InvalidType('Authorization', type, 'User');
  }
}

function parseIds(idsStr) {
  const idsStrArr = idsStr.split(',');
  const ids = [];
  idsStrArr.map((value) => ids.push(int(value)));
  return ids;
}

function createSecret() {
  return randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
}

async function createCredential(req, next, userId, success, fail) {
  const context = Context.fromReq(req);
  const userAgentVal = req.headers['user-agent'];
  const secret = createSecret();
  const activationSecret = createSecret();
  let user = new User(int(userId));

  const cred = await buildRequestCredential(req, next);
  cred.setUserId(user.id);
  const deleteCred = cred.$d().clone();
  cred.setSecret(secret);
  cred.setActivationSecret(activationSecret);

  function setId(credId, success) {cred.setId(credId);success();}

  function setUser(u, success) {
    if (/* global.ENV !== 'prod' && */ u.getEmail().match(/^test[0-9]*@jozsefmorrissey.com$/)) {
      cred.setActivationSecret(`${u.getEmail()}-${userAgentVal}`.substr(0, 128));
    }
    user.setEmail(u.getEmail()); success()
  };

  const cbTree = context.callbackTree(crud.selectOne, 'postCredential', user)
    .success(setUser, 'settingUser')
    .fail(new SqlOperationFailed('select', 'User', {USER_ID: user.id}))
    .success('settingUser', crud.delete, 'removeOld', deleteCred)
    .success('removeOld', crud.insert, 'insert', cred)
    .success('insert', setId, 'settingId', '$cbtArg[0].insertId')
    .fail('insert', fail)
    .success('settingId', email.sendActivationEmail, 'sendEmail', user, cred)
    .success('sendEmail', authVal, 'getAuthKey', 'User', user.id, secret, next)
    .success('getAuthKey', success)
    .fail('sendEmail', fail, undefined, new EmailServiceFailure())
    .execute();
}

function insertTags(tags, success, failure) {
  success();
}

function int(value) {
  return Number.parseInt(value);
}

function addOpinion(req, next, explanationId, opinion, delOpinion, success, fail) {
  function setUserId(user, success) {
    delOpinion.setUserId(user.id);
    opinion.setUserId(user.id);
    success();
  }
  function notAuthor(expl, success, fail) {
    if (expl.author.id === opinion.getUserId()) {
      fail(new UnAuthorized('Authors cannot rate thier own work', '8yUDpd'));
    } else {
      success();
    }
  }

  const context = Context.fromReq(req);
  context.callbackTree(auth, 'submittingOpinion', req, next)
    .success(setUserId, 'settingUser')
    .success('settingUser', crud.selectOne, 'gettingExpl', new Explanation(explanationId))
    .success('gettingExpl', notAuthor, 'checkingUserNotAuthor')
    .fail('gettingExpl', returnError(next), 'explanationNotFound')
    .success('checkingUserNotAuthor', crud.delete, 'deletingOpinion', delOpinion)
    .fail('checkingUserNotAuthor', returnError(next), 'authorWeighingIn')
    .success('deletingOpinion', crud.insert, 'insertingOpinion', opinion)
    .success('insertingOpinion', success)
    .fail('insertingOpinion', fail)
    .execute();
}

function addGroupedOpinion(req, next, favorable, explanationId, groupId, success, fail) {
  explanationId = int(explanationId);
  groupId = int(groupId);


  const like = favorable === true;
  const dislike = favorable === false;
  let opinion = new GroupedOpinion(explanationId, groupId, like, dislike);
  let delOpinion = new GroupedOpinion(explanationId, groupId);

  addOpinion(req, next, explanationId, opinion, delOpinion, success, fail);
}

function addSiteOpinion(req, next, favorable, explanationId, siteId, success, fail) {
  explanationId = int(explanationId);
  siteId = int(siteId);

  let opinion = new Opinion(favorable, explanationId, siteId);
  let delOpinion = new Opinion(undefined, explanationId, siteId);
  addOpinion(req, next, explanationId, opinion, delOpinion, success, fail);
}

function activationStatus(credential) {
  return credential.getActivationSecret() === null ? 'active' : 'pending';
}

const idStrReg = /^([0-9]{1,}(,))*[0-9]{1,}$/;
function getUsers(idsOemail, success, fail) {
  const user = new User();
  // TODO: test get by email
  if (idsOemail.match(idStrReg)) {
    if (idsOemail.indexOf(',') === -1) {
      user.setId(int(idsOemail));
      crud.selectOne(user, success, fail);
    } else {
      user.setId(parseIds(idsOemail));
      crud.select(user, success, fail);
    }
  } else {
    user.setEmail(idsOemail);
    crud.selectOne(user, success, fail);
  }
}

const cleanRegEx = /(e|es|s|ed|ing)$/gi;
function cleanStr(str) {
  if ((typeof str) !== 'string') {
    return undefined;
  }
  return str.toLowerCase().replace(cleanRegEx, '')
}

function addExplToSite(explId, siteUrl, next, success) {
  if (siteUrl !== undefined) {
    const context = Context.fromFunc(success);
    const explanationId = int(explId);
    const siteExpl = new SiteExplanation();
    function setSiteId(site, callback) {siteExpl.setSiteId(site.id); callback();}
    function setExplanation(expl, callback) {siteExpl.setExplanation(expl); callback();}
    context.callbackTree(crud.selectOne, 'gettingExpl', new Explanation(explanationId))
      .success('gettingExpl', setExplanation, 'settingExpl')
      .success('settingExpl', getSite, 'gettingSite', siteUrl, next)
      .success('gettingSite', setSiteId, 'settingSite')
      .success('settingSite', crud.insert, 'addingSiteExpl', siteExpl)
      .success('addingSiteExpl', success, undefined, 'success')
      .fail('addingSiteExpl', success, undefined, 'success: Explanation already mapped to this site.')
      .execute();
  } else {
    success();
  }
}

function endpoints(app, prefix, ip) {
  app.all(prefix + '/*',function(req,res,next){
    const context = Context.fromReq(req);
    if (context.dg.isDebugging()) {
      crud.setLogger(context.dg.log);
    } else {
      crud.setLogger(undefined);
    }
    next();
  });

  //  ------------------------- User Api -------------------------  //

      app.get(prefix + EPNTS.user.login(), function (req, res, next) {
        auth(req, next, returnQuery(res), returnError(next));
      });

      app.get(prefix + EPNTS.user.get(), function (req, res, next) {
        getUsers(req.params.idsOemail, returnQuery(res), returnError(next, new NotFound('User')));
      });

      const searchReg = (str) => new RegExp(`.*${str.split('').join('.*')}.*`);
      app.get(prefix + EPNTS.user.find(), function (req, res, next) {
        const reg = searchReg(req.params.username);
        const map = {};
        const createMap = (results, success) =>
          results.map((result) => map[result.username] = result.id) && success();
        const searchUser = new UserName();
        searchUser.setUsername(reg);
        const context = Context.fromReq(req);
        context.callbackTree(crud.select, 'findingUsers', searchUser)
          .success(createMap, 'creatingMap')
          .success('creatingMap', returnVal(res, map))
          .execute();
      });

      app.post(prefix + EPNTS.user.add(), function (req, res, next) {
        const context = Context.fromReq(req);
        const username = req.body.username;
        const email = req.body.email;
        const user = new User(username, email);
        context.callbackTree(crud.insert, 'insertUser', user)
          .success(createCredential, 'createCredential', req, next, '$cbtArg[0].insertId')
          .fail(returnError(next))
          .success('createCredential', returnQuery(res))
          .fail('createCredential', returnError(next))
          .execute();
      });

      app.post(prefix + EPNTS.user.requestUpdate(), function (req, res, next) {
        const context = Context.fromReq(req);
        const user = User.fromObject(req.body.user);
        const noId = User.fromObject(req.body.user);
        noId.setId(undefined);


        const secret = createSecret();
        const userUpdate = new PendingUserUpdate(secret, user.username, user.getEmail(), {id: user.id});

        function validateUpdatingLoggedInUser(authUser, success, fail) {
          if (authUser.id !== user.id) {
            fail(new InvalidRequest('Wrong user id', 'vZrr1Z'));
            return;
          } else if (authUser.getEmail() !== req.body.originalEmail) {
            fail(new InvalidRequest('Wrong original email', 'fAWVYm'));
            return;
        } else if (authUser.getEmail() === user.getEmail()) {
          if (user.username === undefined) {
            fail(new InvalidRequest('Your email is already set to that silly', 'MgmwsI'));
            return;
          }
          userUpdate.setEmail(undefined);
        }
          success();
        }
        function emptyResults(results, success, fail) {
          if (results.length === 0) { success(); return; }
          let emailMatch, usernameMatch;
          results.forEach((result) => {
            if (result.username === user.username) usernameMatch = true;
            if (result.getEmail() === user.getEmail()) emailMatch = true;
          });
          if (usernameMatch && emailMatch)
            fail(new InvalidRequest('Email is already registered and Username already taken', 'EVb230'));
          else if (usernameMatch)
            fail(new InvalidRequest('Username is already taken', 'UgT3nn'));
          else if (emailMatch)
            fail(new InvalidRequest('Email is already registered', 'ft2xJd'));
          else
            fail(new ShouldNeverHappen('... Check your query'))
        }

        context.callbackTree(auth, 'requestUpdate', req, next)
          .success(validateUpdatingLoggedInUser, 'validating')
          .success('validating', crud.select, 'checkingForUnique', noId, {or: true})
          .fail('validating', returnError(next), 'validationFailed')
          .success('checkingForUnique', emptyResults, 'emptyResults')
          .success('emptyResults', crud.insert, 'insertingUpdate', userUpdate)
          .fail('emptyResults', returnError(next), 'NotUnique',)
          .success('insertingUpdate', email.sendUpdateUserEmail, 'sendEmail', user, secret)
          .fail('insertingUpdate', returnError(next), 'updateInsertFailed',)
          .success('sendEmail', returnVal(res, 'success'), 'emailSent')
          .fail('sendEmail', returnError(next), 'failedToSendEmail')
          .execute();
      });

      app.get(prefix + EPNTS.user.update(), function (req, res, next) {
        const context = Context.fromReq(req);
        const userUpdate = new PendingUserUpdate(req.params.updateSecret);
        function createUser(dbUserUpdate, success) {
          const user = new User();
          user.setId(dbUserUpdate.user.id);
          user.setUsername(dbUserUpdate.username || undefined);
          user.setEmail(dbUserUpdate.email || undefined);
          success(user);
        }
        context.callbackTree(crud.selectOne, 'updateUser', userUpdate)
          .success(createUser, 'creatingUser')
          .success('creatingUser', crud.update, 'updating')
          .fail(returnError(next))
          .success('updating', returnVal(res, 'success'))
          .fail('updating', returnError(next))
          .execute();
      });

  //  ------------------------- Credential Api -------------------------  //

    app.get(prefix + EPNTS.credential.add(), async function (req, res, next) {
      const context = Context.fromReq(req);
      context.callbackTree(createCredential, 'createCredentialRequest', req, next, req.params.userId)
        .success(returnQuery(res))
        .fail(returnError(next))
        .execute();
    });

    app.get(prefix + EPNTS.credential.activationUrl(), function (req, res, next) {
      const credential = new Credential();
      credential.setActivationSecret(req.params.activationSecret);
      function returnUrl (cred) {
        const host = EPNTS.getHost(global.ENV);
        const url = EPNTS.credential.activate(cred.getId(),cred.getUserId(),cred.getActivationSecret());
        res.send(`${host}${url}`);
      }
      crud.selectOne(credential, returnUrl, returnError(next));
    });

    app.get(prefix + EPNTS.credential.activate(), function (req, res, next) {
      const context = Context.fromReq(req);
      const cred =  new Credential();
      cred.setUserId(int(req.params.userId));
      cred.setId(int(req.params.id));

      function activate(credential) {
        if (credential.getActivationSecret() === null) {
          returnVal(res, 'success')();
        } else if (credential.getActivationSecret() === req.params.activationSecret) {
          credential.setActivationSecret(null);
          crud.update(credential, returnVal(res, 'success'), returnError(next));
        } else {
          returnError(next, new UnAuthorized('ActivationSecret is not correct'));
        }
      };

      context.callbackTree(crud.selectOne, 'selectCred', cred)
        .success(activate, 'settingIp')
        .fail(returnError(next, new UnAuthorized()), 'credActivationFailed')
        .execute();
    });

    app.get(prefix + EPNTS.credential.get(), function (req, res, next) {
      function addStatus(results) {
        const clean = [];
        function addToClean(value) {
          const obj = {};
          obj.id = value.getId();
          obj.status = activationStatus(value);
          obj.application = value.getUserAgent();
          obj.ip = value.getIp();
          clean.push(obj);
        }
        results.map(addToClean);
        returnVal(res, clean)();
      }
      const cred = new Credential();
      cred.setUserId(req.params.userId);
      crud.select(cred, addStatus, returnError(next))
    });

    app.get(prefix + EPNTS.credential.status(), function (req, res, next) {
      const context = Context.fromReq(req);
      const authorization = req.params.authorization;
      const match = authorization.match(authReg);
      if (match === null) {
        returnError(next, new InvalidDataFormat())();
        return;
      }
      const id = match[2];
      const secret = match[3];
      function returnStatus(credential) {
        const status = activationStatus(credential);
        returnVal(res, status)();
      }
      const cred = new Credential();
      cred.setUserId(id);
      cred.setSecret(secret);
      context.callbackTree(crud.selectOne, 'getCredentialStatus', cred)
      .success(returnStatus, 'returnCredStatus')
      .fail(returnError(next, new NotFound('Credential')))
      .execute();
    });

    app.delete(prefix + EPNTS.credential.delete(), function (req, res, next) {
      const context = Context.fromReq(req);
      const credential = new Credential();
      const idOauth = req.params.idOauthorization;
      if (idOauth.match(idStrReg)) {
        credential.setId(int(idOauth));
      } else {
        const match = idOauth.match(authReg);
        if (match === null) {
          returnError(next, new InvalidDataFormat())();
          return;
        }
        credential.setUserId(match[2]);
        credential.setSecret(match[3])
      }
      context.callbackTree(auth, 'deleteCredential', req, next)
        .success(crud.delete, 'removeCredential', credential)
        .fail('removeCredential', returnError())
        .success('removeCredential', returnVal(res, 'success'))
        .execute();
    });

  //  ------------------------- Site Api -------------------------  //

  app.post(prefix + EPNTS.site.add(), function (req, res, next) {
    const context = Context.fromReq(req);
    context.callbackTree(auth, 'addSite', req, next)
      .success(getSite, 'insertSite', req.body.url, next)
      .fail('insertSite', returnError(next, new DuplacateUniqueValue()))
      .success('insertSite', returnVal(res, 'success'))
      .execute();
  });

  app.post(prefix + EPNTS.site.get(), function (req, res, next) {
    const context = Context.fromReq(req);
    context.callbackTree(retrieveSite, 'retrieveSite', req.body.url, next)
      // .fail(returnQuery(res))
      .fail(returnError(next, new NoSiteFound(req.body.url)))
      .success(returnQuery(res))
      .execute();
  });

  //  ------------------------- Explanation Api -------------------------  //

  app.get(prefix + EPNTS.explanation.get(), function (req, res, next) {
    const context = Context.fromReq(req);
    const explanation = new Explanation();
    const clean = cleanStr(req.params.words);
    function setWords(words, success) {explanation.setSearchWords(words); success();};
    context.callbackTree(crud.selectOne, 'gettingExplanations', new Words(clean))
      .success(setWords, 'settingWord')
      .fail(returnError(next, new ExplanationNotFound(clean)))
      .success('settingWord', crud.select, 'gettingExpl', explanation)
      .success('gettingExpl', returnQuery(res))
      .execute();
  });

  app.get(prefix + EPNTS.explanation.author(), function (req, res, next) {
    const explanation = new Explanation();
    const authorId = int(req.params.authorId);
    explanation.setAuthor(new User(authorId));
    crud.select(explanation, returnQuery(res), returnError(next));
  });

  app.post(prefix + EPNTS.explanation.add(), function (req, res, next) {
    const context = Context.fromReq(req);
    const explanation = new Explanation(req.body.content);
    explanation.setLastUpdate(new Date());
    const idOnly = new Explanation();
    function setAuthor(author, success) {
      function setGroup(gc) {
        const accessibleGroup = new AccessibleGroup(gc.groupId);
        explanation.setGroupAuthor(accessibleGroup);
        success();
      }
      explanation.setAuthor(author);
      if (req.body.groupId) {
        const groupCont = new GroupContributor(author, int(req.body.groupId));
        crud.selectOne(groupCont, setGroup, returnError(next));
      } else {
        success();
      }
    };
    function setWords(words, success) {explanation.setWords(words); success();};
    function setId(id, success) {idOnly.setId(id); success();};
    function setSearchWords(success, fail) {
      function set(words) {
        explanation.setSearchWords(words);
        success();
      };
      const cleanWords = cleanStr(req.body.words);
      if (req.body.words === cleanWords) {
        explanation.setSearchWords(explanation.getWords());
        success();
      } else {
        getWords(cleanWords, next, set);
      }
    }

    try{
      context.callbackTree(auth, 'addExplanation', req, next)
        .success(setAuthor, 'settingAuthor')
        .success('settingAuthor', getSite, 'gettingSite', req.body.siteUrl, next)
        .success('gettingSite', setValue(explanation, 'siteId'), 'settingSite', '$cbtArg[0].id')
        .success('settingSite', getWords, 'gettingWords', req.body.words, next)
        .success('gettingWords', setWords, 'settingWords')
        .success('settingWords', setSearchWords, 'settingSearchWords')
        .success('settingSearchWords', crud.insert, 'insertExpl', explanation)
        .success('insertExpl', setId, 'settingId', '$cbtArg.explId = $cbtArg[0].insertId')
        .fail('insertExpl', returnError(next))
        .success('settingId', addExplToSite, 'addingToSite', '$cbtArg.explId', req.body.siteUrl, next)
        .success('addingToSite', crud.selectOne, 'gettingExplss', idOnly)
        .fail('addingToSite', returnError(next))
        .success('gettingExplss', alwaysSucceed(TagSvc.updateObj), 'updatingTags', '$cbtArg.expl = $cbtArg[0]', req.body.tagStr)
        .success('updatingTags', alwaysSucceed(Notify), 'notifying', '$cbtArg.expl')
        .fail('gettingExplss', returnError(next), 'retErr')
        .success('notifying', returnQuery(res), 'returnin', '$cbtArg.expl')
        .execute();
    } catch (e) {
      console.log('targ err', e)
    }
  });

  function has(list, valueObj) {
    const keys = Object.keys(valueObj);
    for (let lIndex = 0; list && lIndex < list.length; lIndex += 1) {
      const item = list[lIndex];
      let found = true;
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const value = valueObj[key];
        if (item[key] !== value) {
          found = false;
        }
      }
      if (found) {
        return true;
      }
    }
    return false;
  }

  app.put(prefix + EPNTS.explanation.update(), function (req, res, next) {
    const context = Context.fromReq(req);
    const explId = int(req.body.id);
    const idOnly = new Explanation(explId);
    const contentOnly = idOnly.$d().clone();
    contentOnly.setLastUpdate(new Date());
    const notifyObj = new Explanation(explId);
    let user;
    contentOnly.setContent(req.body.content);
    function recordUser(u, success) {user = u; success();}
    function validateUser(expl, success, fail) {
      if (expl.author.id === user.id) {
        notifyObj.setAuthor(user);
        success();
      } else if (expl.groupAuthor && has(user.groups, {id: expl.groupAuthor.id})) {
        notifyObj.setAuthor(user);
        success();
      } else {
        fail();
      }
    }

    context.callbackTree(auth, 'updateExpl', req, next)
      .success(recordUser, 'recordingLoggedInUser', '$cbtArg[0]')
      .success('recordingLoggedInUser', crud.selectOne, 'gettingExpl', idOnly)
      .fail('gettingExpl', returnError(new InvalidRequest('Invalid explanationId')), 'failedToSelect')
      .success('gettingExpl', validateUser, 'validatingAuthor', '$cbtArg[0]')
      .fail('gettingExpl', returnError(next, new NotFound('Explanation', req.body.id)), 'nf')
      .success('validatingAuthor', crud.update, 'updating', contentOnly)
      .fail('validatingAuthor', returnError(next, new UnAuthorized('Updates can only be made by the author or a member of the groupAuthor.')), 'unAuth3')
      .success('updating', alwaysSucceed(TagSvc.updateObj), 'updatingTags', contentOnly, req.body.tagStr)
      .fail('updating', returnError(next))
      .success('updatingTags', alwaysSucceed(Notify), 'notifying', notifyObj)
      .success('notifying', returnVal(res, 'success'), 'returning', '$cbtArg.comment')
      .execute();
  });

  //  ------------------------- Comment Api -------------------------  //

  app.post(prefix + EPNTS.comment.add(), function (req, res, next) {
    const context = Context.fromReq(req);
    const comment = new Comment(req.body.value, req.body.explanationId, undefined, req.body.commentId);
    comment.setLastUpdate(new Date());
    function recordUserId(author, success) {comment.setAuthor(author); success();}
    context.callbackTree(auth, 'addComment', req, next)
      .success(recordUserId, 'recordingAuthorId', '$cbtArg[0]')
      .success('recordingAuthorId', getSite, 'gettingSite', req.body.siteUrl, next)
      .success('gettingSite', setValue(comment, 'siteId'), 'settingSite', '$cbtArg[0].id')
      .success('settingSite', crud.insertGet, 'insertingComment', comment)
      .success('insertingComment', alwaysSucceed(TagSvc.updateObj), 'updatingTags', '$cbtArg.comment = $cbtArg[0]', req.body.tagStr)
      .fail('insertingComment', returnError(next))
      .success('updatingTags', alwaysSucceed(Notify), 'notifying', '$cbtArg.comment')
      .success('notifying', returnQuery(res), 'success', '$cbtArg.comment')
      .execute();
  });

  app.put(prefix + EPNTS.comment.update(), function (req, res, next) {
    const context = Context.fromReq(req);
    let dataObj = {};
    let comment;
    function assertAuthor(cmt, success, fail) {
      comment = cmt;
      if (comment.author.id === dataObj.userId) {
        comment.setValue(req.body.value);
        comment.setLastUpdate(new Date());
        success(comment);
      } else {
        fail();
      }
    }
    context.callbackTree(auth, 'updateComment', req, next)
      .success(setValue(dataObj, 'userId'), 'savingUserId', '$cbtArg[0].id')
      .success('savingUserId', crud.selectOne, 'gettingComment', new Comment(req.body.id))
      .success('gettingComment', assertAuthor, 'assertingAuthor')
      .fail('gettingComment', returnError(next))
      .success('assertingAuthor', crud.updateGet, 'updatingComment', comment)
      .fail('assertingAuthor', returnError(next, new UnAuthorized('You are not the author of this comment')))
      .success('updatingComment', returnQuery(res))
      .fail('updatingComment', returnError(next))
      .execute();
  });

  //  ------------------------- Question Api -------------------------  //

  app.post(prefix + EPNTS.question.add(), function (req, res, next) {
    const context = Context.fromReq(req);
    const question = new Question(req.body.elaboration);
    question.setLastUpdate(new Date());

    context.callbackTree(auth, 'addQuestion', req, next)
      .success(setValue(question, 'asker'), 'settingAsker')
      .success('settingAsker', getSite, 'gettingSiteId', req.body.siteUrl, next)
      .success('gettingSiteId', setValue(question, 'siteId'), 'settingSiteId', '$cbtArg[0].id')
      .success('settingSiteId', getWords, 'gettingWords', req.body.words, next)
      .success('gettingWords', setValue(question, 'words'), 'settingWords')
      .success('settingWords', crud.insertGet, 'insertQuestion', question)
      .success('insertQuestion', alwaysSucceed(TagSvc.updateObj), 'updatingTags', '$cbtArg.question = $cbtArg[0]', req.body.tagStr)
      .success('updatingTags', returnQuery(res), 'returnin', '$cbtArg.question')
      .fail('insertQuestion', returnError(next), 'retErr')
      .execute();
    });

  function removeQuestionOpinion(questionId, userId, success, fail) {
    const uIdOnly = new QuestionOpinion(questionId, userId);
    crud.deleteGet(uIdOnly, success, fail);
  }

  function submitQuestionOpinion(userId, questionId, unclear, answered, success, fail) {
    unclear = unclear === true;
    answered = !unclear && answered === true;
    if (answered || unclear) {
      removeQuestionOpinion(questionId, userId, (deleted) => {
        const newOpinion = new QuestionOpinion(questionId, userId, unclear, answered);
        crud.insert(newOpinion, success, fail);
      }, fail);
    }
  }

  function assertEquals(val1, val2, success, fail) {
    if (val1 === val2) {
      success();
    } else {
      fail();
    }
  }

  app.put(prefix + EPNTS.question.update(), function (req, res, next) {
    const context = Context.fromReq(req);
    const question = new Question(req.body.elaboration);
    question.setId(req.body.id);
    context.callbackTree(auth, 'updateQuestion', req, next)
      .success(crud.selectOne, 'gettingQuestion', new Question(question.id), '//$cbtArg.userId = $cbtArg[0].id')
      .success('gettingQuestion', assertEquals, 'verifyingAuthor', '$cbtArg[0].asker.id', '$cbtArg.userId')
      .fail('gettingQuestion', returnError(next, new InvalidRequest('Invalid id: ' + question.id)), 'invalidId')
      .success('verifyingAuthor', crud.updateGet, 'updating', question)
      .fail('verifyingAuthor', returnError(next, new UnAuthorized()), 'notAuthorized')
      .success('updating', returnQuery(res), 'returnin')
      .fail('updating', returnError(next, new ShouldNeverHappen()), 'pigsFlew')
      .execute();
  });

  app.get(prefix + EPNTS.question.get(), function (req, res, next) {
    const context = Context.fromReq(req);
    const question = new Question(int(req.params.id));
    context.callbackTree(crud.select, 'gettingQuestion', question)
      .success('gettingQuestion', returnQuery(res), 'found')
      .fail('gettingQuestion', returnError(next), 'notFound')
      .execute();
  });

  app.get(prefix + EPNTS.question.unclear(), function (req, res, next) {
    const context = Context.fromReq(req);
    context.callbackTree(auth, 'unclearQuestion', req, next)
      .success('unclearQuestion', submitQuestionOpinion, 'submittingOpinion', '$cbtArg[0].id', req.params.id, true, null)
      .success('submittingOpinion', returnVal(res, 'success'), 'returnin')
      .fail('submittingOpinion', returnError(next), 'retErr')
      .execute();
  });

  app.get(prefix + EPNTS.question.answered(), function (req, res, next) {
    const context = Context.fromReq(req);
    context.callbackTree(auth, 'answeredQuestion', req, next)
      .success('answeredQuestion', submitQuestionOpinion, 'submittingOpinion', '$cbtArg[0].id', req.params.id, null, true)
      .success('submittingOpinion', returnVal(res, 'success'), 'returnin')
      .fail('submittingOpinion', returnError(next), 'retErr')
      .execute();
  });

  app.get(prefix + EPNTS.question.resetOpinion(), function (req, res, next) {
    const context = Context.fromReq(req);
    context.callbackTree(auth, 'resetQuestionOpinion', req, next)
      .success(removeQuestionOpinion, 'resetingOpinion', req.params.id, '$cbtArg[0].id')
      .success('resetingOpinion', returnVal(res, 'success'), 'returnin')
      .fail('resetingOpinion', returnError(next), 'retErr')
      .execute();
  });

  //  ------------------------- Notification Api -------------------------  //

  function byAttr(attr) {
    return (obj1, obj2) => obj1[attr] - obj2[attr];
  }



  app.get(prefix + EPNTS.notification.get(), function (req, res, next) {
    const notes = new Notification(req.params.userId, undefined);
    const sortAndReturn = (results) => {
      results.sort(byAttr('id'));
      res.send(results);
    }
    crud.select(notes, sortAndReturn, returnError(next));
  });

  //  ------------------------- SiteExplanation Api -------------------------  //

  app.post(prefix + EPNTS.siteExplanation.add(), function (req, res, next) {
    const context = Context.fromReq(req);
    context.callbackTree(auth, 'addSiteExplApi', req, next)
      .success(addExplToSite, 'adding', req.params.explanationId, req.body.siteUrl, next)
      .success('adding', returnVal(res), 'returning')
      .execute();
    });

    app.post(prefix + EPNTS.siteExplanation.get(), function (req, res, next) {
      const context = Context.fromReq(req);
      const siteUrl = req.body.siteUrl;
      const retObj = {list: {}, questions: []};
      const idArr = [];
      function getQuestions(sites, success, fail) {
        retObj.siteId = idArr[0];
        if (idArr.length > 0) {
          const question = new Question();
          question.setSiteId(idArr);
          crud.select(question, success, fail);
        } else {
          success([]);
        }
      }

      function getExplanations(sites, success, fail) {
        sites.forEach((site) => {
          idArr.push(site.id);
        });
        if (idArr.length > 0) {
          crud.select(new SiteExplanation(idArr, undefined), success, fail);
        } else {
          success([]);
        }
      }

      function init(words) {
        const cleanWords = cleanStr(words);
        if (retObj.list[cleanWords] === undefined) retObj.list[cleanWords] = {explanations: [], questions: []};
        return cleanWords;
      }

      function addQuestion(question) {
        const cleanWords = cleanStr(question.words);
        if (retObj.list[cleanWords]) {
          retObj.list[cleanWords].questions.push(question)
        } else {
          retObj.questions.push(question);
        }
      }

      function createExplList(results, success) {
        results.map((siteExpl) => {
          const releventComments = [];
          const expl = siteExpl.explanation;
          if (expl.comments !== undefined) {
            expl.comments.map((comment) => {
              if (idArr.indexOf(comment.siteId) !== -1) {
                releventComments.push(comment);
              }
            });
          }
          const words = init(siteExpl.explanation.searchWords);
          expl.siteLikes = siteExpl.likes;
          expl.siteDislikes = siteExpl.dislikes;
          expl.comments = releventComments;
          retObj.list[words].explanations.push(expl);
        });
        success(retObj);
      }
      const heart = parseSiteUrl(siteUrl)[1];
      const site = new Site(heart);
      context.callbackTree(crud.select, 'gettingSites', site)
        .fail(returnVal(res, []))
        .success(getExplanations, 'gettingExplanations')
        .success('gettingExplanations', createExplList, 'creatingLists')
        .success('creatingLists', getQuestions, 'gettingQuestions')
        .success('gettingQuestions', forEach(addQuestion, retObj), 'settingQuestions')
        .fail('settingQuestions', returnError(next))
        .success('settingQuestions', returnQuery(res))
        .execute();
    });


  //  ------------------------- Opinion Api -------------------------  //

  app.get(prefix + EPNTS.explanation.opinion.like(), function (req, res, next) {
    const explanationId = int(req.params.explanationId);
    const siteId =  int(req.params.siteId);
    addSiteOpinion(req, next, true, explanationId, siteId, returnVal(res, 'success'), returnError(next));
  });

  app.get(prefix + EPNTS.explanation.opinion.dislike(), function (req, res, next) {
    const explanationId = int(req.params.explanationId);
    const siteId =  int(req.params.siteId);
    addSiteOpinion(req, next, false, explanationId, siteId, returnVal(res, 'success'), returnError(next));
  });

  app.get(prefix + EPNTS.explanation.opinion.bySite(), function (req, res, next) {
    const opinion = new Opinion();
    opinion.setSiteId(req.params.siteId);
    opinion.setUserId(req.params.userId);
    crud.select(opinion, returnQuery(res));
  });

  //  ------------------------- Group Api -------------------------  //

  function getGroup(groupId, success, fail) {
    const group = new Group(int(groupId));
    crud.selectOne(group, success, fail);
  }

  function isSuperiorAdmin(userId, newContributor, success, fail) {
    function checkAdmin(group) {
      let existingContRec = undefined;
      for (let index = 0; group.contributors && index < group.contributors.length; index += 1) {
        const contributor = group.contributors[index];
        if (contributor.user.id === newContributor.user.id) {
          existingContRec = contributor;
        }
      }
      if (existingContRec !== undefined && userId === newContributor.user.id) {
        return fail(new SignalError('user is trying to modify thier own information', '2he6yP'));
      }
      if (group.creator.id === newContributor.user.id) {
        return fail(new InvalidRequest('This user is the creator not just a contributor'))
      }

      if (group.creator.id === userId) {
        return success();
      }


      for (let index = 0; group.contributors && index < group.contributors.length; index += 1) {
        const contributor = group.contributors[index];
        if (contributor.user.id === userId) {
          if (contributor.level > group.adminLevel) {
            return fail(new InvalidRequest('You are not an adminstrator'));
          } else if ((newContributor.level === undefined || contributor.level < newContributor.level) &&
              (existingContRec === undefined || contributor.level < existingContRec.level)) {
            return success();
          } else {
            return fail(new InvalidRequest('Your level is not high enough'));
          }
        }
      }
      return fail(new InvalidRequest('You are not a contributor to this group'));
    }

    getGroup(newContributor.groupId, checkAdmin, fail);
  }

  app.get(prefix + EPNTS.group.get(), function (req, res, next) {
    const context = Context.fromReq(req);
    const groupId = req.params.groupId;

    context.callbackTree(getGroup, 'getGroup', groupId)
      .success(returnQuery(res), 'found')
      .fail(returnError(next, new InvalidRequest(`No group with id ${groupId}`)), 'notFound')
      .execute();
  });

  app.post(prefix + EPNTS.group.create(), function (req, res, next) {
    const context = Context.fromReq(req);
    const name = req.body.name;
    const description = req.body.description;
    const adminLevel = req.body.adminLevel;
    const image = req.body.image;
    const group = new Group(name, description, adminLevel, image);

    context.callbackTree(auth, 'createGroup', req, next)
      .success(setValue(group, 'creator'), 'settingCreatorId', '$cbtArg[0]')
      .success('settingCreatorId', crud.insertGet, 'insertingGroup', group)
      .success('insertingGroup', alwaysSucceed(TagSvc.updateObj), 'updatingTags', '$cbtArg.group = $cbtArg[0]', req.body.tagStr)
      .success('updatingTags', returnQuery(res), 'insertSuccessful', '$cbtArg.group')
      .fail('insertingGroup', returnError(next), 'insertFailed')
      .execute();
  });

  //  ------------------------- Group Contributor Api -------------------------  //

  function validContributors(userId, contributors, admin, success) {
    const results = {succeeded: [], failed: []};
    let count = 0;
    const returned = () => {
      if (++count === contributors.length) {
        success(results);
      }
    }

    const context = Context.fromFunc(success);
    const onSuccess = (groupCnt) => () => {
      results.succeeded.push(groupCnt);
      returned();
    };
    const onFail = (contributor) => (error) => {
      if (admin || error.code !== '2he6yP') {
        results.failed.push({contributor, error})
      } else {
        results.succeeded.push(contributor);
      }
      returned();
    };
    for (let index = 0; index < contributors.length; index += 1) {
      const contributor = contributors[index];
      const user = contributor.user;
      const groupId = contributor.groupId;
      const removeContributor = new GroupContributor(user, groupId);
      context.callbackTree(isSuperiorAdmin, 'checkingAdminStatus', userId, contributor)
      .success(onSuccess(contributor), 'successful')
      .fail(onFail(contributor), 'failure')
      .execute();
    }
  }

  function modifyContributors(userId, contributors, admin, func, success) {
    const context = Context.fromFunc(success);

    function applyFunction(results) {
      const cleanContributors = results.succeeded;

      if (cleanContributors.length === 0) return success(results);
      const count = cleanContributors.length;
      const bulkCall = callAfter(count, ()=> results, success);
      for (let index = 0; index < count; index += 1) {
        const contributor = cleanContributors[index];
        const user = contributor.user;
        const groupId = contributor.groupId;
        const funcId = 'callingFunc: ' + func.name;
        const removeContributor = new GroupContributor(user, groupId);
        context.callbackTree(func, 'modifyContributor', contributor)
        .success('modifyContributor', bulkCall, funcId, contributor)
        .execute();
      }
    }

    context.callbackTree(validContributors, 'modifyContributor', userId, contributors, admin)
      .success(applyFunction, 'applying')
      .execute();
  }

  function valueMinMax(value, min, max) {
    return value < min ? min : (value > max ? max : value);
  }

  function parseIntMinMax(strNum, min, max) {
    const match = strNum.match(/^(-|)[0-9]{1,}$/);
    if (match === null) return max;
    const parsedVal = int(match[0]);
    return valueMinMax(parsedVal, min, max);
  }

  function formatModifyContrib(results, success, fail) {
    console.log('resultsss:', results)
    if (results.failed.length > 0) {
      fail(new BulkUpdateFailure('Failed to modify some contributors', results, 'oCxZYr'));
    } else {
      success(results);
    }
  }

  app.post(prefix + EPNTS.group.contributor.add(), function (req, res, next) {
    const userIds = parseIds(req.params.userIds);
    const insertContributors = [];
    const deleteContributors = [];
    const level = parseIntMinMax(req.params.level, 0, 9);
    const emailNotify = req.params.emailNotify === 'true';
    const inAppNotify = req.params.inAppNotify === 'true';
    const groupId = req.params.groupId;
    userIds.map((id) => deleteContributors.push(
      new GroupContributor(new User(id), groupId)
    ));
    userIds.map((id) => insertContributors.push(
      new GroupContributor(new User(id), groupId, emailNotify, inAppNotify, level)
    ));

    Context.fromReq(req).callbackTree(auth, 'addContributor', req, next)
      .success(modifyContributors, 'removingExistingReferences', '$cbtArg.userId = $cbtArg[0].id', deleteContributors, true, crud.delete)
      .success('removingExistingReferences', modifyContributors, 'insertingContributor', '$cbtArg.userId', insertContributors, true, crud.insert)
      .success('insertingContributor', formatModifyContrib, 'formatting')
      .success('formatting', returnVal(res), 'success')
      .fail('formatting', returnError(next), 'fail')
      .execute();
  });

  app.delete(prefix + EPNTS.group.contributor.remove(), function (req, res, next) {
    const userIds = parseIds(req.params.userIds);
    const deleteContributors = [];
    const groupId = req.params.groupId;
    userIds.map((id) => deleteContributors.push(
      new GroupContributor(new User(id), groupId)
    ));

    Context.fromReq(req).callbackTree(auth, 'addContributor', req, next)
      .success(modifyContributors, 'removingExistingReferences', '$cbtArg.userId = $cbtArg[0].id', deleteContributors, false, crud.delete)
      .success('removingExistingReferences', returnVal(res), 'insertingGroupedExplanation')
      .execute();
  });

  const incReg = /^(-|\+)[0-9]{1,}$/;
  const setReg = /^[0-9]{1,}$/;
  function changeLevelFunc(change) {
    let match = int(change.match(incReg));
    if (match) return (cont) => cont.setLevel(valueMinMax(cont.level + match, 0, 64));
    match = int(change.match(setReg));
    if (match) return (cont) => cont.setLevel(valueMinMax(match, 0, 64));
    return new InvalidRequest(`change '${change}' is not a valid input`);
  }

  app.put(prefix + EPNTS.group.contributor.changeLevel(), function (req, res, next) {
    const changeFunc = changeLevelFunc(req.params.change);
    if (changeFunc instanceof Error) {
      returnError(next)(changeFunc);
      return;
    }
    const userIds = parseIds(req.params.userIds);
    const groupId = req.params.groupId;
    const users = [];
    userIds.map((id) => users.push(new User(id)));
    const selectContributor = new GroupContributor(users, groupId)
    Context.fromReq(req).callbackTree(auth, 'changingGroupContributorLevels', req, next)
      .success(crud.select, 'gettingContributors', selectContributor, '//$cbtArg.userId = $cbtArg[0].id')
      .success('gettingContributors', forEach(changeFunc), 'changing', '$cbtArg.contribs = $cbtArg[0]')
      .success('changing', modifyContributors, 'modifying', '$cbtArg.userId', '$cbtArg.contribs', true, crud.updateGet)
      .success('modifying', returnVal(res), 'success')
      .execute();
  });

  app.get(prefix + EPNTS.group.notify(), function (req, res, next) {
    let settingContrib = new GroupContributor();
    const email = req.params.emailNotify === 'true';
    const inApp = req.params.inAppNotify === 'true';
    const groupId = int(req.params.groupId);
    let updateObj;

    const setSettingContrib = (contrib, success) => {
      settingContrib.setId(contrib.id);
      settingContrib.setNotify(notify);
      success(settingContrib);
    };

    function setUpdateObj(accessGroup, success) {
      console.log('Acccess:', accessGroup)
      console.log(accessible);
      switch (accessGroup.level) {
        case -1:
          updateObj = new Group (groupId);
         break;
        default:
          const cu = new ConciseUser(accessGroup.contributorId);
          console.log(cu);
          updateObj = new GroupContributor(cu.id);
      }
      updateObj.setEmailNotify(email);
      updateObj.setInAppNotify(inApp);
      crud.update(updateObj, returnVal(res, 'success'), returnError(next));
    }
    console.log('gggid', groupId);
    const accessible = new AccessibleGroup(groupId)
    Context.fromReq(req).callbackTree(auth, 'updatingGroupNotifications', req, next)
      .success(setValue(accessible, 'userId'), 'settingUser', '$cbtArg[0].id')
      .success('settingUser', crud.selectOne, 'gettingAccessible', accessible)
      .fail('gettingAccessible', returnError(next, new InvalidRequest(`You are not a authorized to access group ${groupId}`)))
      .success('gettingAccessible', setUpdateObj, 'settingUpdateObj', '$cbtArg[0]')
      .execute();
  });

  //  ------------------------- Tag Api -------------------------  //

  app.get(prefix + EPNTS.tag.all(), function (req, res, next) {
    const tag = new Tag();
    crud.select(tag, returnQuery(res));
  });

  app.get(prefix + EPNTS.tag.find(), function (req, res, next) {
    const tag = new Tag(searchReg(req.params.searchVal));
    crud.select(tag, returnQuery(res));
  });

  //  ------------------------- Group Explanation Api -------------------------  //

  app.get(prefix + EPNTS.group.explanation.opinion.like(), function (req, res, next) {
    const groupId = req.params.groupId;
    const explId = req.params.explanationId;
    addGroupedOpinion(req, next, true, explId, groupId, returnVal(res, 'success'), returnError(next));
  });

  app.get(prefix + EPNTS.group.explanation.opinion.dislike(), function (req, res, next) {
    const groupId = req.params.groupId;
    const explId = req.params.explanationId;
    addGroupedOpinion(req, next, false, explId, groupId, returnVal(res, 'success'), returnError(next));
  });

  app.get(prefix + EPNTS.group.explanation.get(), function (req, res, next) {
    function formatResponse(results) {
      const response = {groupId: id, explanations: []};
      for (let index = 0; index < results.length; index += 1) {
        const groupExpl = results[index];
        const expl = groupExpl.explanation
        expl.groupLikes = groupExpl.likes;
        expl.groupDislikes = groupExpl.dislikes;
        response.explanations.push(expl);
      }
      returnVal(res)(response);
    }
    const id = req.params.id;
    if (id.trim().match(/^[0-9]{1,}$/)) {
      const groupExpl = new GroupedExplanation(int(id));
      crud.select(groupExpl, formatResponse);
    } else {
      returnError(next, new InvalidRequest(`Id not '${id}' formatted properly`))
    }
  });

  app.get(prefix + EPNTS.group.explanation.add(), function (req, res, next) {
    const context = Context.fromReq(req);
    const groupId = req.params.groupId;
    const expl = new Explanation(int(req.params.explanationId));
    const groupExplanation = new GroupedExplanation(groupId, expl);

    context.callbackTree(auth, 'addQuestion', req, next)
      .success(crud.insertIgnoreDup, 'insertingGroupedExplanation', groupExplanation)
      .success('insertingGroupedExplanation', returnVal(res, 'success'), 'insertSuccessful')
      .fail('insertingGroupedExplanation', returnError(next), 'insertFailed')
      .execute();
  });

  //  ------------------------- Follower Api -------------------------  //
  function formatFollowing(results, success) {
    const formatted = {users: {}, groups: {}, commentTags: {}, explanationTags: {}, questionTags: {}}
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      const user = result.target;
      formatted.users[user.id] = user;

      const group = result.group;
      formatted.groups[group.id] = group;

      const explTag = result.explanationTag;
      formatted.explanationTags[explTag.id] = explTag;

      const commentTag = result.commentTag;
      formatted.commentTags[commentTag.id] = commentTag;

      const questionTag = result.questionTag;
      formatted.questionTags[questionTag.id] = questionTag;
    }
    formatted.users = Object.values(formatted.users);
    formatted.groups = Object.values(formatted.groups);
    formatted.explanationTags = Object.values(formatted.explanationTags);
    formatted.commentTags = Object.values(formatted.commentTags);
    formatted.questionTags = Object.values(formatted.questionTags);
    success(formatted);
  }

  app.get(prefix + EPNTS.follow.get(), function (req, res, next) {
    const following = new Following();

    Context.fromReq(req).callbackTree(auth, 'addQuestion', req, next)
      .success(setValue(following, 'userId'), 'settingUserId', '$cbtArg[0].id')
      .success('settingUserId', crud.select, 'gettingFollowing', following)
      .success('gettingFollowing', formatFollowing, 'formatting')
      .success('formatting', returnVal(res), 'success')
      .execute();
  });

  app.post(prefix + EPNTS.follow.update(), function (req, res, next) {

    function followObjects(list, listAttr, dataClass, userId, objects) {
      objects = objects || [];
      if (list) {
        const followObject = dataClass.fromObject({});
        followObject.setUserId(userId);
        crud.delete(followObject);
        const fields = followObject.$d().getFields();
        for (let index = 0; index < list.length; index += 1) {
          const follower = dataClass.fromObject({});
          follower.$d().setValueFunc(listAttr)(list[index]);
          follower.setUserId(userId);
          objects.push(follower);
        }
      }
      return objects;
    }

    function updateDefinedList(user, success, failure) {
      const allObjects = [];
      followObjects(req.body.groups, 'groupId', GroupFollower, user.id, allObjects);
      followObjects(req.body.individuals, 'targetId', Follower, user.id, allObjects);
      followObjects(req.body.questions, 'tagId', QuestionTagFollower, user.id, allObjects);
      followObjects(req.body.comments, 'tagId', CommentTagFollower, user.id, allObjects);
      followObjects(req.body.explanations, 'tagId', ExplanationTagFollower, user.id, allObjects);
      if (allObjects.length > 0) {
        crud.insert(allObjects, success, failure);
      }
    }

    const context = Context.fromReq(req);
    context.callbackTree(auth, 'updateFollowing', req, next)
      .success(updateDefinedList, 'processDefinedLists')
      .success('processDefinedLists', returnVal(res, 'success'), 'updateSuccessful')
      .fail('processDefinedLists', returnError(next), 'updateFailed')
      .execute();
  });

  //  ------------------------- Open Sites Api -------------------------  //

  app.post(prefix + EPNTS.site.view(), function (req, res, next) {
    const openSite = new OpenSite(req.body.siteUrl);
    const context = Context.fromReq(req);
    const inserting = req.params.isViewing === 'true';
    context.callbackTree(auth, 'insertingViewing', req, next)
      .success(setValue(openSite, 'userId'), 'settingUserId', '$cbtArg[0].id')
      .success('settingUserId', crud.delete, 'deleteExisting', openSite)
      .success('deleteExisting', conditionalFunc(inserting, crud.insert), 'insertion', openSite)
      .success('insertion', returnVal(res, 'success'), 'successful')
      .fail('insertion', returnVal(res, 'success'), 'failed')
      .execute();
  });

  app.get(prefix + EPNTS.site.viewing(), function (req, res, next) {
    const openSite = new OpenSite();
    const context = Context.fromReq(req);
    context.callbackTree(auth, 'insertingViewing', req, next)
      .success(setValue(openSite, 'userId'), 'settingUserId', '$cbtArg[0].id')
      .success('settingUserId', crud.select, 'gettingOpenSites', openSite)
      .success('gettingOpenSites', returnQuery(res, 'url'), 'successful')
      .execute();
  });
}


exports.endpoints = endpoints;
