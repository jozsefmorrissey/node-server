

function endpoints(app, prefix) {
  app.post(prefix + '/drawer/box/quote', function (req, res, next) {
    res.send(`$${drawerBox.cost()}`);
  });
}


exports.endpoints = endpoints;
