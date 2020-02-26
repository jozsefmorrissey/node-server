function VideoDirectoryClient() {
  const vdId = 'video-directory-utf';
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
    pstPin = document.getElementById('pst-pin-input').value;
    var group = 'video-directory';
    token = query('token');
    Pssst.validatePin(group, token, pstPin, pinValid, askForPin);
  }

  function askForPin(error) {
    if (error != undefined) {
      document.getElementById('pin-error').innerHTML = error.statusText;
    } else {
      document.getElementById('main-body').style.display = 'none';
      document.getElementById('pin-prompt').innerHTML =
          Pssst.getPinPrompt('vdc.validatePin()');
    }
  }

  function addNewTopic(e) {
    const value = e.target.value;
    window.location.href = '/video-directory/request/' + value;
  }

  const reqTopicsId = 'request-topics';
  function onLoad() {
    UTF.searchAllOnEnter(reqTopicsId, addNewTopic);
    document.getElementById(reqTopicsId)
      .querySelectorAll('label')[0].innerHTML = 'Add/Search for Topic:';
    if (query('token') && window.location.pathname === '/video-directory/edit') {
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
      var url = '/video-directory/update';
      xhr.open("POST", url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(body));
    }

    window.addEventListener('load', onLoad);

    return {validatePin, save};
}

var script = document.createElement("script");
script.src = '/pssst/js/pssst-client.js';
document.head.appendChild(script);

var vdc = VideoDirectoryClient();
