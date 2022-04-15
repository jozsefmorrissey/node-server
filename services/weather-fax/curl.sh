curl -X POST https://api.telnyx.com/v2/faxes \
--data-urlencode "media_url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" \
--data-urlencode "connection_id=1878532170411149172" \
--data-urlencode "to=+12172070090" \
--data-urlencode "from=+12172070090" \
--header "Authorization: Bearer KEY018024BD18000EA77D5813B71164FC60_sGUeav2pYRm2Fo2z1Tefsi"


curl --location -g --request GET \
'https://api.telnyx.com/v2/detail_records?filter[record_type]=messaging&filter[date_range]=today' \
--header 'Authorization: Bearer KEY018024BD18000EA77D5813B71164FC60_sGUeav2pYRm2Fo2z1Tefsi'



https://api.openweathermap.org/data/2.5/weather?lat=39&lon=-88&appid=fdaae28868a95fbd0204984b4b59c2d0


https://api.promaptools.com/service/us/zip-lat-lng/get/?zip=${zipcode}&key=17o8dysaCDrgv1c

function estimateZip() {
  let count = 0;
  let total = 0;
  const func = (e) => {
    if (e.innerText.trim().match(/^[0-9]{5}$/)) {
      const number = Number.parseInt(e.innerText);
      console.log(e.innerText)
    }
  }
  Array.from(document.querySelectorAll('tr>td>p')).forEach(func);
}
