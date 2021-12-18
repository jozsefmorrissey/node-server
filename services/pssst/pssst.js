var shell = require('shelljs');
var fs = require('fs');
var cookieParser = require('cookie-parser');
const DebugGuiClient = require('../debug-gui/public/js/debug-gui-client.js').DebugGuiClient;

var failedAttempts = {};

function validate() {
  for(var i = 0; i < arguments.length; ++i)
     if (arguments[i].match('[\']'))
      throw 'Ah Ah Ah you shouldn\'t have non-alphanumberic characters';
}

function clean (value) {
  if ((typeof value) !== 'string') {
    return value;
  }
  return value.replace('\'', '\\\'').trim();
}

function cleanObj(obj) {
  const keys = Object.keys(obj);
  const cleanObj = {};
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    console.log('key:', key)
    cleanObj[key] = clean(obj[key]);
  }
  return cleanObj;
}

function tokenPinErrorStr(token, pstPin) {
  return `token=>${token}|pstPin=>${pstPin}`;
}

const LOCKED_OUT = (d) => `You have exceeded the number of attempts. Sorry your account is locked for ${Math.ceil((d.getTime() - new Date().getTime()) / (1000*60))} minutes`;
function lockout(group, errorCode, errorStr) {
  let count = failedAttempts[group] ? failedAttempts[group].count : undefined;
  if (count !== undefined && count <= 0){
      if (failedAttempts[group].lockoutExpirationDate < new Date()) {
        failedAttempts[group] = undefined;
        count = undefined;
      } else {
        throw new Error(LOCKED_OUT(failedAttempts[group].lockoutExpirationDate));
      }
  }
  if (errorCode !== undefined) {
    if (errorCode !== 0) {
      if (count === undefined) {
        failedAttempts[group] = {count: 6, attempts: []};
      }
      const failures = failedAttempts[group];
      if (errorStr === undefined || failures.attempts.indexOf(errorStr) === -1) {
        failures.count -= 1;
        count = failures.count;
        const lockoutExpirationDate = new Date();
        lockoutExpirationDate.setMinutes(lockoutExpirationDate.getMinutes() + 5);
        failures.lockoutExpirationDate = lockoutExpirationDate;
        failures.attempts.push(errorStr);
      }
      if (count > 0) {
        throw new Error(`Your not supposed to be here... You have ${count} tries left`);
      } else {
        throw new Error(LOCKED_OUT(failedAttempts[group].lockoutExpirationDate));
      }
    }
    count = undefined;
  }
}

function bashDebugStr(req) {
  const dgCookieStr = req.cookies ? req.cookies.DebugGui : '';
  cookieObj = DebugGuiClient.getCookieFromValue(dgCookieStr);
  if (cookieObj.debug || cookieObj.debug === "true") {
    let id = cookieObj.id;
    let host = cookieObj.host || cookieObj.httpsHost || cookieObj.httpHost;
    shell.exec(`debuggui config -id "${id}" -host "${host}"`);
    return ` -d error -dg-id "${id}"`
  }
  return "";
}

function exicuteCmd(cmd, req) {
  const clBody = cleanObj(req.body);

  if (clBody.token != null) {
    let validateCmd = `pst validateToken '${clBody.group}' '${clBody.token}' '${clBody.pstPin}'`;
    const debugStr = bashDebugStr(req);
    validateCmd += debugStr;
    if (cmd != undefined) {
      validateCmd += ` && ${cmd}${debugStr}`;
    }

    const returnValue = shell.exec(validateCmd, {silent: false});
    lockout(clBody.group, returnValue.code, tokenPinErrorStr(clBody.token, clBody.pstPin))
    return returnValue;
  }
}
const tokenValCmd = ''

function get(group, token, pstPin, pi, req) {
  const cmd = 'pst value \'' + group + '\' \'' + pi + '\'';
  return exicuteCmd(cmd, req).replace('\n', '');
}


