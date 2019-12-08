function DebugGuiClient(root) {
    var host = window.location.origin + "/debug-gui";
    var id;
    var root = root || "Default";

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

    function exception(group, exception) {
      const exObj = {id: DebugGui.getId(), msg: exception.toString(), stacktrace: exception.stack}
      var xhr = new XMLHttpRequest();
      xhr.open("POST", DebugGui.getUrl(host, 'exception', DebugGui.getId(), prefixRoot(group)), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(exObj));
    }

    function data(onSuccess) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
          if (this.readyState != 4) return;

          if (this.status == 200) {
              var data = JSON.parse(this.responseText);
              if (onSuccess) {
                onSuccess(data);
              }
          }
      };

      xhr.open('GET', DebugGui.getUrl(host, DebugGui.getId()), true);
      xhr.send();
    }

    function link(group, label, url) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", DebugGui.getUrl(host, "link", DebugGui.getId(), prefixRoot(group)), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({label, url}));
    }

    function value(group, key, value) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", DebugGui.getUrl(host, "value", DebugGui.getId(), prefixRoot(group)), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({key, value}));
    }

    function log(log) {
      var xhr = new XMLHttpRequest();
      var url = DebugGui.getUrl(host, "log", DebugGui.getId());
      xhr.open("POST", url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({log}));
    }

    return {link, value, exception, setHost, log, setRoot};
}

var dg = DebugGuiClient();
