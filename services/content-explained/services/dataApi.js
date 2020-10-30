const bcrypt = require('bcryptjs');
const Crud = require('./database/mySqlWrapper').Crud;
const { CallbackTree } = require('../services/callbackTree.js');

const { EPNTS } = require('./EPNTS.js');
const { InvalidDataFormat, InvalidType, UnAuthorized, SqlOperationFailed,
        EmailServiceFailure, ShouldNeverHappen, DuplacateUniqueValue,
        NoSiteFound, ExplanationNotFound} =
        require('./exceptions.js');
const { User, Explanation, Site, Opinion, SiteExplanation, Credential,
        DataObject, Ip, UserAgent, Words} =
                require('../services/database/objects');
const { randomString } = require('./tools.js');
const email = require('./email.js');

const crud = new Crud({silent: false, mutex: true});

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


async function buildRequestCredential(req, next) {
  const cred = new Credential();
  const userAgentVal = req.headers['user-agent'];

  function setIp(ip, success) {console.log('setIP'); cred.setIp(ip); success();};
  function setUserAgent (ua, success) {console.log('setUA'); cred.setUserAgent(ua); success();};

  const hold = await new CallbackTree(getIp, 'tarGetIp', req.ip, next)
    .success(setIp, 'settingIp')
    .success('settingIp', getUserAgent, 'getUserAgent', userAgentVal, next)
    .success('getUserAgent', setUserAgent, 'settingUserAgent', '$cbtArg[0]')
    .success('settingUserAgent', ()=>{}, undefined, cred).terminate()
    .execute();

  console.log('returned cred: ', cred);
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
async function auth(req, next, success, fail) {
  const val = req.headers['authorization'];
  console.log('auth str', val)
  const match = val === undefined ? null : val.match(authReg);
  if (match === null) {
    fail(new UnAuthorized());
    return;
  }

  const type = match[1];
  const id = Number.parseInt(match[2]);
  const secret = match[3];

  function validateAuthorization(user) {
    const credentials = user.getCredentials();
    console.log("Creds!!!:", credentials);
    for (let index = 0; index < credentials.length; index += 1) {
      const credential = credentials[index];
      const secretEq = credential.secret === secret;
      const userAgentEq = credential.userAgent.value === req.headers['user-agent'];
      const ipEq = credential.ip.value === req.ip;
      const isActive = credential.activationSecret === null;
      if (secretEq && userAgentEq && ipEq && isActive) {
        console.log("failed:", credential)
        success(user);
        return;
      }
    }
    fail(new UnAuthorized());
  }

  switch (type) {
    case 'User':
      const user = new User(id);
      new CallbackTree(crud.selectOne, 'authorizationTree', user)
        .success(validateAuthorization)
        .fail(fail, undefined, new UnAuthorized())
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
    console.log('returning val');
    res.send(value);
  }
}

function returnQuery(res) {
  return function (results) {
    res.setHeader('Content-Type', 'application/json');
    console.log('returning query');
    res.send(results);
  }
}

function returnError(next, error) {
  return function(e) {
    console.log('returning error');
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
  console.log(arguments);
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
        console.log(`username/email: ${username}/${email}\n`, user);
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

  app.get(prefix + EPNTS.site.get(), function (req, res, next) {
    new CallbackTree(crud.selectOne, 'getSite', new Site(req.params.name))
      .fail(returnError(next, new NoSiteFound(req.params.name)))
      .success(returnQuery(res))
      .execute();
  });

  //  ------------------------- Explanation Api -------------------------  //

  app.get(prefix + EPNTS.explanation.get(), function (req, res, next) {
    const explanation = new Explanation(req.body.content);
    function setWords(words, success) {explanation.setWords(words); success();
      console.log(req.params.words, words);
    };
    new CallbackTree(crud.selectOne, 'gettingExplanations', new Words(req.params.words))
      .success(setWords, 'settingWord')
      .fail(returnError(next, new ExplanationNotFound(req.params.words)))
      .success('settingWord', crud.select, 'gettingExpl', explanation)
      .success('gettingExpl', returnQuery(res))
      .execute();
  });

  app.get(prefix + EPNTS.explanation.author(), function (req, res, next) {
    const explanation = new Explanation();
    const authorId = Number.parseInt(req.params.authorId);
    explanation.setAuthor(new User(authorId));
    crud.select(explanation, returnQuery(res), returnError(next));
  });

  app.post(prefix + EPNTS.explanation.add(), function (req, res, next) {
    const explanation = new Explanation(req.body.content);
    function setAuthor(author, success) {explanation.setAuthor(author); success();};
    function setWords(words, success) {explanation.setWords(words); success()
      console.log('print expl!!!', explanation)
    };

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

  //  ------------------------- SiteExplanation Api -------------------------  //



  //  -------------------------  -------------------------  //

  app.get(prefix + "/user/:id", function (req, res, next) {
    const id = Number.parseInt(req.params.id);
    crud.select(new User(id), returnQuery(res, next));
  });

  app.get(prefix + "/site/:id", function (req, res, next) {
    crud.select(new Site(Number.parseInt(req.params.id)), returnQuery(res, next));
  });

  app.post(prefix + "/site/:url", function (req, res, next) {
    crud.insert(new Site(req.params.url), returnQuery(res, next));
  });

  app.get(prefix + "/send", function (req, res, next) {
    res.send("Hi to " + req.device.type + ' running ' + req.headers['user-agent'] + ' at ' + req.ip + " User");
    // email.sendActivationEmail('jozsef.morrissey@gmail.com');
    // email.sendResetSecret('jozsef.morrissey@gmail.com');
    // email.sendActivationEmail('me@jozsefmorrissey.com');
    // email.sendResetSecret('me@jozsefmorrissey.com');
    // res.send('success');
  })
}


exports.endpoints = endpoints;
