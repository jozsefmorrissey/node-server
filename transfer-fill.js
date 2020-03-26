// DO NOT MODIFY: file is generated

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
        if (ju.object.matches(loader.getTemplate(), writer.getTemplate())) {
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
function anotherTest() {}
//dice

function diceClickAddSkill() {
  var addSkillBtn = document.getElementById('addSkillBtn');
  if (addSkillBtn) {
    addSkillBtn.click();
  }
}

function diceRemoveSkill() {
  function remove() {
    var skillElems = ju.object.getElementByIdReg(document, 'removeSkillBtn[0-9]*');
    for (var index = 0; index < skillElems.length; index += 1) {
      skillElems[index].click();
    }
  }
  diceClickAddSkill();
  setTimeout(remove, 5000);
}


function diceAddSkills(list) {
  function addOne(data) {
    return function () {
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent("change", false, true);

      var skill = document.getElementById('newSkillName');
      skill.value = data.skill;
      skill.dispatchEvent(evt);

      var exp = document.getElementById('newSkillYearsExp');
      exp.value = data.experiance;
      exp.dispatchEvent(evt)

      var lastUsedLinks = document.getElementById('newSkillLastUsedBtn')
          .parentNode.querySelectorAll('a')
      for (let index = 0; index < lastUsedLinks.length; index += 1) {
        var link = lastUsedLinks[index];
        if (link.innerText.trim() === data.lastUsed) {
          link.click();
          break;
        }
      }

      document.querySelector('[ng-click="trackAddModifyTechProSkills(newSkill)"]').click();
    }
  }
  for (let index = 0; index < list.length; index += 1) {
    setTimeout(addOne(list[index]), 10000 + (index * 1000));
  }
  diceRemoveSkill();
}

function sortSkills(s1, s2) {
  return s1.experiance > s2.experiance;
}

function diceGetSkills() {
  diceClickAddSkill();
  var skillElems = ju.object.getElementByIdReg(document, 'skillName[0-9]*');
  var expElems = ju.object.getElementByIdReg(document, 'skillYearsExp[0-9]*');
  var lastUsedElems = ju.object.getElementByIdReg(document, 'lastUsed[0-9]*');
  var skills = [];
  for (var index = 0; index < skillElems.length; index += 1) {
    var skill = skillElems[index].value.trim();
    var experiance = expElems[index * 2 + 1].value.trim();
    var lastUsed = lastUsedElems[index * 2 + 1].innerText.trim();
    skills.push({skill, experiance, lastUsed})
  }
    return skills;
}

let template = [{skill: '', experiance: 'string'}];

new TransferFill('https://www.dice.com/dashboard/profiles/6acff179bde93309b1ad559e2002c922', 'skills', add, get, template);

//diceAddSkills([{"skill":"Accountability","experiance":"3"},{"skill":"Repair","experiance":"3"},{"skill":"Avionics","experiance":"3"},{"skill":"Security clearance","experiance":"3"},{"skill":"Training","experiance":"3"},{"skill":"Troubleshooting","experiance":"8"},{"skill":"Delegation","experiance":"3"},{"skill":"Eclipse","experiance":"8"},{"skill":"Probability","experiance":"1"},{"skill":"Software","experiance":"5"},{"skill":"ISO","experiance":"9000"},{"skill":"Programming","experiance":"10"},{"skill":"GDB","experiance":"2"},{"skill":"Graph theory","experiance":"1"},{"skill":"Java","experiance":"5"},{"skill":"Forklift","experiance":"5"},{"skill":"MySQL","experiance":"2"},{"skill":"Oracle SQL Developer","experiance":"4"},{"skill":"PL/SQL","experiance":"2"},{"skill":"Microsoft Office","experiance":"10"},{"skill":"C++","experiance":"2"},{"skill":"C","experiance":"2"},{"skill":"Python","experiance":"2"},{"skill":"Bash","experiance":"3"},{"skill":"Windows PowerShell","experiance":"1"},{"skill":"Batch file","experiance":"1"},{"skill":"Technician","experiance":"3"},{"skill":"JavaScript","experiance":"5"},{"skill":"XML","experiance":"5"},{"skill":"PHP","experiance":"1"},{"skill":"IBM DB","experiance":"2"},{"skill":"JSP","experiance":"3"},{"skill":"Java Servlets","experiance":"2"},{"skill":"DevOps","experiance":"2"},{"skill":"J","experiance":"2"},{"skill":"IBM WebSphere Application Server","experiance":"3"},{"skill":"Apache Ant","experiance":"2"},{"skill":"Apache Subversion","experiance":"3"},{"skill":"Caching","experiance":"2"},{"skill":"Amazon Web Services","experiance":"2"},{"skill":"jQuery","experiance":"3"},{"skill":"HTML","experiance":"5"},{"skill":"Web development","experiance":"5"},{"skill":"IBM WebSphere","experiance":"3"},{"skill":"Database design","experiance":"3"},{"skill":"Code review","experiance":"2"},{"skill":"JSON","experiance":"5"},{"skill":"Apache Log","experiance":"4"},{"skill":"Apache Maven","experiance":"5"},{"skill":"Node.js","experiance":"5"},{"skill":"Spring","experiance":"5"},{"skill":"AngularJS","experiance":"4"},{"skill":"HTML","experiance":"5"},{"skill":"Git","experiance":"8"},{"skill":"Linux","experiance":"8"}])

// indeed

function removeSkills() {
  var skillElems = document.querySelectorAll('[data-tn-section="skillInfoEditor"]');
  for (var index = 0; index < skillElems.length; index += 1) {
    var elem = skillElems[index];
    elem.querySelector('.delete-button').click();
  }
}


function addSkills() {

}

function getSkills() {
  var skillElems = document.querySelectorAll('[data-tn-section="skillInfoEditor"]');
  for (var index = 0; index < skillElems.length; index += 1) {

  }
}

new TransferFill('https://my.indeed.com/p/' + TF.config.indeedProfileId, 'skills', add, get, template);
new TransferFill('https://www.dice.com/dashboard/profiles/active', 'skills', add, get, template);
new TransferFill('https://www.dice.com/daboard/profiles/active', 'skills', add, get, {});
function test() {}
