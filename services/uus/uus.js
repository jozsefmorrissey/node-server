var oauthserver = require('oauth2-server');

const DebugGuiClient = require('../debug-gui/public/js/debug-gui-client.js').DebugGuiClient;
const dg = DebugGuiClient.node(process.argv);

dg.log('hello dgs');
// dg.exception('my.group', new Error('hard error'));
// dg.exception('my.group', new Error('soft error'), true);

// console.log(JSON.hf.parseCookie('key1=value1;key2=value1;key3=value=anothervalue=five'));

function logException(group) {
  return function (exception) {
    dg.exception(group, exception);
  }
}

function getClient() {
  return '123-123-321';
}

function getScope() {
  return 'fakeScope';
}

function getExpiresAt() {
  return new Date();
}

function getRefreshExpiresAt() {
  return new Date();
}

function getRedirectUri() {
  return 'https://www.gooogle.com';
}

//-------------------start model funcs ------------------//

// gives access
function generateAccessToken(client, user, scope) {
  return 'client' + 'user' + 'scope';
}

// one time code used to request an accessToken
function generateAuthorizationCode(client, user, scope) {
  return 'client' + 'user' + 'scope';
}

// allowes clients to get another access token without userpassword
function generateRefreshToken(client, user, scope) {
  return 'client' + 'user' + 'scope';
}

function getAccessToken(token) {
  const accessToken = getAccessToken();
  const accessTokenExpiresAt = getExpiresAt();
  const client = getClient();
  const scope = getScope();
  const user = getUser();
  return { accessToken, accessTokenExpiresAt, client, scope, user };
}

function getAuthCode() {
  const client = getClient();
  const expiresAt = getExpiresAt();
  const redirectUri = getRedirectUri();
  const user = getUser();
  return {client, expiresAt, redirectUri, user};
}

function getClient(clientId, clientSecret) {
  const redirectUris = getRedirectUris();
  const grants = getGrants();
  const grantTypeAllowed = true;
  if (!grantTypeAllowed) {
    return false;
  }
  return {redirectUris, grants};
}

function getRefreshToken(token) {
  const refreshToken = generateRefreshToken();
  const client = getClient();
  const refreshTokenExpiresAt = getRefreshExpiresAt();
  const scope = getScope();
  const user = getUser();
  return { refreshToken, client, refreshTokenExpiresAt, scope, user};
}

function getUser() {
  return { id: '123-321-123', name: 'bob'};
}

function getUserFromClient() {
  return { id: '123-321-123', name: 'bob'};
}

function revokeAuthorizationCode(code) {
  return true;
}

function revokeToken(code) {
  return true;
}

function saveToken(token, client, user) {
  const accessToken = getAccessToken();
  const accessTokenExpiresAt = getExpiresAt();
  const client = getClient();
  const refreshToken = getRefreshToken();
  const refreshTokenExpiresAt = getRefreshExpiresAt();
  const user = getUser();
  return {accessToken, accessTokenExpiresAt, client, refreshToken, refreshTokenExpiresAt, user};
}

function saveAuthorizationCode() {
  return getAuthCode();
}

function validateScope(user, client, scope) {
  let validScope = true;
  return validScope;
}


function endpoints(app, prefix) {
  try {
    app.oauth = new oauthserver({
      model: {generateAccessToken, generateAuthorizationCode, generateRefreshToken,
      getAccessToken, getAuthCode, getClient, getRefreshToken, getUser,
      getUserFromClient, revokeAuthorizationCode, revokeToken, saveToken,
      saveAuthorizationCode, validateScope},
      grants: ['password', 'refresh_token'],
      debug: logException
    });

    // app.all(prefix + '/oauth/token', app.oauth.token());

    app.get(prefix + '/', app.oauth.authorize, function (req, res) {
      console.log(req.headers);
      console.log(req.cookies);
      res.send('Secret area');
    });
  } catch (e) {
    console.log(e);
  }
}


exports.endpoints = endpoints;
