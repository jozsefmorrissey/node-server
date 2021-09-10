
const Endpoints = require('../../../public/js/utils/endpoints.js');
module.exports = new Endpoints(require('../public/json/endpoints.json'));

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
  "patterns": {
    "save": "/patterns/save",
    "get": "/patterns/get"
  },
  "properties": {
    "save": "/properties/save",
    "get": "/properties/get"
  },
  "templates": {
    "save": "/templates/save",
    "get": "/templates/get"
  },
  "order": {
    "add": "/order/:id",
    "get": "/order/:id",
    "list": "/list/orders"
  },
  "export": {
    "dxf": "/export/dxf"
  }
}
, 'http://localhost:3000/cabinet').getFuncObj();
try {exports.EPNTS = EPNTS;}catch(e){}