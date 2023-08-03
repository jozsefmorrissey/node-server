
const shell = require('shelljs');
const $t = require('../../public/js/utils/$t');
$t.loadFunctions(require('./generated/html-templates'));

const DrawerBox = require('./src/objects/lookup/drawer-box');

const templates = {
  index: new $t('mitch-index'),
  report: new $t('report'),
  reports: new $t('reports'),
  configure: new $t('configure'),
  ancestry: new $t('ancestry'),
  playground: new $t('playground')
};

const getScope = (key) => {
  switch (key) {
    case 'report': return {name: 'report'}
    case 'reports': return {name: 'reports'}
    case 'configure': return {name: 'configure'}
    case 'ancestry': return {name: 'ancestry'}
    case 'playground': return {name: 'playground'}
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
    console.log('mitch pref', prefix)
    app.get(prefix + `/${key}`, function (req, res, next) {
      console.log('ranMitch wtf')
      res.setHeader('Content-Type', 'text/html');
      const temp = templates[key];
      const scope = getScope(key);
      res.send(getIndex(temp.render(scope)));
    });
  }
}


exports.endpoints = endpoints;
