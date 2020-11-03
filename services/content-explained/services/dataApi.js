const bcrypt = require('bcryptjs');
const Crud = require('./database/mySqlWrapper').Crud;
const { CallbackTree } = require('../services/callbackTree.js');

const { EPNTS } = require('./EPNTS.js');
const { InvalidDataFormat, InvalidType, UnAuthorized, SqlOperationFailed,
        EmailServiceFailure, ShouldNeverHappen, DuplacateUniqueValue,
        NoSiteFound, ExplanationNotFound, NotFound} =
        require('./exceptions.js');
const { User, Explanation, Site, Opinion, SiteExplanation, Credential,
        DataObject, Ip, UserAgent, Words} =
                require('../services/database/objects');
const { randomString } = require('./tools.js');
const email = require('./email.js');

const crud = new Crud({silent: true, mutex: false});

function retrieveOrInsert(dataObject, next, success) {
  const cbTree = new CallbackTree(crud.selectOne, 'retrieveOrInsertDataObject', dataObject)
    .success(success)
    .fail(crud.insert, 'insert', dataObject)
    .success('insert', crud.selectOne, 'select', dataObject)
    .success('select', success)
    .fail('insert', returnError(next, new SqlOperationFailed('insert', 'UserAgent')));
  cbTree.execute();
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
  retrieveOrInsert(new Site(url), next, success);
}


async function buildRequestCredential(req, next) {
  const cred = new Credential();
  const userAgentVal = req.headers['user-agent'];

  function setIp(ip, success) {cred.setIp(ip); success();};
  function setUserAgent (ua, success) {cred.setUserAgent(ua); success();};

  const hold = await new CallbackTree(getIp, 'tarGetIp', req.ip, next)
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
  function failure() {returnError(next, new UnAuthorized())();}
  const val = req.headers['authorization'];
  const match = val === undefined ? null : val.match(authReg);
  if (match === null) {
    failure();
    return;
  }

  const type = match[1];
  const id = Number.parseInt(match[2]);
  const secret = match[3];
  console.log('creds:', secret, id, req.headers['user-agent']);

  function validateAuthorization(user) {
    const credentials = user.getCredentials();
    for (let index = 0; index < credentials.length; index += 1) {
      const credential = credentials[index];
      const secretEq = credential.secret === secret;
      const userAgentEq = credential.userAgent.value === req.headers['user-agent'];
      const ipEq = credential.ip.value === req.ip;
      console.log(req.ip);
      const isActive = credential.activationSecret === null;
      console.log('test:', secretEq, userAgentEq, ipEq, isActive)
      if (secretEq && userAgentEq && ipEq && isActive) {
        success(user);
        return;
      }
    }
    failure();
  }

  switch (type) {
    case 'User':
      const user = new User(id);
      new CallbackTree(crud.selectOne, 'authorizationTree', user)
        .success(validateAuthorization)
        .fail(failure)
        .execute();
      break;
    default:
      throw new InvalidType('Authorization', type, 'User');
  }
}

function returnVal(res, value) {
  return function () {
    if ((typeof value) === 'object') {
      res.setHeader('Content-Type', 'application/json');
    }
    res.send(value);
  }
}

function returnQuery(res) {
  return function (results) {
    res.setHeader('Content-Type', 'application/json');
    res.send(results);
  }
}

function returnError(next, error) {
  return function(e) {
    next(error || e);
  }
}

function parseIds(idsStr) {
  const idsStrArr = idsStr.split(',');
  const ids = [];
  idsStrArr.map((value) => ids.push(Number.parseInt(value)));
  return ids;
}

async function createCredential(req, next, userId, success, fail) {
  const userAgentVal = req.headers['user-agent'];
  const secret = randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
  const activationSecret = randomString(128, /[a-zA-Z0-9]/, /.{1,}/);
  let user = new User(Number.parseInt(userId));

  const cred = await buildRequestCredential(req, next);
  cred.setUserId(user.id);
  const deleteCred = cred.$d().clone();
  cred.setSecret(secret);
  cred.setActivationSecret(activationSecret);

  function setUser(u, success) {
    if (u.getEmail().match(/^test[0-9]*@jozsefmorrissey.com$/)) {
      cred.setActivationSecret('shhh');
    }
    user.setEmail(u.getEmail()); success()
  };

  const cbTree = new CallbackTree(crud.selectOne, 'postCredential', user)
    .success(setUser, 'settingUser')
    .fail(new SqlOperationFailed('select', 'User', {USER_ID: user.id}))
    .success('settingUser', crud.delete, 'removeOld', deleteCred)
    .success('removeOld', crud.insert, 'insert', cred)
    .success('insert', email.sendActivationEmail, 'sendEmail', user, cred)
    .fail('insert', fail)
    .success('sendEmail', authVal, 'getAuthKey', 'User', user.id, secret, next)
    .success('getAuthKey', success)
    .fail('sendEmail', fail, undefined, new EmailServiceFailure())
    .execute();
}

function addSite(url, success, failure) {
  crud.insert(new Site(url), success, failure);
}

function insertTags(tags, success, failure) {
  success();
}

