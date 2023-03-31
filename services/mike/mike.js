
const shell = require('shelljs');
require('./../../public/js/utils/utils.js')
const $t = require('../../public/js/utils/$t');
$t.loadFunctions(require('./generated/html-templates'));

const DrawerBox = require('./src/objects/lookup/drawer-box');

const templates = {
  report: new $t('report'),
  reports: new $t('reports'),
  configure: new $t('configure')
};

const getScope = (key) => {
  switch (key) {
    case 'report': return {name: 'report'}
    case 'reports': return {name: 'reports'}
    case 'configure': return {name: 'configure'}
    default: return {};
  }
}

function endpoints(app, prefix) {
  const keys = Object.keys(templates);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    console.log(key, prefix + `/${key}`);
    app.get(prefix + `/${key}`, function (req, res, next) {
      console.log(key);
      res.setHeader('Content-Type', 'text/html');
      const temp = templates[key];
      console.log(temp);
      const scope = getScope(key);
      console.log(key);
      res.send(temp.render(scope));
    });
  }
}


exports.endpoints = endpoints;
