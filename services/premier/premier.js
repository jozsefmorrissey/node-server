
const shell = require('shelljs');
require('./../../public/js/utils/utils.js')
const FROM_JSON = require('./src/utils').FROM_JSON;

const DrawerBox = require('./src/objects/lookup/drawer-box');

function endpoints(app, prefix) {
  app.post(prefix + '/drawer/box/quote', function (req, res, next) {
    const drawerBox = FROM_JSON(req.body);
    console.log(drawerBox.toJson());
    res.send(`$${drawerBox.cost()}`);
  });
}


exports.endpoints = endpoints;
