
const shell = require('shelljs');

const dg = require('./debug-gui-interface');
const apiKey = shell.exec('pst value talnyx apiKey').stdout.trim();
const connId = shell.exec('pst value talnyx connId').stdout.trim();
dg.value('fax.apiKey', 'apiKey', apiKey.replace(/^.{10}/, new Array(10).fill('*').join('')));
const faxSvcActive = global.ENV === 'prod';
function sendFax(fromNumber, toNumber, pdfUrl) {
  // TODO: connectionId ????
  console.log(connId, apiKey)
  console.log(`sending fax: ${fromNumber} => ${toNumber} : ${pdfUrl}`);
  if (faxSvcActive) {
    shell.exec(`curl -X POST https://api.telnyx.com/v2/faxes \
      --data-urlencode "media_url=${pdfUrl}" \
      --data-urlencode "connection_id=${connId}" \
      --data-urlencode "to=${toNumber}" \
      --data-urlencode "from=${fromNumber}" \
      --header "Authorization: Bearer ${apiKey}"`)
  } else {
    dg.log(`sending fax: ${fromNumber} => ${toNumber} : ${pdfUrl}`);
  }
}

module.exports = sendFax;
