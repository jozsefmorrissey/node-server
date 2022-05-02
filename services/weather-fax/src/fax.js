
const apiKey = shell.exec('pst value talnyx apiKey').stdout.trim();
console.log(apiKey);
const faxSvcActive = global.ENV === 'prod';

function sendFax(fromNumber, toNumber, pdfUrl) {
  // TODO: connectionId ????
  if (faxSvcActive) {
    shell.exec(`curl -X POST https://api.telnyx.com/v2/faxes \
      --data-urlencode "media_url=${pdfUrl}" \
      --data-urlencode "connection_id=1878532170411149172" \
      --data-urlencode "to=${toNumber}" \
      --data-urlencode "from=${fromNumber}" \
      --header "Authorization: Bearer $${apiKey}"`)
  } else {
    console.log(`sending fax: ${fromNumber} => ${toNumber} : ${pdfUrl}`);
  }
}
