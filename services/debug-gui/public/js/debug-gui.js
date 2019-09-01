var DEBUG_GUI = {};
DEBUG_GUI.EXCEPTION_LOOKUP = {};
DEBUG_GUI.IDS = [];

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


  function toggleChecked() {
    DEBUG_GUI.CHECKED = DEBUG_GUI.CHECKED ? '' : 'checked';
  }

  function buildHeader(html) {
    var ids = DEBUG_GUI.IDS.join(',');
    var host = DEBUG_GUI.HOST;
    var tl = DEBUG_GUI.TIME_LIMIT;
    return `<div style='text-align: center;'>
              <div style='float: left; margin-left: 20pt;'>
                <label>clean: </label>
                <input type='checkbox' onclick='DebugGui().toggleChecked()'
                    ${DEBUG_GUI.CHECKED} id='debug-gui-clean'>
                <input type='button' value='refresh'
                    onclick='DebugGui().refresh()'>
                <input type='button' onclick='DebugGui().displayLogs()'
                    value='Logs'>
              </div>
              <label>host: </label>
              <input type='text' id='debug-gui-host' value='${host}'>
              <label>ids: </label>
              <input type='text' id='debug-gui-ids' value='${ids}'>
              <label>Time Limit(sec): </label>
              <input type='text' id='debug-gui-time-limit' value='${tl}'
                  style='width: 40pt;'>
              <input type="button"
                  value="Copy Html Report"
                  onclick="DebugGui().copyModal()"
                  style='float: right; margin-right: 20pt;'>
            </div>
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
    hideModal();

    document.body.appendChild(DEBUG_GUI.MODAL);
    var html = buildHeader(buildGui(undefined, 'og'));
    DEBUG_GUI.SCC = ShortCutCointainer("debug-gui-scc", ['d', 'g'], html);
  }

  function displayLogs() {
    var logs = DEBUG_GUI.DATA[LOGS];
    var html = '';
    for (var index = 0; index < logs.length; index += 1) {
      html += logs[index].log + '<br>';
    }
    displayModalHtml(html);
  }

  function debug() {
    return document.cookie.match("(;\\s*|^\\s*)DebugGui.debug=true;") !== null;
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
        '<input type="button" value="Copy" onclick="DebugGui().copyReport()">' +
        '<textarea placeholder="Text to copy" id="' + copyTextId + '" style="float: right;"></textarea>' +
        "<textarea cols=120 rows=20 id='" + reportInfoDescId + "' placeholder='Description'></textarea><br>";
    displayModal(reportInfo);
  }

  function copyReport() {

    var title = document.getElementById(reportInfoTitleId).value;
    var desc = document.getElementById(reportInfoDescId).value;
    var copyText = document.getElementById(copyTextId);

    copyText.value = '<html><head><title>' + title + '</title>' +
      '<script type=\'text/javascript\' src="' + DEBUG_GUI.SCRIPT_URL + '"></script>' +
      '</head><body><h1>' + title + '</h1><b>(Press d + g to open debug-gui)</b><p>' + desc + '</p>' +
      '<' + TAG_NAME + ">" + JSON.stringify(DEBUG_GUI.DATA, null, 2) + "</" + TAG_NAME + ">" +
      '</body></html>';
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
    }https://stackoverflow.com/questions/20020902/android-httpurlconnection-how-to-set-post-data-in-http-body
    return "";
  }

  function mergeObject(newData) {
    var keys = Object.keys(newData);
    keys.splice(keys.indexOf(LOGS), 1);
    for (let oIndex = 0; oIndex < keys.length; oIndex += 1) {
      var id = keys[oIndex];
      DEBUG_GUI.DATA[id] = newData[keys[oIndex]];
    }
    if (DEBUG_GUI.DATA[LOGS]) {
      DEBUG_GUI.DATA[LOGS] = DEBUG_GUI.DATA[LOGS].concat(newData[LOGS]);
    } else {
      DEBUG_GUI.DATA[LOGS] = newData[LOGS];
    }
  }

  function getUrl(host, id, group, ext) {
    host = path(host);
    id = path(id);
    ext = path(ext);
    group = path(group);

    var url = host + ext + id + group;
    return url.substr(0, url.length - 1);
  }

  function timeLimit(host, value) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
          if (!value && DEBUG_GUI.TIME_LIMIT != this.responseText) {
            DEBUG_GUI.TIME_LIMIT = this.responseText;
          }
        }
        render();
    };

    var url = host + "time/limit";
    if (value) {
      url += "/" + value;
    }

    xhr.open('GET', url, true);
    xhr.send();
  }

  function getData(host, id, onSuccess) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
            var data = JSON.parse(this.responseText);
            console.log(data);
            if (onSuccess) {
              onSuccess(data);
            } else {
              refresh(data);
            }
        }
    };

    xhr.open('GET', getUrl(host, id), true);
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
         getData(url, id);
         DEBUG_GUI.IDS.push(id);
         if (DEBUG_GUI.HOST != url) {
           DEBUG_GUI.HOST = url;
           timeLimit(DEBUG_GUI.HOST);
         }
       }
       try {
         var json = JSON.parse(tags[index].innerHTML);
         mergeObject(json);
       } catch (e) {
         console.log(e.stack)
       }
     }

     return DEBUG_GUI.DATA;
  }

  function buildValueList(values) {
    var valueKeys = Object.keys(values);
    var valueList = '<div><label>Values</label><ul>';
    for (let vIndex = 0; vIndex < valueKeys.length; vIndex += 1) {
      var key = valueKeys[vIndex];
      valueList += "<li>'" + key + "' => '" + values[key] + "'</li>";
    }
    if (valueKeys.length > 0) {
      return valueList + '</ul></div>';
    }
    return ""
  }

  function buildLinkList(links) {
    var linkKeys = Object.keys(links);
    var linkList = "<span><label>Links: </label>&nbsp;&nbsp;&nbsp;";
    for (let lIndex = 0; lIndex < linkKeys.length; lIndex += 1) {
      var key = linkKeys[lIndex];
      linkList += "<a href='" + links[key] + "' target='_blank'>" + key + "</a> | ";
    }
    if (linkKeys.length > 0) {
      return linkList.substr(0, linkList.length - 3) + '</span>';
    }
    return "";
  }

  function buildExceptions(exceptions) {
    var acorn = '<div><label>Exceptions</label><ul>';
    for (let index = 0; index < exceptions.length; index += 1) {
      var except = exceptions[index];
      acorn += `<li><a href='#' onclick='DebugGui().displayModal(${exceptionId})'>
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
    DEBUG_GUI.SCC.innerHtml(html);
  }

  function refresh(data, clean) {
    if (data) {
        if (clean) {
          DEBUG_GUI.DATA = data;
        } else {
          mergeObject(data);
        }

        render();
    } else {
      var value = document.getElementById('debug-gui-time-limit').value;
      if (value != DEBUG_GUI.TIME_LIMIT) {
        timeLimit(DEBUG_GUI.HOST, value);
      }

      var idsArr = document.getElementById('debug-gui-ids').value.split(',');
      if (document.getElementById('debug-gui-clean').checked) {
        DEBUG_GUI.DATA = {};
      }

      DEBUG_GUI.IDS = idsArr;
      for (var index = 0; index < idsArr.length; index += 1) {
        getData(DEBUG_GUI.HOST, idsArr[index].trim());
      }
      timeLimit(DEBUG_GUI.HOST);
    }
  }


  function onLoad() {
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


  var script = document.createElement("script");
  script.src = 'https://code.jquery.com/jquery-3.3.1.slim.min.js';
  script.integrity = "sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo";
  script.setAttribute('crossorigin', 'anonymous');
  document.head.appendChild(script);

  script = document.createElement("script");
  script.src = 'https://www.jozsefmorrissey.com/js/short-cut-container.js';
  document.head.appendChild(script);

  var style = document.createElement("link");
  style.rel = 'stylesheet';
  style.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css';
  style.integrity = "sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T";
  style.setAttribute('crossorigin', 'anonymous');
  document.head.appendChild(style);

  window.addEventListener('load', onLoad);
  return {refresh, displayModal, displayLogs, debug,
    toggleChecked, copyModal, getUrl, copyReport};
}

DebugGui();
