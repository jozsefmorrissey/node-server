
require('../../public/js/utils/parse-arguments');
const shell = require('shelljs');

const adminPassword = shell.exec('pst value weather-fax admin-password').stdout.trim();
let adminUrl;
if (global.ENV === 'local') {
  adminUrl = require('./src/EPNTS').admin.home() + '?adminPassword=$(pst value weather-fax admin-password)';
} else {
  adminUrl = require('./src/EPNTS').admin.home() + '?adminPassword=$(pst remote weather-fax -key admin-password)';
}

const cmd = `sudo scriptcmd -cmd weater-fax-admin-${global.ENV} -script 'xdg-open ${adminUrl}' -o`;
shell.exec(cmd);
