
const DebugGuiClient = require('../../debug-gui/public/js/debug-gui-client');

const EPNTS = require('./EPNTS');
const debugGuiUrl = EPNTS.getHost().replace('weather-fax', 'debug-gui');
const dg = new DebugGuiClient({
  id: `jozsef-node-server-${global.ENV}`,
  host: debugGuiUrl,
  debug: global.debug}, 'weather-fax');

module.exports = dg;
