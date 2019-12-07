var express = require("express");
var fs = require("fs");
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var http = require('http');
var https = require('https');

var config = require('./config.json');

function endpoints(app, prefix) {
  var dataMap = {};
  var removeAfter = config.removeIntervalMinutes * 60 * 1000;
  var LOGS = "__LOGS";
  const createdAt = {};

  function emptyObj(map) {
      map.exceptions = [];
      map.values = {};
      map.links = {};
  }

  function getRelevantMap(map, addedTime) {
    var targetTime = new Date().getTime() - addedTime;
    var relMap = getRelevantKeys(targetTime, map);
    relMap[LOGS] = getRelevantLogs(targetTime, map);
    return relMap;
  }

  function cleanArray(targetTime, array) {
    var cleanArr = [];
    for (let index = 0; index < array.length; index += 1) {
      if (array[index].time > targetTime) {
        cleanArr.push(array[index]);
      }
    }

    return cleanArr;
  }

  function cleanObject(targetTime, object) {
    var cleanObj = {};
    const keys = Object.keys(object);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (object[key].time > targetTime) {
        cleanObj[key] = object[key];
      }
    }
    return cleanObj;
  }

  function getRelevantKeys(targetTime, map) {
    if (map == undefined) return {};
    const relMap = {};
    var keys = Object.keys(map);
    var time = new Date().getTime();
    for (var index = 0; index < keys.length; index += 1) {
        var key = keys[index];
        if (key !== LOGS && map[key]) {
          relMap[key] = {};
          var obj = map[key];
          relMap[key].children = getRelevantKeys(targetTime, obj.children);
          relMap[key].exceptions = cleanArray(targetTime, obj.exceptions);
          relMap[key].links = cleanObject(targetTime, obj.links);
          relMap[key].values = cleanObject(targetTime, obj.values);
          if (relMap[key].exceptions.length == 0 &&
              Object.keys(relMap[key].values).length == 0 &&
              Object.keys(relMap[key].children).length == 0 &&
              Object.keys(relMap[key].links).length == 0) {
            delete relMap[key];
          }
        }
    }
    return relMap;
  }

  function getRelevantLogs(targetTime, map) {
    var logs = map[LOGS];
    var relevant = [];
    for (var index = 0; index < logs.length; index += 1) {
      if (logs[index].time > targetTime) {
        relevant.push(logs[index]);
      }
    }
    return relevant;
  }

  // TODO: itterate through and remove expired
  var removeInterval = removeAfter * 2;
  var lastRemoval = 0;
  function deleteOutdated() {
    if (lastRemoval < new Date().getTime() - removeInterval) {
      lastRemoval = new Date().getTime();
      var ids = Object.keys(dataMap);
      for (var index = 0; index < ids.length; index += 1) {
        var id = ids[index];
        dataMap[id] = getRelevantMap(dataMap[id], removeAfter);
      }
      console.log(lastRemoval);
      console.log(new Date().getTime() - removeInterval);
      console.log('cleaned');
    }
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

    if (map[group]) {
      return map[group];
    }
    return {};
  }

  function updateCreatedAt(type, id, group) {
    if (createdAt[type] === undefined) {
      createdAt[type] = {};
    }
    if (createdAt[type][id] === undefined) {
      createdAt[type][group] = {};
    }
    createdAt
  }

  app.post(prefix + "/exception/:id/:group", function (req, res) {
      const id = req.params.id;
      const group = req.params.group;
      req.body.time = new Date().getTime();
      getMap(id, group).exceptions.push(req.body);

      res.send('success');
  });

  app.post(prefix + "/link/:id/:group/", function (req, res) {
      const id = req.params.id;
      const group = req.params.group;
      const label = req.body.label;
      const url = req.body.url;
      const time = new Date().getTime();
      getMap(id, group).links[label] = { url, time };

      res.send('success');
  });

  app.post(prefix + "/value/:id/:group", function (req, res) {
      const id = req.params.id;
      const group = req.params.group;
      const key = req.body.key;
      const value = req.body.value;
      const time = new Date().getTime();
      getMap(id, group).values[key] = { value, time };

      res.send('success');
  });

  app.post(prefix + "/log/:id", function (req, res) {
    const id = req.params.id;
    const log = req.body.log;
    const time = new Date().getTime();
    getMap(id)[LOGS].push({ log, time });

    res.send('success');
  });

  app.get(prefix + "/:id/:logWindow", function (req, res) {
    const id = req.params.id;
    const logWindow = Number.parseInt(req.params.logWindow);

    var map = getMap(id);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(getRelevantMap(map, logWindow * 1000)));
    deleteOutdated();
  });
}

exports.endpoints = endpoints;
