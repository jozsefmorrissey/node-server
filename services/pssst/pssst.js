var shell = require('shelljs')

function validate() {
  for(var i = 0; i < arguments.length; ++i)
     if (arguments[i].match('[\']'))
      throw 'Ah Ah Ah you shouldn\'t have non-alphanumberic characters';
}

function clean (str) {
  return str.replace('\'', '\\\'').trim();
}

function exicuteCmd(group, token, cmd) {
  cmd = `pst validateToken ${group} ${token} && ${cmd}`;
  return shell.exec(cmd, {silent: true});
}
const tokenValCmd = ''

function endpoints(app, prefix) {
  app.post(prefix + '/get', function(req, res){
    const group = clean(req.body.group);
    const pi = clean(req.body.id);
    const token = clean(req.body.token);
    const cmd = 'pst value \'' + group + '\' \'' + pi + '\'';
    const password = exicuteCmd(group, token, cmd);
    res.send(password.replace('\n', ''));
  });

  app.post(prefix + '/update', function(req, res){
    const group = clean(req.body.group);
    const pi = clean(req.body.id);
    const token = clean(req.body.token);
    var value = req.body.value;
    value = value ? value.trim() : '';
    validate(group, pi, token);
    const cmd = 'pst update \'' + group + '\' \'' + pi + '\' \'' + value + '\'';
    const password = exicuteCmd(group, token, cmd);
    res.send(password.replace('\n', ''));
  });

  app.post(prefix + '/update/all', function(req, res){
    const group = clean(req.body.group);
    const token = clean(req.body.token);
    var keyValues = req.body.keyValues;
    validate(group, token);
    var keys = Object.keys(keyValues);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const cmd = 'pst update \'' + group + '\' \'' + key + '\' \'' + keyValues[key] + '\'';
      exicuteCmd(group, token, cmd);
    }
    res.send('success');
  });

  app.post(prefix + '/remove', function(req, res){
    const group = clean(req.body.group);
    const pi = clean(req.body.id);
    const token = clean(req.body.token);
    validate(group, pi, token);
    const cmd = 'pst rm \'' + group + '\' \'' + pi + '\'';
    const password = exicuteCmd(group, token, cmd);
    res.send(password.replace('\n', ''));
  });

  app.post(prefix + '/keys', function(req, res){
    const group = clean(req.body.group);
    const token = clean(req.body.token);
    validate(group, token);
    const cmd = 'pst getKeys \'' + group + '\'';
    const keys = exicuteCmd(group, token, cmd);
    res.send(keys.replace(/\n/g, '=='));
  });

  app.get(prefix + '/client', function (req, res) {
    const host = clean(req.query.host);
    const group = clean(req.body.group);
    const token = clean(req.body.token);

    exicuteCmd(group, token, 'echo success');
    const script = `\n\t<script type='text/javascript' src='${host}/pssst/js/pssst-client.js'></script>\n\t`;
    const html = `<html><head>${script}</head><body><pssst></pssst></body></html>`;
    res.send(html);
  });

  app.get(prefix + '/get/json', function (req, res) {
    const group = clean(req.body.group);
    const token = clean(req.body.token);

    const cmd = `pst key-values -group '${group}' | pst to-json`;
    const json = JSON.parse(exicuteCmd(group, token, cmd));
    res.setHeader('Content-Type', 'application/json');
    res.send(json);
  });

  app.get(prefix + '/get/key-values', function (req, res) {
    const group = clean(req.body.group);
    const token = clean(req.body.token);
    validate(token, group);

    const cmd = `pst key-values -group '${group}'`;
    const props = exicuteCmd(group, token, cmd);
    res.setHeader('Content-Type', 'text/plain');
    res.send(props);
  });

  app.post(prefix + '/client', function (req, res) {
    const host = clean(req.body.host);
    const group = clean(req.body.group);
    const token = clean(req.body.token);

    const cmd = 'pst key-values | pst to-json';
    const json = exicuteCmd(group, token, cmd);
    const script = `\n\t<script type='text/javascript' src='${host}/pssst/js/pssst-client.js'></script>\n\t`;
    const html = `<html><head>${script}</head><body><pssst>${json}</pssst></body></html>`;
    res.send(html);
  });

  // app.get(prefix + '/keywords', function (req, res) {
  //   let keywords = shell.exec('find ./services' + prefix + '/public/keywords/ -type f | sed \'s/.*\\/\\(.*\\).html/\\\'\\1\\\',/\'');
  //   keywords = keywords.replace(/\$/g, '/');
  //   keywords = keywords.replace(/\|/g, '.');
  //   keywords = '[' + keywords.substring(0, keywords.length - 2) + ']'
  //   res.send(keywords);
  // });
  //
  // app.get(prefix + '/dockerCommand', function (req, res) {
  //   const cmd = 'grep -oP 'docker.*' ./services' + prefix + '/run.sh';
  //   const dockerCommand = shell.exec(cmd);
  //   res.send(dockerCommand);
  // });
  //
  // app.get(prefix + '/token', function (req, res) {
  //   res.send(confToken);
  // });
}

exports.endpoints = endpoints;