function debugValues(req, group, data, description) {
  description = description || {};
  debugGui = DebugGuiClient.express(req, 'pssst.js');
  if (debugGui.isDebugging()) {
    const keys = Object.keys(data);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      let desc = description[key];
      desc = desc ? ` (${desc})` : '';
      debugGui.value(group, `${key}${desc}`, data[key]);
    }
  }
}

function endpoints(app, prefix) {
  app.post(prefix + '/get', function(req, res){
  debugValues(req, '/update', req.body, {group: 'required', id: 'required', pstPin: 'required if set', token: 'required'});
  const clBody = cleanObj(req.body);
  res.send(get(clBody.group, clBody.token, clBody.pstPin, clBody.id, req));
});

function getJson(req, res) {
  debugValues(req, '/get/json', req.body, {group: 'required', pstPin: 'required if set', token: 'required'});
  const clBody = cleanObj(req.body);
  const cmd = `pst to-json '${clBody.group}'`;
  const jsonStr = exicuteCmd(cmd, req);
  const json = JSON.parse(jsonStr);
  res.setHeader('Content-Type', 'application/json');
  res.send(json);
}

function mixUp(array) {
  let validIndecies = Array.from(Array(array.length), (d, i) => i);
  let mixed = '';
  for (let index = 0; index < array.length; index += 1) {
    const index = Math.floor(Math.random() * validIndecies.length);
    mixed += array[validIndecies[index]];
    validIndecies.splice(index, 1);
  }
  return mixed;
}

function randPassword(len, numberLen, capLetLen, specCharLen, specChars) {
  Array.from(Array(10), (d, i) => i);
  let parts = [];
  for (let index = 0; index < numberLen; index += 1)
    parts.push(Math.floor(Math.random() * 10));
  for (let index = 0; index < specCharLen; index += 1)
    parts.push(specChars.charAt(Math.floor(Math.random() * specChars.length)));
  const wordLength = len - numberLen - specCharLen;
  const cmd = `grep -oP "^[a-z]{${wordLength}}$" ./public/json/word-list.json`;
  const wordList = shell.exec(cmd, {silent: true}).split('\n');
  let word = wordList[Math.floor(Math.random() * wordList.length)];
  for (let index = 0; index < capLetLen; index += 1)
    word = word.substr(0, index) + word.substr(index, 1).toUpperCase() + word.substr(index + 1);
  parts.push(word);
  return mixUp(parts);
}
  app.post(prefix + '/validate/value', function(req, res, next) {
    const clBody = cleanObj(req.body);
    const cmd = `pst validateValue -group '${clBody.group}' -key '${clBody.key}' -value '${clBody.value}'`;
    console.log(cmd)
    const validated = shell.exec(cmd, {silent: false});
    try {
      lockout(clBody.group, validated.code, `${clBody.key}=>${clBody.value}`);
      res.send('success');
    } catch (e) {
      res.statusMessage = e + "";
      res.status(416);
      res.send(e.msg);
    }
  });

  app.post(prefix + '/validate', function(req, res, next){
    debugValues(req, '/validate', req.body, {group: 'required', pstPin: 'required if set', token: 'required'});
    const clBody = cleanObj(req.body);
    const cmd = `pst validateToken '${clBody.group}' '${clBody.token}' '${clBody.pstPin}'`;
    console.log(cmd)
    const validated = shell.exec(cmd, {silent: false});
    try {
      lockout(clBody.group, validated.code, tokenPinErrorStr(clBody.token, clBody.pstPin));
      res.send(validated);
    } catch (e) {
      res.statusMessage = e + "";
      res.status(416);
      res.send(e.msg);
    }
  });

  function saveLocation(group, name) {
    return shell.exec('realpath ~', {silent: true}).stdout.trim() +
        `/.opsc/pst/js/${group}/${name}.json`;
  }

  function valueValidated(group, key, value) {
    if (key === 'token' || key === 'pstPin') return new Error('Cannot validate token or pstPin');
    const cmd = `pst validateValue -group '${group}' -key '${key}' -value '${value}'`;
    const output = shell.exec(cmd).replace('\n', '');
    console.log(cmd);
    const validated = shell.exec(cmd, {silent: false});
    console.log('code', validated.code)
    if (validated.code === 0) {
      return true;
    } else {
      return new Error('Value did not match');
    }
  }

  app.get(prefix + '/load/json/:group/:key', function (req, res) {
    const key = req.params.key;
    const group = req.params.group;
    try {
      res.send(JSON.parse(fs.readFileSync(saveLocation(group, key))));
    } catch (e) {
      res.send(undefined);
    }
  });

  app.get(prefix + '/json/save/auth/:group/:key/:value', function (req, res){
    const clBody = cleanObj(req.params);
    const e = valueValidated(clBody.group, clBody.key, clBody.value);
    if (e === true) {
      console.log('truedat');
      res.send('success');
    } else {
      console.log('falsedat');
      res.statusMessage = e + "";
      res.status(416);
      res.send(e.msg);
    }
  });

  app.post(prefix + '/save/json', function (req, res) {
    const clBody = cleanObj(req.body);
    const e = valueValidated(clBody.group, clBody.key, clBody.value);
    if (e === true) {
      const contents = JSON.stringify(clBody.json);
      const fileLocation = saveLocation(clBody.group, clBody.key);

      const dir = fileLocation.replace(/^(.*\/).*$/, '$1');
      shell.mkdir('-p', dir);
      shell.touch(fileLocation);
      fs.writeFileSync(fileLocation, contents);
      res.send('success');
    } else {
      res.statusMessage = e + "";
      res.status(416);
      res.send(e.msg);
    }
  });


  app.post(prefix + '/update', function(req, res){
    const clBody = cleanObj(req.body);
    debugValues(req, '/update', req.body, {group: 'required', id: 'required', value: 'optional', pstPin: 'required if set', token: 'required'});

    const cmd = 'pst update \'' + clBody.group + '\' \'' + clBody.id + '\' \'' + clBody.value + '\'';
    const output = exicuteCmd(cmd, req).replace('\n', '');
    if (clBody.id === 'token') {
      clBody.token = output;
    } else if (clBody.id === 'pst-pin') {
      clBody.pstPin = output;
    }
    res.send(get(clBody.group, clBody.token, clBody.pstPin, clBody.id, req));
  });

  app.post(prefix + '/admin/update', function(req, res){
    debugValues(req, '/admin/update', req.body, {group: 'required', id: 'required', value: 'optional', pstPin: 'required if set', token: 'required'});

    const clBody = cleanObj(req.body);
    const cmd = 'pst update \'' + clBody.group + '\' \'' + clBody.id + '\' \'' + clBody.value + '\'';
    const output = exicuteCmd(cmd, req).replace('\n', '');
    res.send(get(clBody.group, clBody.token, clBody.pstPin, clBody.id, req));
  });

  app.post(prefix + '/update/all', function(req, res){
    debugValues(req, '/update/all', req.body, {group: 'required', keyValues: 'required', pstPin: 'required if set', token: 'required'});
    const clBody = cleanObj(req.body);
    var keyValues = req.body.keyValues;
    var keys = Object.keys(keyValues);
    for (let index = 0; index < keys.length; index += 1) {
      const key = clean(keys[index]);
      const value = clean(keyValues[key]);
      const cmd = 'pst update \'' + clBody.group + '\' \'' + key + '\' \'' + value + '\'';
      exicuteCmd(cmd, req);
    }
    res.send('success');
  });

  app.post(prefix + '/remove', function(req, res){
    debugValues(req, '/remove', req.body, {group: 'required', id: 'required', pstPin: 'required if set', token: 'required'});
    const clBody = cleanObj(req.body);
    const cmd = 'pst rm \'' + clBody.group + '\' \'' + clBody.id + '\'';
    const password = exicuteCmd(cmd, req);
    res.send(password.replace('\n', ''));
  });

  app.post(prefix + '/keys', function(req, res){
    debugValues(req, '/keys', req.body, {group: 'required', pstPin: 'required if set', token: 'required'});
    const clBody = cleanObj(req.body);
    const cmd = 'pst key-array \'' + clBody.group + '\'';
    const keys = JSON.parse(exicuteCmd(cmd, req));
    res.setHeader('Content-Type', 'application/json');
    res.send(keys);
  });

  app.post(prefix + '/get/json', function(req, res){
    getJson(req, res);
  });

  app.get(prefix + '/client', function (req, res) {
    debugValues(req, '/client', req.query, {host: 'required', group: 'required', pstPin: 'required if set', token: 'required'});
    const clQuery = cleanObj(req.query);

    try {
      exicuteCmd(group, token, '', 'echo success');
    } catch (e) {/* this endpoint ignores errors endpoint */}
    res.send(userHtml(clQuery.host, clQuery.group, clQuery.token));
  });

  app.get(prefix + '/get/json', function (req, res) {
    getJson(req, res);
  });

  app.get(prefix + '/get/key-values', function (req, res) {
    debugValues(req, '/get/key-values', req.body, {group: 'required', pstPin: 'required if set', token: 'required'});
    const cmd = `pst key-values -group '${clBody.group}'`;
    const props = exicuteCmd(cmd, req);
    res.setHeader('Content-Type', 'text/plain');
    res.send(props);
  });

  app.post(prefix + '/get/groups', function (req, res) {
    debugValues(req, '/get/groups', req.body, {group: 'required', pstPin: 'required if set', token: 'required'});
    const clBody = cleanObj(req.body);

    const validationCmd = `pst validateToken admin '${clBody.token}' '${clBody.pstPin}'`
    const cmd = `pst key-array infoMap ${bashDebugStr(req)}`;
    const groups = JSON.parse(shell.exec(`${validationCmd} && ${cmd}`, {silent: true}));
    res.setHeader('Content-Type', 'application/json');
    res.send(groups);
  });


  app.post(prefix + '/client', function (req, res) {
    debugValues(req, '/client', req.body, {host: 'required', group: 'required', pstPin: 'required if set', token: 'required'});
    const clBody = cleanObj(req.body);

    const cmd = 'pst to-json';
    const json = exicuteCmd(cmd, req);
    res.send(userHtml(clBody.host, clBody.group, clBody.token, json));
  });

  app.get(prefix + "/random/password/:length/:numberCount/:capitalLetterCount/:specialcharacterCount/:specialCharacters", function (req, res) {
    const length = req.params.length;
    const numberCnt = req.params.numberCount;
    const capitalCnt = req.params.capitalLetterCount;
    const specialCharCnt = req.params.specialcharacterCount;
    const specChars = req.params.specialCharacters;
    res.setHeader('Content-Type', 'text/html');
    const pass = randPassword(length, numberCnt, capitalCnt, specialCharCnt, specChars);
    res.send(`<h1>${pass}</h1>`);
  });


  function userHtml(host, group, token, json) {
    const cmd = `pst requires-pin '${group}'`;
    const needsPin = 'yes' == shell.exec(cmd, {silent: true}).trim();
    const pinflag = `<pst-pin id="pst-pin-flag" value="${needsPin}"></pst-pin>`;
    const script = `\n\t<script type='text/javascript' src='${host}/pssst/js/pssst-client.js'></script>
                    \n\t<script type='text/javascript' src='${host}/debug-gui/js/debug-gui-client.js'></script>`;
    const bootstrap = `<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.47/css/bootstrap-datetimepicker.min.css">
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">`;
    const css = `<link rel="stylesheet" href="${host}/pssst/css/pssst-client.css">`;
    const debugGui = `<debug-gui-data url='${host}/debug-gui/' dg-id='test'></debug-gui-data>`;
    return `<html><head>${bootstrap}${script}${css}</head><body>${pinflag}<pssst>${json}</pssst></body></html>`;
  }
}

exports.endpoints = endpoints;
exports.exicuteCmd = exicuteCmd;
