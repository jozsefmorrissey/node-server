function DebugGuiClient() {
    var host = window.location.origin + "/debug-gui";

    function setHost(newHost) {
      host = newHost;
    }

    function path(str) {
      if (str) {
        return str + "/";
      }
      return "";
    }

    function exception(id, group, exception) {
      const exObj = {id, msg: exception.toString(), stacktrace: exception.stack}
      var xhr = new XMLHttpRequest();
      xhr.open("POST", DebugGui().getUrl(host, id, group, 'exception'), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(exObj));
    }

    function data(id, onSuccess) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
          if (this.readyState != 4) return;

          if (this.status == 200) {
              var data = JSON.parse(this.responseText);
              console.log(data);
              if (onSuccess) {
                onSuccess(data);
              }
          }
      };

      xhr.open('GET', DebugGui().getUrl(host, id), true);
      xhr.send();
    }

    function link(id, group, label, url) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", DebugGui().getUrl(host, id, group, "link"), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({label, url}));
    }

    function value(id, group, key, value) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", DebugGui().getUrl(host, id, group, "value"), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({key, value}));
    }

    function log(id, log) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", DebugGui().getUrl(host, "log", id), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({log}));
    }

    return {data, link, value, exception, setHost, log};
}
