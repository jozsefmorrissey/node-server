const Endpoints = require('../../../public/js/utils/endpoints.js');
const json = require('../public/json/endpoints.json');
module.exports = new Endpoints(json, 'local').getFuncObj();