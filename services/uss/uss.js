const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const nodeUtils = require('../../public/js/node-utils.js');
const uuidv4 = require('uuid/v4')

var USER_SERVER = 'USER_SERVER';
var url = "mongodb://localhost:27017/";


let usDBo;
let mongoConnection;

MongoClient.connect(url, { useUnifiedTopology: true } , function(err, db) {
  if (err) throw err;
  // db.createCollection(USER_SERVER, { capped : true, autoIndexId : true, size : 6142800, max : 10000 });
  mongoConnection = db;
  usDBo = db.db(USER_SERVER).collection(USER_SERVER);
});

function endpoints (app, prefix) {
  app.get(prefix + '/redirect/:id', function (req, res) {
    const id = req.params.id;
    usDBo.findOne({id}, function(err, result) {
    if (err) throw err;
    console.log(result);
    res.send(result);
    });
  });

  app.get(prefix + '/request/:server', function (req, res) {
    var id = uuidv4();
    const server = req.params.server;
    console.log(usDBo);
    usDBo.update({id}, { id, server }, {upsert: true},
    function(err, result) {
      if (err) throw err;
      res.send(id);
    });
  });
}

function gracefulShutdown() {
//  mongoConnection.close();
  process.exit();
}

nodeUtils.onExit(gracefulShutdown, 'exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException');

exports.endpoints = endpoints;
