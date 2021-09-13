

Request = {
    onStateChange: function (success, failure, id) {
      return function () {
        if (this.readyState == 4) {
          if (this.status == 200) {
            try {
              resp = JSON.parse(this.responseText);
            } catch (e){
              resp = this.responseText;
            }
            if (success) {
              success(resp, this);
            }
          } else if (failure) {
            const errorMsgMatch = this.responseText.match(Request.errorMsgReg);
            if (errorMsgMatch) {
              this.errorMsg = errorMsgMatch[1].trim();
            }
            const errorCodeMatch = this.responseText.match(Request.errorCodeReg);
            if (errorCodeMatch) {
              this.errorCode = errorCodeMatch[1];

            }
            failure(this);
          }
          var resp = this.responseText;
        }
      }
    },

    id: function (url, method) {
      return `request.${method}.${url.replace(/\./g, ',')}`;
    },

    get: function (url, success, failure) {
      const xhr = new Request.xmlhr();
      xhr.open("GET", url, true);
      const id = Request.id(url, 'GET');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
      Request.setGlobalHeaders(xhr);
      if (success === undefined && failure === undefined) return xhr;
      xhr.onreadystatechange =  Request.onStateChange(success, failure, id);
      xhr.send();
      return xhr;
    },

    hasBody: function (method) {
      return function (url, body, success, failure) {
        const xhr = new Request.xmlhr();
        xhr.open(method, url, true);
        const id = Request.id(url, method);
        xhr.setRequestHeader('Content-Type', 'application/json');
        Request.setGlobalHeaders(xhr);
        if (success === undefined && failure === undefined) return xhr;
        xhr.onreadystatechange =  Request.onStateChange(success, failure, id);
        xhr.send(JSON.stringify(body));
        return xhr;
      }
    },

    post: function () {return Request.hasBody('POST')(...arguments)},
    delete: function () {return Request.hasBody('DELETE')(...arguments)},
    options: function () {return Request.hasBody('OPTIONS')(...arguments)},
    head: function () {return Request.hasBody('HEAD')(...arguments)},
    put: function () {return Request.hasBody('PUT')(...arguments)},
    connect: function () {return Request.hasBody('CONNECT')(...arguments)},
}

Request.errorCodeReg = /Error Code:([a-zA-Z0-9]*)/;
Request.errorMsgReg = /[a-zA-Z0-9]*?:([a-zA-Z0-9 ]*)/;
const globalHeaders = {};
Request.globalHeader = (header, funcOval) => {
  globalHeaders[header] = funcOval;
}
Request.setGlobalHeaders = (xhr) => {
  const headers = Object.keys(globalHeaders);
  headers.forEach((header) =>
    xhr.setRequestHeader(header, Function.orVal(globalHeaders[header], xhr)));
}
try {
  Request.xmlhr = XMLHttpRequest;
} catch (e) {
  Request.xmlhr = require('xmlhttprequest').XMLHttpRequest;
}

module.exports = Request;
