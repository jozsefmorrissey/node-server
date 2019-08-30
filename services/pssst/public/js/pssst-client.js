PSSST_CONFIG = {};
function Pssst() {
  var getUrl = window.location.origin + '/pssst/get';
  var updateUrl = window.location.origin + '/pssst/update';
  var removeUrl = window.location.origin + '/pssst/remove';

  function retrieve() {
    var group = document.getElementById('group').value;
    var id = document.getElementById('id').value;
    var token = document.getElementById('token').value;
    get(getUrl, group, id, token);
  }

  function bulkUpdate() {
    var lines = document.getElementById('bulk-update').value.split('\n');
    var group = PSSST_CONFIG.group;
    var token = PSSST_CONFIG.token;
    var keyValues = {};

    for (var index = 0; index < lines.length; index += 1) {
      var match = lines[index].match(/(^.*?)=(.*$)/);
      if (match) {
        keyValues[match[1]] = match[2];
      }
    }
    httpGetAsync(updateUrl + '/all', {group, token, keyValues})
    refresh();
    document.getElementById('bulk-update').value = '';
  }

  function update(index) {
    var group = PSSST_CONFIG.group;
    var token = PSSST_CONFIG.token;
    var id = PSSST_CONFIG.keys[index];
    var value = document.getElementById('input-' + index).value;
    if (confirm("Are you sure, you want to update " + id + "?")) {
      get(updateUrl, group, id, token, index, value);
    }
  }

  function add(index) {
    var group = PSSST_CONFIG.group;
    var token = PSSST_CONFIG.token;
    var id = document.getElementById('add').value;
    if (id) {
      get(updateUrl, group, id, token, index, "");
    }
    document.getElementById('add').value = "";
    refresh();
  }

  function remove(index) {
    var group = PSSST_CONFIG.group;
    var token = PSSST_CONFIG.token;
    var id = PSSST_CONFIG.keys[index];
    if (confirm("Are you sure, you want to remove " + id + "?")) {
      get(removeUrl, group, id, token, index);
    }
    refresh();
  }

  function copy(value) {
    //https://localhost:3001/pssst/client?token=gailahng3Ao0QuuThaerae0Coo4cea&host=https://localhost:3001&group=value
    var copyElem = document.getElementById('copy')
    copyElem.value = value;
    copyElem.select();
    document.execCommand('copy');
  }

  function copyCmd() {
    var host = PSSST_CONFIG.host;
    var token = PSSST_CONFIG.token;
    var group = PSSST_CONFIG.group;
    var config = document.getElementById('config-id').value;
    copy(`pst client-config -config '${config}' -token '${token}' -group '${group}' -host '${host}'`);
  }

  var id;
  function show(index, isToken) {
    id = 'display';
    if (index !== undefined) {
      id += '-' + index;
    }

    function showIndex(value) {
      if (isToken) {
        PSSST_CONFIG.token = value;
      }
      document.getElementById(id).innerHTML = value;
      setTimeout(function () {
        document.getElementById(id).innerHTML = '';
      }, 10000);
      copy(value);
    }
    return showIndex;
  }

  function get(url, group, id, token, index, value) {
    httpGetAsync(url, {group, id, token, value}, show(index, id === 'token'));
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

  function query(name) {
    var reg = new RegExp(".*(\\?|\\&)" + name + "=(.*?)(\\&|$).*");
    var value = window.location.search.replace(reg, '$2');
    return value.indexOf('?') == 0 ? undefined : value;
  }

  function redirectClient(host, token, group) {
    window.history.pushState('client-clean', 'Client', '/pssst/client');
  }

  function build() {
    var elem = document.getElementsByTagName('pssst')[0];
    if (query('host') || query('token') || query('group')) {
      PSSST_CONFIG.host = query('host');
      PSSST_CONFIG.token = query('token');
      PSSST_CONFIG.group = query('group');
      redirectClient(PSSST_CONFIG.host, PSSST_CONFIG.token, PSSST_CONFIG.group);
    } else {
      PSSST_CONFIG=JSON.parse(elem.innerText);
      elem.innerHTML = "";
    }
    html = "<div style='text-align: center'>";
    html += "<h1>" + PSSST_CONFIG.group + "</h1>";
    html += "<p>(Updating a value with no input gernates a random string)</p>";
    html += "<input type='text' style='display: block;' id='copy' readonly='readonly'>";
    html += "<input type='text' id='config-id' placeholder='config id'>";
    html += "<input type='button' value='Copy Cmd' onclick='Pssst().copyCmd()'>";
    // html += "<input type='button' value='Refresh' onclick='Pssst().refresh()'>";
    html += "<div><table id='table' style='margin: 20pt;'></table><div>"
    html += `<button onclick='Pssst().bulkUpdate()'><h3>Bulk Update</h3></button>
              <p>(format: [key]=[value])</p>
              <textarea cols='100' rows='25' id='bulk-update'></textarea>`;
    elem.innerHTML = html + "</div>";
    Pssst().keys();
  }

  function refresh() {
    Pssst().keys();
  }

  function getIndex(index) {
    var group = PSSST_CONFIG.group;
    var token = PSSST_CONFIG.token;
    var id = PSSST_CONFIG.keys[index];
    get(getUrl, group, id, token, index);
    return false;
  }

  function keys() {
    var group = PSSST_CONFIG.group;
    var token = PSSST_CONFIG.token;

    function displayKeys(data) {
      var elem = document.getElementById('table');
      html = "";
      var ks = data.split("==");
      PSSST_CONFIG.keys = ks;
      for (var i = 0; i < ks.length; i += 1) {
        if (ks[i]) {
          link = `<a href onclick='return Pssst().getIndex(${i})'>${ks[i]}</a><br>`;
          input = `<input id='input-${i}'>
          <input type='button' value='update' onclick='Pssst().update(${i})'>
          <input type='button' value='X' onclick='Pssst().remove(${i})'>`;
          display = `<b id='display-${i}'>`;
          html += `<tr><td>${link}</td><td>${input}</td><td>${display}</td></tr>`;
        }
      }
      html += '<input type="text" id="add"><input type="button" value="Add" onclick="Pssst().add()">';
      elem.innerHTML = html;
    }

    httpGetAsync("/pssst/keys", {group, token}, displayKeys);
  }

  return {retrieve, build, keys, getIndex, update, refresh,
    remove, add, bulkUpdate, copyCmd};
}

window.onload = Pssst().build
