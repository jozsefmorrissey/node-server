const bcrypt = require('bcryptjs');
const Crud = require('./database/mySqlWrapper').Crud;

const { EPNTS } = require('./EPNTS');
const { Context } = require('./context');
const { InvalidDataFormat, InvalidType, UnAuthorized, SqlOperationFailed,
        EmailServiceFailure, ShouldNeverHappen, DuplacateUniqueValue,
        NoSiteFound, ExplanationNotFound, NotFound, CredentialNotActive} =
        require('./exceptions.js');
const { User, Explanation, Site, Opinion, SiteExplanation, Credential,
        DataObject, Ip, UserAgent, Words, PendingUserUpdate} =
                require('../services/database/objects');
const { randomString } = require('./tools.js');
const email = require('./email.js');

const crud = new Crud({silent: true, mutex: false});

function retrieveOrInsert(dataObject, next, success) {
  const context = Context.fromFunc(success);
  function s(found) {success(found)}
  context.callbackTree(crud.selectOne, 'retrieveOrInsertDataObject', dataObject)
    .success(s)
    .fail(crud.insert, 'insert', dataObject)
    .success('insert', crud.selectOne, 'select', dataObject)
    .success('select', s)
    .fail('insert', returnError(next, new SqlOperationFailed('insert', 'UserAgent')))
    .execute();
}

