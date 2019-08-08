
function Pssst() {
  function retrieve() {
    var url = window.location.origin + '/pssst/get';
    var group = document.getElementById('group').value;
    var id = document.getElementById('id').value;
    var token = document.getElementById('token').value;
    get(url, group, id, token);
  }

  function show(value) {
    document.getElementById('display').innerHTML = value;
    setTimeout(function () {
      document.getElementById('display').innerHTML = '';
    }, 10000);
  }

  function get(url, group, id, token) {
    httpGetAsync(url, {group, id, token}, show);
  }

  function httpGetAsync(url, data, callback)
  {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() {
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
              callback(xmlHttp.responseText);
      }
      xmlHttp.open("POST", url, true); // true for asynchronous
      xmlHttp.setRequestHeader('Content-Type', 'application/json');
      xmlHttp.send(JSON.stringify(data));
  }

  return {retrieve};
}
