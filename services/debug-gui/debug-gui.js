var express = require("express");
var fs = require("fs");
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var http = require('http');
var https = require('https');

function endpoints(app, prefix) {
  var dataMap = {};
  var timeLimit = 60000;
  var LOGS = "__LOGS";

  function emptyObj(map) {
      map.exceptions = [];
      map.values = {};
      map.links = {};
  }

  function removeOld(map) {
    var keys = Object.keys(map);
    var isEmpty = true;
    var time = new Date().getTime();
    for (var index = 0; index < keys.length; index += 1) {
        var key = keys[index];
        if (key !== LOGS) {
          var obj = map[key];
          var childEmpty = removeOld(obj.children);
          if (obj.exp < time) {
            emptyObj(obj);
          }
          if (childEmpty && obj.exceptions.length == 0 &&
              Object.keys(obj.values).length == 0 &&
              Object.keys(obj.links).length == 0) {
                delete map[key];
          } else {
            isEmpty = false;
          }
        }
    }
    return isEmpty;
  }

  function removeOldLogs(map) {
    var logs = map[LOGS];
    var time = new Date().getTime();
    var healthy = [];
    for (var index = 0; index < logs.length; index += 1) {
      if (logs[index].exp > time) {
        healthy.push(logs[index]);
      }
    }
    map[LOGS] = healthy;
  }

  function getMap(id, groupRaw) {
    if (!dataMap[id]) {
      dataMap[id] = {};
      dataMap[id][LOGS] = [];
    }
    var map = dataMap[id];
    if (!groupRaw) {
      return map;
    }

    var groupPath = groupRaw.split('.');
    for (var index = 0; index < groupPath.length; index += 1) {
      var group = groupPath[index];
      if (!map[group]) {
        map[group] = {};
        emptyObj(map[group]);
        map[group].children = {};
      }
      if (index != groupPath.length - 1) {
        map = map[group].children;
      }
    }

    map[group].exp = new Date().getTime() + timeLimit;
    if (map[group]) {
      return map[group];
    }
    return {};
  }

  app.post(prefix + "/exception/:id/:group", function (req, res) {
      const id = req.params.id;
      const group = req.params.group;
      getMap(id, group).exceptions.push(req.body);

      res.send('success');
  });

  app.post(prefix + "/link/:id/:group/", function (req, res) {
      const id = req.params.id;
      const group = req.params.group;
      const label = req.body.label;
      const url = req.body.url;
      getMap(id, group).links[label] = url;

      res.send('success');
  });

  app.post(prefix + "/value/:id/:group", function (req, res) {
      const id = req.params.id;
      const group = req.params.group;
      const key = req.body.key;
      const value = req.body.value;
      getMap(id, group).values[key] = value;

      res.send('success');
  });

  app.post(prefix + "/log/:id", function (req, res) {
      const id = req.params.id;
      const log = req.body.log;
      getMap(id)[LOGS].push({log, exp: new Date().getTime() + timeLimit});

      res.send('success');
  });

  app.get(prefix + "/:id", function (req, res) {
      const id = req.params.id;

      var map = getMap(id);
      console.log("map: " + JSON.stringify(map, null, 2))

      removeOld(map);
      removeOldLogs(map);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(map));
  });

  app.get(prefix + "/time/limit", function (req, res) {
    res.send("" + timeLimit / 1000);
  });

  app.get(prefix + "/msg/:msg", function (req, res) {
    const msg = req.params.msg;
    console.log(msg);
    res.send("success");
  });

  app.get(prefix + "/time/limit/:newTime", function (req, res) {
    var newTime = Number.parseInt(req.params.newTime);
    if (Number.isInteger(newTime)) {
      timeLimit = newTime * 1000;
      res.send(200);
    }
    res.send(400);
  });
}

exports.endpoints = endpoints;
