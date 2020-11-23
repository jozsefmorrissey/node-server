
const fs = require('fs');
const shell = require('shelljs');

const configs = {};

function loadConfig(filename) {
  console.log('fname:', filename)
  function save(err, contents) {
    let configLoc = configs;
    const match = filename.match(/^.*?\/furniture\/(.*)([^\/]*)\.json$/)
    console.log('filename:', filename, match);
    let path = match[1].split('/');
    path.forEach((step) =>{
        if (configLoc[step] === undefined) configLoc[step] = {};
        configLoc = configLoc[step];
    });
    configLoc[match[2]] = JSON.parse(contents);
    console.log(JSON.stringify(configs, null, 2));
  }

  fs.readFile(filename, 'utf8', save);
}

shell.exec("find './services/furniture-calculator/furniture' -name '*.json'")
  .stdout.trim().split('\n').map((filename) => loadConfig(filename));

function endpoints(app, prefix) {
  app.get(prefix + '/configs', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(configs);
  });
}

exports.endpoints = endpoints;
