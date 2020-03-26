function TF() {
  var LOADERS = {};
  var config = {indeedProfileId: 'jozsefm-gy33uai'};

  function add(transferFiller) {
    LOADERS[transferFiller.getId()] = transferFiller;
  }

  function loaderSorter(loader1, loader2) {
    if (loader1 === loader2) {
      return 0;
    }
    if (loader1 === undefined || loader2 === undefined) {
      return loader1 === undefined ? -1 : 1;
    }
    return loader1.getUrl() > loader2.getUrl();
  }

  function readers() {
    var willWrite = writers();
    var loaders = Object.values(LOADERS);
    var availible = {};
    for (let index = 0; index < loaders.length; index += 1) {
      var loader = loaders[index];
      for (let wIndex = 0; wIndex < willWrite.length; wIndex += 1) {
        var writer = willWrite[wIndex];
        if (ju.object.matches(loader.getTemplate, writer.getTemplate())) {
          availible[loader.getId()] = loader;
        }
      }
    }
    return Object.values(availible);
  }

  function writers() {
    var loaders = Object.values(LOADERS);
    var availible = [];
    for (let index = 0; index < loaders.length; index += 1) {
      var loader = loaders[index];
      if (loader.canLoad()) {
        availible.push(loader);
      }
    }
    availible.sort(loaderSorter);
    return availible;
  }

  var functionCall = 'TransferFill(url, cmd, func, flags:optional);';
  function help () {
    var intro = 'This script was desiged to load data (picked up by grease monkey) from another site.\n';
    var loaders = availibleTransferFills();
    if (loaders.length === 0) {
      intro += 'This webpage does not have any availible loaders.\n';
      intro += 'List All.\n';
      loaders = Object.values(LOADERS);
    }
    var currentUrl = undefined;
    for (var index = 0; index < loaders.length; index += 1) {
      var loader = loaders[index];
      if (currentUrl !== loader.getUrl()) {
        intro += '\n\t' + loader.getUrl();
        currentUrl = loader.getUrl();
      }
      // var flagStr = ' [-' + loader.getFlags().join('|-') + ']';
      // flagStr = flagStr.length > 4 ? flagStr : '';
      // intro += '\n\t\t' + loader.getCmd() + flagStr;
      // var saveLocs = loader.getSaveLocations();
      // for (let sIndex = 0; sIndex < saveLocs.length; sIndex += 1) {
      //   intro += '\n\t\t\t' + saveLocs[sIndex];
      // }
    }
    console.log(intro);
  }

  function load(cmd) {
    // var flags = Array.prototype.slice.call(arguments, 1);
    if (cmd === undefined) {
      help();
    } else {
      run(cmd);
    }
  }

  return { add, help, readers, writers, config };
}

var TF = TF();


function TransferFill(url, cmd, update, get, template) {
  if (url === undefined || cmd === undefined || update === undefined ||
        get === undefined) {
    throw 'url, cmd, and func: must be defined - ' + functionCall;
  }

  function isEndpoint(url) {
    return getEndpointId(window.location.href) === getEndpointId(url);
  }

  function getEndpointId(url) {
    var endpoint = url.replace(/\/#!/g, '');
    var endpoint = url.replace(/\/#\//g, '/');
    return endpoint.replace(/(.*?)(\?|#).*/g, "$1");
  }

  function getDataId(url, cmd) {
    return (getEndpointId(url) + '-' + cmd).replace(/[\/.:]{1,}/g, '-').toLowerCase();
  }

  var id = getDataId(url, cmd);

  function canLoad(loadUrl) {
    loadUrl = loadUrl || window.location.href;
    return getEndpointId(loadUrl) === getEndpointId(url);
  }

  function isCmd(testCmd) {
    return cmd === testCmd;
  }

  function getInputData() {
    var inputData = [];
    return inputData;
  }

  function load() {
    var inputData = getInputData();
    if (inputData.length === 1) {
      update(inputData[0], arguments);
    }
    throw 'script not setup for multiple inputs';
  }

  function getUrl() {return url;}
  function getCmd() {return cmd;}
  function getId() {return id;}
  function getTemplate() {return template;}

  this.canLoad = canLoad;
  this.isCmd = isCmd;
  this.load = load;
  this.getUrl = getUrl;
  this.getCmd = getCmd;
  this.getId = getId;
  this.get = get;
  this.getTemplate = getTemplate;
  this.update = update;
  TF.add(this);
  return this;
}
