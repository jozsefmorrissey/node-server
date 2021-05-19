
class Endpoints {
  constructor(config, host) {
    const instance = this;

    if ((typeof config) !== 'object') {
      host = config;
      config = Endpoints.defaultConfig;
    }

    host = host || '';
    this.setHost = (newHost) => {
      if ((typeof newHost) === 'string') {
        host = config._envs[newHost] || newHost;
      }
    };
    this.setHost(host);
    this.getHost = (env) => env === undefined ? host : config._envs[env];

    const endPointFuncs = {setHost: this.setHost, getHost: this.getHost};
    this.getFuncObj = function () {return endPointFuncs;};


    function build(str) {
      const pieces = str.split(/:[a-zA-Z0-9]*/g);
      const labels = str.match(/:[a-zA-Z0-9]*/g) || [];
      return function () {
        let values = [];
        if (arguments[0] === null || (typeof arguments[0]) !== 'object') {
          values = arguments;
        } else {
          const obj = arguments[0];
          labels.map((value) => values.push(obj[value.substr(1)] !== undefined ? obj[value.substr(1)] : value))
        }
        let endpoint = '';
        for (let index = 0; index < pieces.length; index += 1) {
          const arg = values[index];
          let value = '';
          if (index < pieces.length - 1) {
            value = arg !== undefined ? encodeURIComponent(arg) : labels[index];
          }
          endpoint += pieces[index] + value;
        }
        return `${host}${endpoint}`;
      }
    }

    function configRecurse(currConfig, currFunc) {
      const keys = Object.keys(currConfig);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const value = currConfig[key];
        if (key.indexOf('_') !== 0) {
          if (value instanceof Object) {
            currFunc[key] = {};
            configRecurse(value, currFunc[key]);
          } else {
            currFunc[key] = build(value);
          }
        } else {
          currFunc[key] = value;
        }
      }
    }

    configRecurse(config, endPointFuncs);
  }
}

try {
  Endpoints.defaultConfig = require('../public/json/endpoints.json');
  exports.EPNTS = new Endpoints(Endpoints.defaultConfig).getFuncObj();
  exports.Endpoints = Endpoints;
} catch (e) {}

const EPNTS = new Endpoints({
  "_envs": {
    "local": "http://localhost:3000/cabinet",
    "dev": "https://dev.jozsefmorrissey.com/cabinet",
    "prod": "https://node.jozsefmorrissey.com/cabinet"
  },
  "user": {
    "register": "/register",
    "resendActivation": "/resend/activation",
    "activate": "/activate/:email/:secret",
    "validate": "/validate",
    "login": "/login",
    "status": "/status",
    "resetPasswordRequest": "/reset/password/request",
    "resetPassword": "/reset/password/:email/:secret"
  },
  "cabinet": {
    "add": "/:id",
    "list": "/all"
  },
  "costs": {
    "save": "/costs/save",
    "get": "/costs/get"
  },
  "order": {
    "add": "/order/:id",
    "get": "/order/:id",
    "list": "/list/orders"
  }
}
, 'http://localhost:3000/cabinet').getFuncObj();
try {exports.EPNTS = EPNTS;}catch(e){}