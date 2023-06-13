
const shell = require('shelljs');
require('./../../public/js/utils/utils.js')
const $t = require('../../public/js/utils/$t');
$t.loadFunctions(require('./generated/html-templates'));

const DrawerBox = require('./src/objects/lookup/drawer-box');

const templates = {
  index: new $t('index'),
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

const getIndex = (main, header, footer) => {
  return templates.index.render({main, header, footer});
}

function endpoints(app, prefix) {
  const keys = Object.keys(templates);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    app.get(prefix + `/${key}`, function (req, res, next) {
      res.setHeader('Content-Type', 'text/html');
      const temp = templates[key];
      const scope = getScope(key);
      res.send(getIndex(temp.render(scope)));
    });
  }
}


exports.endpoints = endpoints;
