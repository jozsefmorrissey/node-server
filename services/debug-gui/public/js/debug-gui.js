
function DebugGui() {
  var exceptionId = 0;
  var TAG_NAME = 'debug-gui-data';
  var LOGS = '__LOGS';
  var REFRESH_BTN_ID = 'dg-refresh-btn-id';
  var DISPLAY_LOGS_BTN_ID = 'dg-display-logs-id';
  var COPY_MODAL_BTN_ID = 'dg-copy-modal-btn-id';
  var COPY_BTN_ID = 'dg-copy-btn-id';
  var DISPLAY_MODAL_BTN_ID = 'dg-display-modal-btn-id';
  var HOST_INPUT_ID = 'dg-host-input-id';
  var ID_INPUT_ID = 'dg-id-input-id';


  const events = {};
  function on(eventName, selector, func) {
    if ((typeof eventName) !== 'string') throw new Error('eventName (arg1) must be a string!');
    if ((typeof selector) !== 'string') throw new Error('selector (arg2) must be a string!');
    if ((typeof func) !== 'function') throw new Error('func (arg3) must be a function!');

    function call(event) {
      if (events[event.type]) {
        Object.keys(events[event.type]).forEach((selector) => {
          if (event.target.matches && event.target.matches(selector)) {
            events[event.type][selector].forEach((func) => func(event));
          }
        });
      }
    }

    if (events[eventName] === undefined) {
      DebugGui.SCC.addEventListener(eventName, call);
      events[eventName] = {};
    }
    if (events[eventName][selector] === undefined) {
      events[eventName][selector] = [];
    }
    events[eventName][selector].push(func);
  }

  var getScriptURL = (function () {
      var scripts = document.getElementsByTagName('script');
      var index = scripts.length - 1;
      var myScript = scripts[index];
      return function () { return myScript.src; };
  })();

  function getParameter(name) {
    var paramReg = new RegExp("(.*?(\\?|&))" + name + "=([^&]*?)(#|&|$).*");
    if (window.location.href.match(paramReg)) {
      return window.location.href.replace(paramReg, "$3")
    }
  }

  const jsAttrReg = / on[a-zA-Z]*\s*=/g;
  function safeInnerHtml(text, elem) {
    const clean = text.replace(/<script[^<]*?>/, '').replace(jsAttrReg, '');
    if (clean !== text) throw Error('ddddddddiiiiiiiiiiiiiirrrrrrrrrrrrtttttttttttty');
    if (elem !== undefined) elem.innerHTML = clean;
    return clean;
  }

  function getId() {
    return DebugGui.client.getId();
  }

  function updateId(value) {
    DebugGui.client.setId(value);
    createCookie();
  }

  function updateHost(value) {
    DebugGui.client.setHost(value);
    createCookie();
  }

  function sendValue(func) {
    return (event) => func(event.target.value);
  }

  const COOKIE_BTN_ID = 'dg-cookie-btn-id';
  function buildHeader(html) {
    var host = getHost();
    var tl = logWindow();
    return `<div style='text-align: center;'>
              <div style='float: left; margin-left: 20pt;'>
                <input type='button' value='refresh' id='${REFRESH_BTN_ID}'>
                <input type='button' id='${DISPLAY_LOGS_BTN_ID}' value='Logs'>
              </div>
              <label>host: </label>
              <input type='text' id='${HOST_INPUT_ID}' value='${host}'>
              <label>id: </label>
              <input type='text' id='${ID_INPUT_ID}' value='${getId()}'>
              <img style='height: 20px;' id='${COOKIE_BTN_ID}' src='${host}/images/cookie.gif'>
              <label>&nbsp;&nbsp;Logging Window </label>
              <input type='text' id='debug-gui-log-window' value='${tl}'
                  style='width: 40pt;'>
              <label>Seconds</label>
              <input type="button"
                  value="Copy Html Report"
                  id='${COPY_MODAL_BTN_ID}'
                  style='float: right; margin-right: 20pt;'>
            </div>
            <br>
            ${html}`;
  }

  function init() {
    if (!document.getElementById("debug-gui-scc")) {
      DebugGui.MODAL = document.createElement('div');

      DebugGui.HAZE = document.createElement('div');
      DebugGui.HAZE.style.cssText = `position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              text-align: center;
              background:rgba(0,0,0,0.6);
              z-index: 1000000;
              padding: 20pt;`;
      DebugGui.MODAL.appendChild(DebugGui.HAZE);

      DebugGui.POPUP = document.createElement('div');
      DebugGui.POPUP.id = 'pu';
      DebugGui.POPUP.style.cssText = `background-color: white;
              padding: 10pt 20pt;
              display: inline-block;
              max-width: 80%;
              text-align: left;
              max-height: 80%;
              overflow: scroll;
              border-radius: 2pt;`;
      DebugGui.POPUP.onclick = (event) => event.stopPropagation();
      DebugGui.HAZE.appendChild(DebugGui.POPUP);
      DebugGui.MODAL.id = 'debug-gui-modal';
      DebugGui.HAZE.onclick = hideModal;
      DebugGui.HAZE.onmouseup = (event) => event.stopPropagation();
      DebugGui.HAZE.onmousedown = (event) => event.stopPropagation();
      logWindow();
      hideModal();

      document.body.appendChild(DebugGui.MODAL);
      var html = buildHeader(buildGui(undefined, 'og'));
      DebugGui.SCC = ShortCutContainer("debug-gui-scc", ['d', 'g'], html);
      on('change', '#' + HOST_INPUT_ID, sendValue(updateHost));
      on('change', '#' + ID_INPUT_ID, sendValue(updateId));
      on('click', '#' + REFRESH_BTN_ID, refresh);
      on('click', '#' + DISPLAY_LOGS_BTN_ID, displayLogs);
      on('click', '#' + COPY_MODAL_BTN_ID, copyModal);
      on('click', '#' + COPY_BTN_ID, copyReport);
      on('click', '.' + DISPLAY_MODAL_BTN_ID, displayExeptionModal);

      on('click', '.btn-link', (e) => {
        var target = document.querySelector(e.target.getAttribute('data-target'));
        if (target.style.display === 'none') {
          collapseAllDescendents(document.querySelector(e.target.getAttribute('data-parent')));
          target.style.display = 'block';
        } else {
          target.style.display = 'none';
        }
      });
      createCookie();
      refresh();
    }
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
    var logs = DebugGui.DATA[LOGS];
    var html = '';
    for (var index = logs.length - 1; index > -1; index -= 1) {
      const log = logs[index];
      html += new Date(log.time) + '<br>' + log.log.replace(/\n/g, '<br>')
          .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
          .replace(/\s/g, '&nbsp;') + '<br>';
    }

    displayModalHtml(html);
  }

  function debug() {
    return DebugGui.client.isDebugging();
  }

  function displayModalHtml(html) {
    safeInnerHtml(html, DebugGui.POPUP);
    DebugGui.MODAL.style.display = 'block';
  }

  function displayExeptionModal() {
    const id = event.target.getAttribute('except-id');
    safeInnerHtml(DebugGui.EXCEPTION_LOOKUP[id], DebugGui.POPUP);
    DebugGui.MODAL.style.display = 'block';
  }

  function hideModal() {
    safeInnerHtml('', DebugGui.POPUP);
    DebugGui.MODAL.style.display = 'none';
  }

  var reportInfoTitleId = 'debug-gui-report-info-title';
  var reportInfoDescId = 'debug-gui-report-info-desc';
  var copyTextId = 'debug-gui-copy-text';

  function copyModal() {
    var reportInfo = '<input id="' + reportInfoTitleId + '" placeholder="title">' +
        '<input type="button" value="Copy" id="' + COPY_BTN_ID + '">' +
        '<textarea placeholder="Text to copy" id="' + copyTextId + '" style="float: right;"></textarea>' +
        "<textarea cols=120 rows=20 id='" + reportInfoDescId + "' placeholder='Description'></textarea><br>";
    displayModalHtml(reportInfo);
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
    var host = DebugGui.client.getHost();

    copyText.value = '<html>\n\t<head>\n\t\t<title>' + title + '</title>' +
      '\n\t\t<script type=\'text/javascript\' src="' + DebugGui.client.getHost() +
      '/js/debug-gui-client.js"></script>' + '\n\t</head>\n\t<body>\n\t\t<h1>' + title +
      '</h1>\n\t\t<b>(Press d + g to open debug-gui)</b>\n\t\t<p>' + desc +
      '</p>' + '\n\t\t<' + TAG_NAME + " url='" + host + "' debug-gui-id='" + getId() +
      "'>\n" + JSON.stringify(DebugGui.DATA, null, 2) + "\n\t\t</" + TAG_NAME + ">" +
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
      DebugGui.DATA[id] = newData[keys[oIndex]];
    }

    DebugGui.DATA[LOGS] = newData[LOGS];
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
     DebugGui.DATA = {};
     for (let index = 0; index < tags.length; index += 1) {
       var tag = tags[index];
       tag.style.display = 'none';
       if (tag.getAttribute('url')) {
         var url = tag.getAttribute('url');
         var id = tag.getAttribute('dg-id');
         if (getHost() != url) {
           DebugGui.client.setHost(url);
         }
       }
       var innerHtml = tags[index].innerHTML.trim();
       if (innerHtml !== "") {
         try {
           var json = JSON.parse(innerHtml);
           DebugGui.DONT_REFRESH = true;
           mergeObject(json);
         } catch (e) {
           console.log(e.stack)
         }
       }
     }

     return DebugGui.DATA;
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
      acorn += `<li><a href='#' except-id='${exceptionId}' class='${DISPLAY_MODAL_BTN_ID}'>
                  ${except.id} - ${except.msg}
                </a></li>`;
      var stacktrace = except.stacktrace === undefined ? "" : except.stacktrace.replace(/\n/g, "<br>");
      DebugGui.EXCEPTION_LOOKUP[exceptionId++] = `<h4>${except.msg}</h4><p>${stacktrace}</p>`;
    }
    if (exceptions.length > 0) {
      return acorn + '</ul></div>';
    }
    return "";
  }

  function buildGui(data, fp, accordionId) {
    var acorn = '';
    accordionId = Math.floor(Math.random() * 1000000000);
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
      var randId = Math.random().toString(36).substring(2);
      var childBlock = buildGui(data[id].children, fp + "-" + randId);
      var targetId = `dg-collapse-${fp}-${randId}`;
      var headingId = `dg-heading-${fp}-${randId}`;
      if (childBlock.trim()) {
        childBlock = `<div style='border-style: double;'>
                        ${childBlock}
                      </div>`
      }
      acorn += `  <div class="card">
          <div class="card-header" id="${headingId}" style='font-size: larger;font-weight: 700;text-align: center;background-color: blue;color: white;padding: 2pt;'>
              <div class="btn btn-link collapsed" data-parent="#${acordId}" type="button" data-toggle="collapse" data-target="#${targetId}" aria-expanded="true" aria-controls="${targetId}">
                ${id}
              </div>
          </div>

          <div id="${targetId}" class="collapse" aria-labelledby="${headingId}" data-parent="#${acordId}">
            <div class="card-body" style='padding: 2pt;'>
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

  function collapseAllDescendents(elem) {
    Array.from(elem.querySelectorAll('.collapse'))
          .forEach((elem) => elem.style.display = 'none');
  }

  function render() {
    var html = buildHeader(buildGui(DebugGui.DATA, 'og'));
    hideEmpties();
    DebugGui.SCC.innerHtml(html);
    document.getElementById(COOKIE_BTN_ID).onclick = createCookie.bind(true);
    collapseAllDescendents(document);
  }

  var numberReg = new RegExp('^[0-9]*$');
  function logWindow(value) {
    var element = document.getElementById('debug-gui-log-window');
    var elementValue = element && element.value.match(numberReg) ? element.value : undefined;

    if (value && value.match(numberReg)) {
      DebugGui.TIME_LIMIT = value;
    } else if (!DebugGui.TIME_LIMIT) {
      var param = getParameter('DebugGui.logWindow');
      param = param && param.match(numberReg) ? param : undefined;
      DebugGui.TIME_LIMIT = param || elementValue || '20';
    } else if (elementValue) {
      DebugGui.TIME_LIMIT = elementValue;
    }
    return DebugGui.TIME_LIMIT;
  }

  function refresh(data) {
    if (data && !(data instanceof MouseEvent)) {
        DebugGui.DATA = data;
        render();
    } else if (!DebugGui.DONT_REFRESH) {
      getData(getHost(), getId());
    }
  }

  function getHost() {
    return DebugGui.client.getHost();
  }

  function createCookie(copy) {
    var cookie = DebugGui.client.createCookie();
    if (copy) {
      copyToClipboard(cookie, "Setup cookie copied to clipboard");
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
    DebugGui.client = new DebugGuiClient.browser();
    if (debug() || isParse) {
      init();
    }
    createCookie();
  }

console.log('dg here')
  window.addEventListener('load', onLoad);
  return {refresh, displayModalHtml, displayLogs, debug, createCookie,
      copyModal, getUrl, copyReport, getId, updateId, updateHost};
}

DebugGui = DebugGui();
DebugGui.EXCEPTION_LOOKUP = {};
DebugGui.UI_EXISTANCE_ID = 'debug-gui-ui-exists-globally-unique-id';

if (document.currentScript &&
  document.currentScript.src.match(/^.*\/debug-gui.js$/)) {
  document.currentScript.id = DebugGui.UI_EXISTANCE_ID;
}