function cleanSiteUrl(url) {
  return url.replace(/^(.*?)(\#|\?).*$/, '$1')
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
  retrieveOrInsert(new Site(cleanSiteUrl(url)), next, success);
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
  const id = Number.parseInt(match[2]);
  const secret = match[3];

  function validateAuthorization(user) {
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

function returnVal(res, value) {
  return function (resVal) {
    value = value || resVal;
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
    const err = error === undefined ? e : error;
    next(err);
  }
}

function parseIds(idsStr) {
  const idsStrArr = idsStr.split(',');
  const ids = [];
  idsStrArr.map((value) => ids.push(Number.parseInt(value)));
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

  const cbTree = context.callbackTree(crud.selectOne, 'postCredential', user)
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
  const context = Context.fromReq(req);
  const opinion = new Opinion(favorable, explanationId, siteId);
  const delOpinion = new Opinion(undefined, explanationId, siteId);
  function setUserId(user, success) {
    delOpinion.setUserId(user.id);
    opinion.setUserId(user.id);
    success();
  }
  new context.callbackTree(auth, 'submittingOpinion', req, next)
    .fail(fail)
    .success(setUserId, 'settingUser')
    .success('settingUser', crud.delete, 'deletingOpinion', delOpinion)
    .success('deletingOpinion', crud.insert, 'insertingOpinion', opinion)
    .success('insertingOpinion', success)
    .fail('insertingOpinion', fail)
    .execute();
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
      user.setId(Number.parseInt(idsOemail));
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
    const context = Context.fromReq(req);
    const explanationId = Number.parseInt(explId);
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
    console.log('checkDebugger', context.dg.isDebugging())
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


        const secret = createSecret();
        const userUpdate = new PendingUserUpdate(secret, user.username, user.getEmail(), {id: user.id});
        console.log('email:', user.getEmail() === undefined, user.getEmail());

        function validateUpdatingLoggedInUser(authUser, success, fail) {
          function emailAndUsernameUnique(results) {
            if (results.length === 0) success(); else fail();
          }

          if (authUser.id !== user.id) {
            fail(new UnAuthorized());
          } if (authUser.getEmail() !== req.body.originalEmail) {
            fail(new UnAuthorized('Wrong original email'));
          } else {
            const usernameAndEmail = new User(req.body.user);
            usernameAndEmail.setEmail(user.getEmail() || undefined);
            usernameAndEmail.setUsername(user.username || undefined);
            crud.select(usernameAndEmail, emailAndUsernameUnique, fail, true);
          }
        }
        console.log(userUpdate);
        context.callbackTree(auth, 'requestUpdate', req, next)
          .success(validateUpdatingLoggedInUser, 'validating')
          .fail(returnError(next))
          .success('validating', crud.selectOne, 'checkingForUniqueUsername', )
          .success('validating', crud.insert, 'insertingUpdate', userUpdate)
          .fail('validating', returnError(next), 'insertingUpdateFailed',)
          .success('insertingUpdate', email.sendUpdateUserEmail, 'sendEmail', user, secret)
          .fail('insertingUpdate', returnError(next), 'validationFailed',)
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
          .success('updating', returnQuery(res))
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

    app.get(prefix + EPNTS.credential.activate(), function (req, res, next) {
      const context = Context.fromReq(req);
      const cred =  new Credential();
      cred.setActivationSecret(req.params.activationSecret);
      cred.setUserId(Number.parseInt(req.params.userId));

      function activate(credential) {
        credential.setActivationSecret(null);
        crud.update(credential, returnVal(res, 'success'), returnError(next));
      };

      context.callbackTree(crud.selectOne, 'selectCred', cred)
        .success(activate, 'settingIp')
        .fail(returnError(next, new UnAuthorized()))
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
      console.log(id, secret)
      context.callbackTree(crud.selectOne, 'getCredentialStatus', cred)
      .success(returnStatus)
      .fail(returnError(next, new NotFound('Credential')))
      .execute();
    });

    app.delete(prefix + EPNTS.credential.delete(), function (req, res, next) {
      const context = Context.fromReq(req);
      const credential = new Credential();
      const idOauth = req.params.idOauthorization;
      if (idOauth.match(idStrReg)) {
        credential.setId(Number.parseInt(idOauth));
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
        .fail(returnError(next, new UnAuthorized()))
        .success(crud.delete, 'removeCredential', credential)
        .fail('removeCredential', returnError())
        .success('removeCredential', returnVal(res, 'success'))
        .execute();
    });

  //  ------------------------- Site Api -------------------------  //

  app.post(prefix + EPNTS.site.add(), function (req, res, next) {
    const context = Context.fromReq(req);
    context.callbackTree(auth, 'addSite', req, next)
      .fail(returnError(next, new UnAuthorized()))
      .success(addSite, 'insertSite', req.body.url)
      .fail('insertSite', returnError(next, new DuplacateUniqueValue()))
      .success('insertSite', returnVal(res, 'success'))
      .execute();
  });

  app.post(prefix + EPNTS.site.get(), function (req, res, next) {
    const context = Context.fromReq(req);
    context.callbackTree(crud.selectOne, 'getSite', new Site(req.body.url))
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
    console.log('auth id: ', req.params.authorId)
    const explanation = new Explanation();
    const authorId = Number.parseInt(req.params.authorId);
    explanation.setAuthor(new User(authorId));
    crud.select(explanation, returnQuery(res), returnError(next));
  });

  app.post(prefix + EPNTS.explanation.add(), function (req, res, next) {
    const context = Context.fromReq(req);
    const explanation = new Explanation(req.body.content);
    const idOnly = new Explanation();
    console.log('EXPL:::', explanation);
    console.log('adding', req.body.words, req.body.content);
    function setAuthor(author, success) {explanation.setAuthor(author); success();};
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
        .success('settingAuthor', getWords, 'gettingWords', req.body.words, next)
        .success('gettingWords', setWords, 'settingWords')
        .success('settingWords', setSearchWords, 'settingSearchWords')
        .success('settingSearchWords', crud.insert, 'insertExpl', explanation)
        .success('insertExpl', setId, 'settingId', '$cbtArg.explId = $cbtArg[0].insertId')
        .fail('insertExpl', returnError(next))
        .success('settingId', addExplToSite, 'addingToSite', '$cbtArg.explId', req.body.siteUrl, next)
        .success('addingToSite', crud.selectOne, 'gettingExplss', idOnly)
        .fail('addingToSite', returnError(next))
        .success('gettingExplss', returnQuery(res), 'returnin')
        // .fail('gettingExplss', new Error('wtf'), 'retWtf')
        .fail('gettingExplss', returnError(next), 'retErr')
        .execute();
    } catch (e) {
      console.log('targ err', e)
    }
  });

  app.put(prefix + EPNTS.explanation.update(), function (req, res, next) {
    const context = Context.fromReq(req);
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
    context.callbackTree(auth, 'updateExpl', req, next)
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
    const context = Context.fromReq(req);
    context.callbackTree(auth, 'addSiteExplApi', req, next)
      .success(addExplToSite, 'adding', req.params.explanationId, req.body.siteUrl, next)
      .success('adding', returnVal(res), 'returning')
      .execute();
    });

    app.post(prefix + EPNTS.siteExplanation.get(), function (req, res, next) {
      const context = Context.fromReq(req);
      const siteUrl = req.body.siteUrl;
      let siteId;
      function getExplanations(site, success, fail) {
        siteId = site.id;
        console.log('aaaargs:', arguments);
        crud.select(new SiteExplanation(site.id, undefined), success, fail);
      }

      function createExplList(results, success) {
        const list = {};
        results.map((siteExpl) => {
          const words = cleanStr(siteExpl.explanation.searchWords);
          siteExpl.explanation.likes = siteExpl.likes;
          siteExpl.explanation.dislikes = siteExpl.dislikes;
          if (list[words] === undefined) { list[words] = []; }
          list[words].push(siteExpl.explanation);
        });
        success({siteId, list});
      }
      context.callbackTree(getSite, 'gettingSiteExpls', siteUrl, next)
        .fail(returnVal(req, []))
        .success(getExplanations, 'gettingExplanations')
        .success('gettingExplanations', createExplList, 'creatingLists')
        .fail('gettingExplanations', returnError(next))
        .success('creatingLists', returnQuery(res))
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
