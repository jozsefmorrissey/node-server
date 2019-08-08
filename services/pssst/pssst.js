var shell = require("shelljs")

function validate() {
  for(var i = 0; i < arguments.length; ++i)
     if (!arguments[i].match('^[a-zA-Z0-9]*$'))
      throw "Ah Ah Ah you shouldn't have non-alphanumberic characters";
}

function endpoints(app, prefix) {
  app.post(prefix + "/get", function(req, res){
    //console.log("DEBUG ", JSON.stringify(req.query))
    const gi = req.body.group.trim();
    const pi = req.body.id.trim();
    const token = req.body.token.trim();
    validate(gi, pi, token);
    const cmd = 'confidentalInfo.sh getWithToken "' + gi + '" "' + pi + '" "' + token + '"';
    const password = shell.exec(cmd, {silent: true});
    res.send(password.replace("\n", ""));
  });


  // app.get(prefix + "/keywords", function (req, res) {
  //   let keywords = shell.exec("find ./services" + prefix + "/public/keywords/ -type f | sed \"s/.*\\/\\(.*\\).html/\\\"\\1\\\",/\"");
  //   keywords = keywords.replace(/\$/g, "/");
  //   keywords = keywords.replace(/\|/g, ".");
  //   keywords = "[" + keywords.substring(0, keywords.length - 2) + "]"
  //   res.send(keywords);
  // });
  //
  // app.get(prefix + "/dockerCommand", function (req, res) {
  //   const cmd = 'grep -oP "docker.*" ./services' + prefix + '/run.sh';
  //   const dockerCommand = shell.exec(cmd);
  //   res.send(dockerCommand);
  // });
  //
  // app.get(prefix + "/token", function (req, res) {
  //   res.send(confToken);
  // });
}

exports.endpoints = endpoints;
