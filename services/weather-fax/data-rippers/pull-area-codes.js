//https://www.allareacodes.com/area_code_listings_by_state.htm
function pullAreaCodes() {
  const json = {};
  Array.from(document.getElementsByTagName('a')).forEach((a) => {
    if (a.innerText.trim().match(/^[0-9]{3}$/)) {
      json[a.innerText.trim()] = '';
    }
  });
  console.log(JSON.stringify(json, null, 2));
}
