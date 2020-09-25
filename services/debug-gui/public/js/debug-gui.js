var DEBUG_GUI = {};
DEBUG_GUI.EXCEPTION_LOOKUP = {};
DEBUG_GUI.client = new DebugGuiClient.browser();

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

  function getParameter(name) {
    var paramReg = new RegExp("(.*?(\\?|&))" + name + "=([^&]*?)(#|&|$).*");
    if (window.location.href.match(paramReg)) {
      return window.location.href.replace(paramReg, "$3")
    }
  }

  function getId() {
    return DEBUG_GUI.client.getId();
  }

  function updateId(value) {
    DEBUG_GUI.client.setId(value);
    createCookie();
  }

  function updateHost(value) {
    DEBUG_GUI.client.setHost(value);
    createCookie();
  }

  function buildHeader(html) {
    var host = getHost();
    var tl = logWindow();
    return `<div style='text-align: center;'>
              <div style='float: left; margin-left: 20pt;'>
                <input type='button' value='refresh'
                    onclick='DebugGui.refresh()'>
                <input type='button' onclick='DebugGui.displayLogs()'
                    value='Logs'>
              </div>
              <label>host: </label>
              <input type='text' id='debug-gui-host' onchange='DebugGui.updateHost(this.value)' value='${host}'>
              <label>id: </label>
              <input type='text' id='debug-gui-id' onchange='DebugGui.updateId(this.value)' value='${getId()}'>
              <img style='height: 20px;' onclick='DebugGui.createCookie(true)' src='${host}/images/cookie.gif'>
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
    logWindow();
    hideModal();

    document.body.appendChild(DEBUG_GUI.MODAL);
    var html = buildHeader(buildGui(undefined, 'og'));
    DEBUG_GUI.SCC = ShortCutCointainer("debug-gui-scc", ['d', 'g'], html);
    createCookie();
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
    return DEBUG_GUI.client.isDebugging();
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
      '</p>' + '\n\t\t<' + TAG_NAME + " url='" + host + "' debug-gui-id='" + getId() +
      "'>\n" + JSON.stringify(DEBUG_GUI.DATA, null, 2) + "\n\t\t</" + TAG_NAME + ">" +
      '\n\t</body>\n</html>';
    copyText.select();


    document.execCommand("copy");
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

    xhr.open('GET', getUrl(host, id, logWindow()), true);
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
         if (getHost() != url) {
           DEBUG_GUI.client.setHost(url);
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
      var stacktrace = except.stacktrace === undefined ? "" : except.stacktrace.replace(/\n/g, "<br>");
      DEBUG_GUI.EXCEPTION_LOOKUP[exceptionId++] = `<h4>${except.msg}</h4><p>${stacktrace}</p>`;
    }
    if (exceptions.length > 0) {
      return acorn + '</ul></div>';
    }
    return "";
  }

  function buildGui(data, fp, accordionId) {
    var acorn = '';
    accordionId = (accordionId ? accordionId : 0);
    const acordId = 'dg-accordion-' + accordionId;
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
      var cleanId = id.replace(/[:+=\/]/g, '-');
      var childBlock = buildGui(data[id].children, fp + "-" + id, accordionId+1);
      if (childBlock.trim()) {
        childBlock = `<div style='border-style: double;'>
                        ${childBlock}
                      </div>`
      }
      acorn += `  <div class="card">
          <div class="card-header" id="heading-${fp}-${cleanId}">
            <h2 class="mb-${fp}-${cleanId}">
              <button class="btn btn-link collapsed" type="button" data-toggle="collapse" data-target="#collapse-${fp}-${cleanId}" aria-expanded="true" aria-controls="collapse-${fp}-${cleanId}">
                ${id}
              </button>
            </h2>
          </div>

          <div id="collapse-${fp}-${cleanId}" class="collapse" aria-labelledby="heading-${fp}-${cleanId}" data-parent="#${acordId}">
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
      return `<div class="accordion" id="${acordId}">${acorn}</div>`;
    }
    return acorn;
  }

  function render() {
    var html = buildHeader(buildGui(DEBUG_GUI.DATA, 'og'));
    hideEmpties();
    DEBUG_GUI.SCC.innerHtml(html);
  }

  var numberReg = new RegExp('^[0-9]*$');
  function logWindow(value) {
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
      getData(getHost(), getId());
    }
  }

  function getHost() {
    return DEBUG_GUI.client.getHost();
  }

  function createCookie(copy) {
    var id = getId();
    var host = getHost();
    if (!id || !host) return;
    noProtocol=host.replace(/^(http|https):\/\//, "")
    var portReg = /([^:]*?:[0-9]{4})(\/.*)$/;
    var httpHost;
    var httpsHost;
    var portMatch = noProtocol.match(portReg);
    if (portMatch) {
      // localhost
      var rootValue = portMatch[1].substr(0, portMatch[1].length - 1);
      httpHost = "http://" + rootValue + 0 + portMatch[2];
      httpsHost = "https://" + rootValue + 1 + portMatch[2];
    } else {
      // production
      httpHost = host.replace(/https/, 'http');
      httpsHost = host.replace(/http/, 'https');
    }
    var cookie = "id=" + id;
    var setupCookie = cookie + "|host=" +
        host + "|httpHost="  + httpHost + "|httpsHost=" + httpsHost + "|debug=" + debug();
    var cookieCmd = "document.cookie = 'DebugGui=" + setupCookie + "'";

    if (DEBUG_GUI.client.isDebugging()) {
      eval(cookieCmd);
      document.cookie = 'DebugGui=' + setupCookie;
    } else {
      document.cookie = 'DebugGui=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    if (copy) {
      copyToClipboard(cookieCmd, "Setup cookie copied to clipboard");
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

      // script = document.createElement("script");
      // script.src = 'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js';
      // script.integrity = "sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM";
      // script.setAttribute('crossorigin', 'anonymous');
      // document.head.appendChild(script);
      init();
    }
    createCookie();
  }


  var script = document.createElement("script");
  script.src = 'https://code.jquery.com/jquery-3.3.1.slim.min.js';
  script.integrity = "sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo";
  script.setAttribute('crossorigin', 'anonymous');
  document.head.appendChild(script);

  var script = document.createElement("script");
  script.src = 'http://node.jozsefmorrissey.com/js/short-cut-container.js';
  document.head.appendChild(script);

  // var style = document.createElement("link");
  // style.rel = 'stylesheet';
  // style.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css';
  // style.integrity = "sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T";
  // style.setAttribute('crossorigin', 'anonymous');
  // document.head.appendChild(style);

  window.addEventListener('load', onLoad);
  return {refresh, displayModal, displayLogs, debug, createCookie,
      copyModal, getUrl, copyReport, getId, updateId, updateHost};
}

DebugGui = DebugGui();
