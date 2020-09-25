function VideoDirectoryClient() {
  const vdId = 'info-directory-utf';
  let token;
  let pstPin;

  function pinValid() {
    document.getElementById('main-body').style.display = 'block';
    document.getElementById('pin-prompt').style.display = 'none';
  }

  function query(name) {
    var reg = new RegExp(".*(\\?|\\&)" + name + "=(.*?)(\\&|$).*");
    var value = window.location.search.replace(reg, '$2');
    return value.indexOf('?') == 0 ? undefined : value;
  }

  function validatePin() {
    var inputElem = document.getElementById('pst-pin-input');
    pstPin = inputElem ? inputElem.value : '';
    var group = 'info-directory';
    token = query('token');
    if (pstPin) {
      Pssst.validatePin(group, token, pstPin, pinValid, askForPin);
    }
  }

  function askForPin(error) {
    document.getElementById('main-body').style.display = 'none';
    document.getElementById('pin-prompt').innerHTML =
    Pssst.getPinPrompt('vdc.validatePin()');
    if (error != undefined) {
      document.getElementById('pin-error').innerHTML = error.statusText;
    }
  }

  function addNewTopic(e) {
    const value = e.target.value;
    window.location.href = '/info-directory/request/' + value;
  }

  const reqTopicsId = 'request-topics';
  function onLoad() {
    UTF.searchAllOnEnter(reqTopicsId, addNewTopic);
    document.getElementById(reqTopicsId)
      .querySelectorAll('label')[0].innerHTML = 'Add/Search for Topic:';
    if (query('token') && window.location.pathname === '/info-directory/edit') {
      UTF.setEdit(vdId, true);
      askForPin();
    }
  }

  function save() {
    var body = {
      token,
      pstPin,
      vidDir: UTF.getData(vdId),
    }
    var xhr = new XMLHttpRequest();
    var url = '/info-directory/update';
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(body));
  }

  window.addEventListener('load', onLoad);

  window.location.href.match(/^.*\/edit\?.*$/) && validatePin();

  return {validatePin, save};
}

var script = document.createElement("script");
script.src = '/pssst/js/pssst-client.js';
document.head.appendChild(script);

var vdc = VideoDirectoryClient();
