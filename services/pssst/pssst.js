var shell = require('shelljs')

function validate() {
  for(var i = 0; i < arguments.length; ++i)
     if (arguments[i].match('[\']'))
      throw 'Ah Ah Ah you shouldn\'t have non-alphanumberic characters';
}

function clean (str) {
  if (str === undefined) {
    return "";
  }
  return str.replace('\'', '\\\'').trim();
}

function exicuteCmd(group, token, pstPin, cmd) {
  if (token != null) {
    cmd = `pst validateToken '${group}' '${token}' '${pstPin}' && ${cmd}`;
    console.log(cmd);
    return shell.exec(cmd, {silent: true});
  }
}
const tokenValCmd = ''

function get(group, token, pstPin, pi) {
  const cmd = 'pst value \'' + group + '\' \'' + pi + '\'';
  console.log(`${group}-${token}-${pi}`)
  return exicuteCmd(group, token, pstPin, cmd).replace('\n', '');
}

function endpoints(app, prefix) {
  app.post(prefix + '/get', function(req, res){
    const group = clean(req.body.group);
    const pi = clean(req.body.id);
    const token = clean(req.body.token);
    const pstPin = clean(req.body.pstPin);
    res.send(get(group, token, pstPin, pi));
  });

  app.post(prefix + '/validate', function(req, res){
    console.log(req.body);
    const group = clean(req.body.group);
    const token = clean(req.body.token);
    const pstPin = clean(req.body.pstPin);
    const cmd = `pst validateToken '${group}' '${token}' '${pstPin}'`;
    console.log(cmd);
    const validated = "" === shell.exec(cmd, {silent: true}).trim();
    console.log(validated)
    if (validated) {
      res.send(validated);
    } else {
      throw new Error("Your not supposed to be here...");
    }
  });

  app.post(prefix + '/update', function(req, res){
    const group = clean(req.body.group);
    const pi = clean(req.body.id);
    let token = clean(req.body.token);
    let pstPin = clean(req.body.pstPin);
    var value = req.body.value;
    value = value ? value.trim() : '';
    const cmd = 'pst update \'' + group + '\' \'' + pi + '\' \'' + value + '\'';
    const output = exicuteCmd(group, token, pstPin, cmd).replace('\n', '');
    if (pi === 'token') {
      token = output;
    } else if (pi === 'pst-pin') {
      pstPin = output;
    }
    res.send(get(group, token, pstPin, pi));
  });

  app.post(prefix + '/admin/update', function(req, res){
    const group = clean(req.body.group);
    const pi = clean(req.body.id);
    let token = clean(req.body.token);
    let pstPin = clean(req.body.pstPin);
    var value = req.body.value;
    value = value ? value.trim() : '';
    const cmd = 'pst update \'' + group + '\' \'' + pi + '\' \'' + value + '\'';
    const output = exicuteCmd(group, token, pstPin, cmd).replace('\n', '');
    res.send(get(group, token, pstPin, pi));
  });

  app.post(prefix + '/update/all', function(req, res){
    const group = clean(req.body.group);
    const token = clean(req.body.token);
    const pstPin = clean(req.body.pstPin);
    var keyValues = req.body.keyValues;
    var keys = Object.keys(keyValues);
    for (let index = 0; index < keys.length; index += 1) {
      const key = clean(keys[index]);
      const cmd = 'pst update \'' + group + '\' \'' + key + '\' \'' + keyValues[key] + '\'';
      exicuteCmd(group, token, pstPin, cmd);
    }
    res.send('success');
  });

  app.post(prefix + '/remove', function(req, res){
    const group = clean(req.body.group);
    const pi = clean(req.body.id);
    const token = clean(req.body.token);
    const pstPin = clean(req.body.pstPin);
    const cmd = 'pst rm \'' + group + '\' \'' + pi + '\'';
    const password = exicuteCmd(group, token, pstPin, cmd);
    res.send(password.replace('\n', ''));
  });

  app.post(prefix + '/keys', function(req, res){
    const group = clean(req.body.group);
    const token = clean(req.body.token);
    const pstPin = clean(req.body.pstPin);
    const cmd = 'pst key-array \'' + group + '\'';
    const keys = JSON.parse(exicuteCmd(group, token, pstPin, cmd));
    res.setHeader('Content-Type', 'application/json');
    console.log(`${group}-${token}\n${cmd}\n${keys}`)
    res.send(keys);
  });

  app.get(prefix + '/client', function (req, res) {
    const host = clean(req.query.host);
    const group = clean(req.query.group);
    const token = clean(req.query.token);

    exicuteCmd(group, token, 'echo success');
    const script = `\n\t<script type='text/javascript' src='${host}/pssst/js/pssst-client.js'></script>\n\t`;
    const html = `<html><head>${script}</head><body><pssst></pssst></body></html>`;
    res.send(userHtml(host, group, token));
  });

  app.get(prefix + '/get/json', function (req, res) {
    const group = clean(req.query.group);
    const token = clean(req.query.token);
    const pstPin = clean(req.body.pstPin);
    console.log(group + "->" + token);

    const cmd = `pst key-values -group '${group}' | pst to-json`;
    const jsonStr = exicuteCmd(group, token, pstPin, cmd);
    console.log(jsonStr);
    const json = JSON.parse(jsonStr);
    res.setHeader('Content-Type', 'application/json');
    res.send(json);
  });

  app.get(prefix + '/get/key-values', function (req, res) {
    const group = clean(req.query.group);
    const token = clean(req.query.token);
    const pstPin = clean(req.body.pstPin);

    const cmd = `pst key-values -group '${group}'`;
    const props = exicuteCmd(group, token, pstPin, cmd);
    res.setHeader('Content-Type', 'text/plain');
    res.send(props);
  });

  app.post(prefix + '/get/groups', function (req, res) {
    const group = clean(req.query.group);
    const token = clean(req.query.token);
    const pstPin = clean(req.body.pstPin);

    const cmd = `pst key-array infoMap`;
    const groups = JSON.parse(shell.exec(cmd, {silent: true}));
    res.setHeader('Content-Type', 'application/json');
    res.send(groups);
  });


  app.post(prefix + '/client', function (req, res) {
    const host = clean(req.query.host);
    const group = clean(req.query.group);
    const token = clean(req.query.token);
    const pstPin = clean(req.body.pstPin);

    const cmd = 'pst key-values | pst to-json';
    const json = exicuteCmd(group, token, pstPin, cmd);
    res.send(userHtml(json));
  });

  function userHtml(host, group, token, json) {
    const cmd = `pst requires-pin '${group}'`;
    const needsPin = 'yes' == shell.exec(cmd, {silent: true}).trim();
    const pinflag = `<pst-pin id="pst-pin-flag" value="${needsPin}"></pst-pin>`;
    const script = `\n\t<script type='text/javascript' src='${host}/pssst/js/pssst-client.js'></script>\n\t`;
    const bootstrap = `<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
        <link rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.47/css/bootstrap-datetimepicker.min.css">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>`;
    const css = `<link rel="stylesheet" href="${host}/pssst/css/pssst-client.css">`;
    return `<html><head>${bootstrap}${script}${css}</head><body>${pinflag}<pssst>${json}</pssst></body></html>`;
  }
}

exports.endpoints = endpoints;