function addOpinion(req, next, favorable, explanationId, siteId, success, fail) {
  const opinion = new Opinion(favorable, explanationId, siteId);
  const delOpinion = new Opinion(undefined, explanationId, siteId);
  function setUserId(user, success) {opinion.setUserId(user.id); success()}
  new CallbackTree(auth, 'submittingOpinion', req, next)
    .fail(fail)
    .success(setUserId, 'settingUser')
    .success('settingUser', crud.delete, 'deletingOpinion', delOpinion)
    .success('deletingOpinion', crud.insert, 'insertingOpinion', opinion)
    .success('insertingOpinion', success)
    .fail('insertingOpinion', fail)
    .execute();
}

function endpoints(app, prefix, ip) {

  //  ------------------------- User Api -------------------------  //

      app.get(prefix + EPNTS.user.login(), function (req, res, next) {
        auth(req, next, returnQuery(res), returnError(next));
      });

      app.get(prefix + EPNTS.user.get(), function (req, res, next) {
        const user = new User();
        user.setId(parseIds(req.params.ids));
        crud.select(user, returnQuery(res), returnError(next));
      });

      app.post(prefix + EPNTS.user.add(), function (req, res, next) {
        const username = req.body.username;
        const email = req.body.email;
        const user = new User(username, email);
        new CallbackTree(crud.insert, 'insertUser', user)
          .success(createCredential, 'createCredential', req, next, '$cbtArg[0].insertId')
          .fail(returnError(next))
          .success('createCredential', returnQuery(res))
          .fail('createCredential', returnError(next))
          .execute();
      });

      app.put(prefix + EPNTS.user.update(), function (req, res, next) {
        const user = User.fromObject(req.body);
        new CallbackTree(auth, 'updateUser', req, next)
          .success(crud.update, 'updating', user)
          .fail(returnError(next))
          .success('updating', returnQuery(res))
          .fail('updating', returnError(next, new ShouldNeverHappen()))
          .execute();
      });

  //  ------------------------- Credential Api -------------------------  //

    app.post(prefix + "/credential/:userId", async function (req, res, next) {
      new CallbackTree(createCredential, 'createCredentialRequest', req, next, req.params.userId)
        .success(returnQuery(res))
        .fail(returnError(next))
        .execute();
    });

    app.get(prefix + "/credential/activate/:userId/:activationSecret", function (req, res, next) {
      const cred =  new Credential();
      cred.setActivationSecret(req.params.activationSecret);
      cred.setUserId(Number.parseInt(req.params.userId));

      function activate(credential) {
        credential.setActivationSecret(null);
        crud.update(credential, returnVal(res, 'success'), returnError(next));
      };

      const cbTree = new CallbackTree(crud.selectOne, 'selectCred', cred)
        .success(activate, 'settingIp')
        .fail(returnError(next, new UnAuthorized()));
      cbTree.execute();
    });

    app.get(prefix + "/credential/:userId", function (req, res, next) {
      function addStatus(results) {
        const clean = [];
        function addToClean(value) {
          const obj = {};
          obj.id = value.getId();
          obj.status = value.getActivationSecret() === null ? 'active' : 'pending';
          obj.application = value.getUserAgent().getValue();
          obj.ip = value.getIp().getValue();
          clean.push(obj);
        }
        results.map(addToClean);
        returnVal(res, clean)();
      }
      const cred = new Credential();
      cred.setUserId(req.params.userId);
      crud.select(cred, addStatus, returnError(next))
    });

    app.delete(prefix + "/credential/:credId", function (req, res, next) {
      new CallbackTree(auth, 'deleteCredential', req, next)
        .fail(returnError(next, new UnAuthorized()))
        .success(crud.delete, 'removeCredential', new Credential(Number.parseInt(req.params.credId)))
        .fail('removeCredential', returnError(new ShouldNeverHappen('delete should always succeed')))
        .success('removeCredential', returnVal(res, 'success'))
        .execute();
    });

  //  ------------------------- Site Api -------------------------  //

  app.post(prefix + EPNTS.site.add(), function (req, res, next) {
    new CallbackTree(auth, 'addSite', req, next)
      .fail(returnError(next, new UnAuthorized()))
      .success(addSite, 'insertSite', req.body.url)
      .fail('insertSite', returnError(next, new DuplacateUniqueValue()))
      .success('insertSite', returnVal(res, 'success'))
      .execute();
  });

  app.post(prefix + EPNTS.site.get(), function (req, res, next) {
    console.log('booody',req.body)
    new CallbackTree(crud.selectOne, 'getSite', new Site(req.body.url))
      .fail(returnError(next, new NoSiteFound(req.body.url)))
      .success(returnQuery(res))
      .execute();
  });

  //  ------------------------- Explanation Api -------------------------  //

  app.get(prefix + EPNTS.explanation.get(), function (req, res, next) {
    const explanation = new Explanation(req.body.content);
    function setWords(words, success) {explanation.setWords(words); success();};
    new CallbackTree(crud.selectOne, 'gettingExplanations', new Words(req.params.words))
      .success(setWords, 'settingWord')
      .fail(returnError(next, new ExplanationNotFound(req.params.words)))
      .success('settingWord', crud.select, 'gettingExpl', explanation)
      .success('gettingExpl', returnQuery(res))
      .execute();
  });

  app.get(prefix + EPNTS.explanation.author(), function (req, res, next) {
    console.log('auth id: ', req.params.authorId)
    const explanation = new Explanation();
    const authorId = Number.parseInt(req.params.authorId);
    explanation.setAuthor(new User(authorId));
    crud.select(explanation, returnQuery(res), returnError(next));
  });

  app.post(prefix + EPNTS.explanation.add(), function (req, res, next) {
    const explanation = new Explanation(req.body.content);
    function setAuthor(author, success) {explanation.setAuthor(author); success();};
    function setWords(words, success) {explanation.setWords(words); success();};

    new CallbackTree(auth, 'addSite', req, next)
      .success(setAuthor, 'settingAuthor')
      .fail(returnError(next, new UnAuthorized()))
      .success('settingAuthor', getWords, 'gettingWords', req.body.words, next)
      .success('gettingWords', setWords, 'settingWords')
      .success('settingWords', crud.insert, 'insertExpl', explanation)
      .success('insertExpl', insertTags, 'insertingTags', req.body.tags)
      .fail('insertExpl', returnError(next, new ShouldNeverHappen()))
      .success('insertingTags', returnVal(res, 'success'))
      .fail('insertingTags', returnError(next, new ShouldNeverHappen()))
      .execute();
  });

  app.put(prefix + EPNTS.explanation.update(), function (req, res, next) {
    const idOnly = new Explanation(Number.parseInt(req.body.id));
    const contentOnly = idOnly.$d().clone();
    contentOnly.setContent(req.body.content);
    function validateUser(id, success, fail) {
      if (id === req.body.authorId) {
        success();
      } else {
        fail();
      }
    }
    console.log('here: ', req.body)
    new CallbackTree(auth, 'updateExpl', req, next)
      .success(validateUser, 'validatingLoginUser', '$cbtArg[0].id')
      .fail(returnError(next, new UnAuthorized('Updates can only be made by the author.')), 'unAuth1')
      .success('validatingLoginUser', crud.selectOne, 'gettingExpl', idOnly)
      .fail('validatingLoginUser', returnError(next, new UnAuthorized('Updates can only be made by the author.')), 'unAuth1')
      .success('gettingExpl', validateUser, 'validatingAuthor', '$cbtArg[0].author.id')
      .fail('gettingExpl', returnError(next, new NotFound('Explanation', req.body.id)), 'nf')
      .success('validatingAuthor', crud.update, 'updating', contentOnly)
      .fail('validatingAuthor', returnError(next, new UnAuthorized('Updates can only be made by the author.')), 'unAuth1')
      .success('updating', returnVal(res, 'success'))
      .execute();
  });

  //  ------------------------- SiteExplanation Api -------------------------  //

  app.post(prefix + EPNTS.siteExplanation.add(), function (req, res, next) {
    const explanationId = Number.parseInt(req.params.explanationId);
    console.log('eee:', explanationId);
    const siteUrl = req.body.siteUrl;
    const siteExpl = new SiteExplanation();
    function setSiteId(site, success) {siteExpl.setSiteId(site.id); success();
      console.log('new siteE: ', siteExpl);
    }
    function setExplanation(expl, success) {siteExpl.setExplanation(expl); success();}
    new CallbackTree(auth, 'addSiteExpl', req, next)
      .success(crud.selectOne, 'gettingExpl', new Explanation(explanationId))
      .success('gettingExpl', setExplanation, 'settingExpl')
      .success('settingExpl', getSite, 'gettingSite', siteUrl, next)
      .success('gettingSite', setSiteId, 'settingSite')
      .success('settingSite', crud.insert, 'addingSiteExpl', siteExpl)
      .success('addingSiteExpl', returnVal(res, 'success'))
      .fail('addingSiteExpl', returnVal(res, 'success: Explanation already mapped to this site.'))
      .execute();
    });


  //  ------------------------- Opinion Api -------------------------  //

  app.get(prefix + EPNTS.opinion.like(), function (req, res, next) {
    const explanationId = Number.parseInt(req.params.explanationId);
    const siteId =  Number.parseInt(req.params.siteId);
    addOpinion(req, next, true, explanationId, siteId, returnVal(res, 'success'), returnError(next));
  });

  app.get(prefix + EPNTS.opinion.dislike(), function (req, res, next) {
    const explanationId = Number.parseInt(req.params.explanationId);
    const siteId =  Number.parseInt(req.params.siteId);
    addOpinion(req, next, false, explanationId, siteId, returnVal(res, 'success'), returnError(next));
  });

  app.get(prefix + EPNTS.opinion.bySite(), function (req, res, next) {
    const opinion = new Opinion();
    opinion.setSiteId(req.params.siteId);
    opinion.setUserId(req.params.userId);
    crud.select(opinion, returnQuery(res));
  });
}


exports.endpoints = endpoints;
