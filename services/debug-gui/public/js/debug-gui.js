var DEBUG_GUI = {};
DEBUG_GUI.EXCEPTION_LOOKUP = {};

function DebugGui() {
  var exceptionId = 0;
  var TAG_NAME = 'debug-gui-data';
  var LOGS = '__LOGS';

  var getScriptURL = (function() {
      var scripts = document.getElementsByTagName('script');
      var index = scripts.length - 1;
      var myScript = scripts[index];
      return function() { return myScript.src; };
  })();

  function getCookie(name) {
    var cookieReg = new RegExp("^(.*?; |)DebugGui=(id=.*?)(;.*$|$)");
    if (document.cookie.match(cookieReg)) {
      var value = document.cookie.replace(cookieReg, '$2');
      var keyValues = value.split("|");
      var json = {};
      for (var index = 0; index < keyValues.length; index += 1) {
          var keyValue = keyValues[index].split("=");
          json[keyValue[0]] = keyValue[1];
      }
      return json;
    }
  }

  function getParameter(name) {
    var paramReg = new RegExp("(.*?(\\?|&))" + name + "=([^&]*?)(#|&|$).*");
    if (window.location.href.match(paramReg)) {
      return window.location.href.replace(paramReg, "$3")
    }
  }

  function getId() {
    if (DEBUG_GUI.ID) {
      return DEBUG_GUI.ID;
    }
    var cookie = getCookie('DebugGui');
    var param = getParameter('DebugGui.id');
    if (cookie && param && cookie.id !== param){
      try{
        throw new Error('Contradication exists between DebugGui cookie ' +
        'and id parameter. This contraction must be fixed, it could be triggering' +
        ' different applications to use different identifiers.\n\t\tCookie: ' +
        cookie.id + "\n\t\tParameter: " + param);
      } catch (e) {
        console.error(e);
      }
    }
    if (cookie) {
      DEBUG_GUI.ID = cookie.id;
    }
    if (param) {
      DEBUG_GUI.ID = param;
    }
    return DEBUG_GUI.ID;
  }

  function updateId(value) {
    DEBUG_GUI.ID = value;
  }

  function buildHeader(html) {
    var host = DEBUG_GUI.HOST;
    var tl = getLogWindow();
    return `<div style='text-align: center;'>
              <div style='float: left; margin-left: 20pt;'>
                <input type='button' value='refresh'
                    onclick='DebugGui.refresh()'>
                <input type='button' onclick='DebugGui.displayLogs()'
                    value='Logs'>
              </div>
              <label>host: </label>
              <input type='text' id='debug-gui-host' value='${host}'>
              <label>id: </label>
              <input type='text' id='debug-gui-id' onchange='DebugGui.updateId(this.value)' value='${getId()}'>
              <img style='height: 20px;' onclick='DebugGui.createCookie()' src='${host}/images/cookie.gif'>
              <label>&nbsp;&nbsp;Logging Window </label>
              <input type='text' id='debug-gui-log-window' value='${tl}'
                  style='width: 40pt;'>
              <label>Seconds</label>
              <input type="button"
                  value="Copy Html Report"
                  onclick="DebugGui.copyModal()"
                  style='float: right; margin-right: 20pt;'>
            </div>
            <br>
            ${html}`;
  }

  function init() {
    DEBUG_GUI.MODAL = document.createElement('div');

    DEBUG_GUI.HAZE = document.createElement('div');
    DEBUG_GUI.HAZE.style.cssText = `position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            text-align: center;
            background:rgba(0,0,0,0.6);
            z-index: 1;
            padding: 20pt;`;
    DEBUG_GUI.MODAL.appendChild(DEBUG_GUI.HAZE);

    DEBUG_GUI.POPUP = document.createElement('div');
    DEBUG_GUI.POPUP.style.cssText = `background-color: white;
            padding: 10pt 20pt;
            display: inline-block;
            max-width: 80%;
            text-align: left;
            max-height: 80%;
            overflow: scroll;
            border-radius: 2pt;`;
    DEBUG_GUI.POPUP.setAttribute('onclick', 'event.stopPropagation()');
    DEBUG_GUI.HAZE.appendChild(DEBUG_GUI.POPUP);
    DEBUG_GUI.MODAL.id = 'debug-gui-modal';
    DEBUG_GUI.HAZE.onclick = hideModal;
    DEBUG_GUI.SCRIPT_URL = getScriptURL();
    getLogWindow();
    hideModal();

    document.body.appendChild(DEBUG_GUI.MODAL);
    var html = buildHeader(buildGui(undefined, 'og'));
    DEBUG_GUI.SCC = ShortCutCointainer("debug-gui-scc", ['d', 'g'], html);
    DEBUG_GUI.ID = getId();

    refresh();
  }

  function hideEmpties() {
    var accordions = document.querySelectorAll('#accordionExample');
    for (let index = 0; index < accordions.length; index += 1) {
      var ctn = accordions[index].parentElement;
      if (ctn.innerText.trim() === "") {
        ctn.style = 'display:none';
      }
    }
  }

  function displayLogs() {
    var logs = DEBUG_GUI.DATA[LOGS];
    var html = '';
    for (var index = logs.length - 1; index > -1; index -= 1) {
      html += logs[index].log + '<br>';
    }
    displayModalHtml(html);
  }

  function debug() {
    return document.cookie.match("(;\\s*|^\\s*)DebugGui=(.{1,})(;|$)") !== null ||
      window.location.href.match("(\\?|&)DebugGui.id=[^&]{1,}(&|$)");
  }

  function displayModalHtml(html) {
    DEBUG_GUI.POPUP.innerHTML = html;
    DEBUG_GUI.MODAL.style.display = 'block';
  }

  function displayModal(id) {
    DEBUG_GUI.POPUP.innerHTML = DEBUG_GUI.EXCEPTION_LOOKUP[id];
    DEBUG_GUI.MODAL.style.display = 'block';
  }

  function hideModal() {
    DEBUG_GUI.POPUP.innerHTML = '';
    DEBUG_GUI.MODAL.style.display = 'none';
  }

  var reportInfo = '__REPORT_INFO';
  var reportInfoTitleId = 'debug-gui-report-info-title';
  var reportInfoDescId = 'debug-gui-report-info-desc';
  var copyTextId = 'debug-gui-copy-text';

  function copyModal() {
    DEBUG_GUI.EXCEPTION_LOOKUP[reportInfo] = '<input id="' + reportInfoTitleId + '" placeholder="title">' +
        '<input type="button" value="Copy" onclick="DebugGui.copyReport()">' +
        '<textarea placeholder="Text to copy" id="' + copyTextId + '" style="float: right;"></textarea>' +
        "<textarea cols=120 rows=20 id='" + reportInfoDescId + "' placeholder='Description'></textarea><br>";
    displayModal(reportInfo);
  }

  function retTab(count) {
    var tab = '\n';
    for (var index = 0; index < count; index += 1) {
      tab += '\t';
    }
    return tab;
  }

  function copyReport() {

    var title = document.getElementById(reportInfoTitleId).value;
    var desc = document.getElementById(reportInfoDescId).value;
    var copyText = document.getElementById(copyTextId);
    var host = DEBUG_GUI.SCRIPT_URL.replace('/gui', '');

    copyText.value = '<html>\n\t<head>\n\t\t<title>' + title + '</title>' +
      '\n\t\t<script type=\'text/javascript\' src="' + DEBUG_GUI.SCRIPT_URL +
      '"></script>' + '\n\t</head>\n\t<body>\n\t\t<h1>' + title +
      '</h1>\n\t\t<b>(Press d + g to open debug-gui)</b>\n\t\t<p>' + desc +
      '</p>' + '\n\t\t<' + TAG_NAME + " url='" + host + "' debug-gui-id='" + DEBUG_GUI.ID +
      "'>\n" + JSON.stringify(DEBUG_GUI.DATA, null, 2) + "\n\t\t</" + TAG_NAME + ">" +
      '\n\t</body>\n</html>';
    copyText.select();


    document.execCommand("copy");
    console.log('copied')
  }

  function path(str) {
    if (str) {
      if (str.lastIndexOf('/') != str.length - 1) {
        return str + "/";
      }
      return str;
    }
    return "";
  }

  function mergeObject(newData) {
    var keys = Object.keys(newData);
    keys.splice(keys.indexOf(LOGS), 1);
    for (let oIndex = 0; oIndex < keys.length; oIndex += 1) {
      var id = keys[oIndex];
      DEBUG_GUI.DATA[id] = newData[keys[oIndex]];
    }

    DEBUG_GUI.DATA[LOGS] = newData[LOGS];
  }

  function getUrl(host, ext, id, group) {
    host = path(host);
    ext = path(ext);
    id = path(id);
    group = path(group);

    var url = host + ext + id + group;
    return url.substr(0, url.length - 1);
  }

  function getData(host, id, onSuccess) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
            var data = JSON.parse(this.responseText);
            if (onSuccess) {
              onSuccess(data);
            } else {
              refresh(data);
            }
        }
    };

    xhr.open('GET', getUrl(host, id, getLogWindow()), true);
    xhr.send();
  }

  function buildData() {
     var tags = document.getElementsByTagName(TAG_NAME);
     DEBUG_GUI.DATA = {};
     for (let index = 0; index < tags.length; index += 1) {
       var tag = tags[index];
       tag.style.display = 'none';
       if (tag.getAttribute('url')) {
         var url = tag.getAttribute('url');
         var id = tag.getAttribute('dg-id');
         if (DEBUG_GUI.HOST != url) {
           DEBUG_GUI.HOST = url;
         }
       }
       var innerHtml = tags[index].innerHTML.trim();
       if (innerHtml !== "") {
         try {
           var json = JSON.parse(innerHtml);
           DEBUG_GUI.DONT_REFRESH = true;
           mergeObject(json);
         } catch (e) {
           console.log(e.stack)
         }
       }
     }

     return DEBUG_GUI.DATA;
  }

  function buildValueList(values) {
    if (!values) return "";
    var valueKeys = Object.keys(values);
    var valueList = '<div><label>Values</label><ul>';
    for (let vIndex = 0; vIndex < valueKeys.length; vIndex += 1) {
      var key = valueKeys[vIndex];
      valueList += "<li>'" + key + "' => '" + values[key].value + "'</li>";
    }
    if (valueKeys.length > 0) {
      return valueList + '</ul></div>';
    }
    return ""
  }

  function buildLinkList(links) {
    if (!links) return "";
    var linkKeys = Object.keys(links);
    var linkList = "<span><label>Links: </label>&nbsp;&nbsp;&nbsp;";
    for (let lIndex = 0; lIndex < linkKeys.length; lIndex += 1) {
      var key = linkKeys[lIndex];
      linkList += "<a href='" + links[key].url + "' target='_blank'>" + key + "</a> | ";
    }
    if (linkKeys.length > 0) {
      return linkList.substr(0, linkList.length - 3) + '</span>';
    }
    return "";
  }

  function buildExceptions(exceptions) {
    if (!exceptions) return "";
    var acorn = '<div><label>Exceptions</label><ul>';
    for (let index = 0; index < exceptions.length; index += 1) {
      var except = exceptions[index];
      acorn += `<li><a href='#' onclick='DebugGui.displayModal(${exceptionId})'>
                  ${except.id} - ${except.msg}
                </a></li>`;
      DEBUG_GUI.EXCEPTION_LOOKUP[exceptionId++] = `<h4>${except.msg}</h4><p>${except.stacktrace}</p>`;
    }
    if (exceptions.length > 0) {
      return acorn + '</ul></div>';
    }
    return "";
  }

  function buildGui(data, fp) {
    var acorn = '';
    if (!data) {
      data = buildData();
    }

    var keys = Object.keys(data);
    keys = keys.sort();
    if (keys.indexOf(LOGS) != -1) {
      keys.splice(keys.indexOf(LOGS), 1);
    }
    for (let index = 0; index < keys.length; index += 1) {
      var id = keys[index];
      var childBlock = buildGui(data[id].children, fp + "-" + id);
      if (childBlock.trim()) {
        childBlock = `<div style='border-style: double;'>
                        ${childBlock}
                      </div>`
      }
      acorn += `  <div class="card">
          <div class="card-header" id="heading-${fp}-${id}">
            <h2 class="mb-${fp}-${id}">
              <button class="btn btn-link collapsed" type="button" data-toggle="collapse" data-target="#collapse-${fp}-${id}" aria-expanded="true" aria-controls="collapse-${fp}-${id}">
                ${id}
              </button>
            </h2>
          </div>

          <div id="collapse-${fp}-${id}" class="collapse" aria-labelledby="heading-${fp}-${id}" data-parent="#accordionExample">
            <div class="card-body">
              ${buildLinkList(data[id].links)}
              ${buildValueList(data[id].values)}
              ${buildExceptions(data[id].exceptions)}
              ${childBlock}
            </div>
          </div>
        </div>`;
    }

    if (acorn) {
      return `<div class="accordion" id="accordionExample"></div>${acorn}`;
    }
    return acorn;
  }

  function render() {
    var html = buildHeader(buildGui(DEBUG_GUI.DATA, 'og'));
    hideEmpties();
    DEBUG_GUI.SCC.innerHtml(html);
  }

  var numberReg = new RegExp('^[0-9]*$');
  function getLogWindow(value) {
    var element = document.getElementById('debug-gui-log-window');
    var elementValue = element && element.value.match(numberReg) ? element.value : undefined;

    if (value && value.match(numberReg)) {
      DEBUG_GUI.TIME_LIMIT = value;
    } else if (!DEBUG_GUI.TIME_LIMIT) {
      var param = getParameter('DebugGui.logWindow');
      param = param && param.match(numberReg) ? param : undefined;
      DEBUG_GUI.TIME_LIMIT = param || elementValue || '20';
    } else if (elementValue) {
      DEBUG_GUI.TIME_LIMIT = elementValue;
    }
    return DEBUG_GUI.TIME_LIMIT;
  }

  function refresh(data) {
    if (data) {
        DEBUG_GUI.DATA = data;

        render();
    } else if (!DEBUG_GUI.DONT_REFRESH) {
      getData(DEBUG_GUI.HOST, DEBUG_GUI.ID);
    }
  }

  function createCookie() {
    var id = getId();
    var host = window.location.href.replace(/(http(s|):\/\/.*?)\/.*/, "$1");
    var portReg = /(http(s|)(:\/\/[^:]*?:[0-9]{4})\/)/;
    var httpHost;
    var httpsHost;
    var portMatch = window.location.href.match(portReg);
    if (portMatch) {
      var rootValue = portMatch[3].substr(0, portMatch[3].length - 1);
      httpHost = "http" + rootValue + 0 + "/debug-gui/";
      httpsHost = "https" + rootValue + 1 + "/debug-gui/";
    }
    var cookie = "id=" + id;
    var setupCookie = "document.cookie = 'DebugGui=" + cookie + "|host=" +
        host + "|httpHost="  + httpHost + "|httpsHost=" + httpsHost + "'";

    if (document.getElementById('debug-gui-id').value) {
      document.cookie = 'DebugGui=' + cookie;
    } else {
      document.cookie = 'DebugGui=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    if (window.location.href.indexOf('/debug-gui/') > -1) {
      copyToClipboard(setupCookie, "Setup cookie copied to clipboard");
    }
  }

  function copyToClipboard(value, msg) {
    var input = document.createElement('input')
    input.value = value;
    document.querySelectorAll('body')[0].append(input);
    input.select();
    document.execCommand('copy');

    input.style = 'display: none';
    msg && alert(msg);
  }



  function onLoad() {
    var elem = document.querySelectorAll('debug-gui-data');
    var isParse = (elem.length > 0 && elem[0].innerText.trim());
    if (debug() || isParse) {
      var script = document.createElement("script");
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js';
      script.integrity = "sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1";
      script.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(script);

      script = document.createElement("script");
      script.src = 'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js';
      script.integrity = "sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM";
      script.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(script);
      init();
    }
  }


  var script = document.createElement("script");
  script.src = 'https://code.jquery.com/jquery-3.3.1.slim.min.js';
  script.integrity = "sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo";
  script.setAttribute('crossorigin', 'anonymous');
  document.head.appendChild(script);

  script = document.createElement("script");
  script.src = '/js/short-cut-container.js';
  document.head.appendChild(script);

  var style = document.createElement("link");
  style.rel = 'stylesheet';
  style.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css';
  style.integrity = "sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T";
  style.setAttribute('crossorigin', 'anonymous');
  document.head.appendChild(style);

  window.addEventListener('load', onLoad);
  return {refresh, displayModal, displayLogs, debug, createCookie,
      copyModal, getUrl, copyReport, getId, updateId};
}

DebugGui = DebugGui();
