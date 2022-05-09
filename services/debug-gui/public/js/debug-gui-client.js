
function DebugGuiClient(config, root, debug) {
  config = config || {};
  var instance = this;
  var host = config.host;
  var httpHost = config.httpHost;
  var httpsHost = config.httpsHost;
  var id = config.id;
  var logWindow = config.logWindow || 25;

  debug = debug || config.debug || config.debug === 'true' || false;

  this.getId = function () {return id;}
  this.setId = function (value) {id = value; createCookie();}
  this.setHost = function (value) {host = value; createCookie();}

  function secure() {host = httpsHost;}
  function insecure() {host = httpHost;}
  function getHost() {return host;}
  function setRoot(r) {root = r;}
  function getRoot() {return root;}

  function path(str) {
    if (str) {
      return str + "/";
    }
    return "";
  }

  function prefixRoot(group) {
    return root + "." + group;
  }

  function softUpdate(config) {
    config.id = id || config.id;
    config.host = host || config.host;
    config.httpHost = httpHost || config.httpHost;
    config.httpsHost = httpsHost || config.httpsHost;
    updateConfig(config);
  }

  var guiAdded = false;
  function updateConfig(config) {
    id = config.id !== undefined ? config.id : id;
    httpHost = config.httpHost || httpHost;
    httpsHost = config.httpsHost || httpsHost;
    config.debug = String(config.debug);
    debug = config.debug.trim().match(/^(true|false)$/) ? config.debug : debug;
    debug = debug === true || debug === 'true';
    host = config.host !== undefined ? config.host : host;
    if (host !== undefined) host = host.replace(/^(.*?)\/$/, "$1");
    logWindow = logWindow != 25 ? logWindow : config.logWindow;
    createCookie();
  }

  function getUrl(host, ext, id, group) {
    host = path(host);
    ext = path(ext);
    id = path(id);
    group = group ? group.replace(/\//g, '%2F').replace(/\s/g, '%20') : undefined;
    group = path(group);

    var url = host + ext + id + group;
    return url.substr(0, url.length - 1);
  }

  function exception(group, exception, soft) {
    const exObj = {id: id, msg: exception.toString(), stacktrace: exception.stack}
    var xhr = new DebugGuiClient.xmlhr();
    xhr.open("POST", getUrl(host, 'exception', id, prefixRoot(group)), true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (soft !== true) {
      console.error(group + ' - threw the following exception\n\t' + exception);
    }
    xhr.send(JSON.stringify(exObj));
  }

  function data(onSuccess) {
    var xhr = new DebugGuiClient.xmlhr();
    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        console.error('dg resp', this.responseText);
        if (this.status == 200) {
            var data = JSON.parse(this.responseText);
            if (onSuccess) {
              onSuccess(data);
            }
        }
    };

    xhr.open('GET', getUrl(host, id), true);
    xhr.send();
  }

  function link(group, label, url) {
    if (debug) {
      var xhr = new DebugGuiClient.xmlhr();
      xhr.open("POST", getUrl(host, "link", id, prefixRoot(group)), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({label, url}));
    }
    return instance;
  }

  function value(group, key, value) {
    if (debug) {
      var xhr = new DebugGuiClient.xmlhr();
      xhr.open("POST", getUrl(host, "value", id, prefixRoot(group)), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if ((typeof value) === 'object') value = JSON.stringify(value, null, 2);
      xhr.send(JSON.stringify({key, value}));
    }
    return instance;
  }

  function logs() {
    if (debug) {
      var log = '';
      for (let i = 0; i < arguments.length; i++) {
        if ((typeof arguments[i]) === 'object') {
          log += JSON.stringify(arguments[i], null, 6);
        } else {
          log += arguments[i];
        }
      }
      var xhr = new DebugGuiClient.xmlhr();
      var url = getUrl(host, "log", id);
      xhr.open("POST", url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({log}));
    }
    return instance;
  }

  function log(log) {
    logs(log);
  }


  function isDebugging() {
    return debug;
  }

  this.toString = function () {
    var id = instance.getId() || '';
    var host = instance.getHost() || '';
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
    return cookie + "|host=" +
        host + "|httpHost="  + httpHost + "|httpsHost=" + httpsHost + "|debug=" + isDebugging();
  }

  this.addHeaderXhr = function (xhr) {
    if (debug) {
      xhr.setRequestHeader('debug-gui', instance.toString());
    }
  }

  function createCookie() {
    if (!instance.getId() || !instance.getHost()) return;
    if (DebugGuiClient.inBrowser) {
      var cookie;
      if (instance.isDebugging()) {
        cookie = 'DebugGui=' + instance.toString() + ";";
      } else {
        cookie = 'DebugGui=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      document.cookie = cookie;
      return cookie;
    }
  }

  this.link = link;
  this.value = value;
  this.exception = exception;
  this.getHost = getHost;
  this.logs = logs;
  this.log = log;
  this.updateConfig = updateConfig;
  this.softUpdate = softUpdate;
  this.isDebugging = isDebugging;
  this.secure = secure;
  this.insecure = insecure;
  this.setRoot = setRoot;
  this.getRoot = getRoot;
  this.cache = () => DebugGuiClient.clients[id] = this;
  this.trash = () => DebugGuiClient.clients[id] = undefined;
  this.createCookie = createCookie;
}

{

  DebugGuiClient.EXISTANCE_ID = 'debug-gui-exists-globally-unique-id';

  const dummyClient = new DebugGuiClient();
  function staticCall(funcName) {
    return (id) => {
      const args = Array.from(arguments).splice(1);
      const realClient = DebugGuiClient.clients[id];
      realClient ? realClient[funcName].apply(realClient, args) :
          dummyClient[funcName].apply(dummyClient, args);
    }
  }

  DebugGuiClient.clients = {};
  function createStaticInterface() {
    const funcNames = Object.keys(dummyClient);
    for (var index = 0; index < funcNames.length; index += 1) {
      const funcName = funcNames[index];
      DebugGuiClient[funcName] = staticCall(funcName);
    }
  }

  // Copied from https://jozsefmorrissey.com/js/ju.js
  function parseSeperator (str, seperator, isRegex) {
    if ((typeof str) !== 'string') {
      return {};
    }
    if (isRegex !== true) {
      seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
    }
    var keyValues = str.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
    var json = {};
    for (let index = 0; keyValues && index < keyValues.length; index += 1) {
      var split = keyValues[index].match(new RegExp('\\s*(.*?)\\s*=\\s*(.*?)\\s*(' + seperator + '|$)'));
      if (split) {
        json[split[1]] = split[2];
      }
    }
    return json;
  }

  // Copied from https://jozsefmorrissey.com/js/ju.js
  function arrayMatches(array, regExp) {
    var matches = [];
    for (var index = 0; index < array.length; index += 1) {
      var elem = new String(array[index]);
      var match = elem.match(regExp);
      if (match) {
        if (arguments.length > 2) {
          var obj = {};
          for (var aIndex = 2; aIndex < arguments.length; aIndex += 1) {
              if ((typeof arguments[aIndex]) === 'string' ) {
                obj[arguments[aIndex]] = match[aIndex - 1];
              }
          }
          matches.push(obj);
        } else {
          matches.push(array[index]);
        }
      }
    }
    return matches;
  }

  function getParameter(params) {
    if ((typeof params) === 'string') {
      params = parseSeperator(params, '&');
    }
    if ((typeof params) === 'object') {
      var id = params['DebugGui.id'];
      var debug = params['DebugGui.debug'];
      var host = params['DebugGui.host'];
      return {id, debug, host};
    }
    DebugGuiClient.debugger.exception('', new Error('Param value must be a string or object'));
    return {};
  }

  function getCookie(cookies) {
    if (cookies === undefined) {
      return {};
    } else if ((typeof cookies) === 'string') {
      var cookieObj = parseSeperator(cookies, ';');
      return parseSeperator(cookieObj.DebugGui, '|');
    }
    DebugGuiClient.debugger.exception('', new Error('Cookies should be expressed as a string'));
  }

  function getCookieFromValue(value) {
    return parseSeperator(value, '|');
  }

  function getHeaderOrCookie(headers) {
    if (headers['debug-gui']) {
      return parseSeperator(headers['debug-gui'], '|');
    } else if (headers.cookie) {
      return getCookie(headers.cookie);
    }
    // DebugGuiClient.debugger.exception('', new Error('Neither a cookie "DebugGui" or a header "debug-gui" are defined'));
    return {};
  }

  function express(req, root) {
    if (req === undefined) return new DebugGuiClient({}, root);
    if (req.debugGui) return req.debugGui;
    var config = getHeaderOrCookie(req.headers);
    var debugGui = new DebugGuiClient(config, root);
    config = getParameter(req.params);
    debugGui.updateConfig(config);
    return debugGui;
  }

  var tagConf = undefined;
  function tagConfig() {
    const scriptTag = document.querySelector(`script#${DebugGuiClient.EXISTANCE_ID}`);
    if (scriptTag) {
      function getScriptAttr(name) {
        var attr = scriptTag.getAttribute(name);
        return attr ? attr : undefined;
      }
      tagConf = tagConf || {
        host: getScriptAttr('host'),
        debug: getScriptAttr('debug'),
        logWindow: getScriptAttr('log-window')
      };
      return tagConf;
    }
    return {};
  }

  function browser(root, programaticConfig) {
    var debugGui = new DebugGuiClient();
    debugGui.updateConfig(tagConfig());
    if (programaticConfig) debugGui.updateConfig(programaticConfig);
    var config = getCookie(document.cookie);
    debugGui.updateConfig(config);
    var params = window.location.href.replace(/^.*?\?(.*?)(#|)$|^.*$()/, '$1');
    config = getParameter(params);
    debugGui.updateConfig(config);
    debugGui.createCookie();
    debugGui.setRoot(root);
    return debugGui;
  }

  function node(args) {
    var config = require(global.__basedir + '/.debug-gui.json');
    var argMatches = arrayMatches.apply(undefined, [args, new RegExp(config.debugArg), undefined, 'id']);
    if (argMatches.length > 0) {
      config.debug = true;
      if (argMatches[0].id) {
        config.id = argMatches[0].id;
      }
    }
    var debugGui = new DebugGuiClient(config);

    return debugGui;
  }


  DebugGuiClient.debugger = new DebugGuiClient({id: 'DebugGui' });
  DebugGuiClient.getParameter = getParameter;
  DebugGuiClient.getCookie = getCookie;
  DebugGuiClient.getCookieFromValue = getCookieFromValue;
  DebugGuiClient.getHeaderOrCookie = getHeaderOrCookie;
  DebugGuiClient.express = express;
  DebugGuiClient.browser = browser;
  DebugGuiClient.node = node;
}

try {
  DebugGuiClient.xmlhr = XMLHttpRequest;
  DebugGuiClient.inBrowser = true;
} catch (e) {
  DebugGuiClient.inBrowser = false;
  DebugGuiClient.xmlhr = require('xmlhttprequest').XMLHttpRequest;
}

if (!DebugGuiClient.inBrowser) {
  exports.DebugGuiClient = DebugGuiClient;
} else {
  DebugGuiClient.UI_EXISTANCE_ID = 'debug-gui-ui-exists-globally-unique-id';
  if (document.currentScript &&
    document.currentScript.src.match(/^.*\/debug-gui-client.js$/)) {
    document.currentScript.id = DebugGuiClient.EXISTANCE_ID;
  }
  var dg = DebugGuiClient.browser('default');
}
