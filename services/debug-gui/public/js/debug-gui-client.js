function DebugGuiClient(config, root, debug) {
  config = config || {};
  var host = config.host;
  var id = config.id;
  var logWindow = config.logWindow || 25;

  debug = debug || config.debug || config.debug === 'true' || false;

  function setHost(newHost) {
    host = newHost;
  }

  function setRoot(r) {
    root = r;
  }

  function path(str) {
    if (str) {
      return str + "/";
    }
    return "";
  }

  function prefixRoot(group) {
    return root + "." + group;
  }

  function updateConfig(config) {
    id = config.id !== undefined ? config.id : id;
    config.debug = String(config.debug);
    debug = config.debug.trim().match(/^(true|false)$/) ? config.debug : debug;
    debug = debug === true || debug === 'true';
    host = config.host !== undefined ? config.host : host;
    if (host !== undefined) host = host.replace(/^(.*?)\/$/, "$1");
    logWindow = logWindow != 25 ? logWindow : config.logWindow;
  }

  function getUrl(host, ext, id, group) {
    host = path(host);
    ext = path(ext);
    id = path(id);
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
    return this;
  }

  function value(group, key, value) {
    if (debug) {
      var xhr = new DebugGuiClient.xmlhr();
      xhr.open("POST", getUrl(host, "value", id, prefixRoot(group)), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({key, value}));
    }
    return this;
  }

  function log(log) {
    if (debug) {
      var xhr = new DebugGuiClient.xmlhr();
      var url = getUrl(host, "log", id);
      xhr.open("POST", url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({log}));
    }
    return this;
  }

  function isDebugging() {
    return debug;
  }

  this.getHost = function () {return host;}
  this.getId = function () {return id;}
  this.setId = function (value) {id = value;}
  this.setHost = function (value) {host = value;}

  function createCookie(copy) {
    var id = this.getId();
    var host = this.getHost();
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
        host + "|httpHost="  + httpHost + "|httpsHost=" + httpsHost + "|debug=" + isDebugging();

    if (this.isDebugging()) {
      document.cookie = 'DebugGui=' + setupCookie;
    } else {
      document.cookie = 'DebugGui=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    if (copy) {
      copyToClipboard(setupCookie, "Setup cookie copied to clipboard");
    }
  }

  this.link = link;
  this.value = value;
  this.exception = exception;
  this.setHost = setHost;
  this.log = log;
  this.updateConfig = updateConfig;
  this.isDebugging = isDebugging;
  this.setRoot = setRoot;
  this.createCookie = createCookie;
}

{
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
      var split = keyValues[index].match(new RegExp('(.*?)=(.*?)(' + seperator + '|$)'));
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
    var config = getHeaderOrCookie(req.headers);
    var debugGui = new DebugGuiClient(config, root);
    config = getParameter(req.params);
    debugGui.updateConfig(config);
    return debugGui;
  }

  var tagConf = undefined;
  function tagConfig() {
    function getScriptAttr(name) {
      var attr = document.currentScript.attributes[name];
      return attr ? attr.value : undefined;
    }
    tagConf = tagConf || {
      id: getScriptAttr('identity'),
      host: getScriptAttr('host'),
      debug: getScriptAttr('debug'),
      logWindow: getScriptAttr('log-window')
    };
    return tagConf;
  }

  function browser(root) {
    var debugGui = new DebugGuiClient();
    debugGui.updateConfig(tagConfig());
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
  var dg = DebugGuiClient.browser('default');
  if (dg.isDebugging()) {
    var script = document.createElement("script");
    var src = document.currentScript.attributes['src'].value;
    script.src = src.replace(/-client/, '');
    document.head.appendChild(script);
  }
}
