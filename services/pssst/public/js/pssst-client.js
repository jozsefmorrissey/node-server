PSSST_CONFIG = {};
PSSST_CONFIG.DONT_HIDE = 'dontHide';
function Pssst() {
  var getUrl = window.location.origin + '/pssst/get';
  var updateUrl = window.location.origin + '/pssst/update';
  var adminUpdateUrl = window.location.origin + '/pssst/admin/update';
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
    var pstPin = PSSST_CONFIG.pstPin;
    var keyValues = {};

    for (var index = 0; index < lines.length; index += 1) {
      var match = lines[index].match(/(^.*?)=(.*$)/);
      if (match) {
        keyValues[match[1]] = match[2];
      }
    }
    httpPostAsync(updateUrl + '/all', {group, token, pstPin, keyValues})
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

  function resetToken(group) {
    adminUpdate(group, "token");
  }

  function resetPin(group) {
    var pin = Math.random().toString().substring(2, 6);
    adminUpdate(group, "pst-pin", pin);
  }

  function adminUpdate(group, id, value) {
    var token = PSSST_CONFIG.token;
    if (confirm("Are you sure, you want to update " + id + "?")) {
      get(adminUpdateUrl, group, id, token, undefined, value);
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

  function url(group) {
    var host = PSSST_CONFIG.host;
    var token = PSSST_CONFIG.token;
    if (group === undefined) {
      group = PSSST_CONFIG.group;
    }
    return `${host}/pssst/client?token=${token}&group=${group}&host=${host}`;
  }

  function copyCmd() {
    var host = PSSST_CONFIG.host;
    var token = PSSST_CONFIG.token;
    var group = PSSST_CONFIG.group;
    var config = document.getElementById('config-id').value;
    copy(`pst client-config -config '${config}' -token '${token}' -group '${group}' -host '${host}'`);
  }

  var id;
  function show(index, identifier) {
    id = 'display';
    if (index !== undefined) {
      id += '-' + index;
    }

    function showIndex(value) {
      if (identifier === 'token' && PSSST_CONFIG.group != 'admin' && value !== PSSST_CONFIG.token) {
        PSSST_CONFIG.token = value;
        window.location = url();
      } else if (identifier === 'pst-pin') {
        PSSST_CONFIG.pstPin = value;
      }
      document.getElementById('copy').value = value;
      setTimeout(function () {
        document.getElementById('copy').value = '';
      }, 10000);
      copy(value);
    }
    return showIndex;
  }

  function get(url, group, id, token, index, value) {
    var pstPin = PSSST_CONFIG.pstPin;
    httpPostAsync(url, {group, id, token, pstPin, value}, show(index, id));
  }

  function httpPostAsync(url, data, callback, failureCallback)
  {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4)
          if (xmlHttp.status == 200)
            callback(xmlHttp.responseText);
          else
            failureCallback(xmlHttp);
      }
      xmlHttp.onerror = function() {
        failureCallback(xmlHttp);
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
    // if ('true' !== query(PSSST_CONFIG.DONT_HIDE)) {
    //   window.history.pushState('client-clean', 'Client', '/pssst/client');
    // } else {
      window.history.pushState('client-clean', 'Client', url());
    // }
  }

  function validatePin() {
    var pstPin = document.getElementById('pst-pin-input').value;
    console.log(pstPin);
    function pinValidated() {
      PSSST_CONFIG.pstPin = pstPin;
      document.querySelector('pssst').style.display = '';
      document.getElementById('pst-pin-flag').style.display = 'none';
      header();
    }
    var group = PSSST_CONFIG.group;
    var token = PSSST_CONFIG.token;
    httpPostAsync("/pssst/validate", {group, token, pstPin}, pinValidated, askForPin);
  }

  function deleteGroup() {
    var token = PSSST_CONFIG.token;
    var pstPin = PSSST_CONFIG.pstPin;
    var group = document.getElementById('delete').value;
    httpPostAsync("/pssst/remove/group", {group, token, pstPin});
    var group = document.getElementById('delete').value = "";
  }

  function askForPin(error) {
    if (document.getElementById('pst-pin-flag').getAttribute('value') === 'true') {
      if (error != undefined) {
        document.getElementById('pin-error').innerHTML = error.statusText;
      } else {
        document.querySelector('pssst').style.display = 'none';
        let pinPrompt = '<div style="margin: auto;display: block; text-align: center;"><br><br><br>';
        pinPrompt += `<b id="pin-error" style='font-size: 16px; color:red;'></b><br>`;
        pinPrompt += `<input type="text" id="pst-pin-input" style='margin: auto; max-width: 300px;' class="form-control" placeholder="pst-pin"
        onkeydown = "if (event.keyCode == 13) Pssst().validatePin()"><br><br>`;
        pinPrompt += '<button onclick="Pssst().validatePin()" class="btn btn-primary">Enter</button></div>';
        document.getElementById('pst-pin-flag').innerHTML = pinPrompt;
      }
      return true;
    }
    return false;
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
    askForPin() || header();
  }

  function header() {
    var elem = document.getElementsByTagName('pssst')[0];
    var html = "<div style='text-align: center'>";
    html += "<h1>" + PSSST_CONFIG.group + "</h1>";
    html += "<p>(Updating a value with no input gernates a random string)</p>";
    html += "<input type='text' class='form-control' style='margin: auto;display: block;max-width: 300px;' id='copy' readonly='readonly'>";
    html += "<input type='text' class='form-control' id='config-id' placeholder='config id' style='margin: auto;display: block;max-width: 300px;'>";
    html += "<input type='button' class='btn btn-primary' value='pst cmd' onclick='Pssst().copyCmd()'><br><br><br>";
    // html += "<input type='button' value='Refresh' onclick='Pssst().refresh()'>";
    html += "<div id='table' style='margin: auto;'></div>"
    html += `<button class='btn btn-primary' onclick='Pssst().bulkUpdate()'><h3>Bulk Update</h3></button>
              <p>(format: [key]=[value])</p>
              <textarea class='form-control' rows='25' id='bulk-update'></textarea>`;
    elem.innerHTML = html + "</div>";
    if (PSSST_CONFIG.group === 'admin') {
      groups();
    } else {
      Pssst().keys();
    }
    document.getElementById('config-id').value = PSSST_CONFIG.group;
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
      html = "<table style='width:100%; display:inline;' cellpadding='40'><tbody>";
      var ks = JSON.parse(data);
      PSSST_CONFIG.keys = ks;
      for (var i = 0; i < ks.length; i += 1) {
        if (ks[i]) {
          link = `<br><a href onclick='return Pssst().getIndex(${i})'>${ks[i]}</a><br>
                  <span><input class='form-control' id='input-${i}'>`;
          input = `
          <input type='button' class='btn btn-primary' value='update' onclick='Pssst().update(${i})'>
          <input type='button' class='btn btn-primary' value='X' onclick='Pssst().remove(${i})'></span>`;
          display = `<b id='display-${i}'></b>`;
          html += `\n<tr><td style="    text-align: center;
    padding-right: 40pt;
    display: inherit;">${link}</td><td>${input}</td></tr>\n`;
        }
      }

      html += '</tbody></table><br><br><input type="text" class="form-control" id="add">';
      html += '<input class="btn btn-primary" type="button" value="Add" onclick="Pssst().add()"><br><br><br>';
      elem.innerHTML = html;
    }

    var pstPin = PSSST_CONFIG.pstPin;
    httpPostAsync("/pssst/keys", {group, token, pstPin}, displayKeys);
  }



  function groups() {
    var host = PSSST_CONFIG.host;
    var group = PSSST_CONFIG.group;
    var token = PSSST_CONFIG.token;

    function displayKeys(data) {
      var elem = document.getElementById('table');
      html = "<table style='width:100%;'><tbody>";
      html += `<tr><td><input type="text" class="form-control" id="add" class='form-control' style='margin: auto;display: block;max-width: 300px;'>`;
      html += `<input class="btn btn-primary" type="button" value="Add" onclick="Pssst().createGroup()" style='margin:auto;display: block;'><br><br></td>`;
      html += `<td><input type="text" class="form-control" id="delete" class='form-control' style='margin: auto;display: block;max-width: 300px;'>`;
      html += `<input class="btn btn-primary" type="button" value="Delete" onclick="Pssst().deleteGroup()" style='margin:auto;display: block;'><br><br></td></tr>`;
      var ks = JSON.parse(data);
      PSSST_CONFIG.keys = ks;
      for (var i = 0; i < ks.length; i += 1) {
        if (ks[i]) {
          const link = `<tr><td colspan="2" style='width: 100%; text-align: center;'>
                          <a target='_blank' href="${url(group)}">
                          ${ks[i]}</a></td><tr>`;
          const resetPin = `<tr><td style="width:50%; text-align: center;">
                              <button onclick='Pssst().resetPin("${ks[i]}")' class='btn btn-primary'>
                              Reset Pin</button><br><br></td>`;
          const resetToken = `<td style="width:50%; text-align: center;">
                              <button onclick='Pssst().resetToken("${ks[i]}")' class='btn btn-primary'>
                              Reset Token</button><br><br></td></tr>`;
          html += `${link}${resetPin}${resetToken}`;
        }
      }

      elem.innerHTML = html;
    }

    var pstPin = PSSST_CONFIG.pstPin;
    httpPostAsync("/pssst/get/groups", {group, token, pstPin}, displayKeys);
  }

  function createGroup() {
      const group = document.getElementById('add').value;
      if (group) {
        window.open(url(group),'_blank');
        document.getElementById('add').value = '';
      }
  }

  return {retrieve, build, keys, getIndex, update, refresh, createGroup,
    remove, add, bulkUpdate, copyCmd, url, validatePin, resetToken, resetPin,
    deleteGroup};
}

window.onload = Pssst().build
