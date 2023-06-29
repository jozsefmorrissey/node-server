let fs = () => 'Only works on searver';
let shell = fs;

try {
  fs = require('fs');
  shell = require('shelljs');
} catch(e) {}



function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class MapScript {
  constructor (absolutePath, script) {
    this.script = script;
    script = MapScript.removeReg(/\/\/.*?\n/g, '', script);
    script = MapScript.removeReg(/`.*?`/g, '', script);
    script = MapScript.removeReg(/([^\\])\/[^\n]{1,}?[^\\]\//g, '$1', script);
    script = MapScript.removeReg(MapScript.reg.block, '', script);
    script = MapScript.removeReg(/\s{2,}/g, ' ', script);

    this.absPath = () => absolutePath;
    this.dir = () => absolutePath.replace(/^(.*\/).*$/, '$1')
    this.existingExports = MapScript.regToNameArr(MapScript.reg.export, script);
    this.requires = MapScript.regToNameArr(MapScript.reg.require, script);
    this.classes = MapScript.regToNameArr(MapScript.reg.class, script);
    this.functions = MapScript.regToNameArr(MapScript.reg.function, script);
    this.consts = MapScript.regToNameArr(MapScript.reg.const, script);

    this.exports = this.existingExports.length > 0 ?
                    this.existingExports : (this.classes.length > 0 ?
                        this.classes : (this.functions.length > 0 ?
                          this.functions : this.consts));

    this.exportStr = () => {
      let exportStr = '';
      if (this.existingExports.length === 0) {
        if (this.exports.length === 1) return `module.exports = ${this.exports[0]}\n`;
        this.exports.forEach((exprt) => (exportStr += `exports.${exprt} = ${exprt}\n`));
      }
      return exportStr;
    }

    this.requireStr = async () => {
      return new Promise(async (resolve) => {
        let requireStr = '';
        if (this.requires.length === 0) {
          const reqReg = MapScript.findRequireReg();
          console.log(reqReg)
          if (reqReg) {
            const referenced = this.script.match(reqReg.all) || [];
            const filesRefd = {};
            filesRefd[this.absPath()] = true;
            for (let i = 0; i < referenced.length; i += 1) {
              const ref = referenced[i];
              const formattedRef = ref.match(reqReg.first)[1];
              const refMap = MapScript.list[formattedRef];
              if (!filesRefd[refMap.absPath()]) {
                filesRefd[refMap.absPath()] = true;
                const moduleExport = refMap.exports.length === 1;
                console.log(this.dir(), '->', refMap.absPath())
                const relitivePath = await MapScript.toRelitivePath(refMap.absPath(), this.dir());
                requireStr += `const ${formattedRef} = require('${relitivePath}')`;
                requireStr += moduleExport ? ';\n' : `.${formattedRef};\n`
              }
            }
          }
        }
        resolve(requireStr);
      });
      return requireStr;
    }

    this.toString = async () => {
      const arrToStr = (name, arr) => `(${arr.length}) ${name}: ${arr}\n`;
      console.log(`File: ${absolutePath}\n` +
             arrToStr('exports', this.exports) +
             arrToStr('requires', this.requires) +
             arrToStr('classes', this.classes) +
             arrToStr('functions', this.functions) +
             arrToStr('consts', this.consts) +
             `requireStr ${await this.requireStr()}\n` +
             `exportStr ${this.exportStr()}\n` +
             `script: \n${script}`);
    }
    this.exports.forEach((name) => MapScript.list[name] = this);
  }
}

MapScript.list = {};
MapScript.findRequireReg = () => {
  let reg = '';
  const names = Object.keys(MapScript.list);
  console.log('nameslen', names.length);
  if (names.length === 0) return null;
  names.forEach((name) => {
    reg += `${name}|`;
  });
  reg = reg.substr(0, reg.length - 1);
  reg = `[^a-z^A-Z^$^_](${reg})[^a-z^A-Z^0-9^$^_]`;
  return {all: new RegExp(reg, 'g'), first: new RegExp(reg)};
}
MapScript.regToNameArr = function (regObj, script) {
  const arr = [];
  const matches = script.match(regObj.all) || [];
  matches.forEach((match) =>
    arr.push(regObj.name.apply(null, match.match(regObj.first))))
  return arr;
}

MapScript.removeReg = function (reg, replace, script) {
  while(script.match(reg)) {
    script = script.replace(reg, replace);
  }
  return script;
}

MapScript.value = {one: (match, one) => one};
MapScript.value.exports = (match, one, two, exportName, realName) => {
  return exportName || realName;
}

MapScript.reg = {};
MapScript.reg.const = {
  all: /const\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)\s{1,}=/g,
  first: /const\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)\s{1,}=/,
  name: MapScript.value.one
}

MapScript.reg.function = {
  all: /function\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)/g,
  first: /function\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)/,
  name: MapScript.value.one
}

MapScript.reg.class = {
  all: /class\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)/g,
  first: /class\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)/,
  name: MapScript.value.one
}
MapScript.reg.export = {
  all: /(module.|)exports(.([a-zA-Z$_][a-zA-Z0-9$_]*)|)\s*=\s*([a-zA-Z$_][a-zA-Z0-9$_]*)/g,
  first: /(module.|)exports(.([a-zA-Z$_][a-zA-Z0-9$_]*)|)\s*=\s*([a-zA-Z$_][a-zA-Z0-9$_]*)/,
  name: MapScript.value.exports
}

MapScript.reg.require = {
  all: /require\((.*?)\)/g,
  first: /require\((.*?)\)/,
  name: MapScript.value.one
}

MapScript.reg.block = /\{[^{^}]*\}/g;
MapScript.upFolderRegex = /(\/|^)([^/]{3,}|[^.]|[^.].|.[^.])\/\.\.\//g;


MapScript.simplifyPath = function (path) {
  path = path.replace(/^\.\//, '');
  path = path.replace(/\/.\//, '/');
  path += path.match(/^.*\.(js|json)$/) ? '' : '.js';
  let simplified = path;
  let currSimplify = path;
  while(currSimplify.match(MapScript.upFolderRegex)) {
    currSimplify = currSimplify.replace(MapScript.upFolderRegex, '$1');
    simplified = currSimplify;
  }
  const fChar = simplified[0];
  if (fChar !== '.' && fChar !== '/') simplified = `./${simplified}`;
  return simplified;
}

MapScript.toRelitivePath = async function (path, dir) {
  const cmd = `realpath --relative-to='${dir}' '${path}'`;
  const promise = new Promise((resolve) => {
    function resolver(data) {
      const relPath = MapScript.simplifyPath(`${data.trim()}`);
      resolve(relPath);
    }
    const child = shell.exec(cmd, {async: true});
    child.stdout.on('data', resolver);
  });
  return promise;
}


class RequireJS {
  constructor(projectDir, main) {
    function guessProjectDir () {
      const stackTarget = new Error().stack.split('\n')[4];
      return stackTarget === undefined ? '' : stackTarget
          .replace(/^.*?\(([^(^:]*)\/[^/]{1,}?:.*$/, '$1');
    }

    projectDir = projectDir || guessProjectDir();
    const scripts = {};
    const prefixReg = /^\.\//;
    const trimPrefix = (path) => path.replace(prefixReg, '');

    const nameReg = /^(.*)\/(.*)$/;
    function guessFilePath (wrongPath, currFile) {
      const guesses = [];
      const fileName = wrongPath.replace(nameReg, '$2').toLowerCase();
      Object.keys(scripts).forEach((path) => {
        const name = path.replace(nameReg, '$2').toLowerCase();
        if (name === fileName) {
          guesses.push(determinRelitivePath(currFile, path));
        }
      });
      return guesses;
    }

    function determinRelitivePath(from, to) {
      from = trimPrefix(MapScript.simplifyPath(from))
      from = from.replace(nameReg, '$1');
      from = from.split('/');
      to = trimPrefix(MapScript.simplifyPath(to))
      to = to.split('/');
      let index = 0;
      while (from[index] && from[index] === to[index]) {
        index += 1;
      }
      const backPages = from.length - index;
      const relPathArr = backPages === 0  ? `./${to.slice(to.length - 1)}` :
                          new Array(backPages).fill('..').concat(to.slice(index)).join('/');
      return relPathArr;
    }

    function requireWrapper (absDir, relitivePath, filePath) {
      relitivePath = MapScript.simplifyPath(relitivePath);
      const path = MapScript.simplifyPath(`${absDir}${relitivePath}`);
      if (scripts[path] instanceof Unloaded) {
        scripts[path] = scripts[path].load();
      }
      if (scripts[path] === undefined) console.warn(`Trying to load a none exisant js file
\t'${relitivePath}' from file '${filePath}'
\t\tDid you mean:\n\t\t\t${guessFilePath(relitivePath, filePath).join('\n\t\t\t')}`);
      return scripts[path];
    }

    function requireFunc (absoluteDir, filePath) {
      return (relitivePath) => requireWrapper(absoluteDir, relitivePath, filePath);
    }

    const loadPath = [];
    class Unloaded {
      constructor(path, func) {
        const absoluteDir = MapScript.simplifyPath(path).replace(/(.*\/).*/, '$1');
        const modulee = {exports: {}};
        this.load = () => {
          if (loadPath.indexOf(path) !== -1) throw Error(`Circular Reference: \n\t\t${loadPath.join('\n\t\t')}`);
          loadPath.push(path);
          // console.log('loading: ', path);
          func(requireFunc(absoluteDir, path), modulee.exports, modulee);
          loadPath.splice(loadPath.indexOf(path), 1);
          return modulee.exports;
        };
      }
    }

    function addFunction (path, func) {
      scripts[path] = new Unloaded(path, func);
    }

    let header;
    this.header = () => {
      if (header === undefined) {
        header = fs.readFileSync(__filename, 'utf8');
      }
      return `${header}\n\n\n`;
    }

    this.footer = () => {
      return `window.onload = () => RequireJS.init('${main}')\n`;
    }

    let guess = false;
    this.guess = (g) => guess = (typeof g) === 'boolean' ? g : !guess;

    function resolveBody (script) {
      async function resolver(resolve) {
        try {
          JSON.parse(script);
          resolve(`module.exports = ${script.trim()};`);
        } catch (e) {
          if (guess) {
            const reqStr = await map.requireStr();
            const expStr = map.exportStr();
            resolve(`${reqStr}\n${script}${expStr}\n`);
          } else {
            resolve(script);
          }
        }
      }
      return new Promise(resolver);
    }


    const startTime = new Date().getTime();
    const pathCache = {};
    function encapsulate(absolutePath, script) {
      const map = new MapScript(absolutePath, script);
      async function resolver (resolve) {
        if (pathCache[absolutePath] === undefined) {
          pathCache[absolutePath] = await MapScript.toRelitivePath(absolutePath, projectDir);
        }
        const body = await resolveBody(script);
        const encaps = `RequireJS.addFunction('${pathCache[absolutePath]}',
function (require, exports, module) {
${body.replace(/(^|\n)/g, '\n\t').substr(1)}
});\n\n\n`;
        resolve(encaps);

        if (guess && startTime + 10000 < new Date().getTime()) {
          console.log('writinggggg...')
          fs.writeFile(map.absPath(), body, 'utf8');
        }

      }
      const promise = new Promise(resolver);
      return promise;
    }

    function init(main) {
      requireWrapper ('', main)
    }

    this.init = init;
    this.encapsulate = encapsulate;
    this.addFunction = addFunction;
  }
}


try {
  exports.RequireJS = RequireJS;
} catch (e) {}

RequireJS = new RequireJS();



RequireJS.addFunction('../../public/json/configure.json',
function (require, exports, module) {
	module.exports = {"_TYPE":"DecisionInputTree","id":"DecisionInputTree_0e70ftc","ID_ATTRIBUTE":"id","stateConfigs":{"Questionaire":{"_TYPE":"StateConfig","id":"StateConfig_788ityg","ID_ATTRIBUTE":"id","name":"Questionaire","payload":{"name":"Questionaire","inputArray":[]},"treeName":"DecisionInputTree","conditions":[]},"info":{"_TYPE":"StateConfig","id":"StateConfig_161qyym","ID_ATTRIBUTE":"id","name":"info","payload":{"sectionName":"Informationsss","inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"inspector","label":"Inspector","list":["Zach","Dylan","Adam","Jon","Tucker","Mitchell"],"inline":false,"hidden":false,"optional":false,"value":"Zach","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Input","ID_ATTRIBUTE":"id","type":"date","name":"dateOfInspection","label":"Date of Inspection","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"NumberInput","ID_ATTRIBUTE":"id","name":"enginHours","label":"Engin Hours","min":0,"max":9007199254740991,"step":1,"hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}]},"treeName":"DecisionInputTree","conditions":[]},"visual":{"_TYPE":"StateConfig","id":"StateConfig_m45mlv2","ID_ATTRIBUTE":"id","name":"visual","payload":{"sectionName":"Visual","inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"doTiresVissuallyAppearToBeInflated","label":"Do tires vissually appear to be inflated","list":["Yes","No"],"inline":false,"hidden":false,"optional":false,"value":"Yes","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"areThereAnyObviousFluidPuddlesUnderTheMachineThatMayIndicateAleak?","label":"Are there any obvious fluid puddles under the machine that may indicate a leak?","list":["Yes","No"],"inline":false,"hidden":false,"optional":false,"value":"Yes","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"areAllPrimaryAndSecondaryLockingPinsInPlaceForLoaderAndImplement","label":"Are all primary and secondary locking pins in place for loader and implement","list":["Yes","No"],"inline":false,"hidden":false,"optional":false,"value":"Yes","targetAttr":"value","errorMsg":"Error"}]},"treeName":"DecisionInputTree","conditions":[{"_TYPE":"CaseInsensitiveCondition","group":"severity","attribute":"doTiresVissuallyAppearToBeInflated","value":"No","deligator":{"_TYPE":"NodeCondition"}},{"_TYPE":"CaseInsensitiveCondition","group":"severity","attribute":"areThereAnyObviousFluidPuddlesUnderTheMachineThatMayIndicateAleak?","value":"No","deligator":{"_TYPE":"NodeCondition"}},{"_TYPE":"CaseInsensitiveCondition","group":"severity","attribute":"areAllPrimaryAndSecondaryLockingPinsInPlaceForLoaderAndImplement","value":"No","deligator":{"_TYPE":"NodeCondition"}}]},"fluids":{"_TYPE":"StateConfig","id":"StateConfig_q3nxw0j","ID_ATTRIBUTE":"id","name":"fluids","payload":{"sectionName":" ","inputArray":[{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"checkingFluids","label":"Checking Fluids","rows":["Engine Oil","Hydraulic Oil","Antifreeze"],"columns":["All Good","Topped Off","Bulk Add"],"type":"radio","hidden":false,"list":{"engineOil":{"name":"RadioTable_input-vqlwriy-engineOil","label":"Engine Oil","value":"All Good","key":"engineOil"},"hydraulicOil":{"name":"RadioTable_input-vqlwriy-hydraulicOil","label":"Hydraulic Oil","value":"All Good","key":"hydraulicOil"},"antifreeze":{"name":"RadioTable_input-vqlwriy-antifreeze","label":"Antifreeze","value":"All Good","key":"antifreeze"}},"optional":false,"value":{"engineOil":"All Good","hydraulicOil":"All Good","antifreeze":"All Good"},"targetAttr":"value","errorMsg":"Error"}]},"treeName":"DecisionInputTree","conditions":[{"_TYPE":"WildCardCondition","group":"severity","attribute":"checkingFluids.*","value":"Bulk Add","deligator":{"_TYPE":"NodeCondition"}}]},"greasing":{"_TYPE":"StateConfig","id":"StateConfig_yt81zqx","ID_ATTRIBUTE":"id","name":"greasing","payload":{"inputArray":[{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"greasing","label":"Greasing","rows":["Grease Zerk #1","Grease Zerk #2","Grease Zerk #3","Grease Zerk #4","Grease Zerk #5","Grease Zerk #6","Grease Zerk #7"],"columns":["Took At Least 1 Pump","Would not accept grease"],"type":"radio","hidden":false,"list":{"greaseZerk #1":{"name":"RadioTable_input-udc0gw7-greaseZerk #1","label":"Grease Zerk #1","value":"Took At Least 1 Pump","key":"greaseZerk #1"},"greaseZerk #2":{"name":"RadioTable_input-udc0gw7-greaseZerk #2","label":"Grease Zerk #2","value":"Took At Least 1 Pump","key":"greaseZerk #2"},"greaseZerk #3":{"name":"RadioTable_input-udc0gw7-greaseZerk #3","label":"Grease Zerk #3","value":"Took At Least 1 Pump","key":"greaseZerk #3"},"greaseZerk #4":{"name":"RadioTable_input-udc0gw7-greaseZerk #4","label":"Grease Zerk #4","value":"Took At Least 1 Pump","key":"greaseZerk #4"},"greaseZerk #5":{"name":"RadioTable_input-udc0gw7-greaseZerk #5","label":"Grease Zerk #5","value":"Took At Least 1 Pump","key":"greaseZerk #5"},"greaseZerk #6":{"name":"RadioTable_input-udc0gw7-greaseZerk #6","label":"Grease Zerk #6","value":"Took At Least 1 Pump","key":"greaseZerk #6"},"greaseZerk #7":{"name":"RadioTable_input-udc0gw7-greaseZerk #7","label":"Grease Zerk #7","value":"Took At Least 1 Pump","key":"greaseZerk #7"}},"optional":false,"value":{"greaseZerk #1":"Took At Least 1 Pump","greaseZerk #2":"Took At Least 1 Pump","greaseZerk #3":"Took At Least 1 Pump","greaseZerk #4":"Took At Least 1 Pump","greaseZerk #5":"Took At Least 1 Pump","greaseZerk #6":"Took At Least 1 Pump","greaseZerk #7":"Took At Least 1 Pump"},"targetAttr":"value","errorMsg":"Error"}]},"treeName":"DecisionInputTree","conditions":[{"_TYPE":"WildCardCondition","group":"severity","attribute":"greasing.*","value":"Took At Least 1 Pump","deligator":{"_TYPE":"NodeCondition"}}]},"hydraulic":{"_TYPE":"StateConfig","id":"StateConfig_qn32dn8","ID_ATTRIBUTE":"id","name":"hydraulic","payload":{"sectionName":"","inputArray":[{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"hydraulicHoseAndFittingInspection","label":"Hydraulic Hose and fitting inspection","rows":["Pump to Control Valve","Control Valve to Arm Cylinders","Control Valve to Bucket Cylinders"],"columns":["Dry","Wet"],"type":"radio","hidden":false,"list":{"pumpToControlValve":{"name":"RadioTable_input-0a9dmi1-pumpToControlValve","label":"Pump to Control Valve","value":"Dry","key":"pumpToControlValve"},"controlValveToArmCylinders":{"name":"RadioTable_input-0a9dmi1-controlValveToArmCylinders","label":"Control Valve to Arm Cylinders","value":"Dry","key":"controlValveToArmCylinders"},"controlValveToBucketCylinders":{"name":"RadioTable_input-0a9dmi1-controlValveToBucketCylinders","label":"Control Valve to Bucket Cylinders","value":"Dry","key":"controlValveToBucketCylinders"}},"optional":false,"value":{"pumpToControlValve":"Dry","controlValveToArmCylinders":"Dry","controlValveToBucketCylinders":"Dry"},"targetAttr":"value","errorMsg":"Error"}]},"treeName":"DecisionInputTree","conditions":[{"_TYPE":"WildCardCondition","group":"severity","attribute":"hydraulicHoseAndFittingInspection.*","value":"Wet","deligator":{"_TYPE":"NodeCondition"}}]},"controlsCheck":{"_TYPE":"StateConfig","id":"StateConfig_1hwx50c","ID_ATTRIBUTE":"id","name":"controlsCheck","payload":{"sectionName":"Controls Check","inputArray":[{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"startingAndOperating","label":"Starting and Operating","rows":["Parking Brake","Ignition and Key","Throttle Control","3-point Control","Loader Controls"],"columns":["Works","Kinda Works","Not Functioning"],"type":"radio","hidden":false,"list":{"parkingBrake":{"name":"RadioTable_input-hyubnp7-parkingBrake","label":"Parking Brake","value":"Works","key":"parkingBrake"},"ignitionAndKey":{"name":"RadioTable_input-hyubnp7-ignitionAndKey","label":"Ignition and Key","value":"Works","key":"ignitionAndKey"},"throttleControl":{"name":"RadioTable_input-hyubnp7-throttleControl","label":"Throttle Control","value":"Works","key":"throttleControl"},"3-pointControl":{"name":"RadioTable_input-hyubnp7-3-pointControl","label":"3-point Control","value":"Works","key":"3-pointControl"},"loaderControls":{"name":"RadioTable_input-hyubnp7-loaderControls","label":"Loader Controls","value":"Works","key":"loaderControls"}},"optional":false,"value":{"parkingBrake":"Works","ignitionAndKey":"Works","throttleControl":"Works","3-pointControl":"Works","loaderControls":"Works"},"targetAttr":"value","errorMsg":"Error"},{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"shiftingTransmissionAndTransferCase","label":"Shifting Transmission and Transfer Case","rows":["Transmission shifts with no issues","Transfer Case shifts with no issues"],"columns":["Yes","No"],"type":"radio","hidden":false,"list":{"transmissionShiftsWithNoIssues":{"name":"RadioTable_input-tjq6oyt-transmissionShiftsWithNoIssues","label":"Transmission shifts with no issues","value":"Yes","key":"transmissionShiftsWithNoIssues"},"transferCaseShiftsWithNoIssues":{"name":"RadioTable_input-tjq6oyt-transferCaseShiftsWithNoIssues","label":"Transfer Case shifts with no issues","value":"Yes","key":"transferCaseShiftsWithNoIssues"}},"optional":false,"value":{"transmissionShiftsWithNoIssues":"Yes","transferCaseShiftsWithNoIssues":"Yes"},"targetAttr":"value","errorMsg":"Error"}]},"treeName":"DecisionInputTree","conditions":[{"_TYPE":"WildCardCondition","group":"severity","attribute":"startingAndOperating.*","value":"Not Functioning","deligator":{"_TYPE":"NodeCondition"}},{"_TYPE":"WildCardCondition","group":"severity","attribute":"startingAndOperating.*","value":"Kinda Works","deligator":{"_TYPE":"NodeCondition"}},{"_TYPE":"WildCardCondition","group":"severity","attribute":"shiftingTransmissionAndTransferCase.*","value":"No","deligator":{"_TYPE":"NodeCondition"}}]},"severity":{"_TYPE":"StateConfig","id":"StateConfig_np9id2x","ID_ATTRIBUTE":"id","name":"severity","payload":{"sectionName":"Severity","inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"level","label":"Level","list":["Documenting","Keep an eye one","Action Needs Taken","Immediate Action Required"],"inline":false,"hidden":false,"optional":false,"value":"Documenting","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Textarea","ID_ATTRIBUTE":"id","name":"yourObservationsAndActions","label":"Your Observations and Actions","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}]},"treeName":"DecisionInputTree","conditions":[]}},"name":"Questionaire","referenceNodes":false,"root":{"name":"Questionaire","payload":{"inputArray":[],"PAYLOAD_ID":"5u427zk"},"children":{"info":{"name":"info","payload":{"inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"inspector","label":"Inspector","list":["Zach","Dylan","Adam","Jon","Tucker","Mitchell"],"inline":false,"hidden":false,"optional":false,"value":"Zach","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Input","ID_ATTRIBUTE":"id","type":"date","name":"dateOfInspection","label":"Date of Inspection","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"NumberInput","ID_ATTRIBUTE":"id","name":"enginHours","label":"Engin Hours","min":0,"max":9007199254740991,"step":1,"hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"hfopyzt"},"children":{},"metadata":{}},"visual":{"name":"visual","payload":{"inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"doTiresVissuallyAppearToBeInflated","label":"Do tires vissually appear to be inflated","list":["Yes","No"],"inline":false,"hidden":false,"optional":false,"value":"Yes","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"areThereAnyObviousFluidPuddlesUnderTheMachineThatMayIndicateAleak?","label":"Are there any obvious fluid puddles under the machine that may indicate a leak?","list":["Yes","No"],"inline":false,"hidden":false,"optional":false,"value":"Yes","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"areAllPrimaryAndSecondaryLockingPinsInPlaceForLoaderAndImplement","label":"Are all primary and secondary locking pins in place for loader and implement","list":["Yes","No"],"inline":false,"hidden":false,"optional":false,"value":"Yes","targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"5tk0j5e"},"children":{"severity":{"name":"severity","payload":{"inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"level","label":"Level","list":["Documenting","Keep an eye one","Action Needs Taken","Immediate Action Required"],"inline":false,"hidden":false,"optional":false,"value":"Action Needs Taken","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Textarea","ID_ATTRIBUTE":"id","name":"yourObservationsAndActions","label":"Your Observations and Actions","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"i802yy8"},"children":{},"metadata":{}}},"metadata":{}},"fluids":{"name":"fluids","payload":{"inputArray":[{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"checkingFluids","label":"Checking Fluids","rows":["Engine Oil","Hydraulic Oil","Antifreeze"],"columns":["All Good","Topped Off","Bulk Add"],"type":"radio","hidden":false,"list":{"engineOil":{"name":"RadioTable_input-2n6i008-engineOil","label":"Engine Oil","value":"All Good","key":"engineOil"},"hydraulicOil":{"name":"RadioTable_input-2n6i008-hydraulicOil","label":"Hydraulic Oil","value":"All Good","key":"hydraulicOil"},"antifreeze":{"name":"RadioTable_input-2n6i008-antifreeze","label":"Antifreeze","value":"All Good","key":"antifreeze"}},"optional":false,"value":{"engineOil":"All Good","hydraulicOil":"All Good","antifreeze":"All Good"},"targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"6z4fcwp"},"children":{"severity":{"name":"severity","payload":{"inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"level","label":"Level","list":["Documenting","Keep an eye one","Action Needs Taken","Immediate Action Required"],"inline":false,"hidden":false,"optional":false,"value":"Documenting","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Textarea","ID_ATTRIBUTE":"id","name":"yourObservationsAndActions","label":"Your Observations and Actions","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"jc5alcf"},"children":{},"metadata":{}}},"metadata":{}},"greasing":{"name":"greasing","payload":{"inputArray":[{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"greasing","label":"Greasing","rows":["Grease Zerk #1","Grease Zerk #2","Grease Zerk #3","Grease Zerk #4","Grease Zerk #5","Grease Zerk #6","Grease Zerk #7"],"columns":["Took At Least 1 Pump","Would not accept grease"],"type":"radio","hidden":false,"list":{"greaseZerk #1":{"name":"RadioTable_input-l4q2zxv-greaseZerk #1","label":"Grease Zerk #1","value":"Would not accept grease","key":"greaseZerk #1"},"greaseZerk #2":{"name":"RadioTable_input-l4q2zxv-greaseZerk #2","label":"Grease Zerk #2","value":"Would not accept grease","key":"greaseZerk #2"},"greaseZerk #3":{"name":"RadioTable_input-l4q2zxv-greaseZerk #3","label":"Grease Zerk #3","value":"Took At Least 1 Pump","key":"greaseZerk #3"},"greaseZerk #4":{"name":"RadioTable_input-l4q2zxv-greaseZerk #4","label":"Grease Zerk #4","value":"Took At Least 1 Pump","key":"greaseZerk #4"},"greaseZerk #5":{"name":"RadioTable_input-l4q2zxv-greaseZerk #5","label":"Grease Zerk #5","value":"Would not accept grease","key":"greaseZerk #5"},"greaseZerk #6":{"name":"RadioTable_input-l4q2zxv-greaseZerk #6","label":"Grease Zerk #6","value":"Would not accept grease","key":"greaseZerk #6"},"greaseZerk #7":{"name":"RadioTable_input-l4q2zxv-greaseZerk #7","label":"Grease Zerk #7","value":"Would not accept grease","key":"greaseZerk #7"}},"optional":false,"value":{"greaseZerk #1":"Would not accept grease","greaseZerk #2":"Would not accept grease","greaseZerk #3":"Took At Least 1 Pump","greaseZerk #4":"Took At Least 1 Pump","greaseZerk #5":"Would not accept grease","greaseZerk #6":"Would not accept grease","greaseZerk #7":"Would not accept grease"},"targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"zkaqx7e"},"children":{"severity":{"name":"severity","payload":{"inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"level","label":"Level","list":["Documenting","Keep an eye one","Action Needs Taken","Immediate Action Required"],"inline":false,"hidden":false,"optional":false,"value":"Documenting","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Textarea","ID_ATTRIBUTE":"id","name":"yourObservationsAndActions","label":"Your Observations and Actions","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"z5y1qc1"},"children":{},"metadata":{}}},"metadata":{}},"hydraulic":{"name":"hydraulic","payload":{"inputArray":[{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"hydraulicHoseAndFittingInspection","label":"Hydraulic Hose and fitting inspection","rows":["Pump to Control Valve","Control Valve to Arm Cylinders","Control Valve to Bucket Cylinders"],"columns":["Dry","Wet"],"type":"radio","hidden":false,"list":{"pumpToControlValve":{"name":"RadioTable_input-5z94xoj-pumpToControlValve","label":"Pump to Control Valve","value":"Dry","key":"pumpToControlValve"},"controlValveToArmCylinders":{"name":"RadioTable_input-5z94xoj-controlValveToArmCylinders","label":"Control Valve to Arm Cylinders","value":"Dry","key":"controlValveToArmCylinders"},"controlValveToBucketCylinders":{"name":"RadioTable_input-5z94xoj-controlValveToBucketCylinders","label":"Control Valve to Bucket Cylinders","value":"Dry","key":"controlValveToBucketCylinders"}},"optional":false,"value":{"pumpToControlValve":"Dry","controlValveToArmCylinders":"Dry","controlValveToBucketCylinders":"Dry"},"targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"xj4obhz"},"children":{"severity":{"name":"severity","payload":{"inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"level","label":"Level","list":["Documenting","Keep an eye one","Action Needs Taken","Immediate Action Required"],"inline":false,"hidden":false,"optional":false,"value":"Documenting","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Textarea","ID_ATTRIBUTE":"id","name":"yourObservationsAndActions","label":"Your Observations and Actions","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"w3ptpwr"},"children":{},"metadata":{}}},"metadata":{}},"controlsCheck":{"name":"controlsCheck","payload":{"inputArray":[{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"startingAndOperating","label":"Starting and Operating","rows":["Parking Brake","Ignition and Key","Throttle Control","3-point Control","Loader Controls"],"columns":["Works","Kinda Works","Not Functioning"],"type":"radio","hidden":false,"list":{"parkingBrake":{"name":"RadioTable_input-wsok8pi-parkingBrake","label":"Parking Brake","value":"Not Functioning","key":"parkingBrake"},"ignitionAndKey":{"name":"RadioTable_input-wsok8pi-ignitionAndKey","label":"Ignition and Key","value":"Not Functioning","key":"ignitionAndKey"},"throttleControl":{"name":"RadioTable_input-wsok8pi-throttleControl","label":"Throttle Control","value":"Not Functioning","key":"throttleControl"},"3-pointControl":{"name":"RadioTable_input-wsok8pi-3-pointControl","label":"3-point Control","value":"Not Functioning","key":"3-pointControl"},"loaderControls":{"name":"RadioTable_input-wsok8pi-loaderControls","label":"Loader Controls","value":"Not Functioning","key":"loaderControls"}},"optional":false,"value":{"parkingBrake":"Not Functioning","ignitionAndKey":"Not Functioning","throttleControl":"Not Functioning","3-pointControl":"Not Functioning","loaderControls":"Not Functioning"},"targetAttr":"value","errorMsg":"Error"},{"_TYPE":"RadioTable","ID_ATTRIBUTE":"id","name":"shiftingTransmissionAndTransferCase","label":"Shifting Transmission and Transfer Case","rows":["Transmission shifts with no issues","Transfer Case shifts with no issues"],"columns":["Yes","No"],"type":"radio","hidden":false,"list":{"transmissionShiftsWithNoIssues":{"name":"RadioTable_input-n93is74-transmissionShiftsWithNoIssues","label":"Transmission shifts with no issues","value":"No","key":"transmissionShiftsWithNoIssues"},"transferCaseShiftsWithNoIssues":{"name":"RadioTable_input-n93is74-transferCaseShiftsWithNoIssues","label":"Transfer Case shifts with no issues","value":"Yes","key":"transferCaseShiftsWithNoIssues"}},"optional":false,"value":{"transmissionShiftsWithNoIssues":"No","transferCaseShiftsWithNoIssues":"Yes"},"targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"q69gaj0"},"children":{"severity":{"name":"severity","payload":{"inputArray":[{"_TYPE":"Radio","ID_ATTRIBUTE":"id","name":"level","label":"Level","list":["Documenting","Keep an eye one","Action Needs Taken","Immediate Action Required"],"inline":false,"hidden":false,"optional":false,"value":"Documenting","targetAttr":"value","errorMsg":"Error"},{"_TYPE":"Textarea","ID_ATTRIBUTE":"id","name":"yourObservationsAndActions","label":"Your Observations and Actions","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}],"PAYLOAD_ID":"web3489"},"children":{},"metadata":{}}},"metadata":{}}},"metadata":{}},"payloadHandler":{"inputs":[{"_TYPE":"Input","ID_ATTRIBUTE":"id","label":"Section Name","name":"sectionName","inline":true,"class":"center","hidden":false,"list":[],"optional":false,"value":"","targetAttr":"value","errorMsg":"Error"}],"templateName":"{{sectionName}}"}};
});


RequireJS.addFunction('../../public/js/utils/$t.js',
function (require, exports, module) {
	

	
	
	
	const CustomEvent = require('./custom-event');
	const ExprDef = require('./expression-definition');
	
	class $t {
		constructor(template, id, selector) {
			if (selector) {
				const afterRenderEvent = new CustomEvent('afterRender');
				const beforeRenderEvent = new CustomEvent('beforeRender');
			}
	
			function varReg(prefix, suffix) {
			  const vReg = '([a-zA-Z_\\$][a-zA-Z0-9_\\$]*)';
			  prefix = prefix ? prefix : '';
			  suffix = suffix ? suffix : '';
			  return new RegExp(`${prefix}${vReg}${suffix}`)
			};
	
			function replace(needleRegEx, replaceStr, exceptions) {
			  return function (sub) {
			    if (!exceptions || exceptions.indexOf(sub) === -1) {
			      return sub.replace(needleRegEx, replaceStr)
			    } else {
			      return sub;
			    }
			  }
			}
	
			const signProps = {opening: /([-+\!])/};
			const relationalProps = {opening: /((\<|\>|\<\=|\>\=|\|\||\||&&|&))/};
			const ternaryProps = {opening: /\?/};
			const keyWordProps = {opening: /(new|null|undefined|typeof|NaN|true|false)[^a-z^A-Z]/, tailOffset: -1};
			const ignoreProps = {opening: /new \$t\('.*?'\).render\(.*?, '(.*?)', get\)/};
			const commaProps = {opening: /,/};
			const colonProps = {opening: /:/};
			const multiplierProps = {opening: /(===|[-+=*\/](=|))/};
			const stringProps = {opening: /('|"|`)(\1|.*?([^\\]((\\\\)*?|[^\\])(\1)))/};
			const spaceProps = {opening: /\s{1}/};
			const numberProps = {opening: /([0-9]*((\.)[0-9]{1,})|[0-9]{1,})/};
			const objectProps = {opening: '{', closing: '}'};
			const objectLabelProps = {opening: varReg(null, '\\:')};
			const groupProps = {opening: /\(/, closing: /\)/};
			const expressionProps = {opening: null, closing: null};
			const attrProps = {opening: varReg('(\\.', '){1,}')};
	
			// const funcProps = {
			//   opening: varReg(null, '\\('),
			//   onOpen: replace(varReg(null, '\\('), 'get("$1")('),
			//   closing: /\)/
			// };
			const arrayProps = {
			  opening: varReg(null, '\\['),
			  onOpen: replace(varReg(null, '\\['), 'get("$1")['),
			  closing: /\]/
			};
			const funcRefProps = {
				opening: /\[|\(/,
				closing: /\]|\)/
			};
			const memberRefProps = {
				opening: varReg('\\.', ''),
			};
			const variableProps = {
			  opening: varReg(),
			  onOpen: replace(varReg(), 'get("$1")'),
			};
			const objectShorthandProps = {
			  opening: varReg(),
			  onOpen: replace(varReg(), '$1: get("$1")'),
			};
	
	
			const expression = new ExprDef('expression', expressionProps);
			const ternary = new ExprDef('ternary', ternaryProps);
			const relational = new ExprDef('relational', relationalProps);
			const comma = new ExprDef('comma', commaProps);
			const colon = new ExprDef('colon', colonProps);
			const attr = new ExprDef('attr', attrProps);
			// const func = new ExprDef('func', funcProps);
			const funcRef = new ExprDef('funcRef', funcRefProps);
			const memberRef = new ExprDef('memberRef', memberRefProps);
			const string = new ExprDef('string', stringProps);
			const space = new ExprDef('space', spaceProps);
			const keyWord = new ExprDef('keyWord', keyWordProps);
			const group = new ExprDef('group', groupProps);
			const object = new ExprDef('object', objectProps);
			const array = new ExprDef('array', arrayProps);
			const number = new ExprDef('number', numberProps);
			const multiplier = new ExprDef('multiplier', multiplierProps);
			const sign = new ExprDef('sign', signProps);
			const ignore = new ExprDef('ignore', ignoreProps);
			const variable = new ExprDef('variable', variableProps);
			const objectLabel = new ExprDef('objectLabel', objectLabelProps);
			const objectShorthand = new ExprDef('objectShorthand', objectShorthandProps);
	
			expression.always(space, ignore, keyWord);
			expression.if(string, number, group, array, variable, funcRef, memberRef)
			      .then(multiplier, sign, relational, group)
			      .repeat();
			expression.if(string, group, array, variable, funcRef, memberRef)
						.then(attr)
			      .then(multiplier, sign, relational, expression, funcRef, memberRef)
						.repeat();
			expression.if(string, group, array, variable, funcRef, memberRef)
						.then(attr)
						.end();
	
			funcRef.if(expression).then(comma).repeat();
			funcRef.if(expression).end();
			memberRef.if(expression).then(comma).repeat();
			memberRef.if(expression).end();
	
			expression.if(sign)
			      .then(expression)
			      .then(multiplier, sign, relational, group)
			      .repeat();
			expression.if(string, number, group, array, variable)
			      .then(ternary)
			      .then(expression)
			      .then(colon)
			      .then(expression)
			      .end();
			expression.if(ternary)
			      .then(expression)
			      .then(colon)
			      .then(expression)
			      .end();
			expression.if(object, string, number, group, array, variable)
			      .end();
			expression.if(sign)
			      .then(number)
			      .end();
	
			object.always(space, ignore, keyWord);
			object.if(objectLabel).then(expression).then(comma).repeat();
			object.if(objectShorthand).then(comma).repeat();
			object.if(objectLabel).then(expression).end();
			object.if(objectShorthand).end();
	
			group.always(space, ignore, keyWord);
			group.if(expression).then(comma).repeat();
			group.if(expression).end();
	
			array.always(space, ignore, keyWord);
			array.if(expression).then(comma).repeat();
			array.if(expression).end();
	
			function getter(scope, parentScope) {
				parentScope = parentScope || function () {return undefined};
				function get(name) {
					if (name === 'scope') return scope;
					const split = new String(name).split('.');
					let currObj = scope;
					for (let index = 0; currObj != undefined && index < split.length; index += 1) {
						currObj = currObj[split[index]];
					}
					if (currObj !== undefined) return currObj;
					const parentScopeVal = parentScope(name);
					if (parentScopeVal !== undefined) return parentScopeVal;
	        else {
	          const globalVal = $t.global(name);
	          return globalVal === undefined ? '' : globalVal;
	        }
				}
				return get;
			}
	
			function defaultArray(elemName, get) {
				let resp = '';
				for (let index = 0; index < get('scope').length; index += 1) {
					if (elemName) {
						const obj = {};
	          obj.$index = index;
						obj[elemName] = get(index);
						resp += new $t(template).render(obj, undefined, get);
					} else {
						resp += new $t(template).render(get(index), undefined, get);
					}
				}
				return `${resp}`;
			}
	
			function arrayExp(varName, get) {
				varName = varName.trim();
				const array = get('scope');
				let built = '';
				for (let index = 0; index < array.length; index += 1) {
					const obj = {};
					obj[varName] = array[index];
					obj.$index = index;
					built += new $t(template).render(obj, undefined, get);
				}
				return built;
			}
	
			function itOverObject(varNames, get) {
				const match = varNames.match($t.objectNameReg);
				const keyName = match[1];
				const valueName = match[2];
				const obj = get('scope');
				const keys = Object.keys(obj);
				const isArray = Array.isArray(obj);
				let built = '';
				for (let index = 0; index < keys.length; index += 1) {
					const key = keys[index];
					if (!isArray || key.match(/^[0-9]{1,}$/)) {
						const childScope = {};
						childScope[keyName] = key;
						childScope[valueName] = obj[key];
						childScope.$index = index;
						built += new $t(template).render(childScope, undefined, get);
					}
				}
	      return built;
			}
	
			function rangeExp(elemName, rangeItExpr, get) {
				const match = rangeItExpr.match($t.rangeItExpReg);
				let startIndex = match[1].match(/^[0-9]{1,}$/) ?
							match[1] : get(match[1]);
				let endIndex = match[2].match(/^[0-9]*$/) ?
							match[2] : get(match[2]);
				if (((typeof startIndex) !== 'string' &&
								(typeof	startIndex) !== 'number') ||
									(typeof endIndex) !== 'string' &&
									(typeof endIndex) !== 'number') {
										throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
				}
	
				try {
					startIndex = Number.parseInt(startIndex);
				} catch (e) {
					throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
				}
				try {
					endIndex = Number.parseInt(endIndex);
				} catch (e) {
					throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
				}
	
				let index = startIndex;
				let built = '';
				while (true) {
					let increment = 1;
					if (startIndex > endIndex) {
						if (index <= endIndex) {
							break;
						}
						increment = -1;
					} else if (index >= endIndex) {
						break;
					}
					const obj = {$index: index};
					obj[elemName] = index;
					built += new $t(template).render(obj, undefined, get);
					index += increment;
				}
				return built;
			}
	
			function evaluate(get) {
				if ($t.functions[id]) {
					try {
						return $t.functions[id](get, $t);
					} catch (e) {
					  console.error(e);
					}
				} else {
					return eval($t.templates[id])
				}
			}
	
			function type(scope, expression) {
				if ((typeof scope) === 'string' && scope.match($t.rangeAttemptExpReg)) {
					if (scope.match($t.rangeItExpReg)) {
						return 'rangeExp'
					}
					return 'rangeExpFormatError';
				} else if (Array.isArray(scope)) {
					if (expression === undefined) {
						return 'defaultArray';
					} else if (expression.match($t.nameScopeExpReg)) {
						return 'nameArrayExp';
					}
				}
	
				if ((typeof scope) === 'object') {
					if (expression === undefined) {
						return 'defaultObject';
					} else if (expression.match($t.objectNameReg)){
						return 'itOverObject';
					} else if (expression.match($t.arrayNameReg)){
						return 'arrayExp';
					} else {
						return 'invalidObject';
					}
				} else {
					return 'defaultObject';
				}
			}
	
			// TODO: itExp is not longer an iteration expression. fix!!!!
			function render(scope, itExp, parentScope) {
	      if (scope === undefined) return '';
				let rendered = '';
				const get = getter(scope, parentScope);
				switch (type(scope, itExp)) {
					case 'rangeExp':
						rendered = rangeExp(itExp, scope, get);
						break;
					case 'rangeExpFormatError':
						throw new Error(`Invalid range itteration expression "${scope}"`);
					case 'defaultArray':
						rendered = defaultArray(itExp, get);
						break;
					case 'nameArrayExp':
						rendered = defaultArray(itExp, get);
						break;
					case 'arrayExp':
						rendered = arrayExp(itExp, get);
						break;
					case 'invalidArray':
						throw new Error(`Invalid iterative expression for an array "${itExp}"`);
					case 'defaultObject':
						rendered = evaluate(get);
						break;
					case 'itOverObject':
						rendered = itOverObject(itExp, get);
						break;
					case 'invalidObject':
						throw new Error(`Invalid iterative expression for an object "${itExp}"`);
					default:
						throw new Error(`Programming error defined type '${type()}' not implmented in switch`);
				}
	
	      if (selector) {
	        const elem = document.querySelector(selector);
	        if (elem !== null) {
	          beforeRenderEvent.trigger();
	          elem.innerHTML = rendered;
	          afterRenderEvent.trigger();
	        }
	      }
				return rendered;
			}
	
	
	//---------------------  Compile Functions ---------------//
	
			function stringHash(string) {
				let hashString = string;
				let hash = 0;
				for (let i = 0; i < hashString.length; i += 1) {
					const character = hashString.charCodeAt(i);
					hash = ((hash << 5) - hash) + character;
					hash &= hash; // Convert to 32bit integer
				}
				return hash;
			}
	
			function isolateBlocks(template) {
				let inBlock = false;
				let openBracketCount = 0;
				let block = '';
				let blocks = [];
				let str = template;
				for (let index = 0; index < str.length; index += 1) {
					if (inBlock) {
						block += str[index];
					}
					if (!inBlock && index > 0 &&
						str[index] == '{' && str[index - 1] == '{') {
						inBlock = true;
					} else if (inBlock && str[index] == '{') {
						openBracketCount++;
					} else if (openBracketCount > 0 && str[index] == '}') {
						openBracketCount--;
					} else if (str[index + 1] == '}' && str[index] == '}' ) {
						inBlock = false;
						blocks.push(`${block.substr(0, block.length - 1)}`);
						block = '';
					}
				}
				return blocks;
			}
	
			function compile() {
				const blocks = isolateBlocks(template);
				let str = template;
				for (let index = 0; index < blocks.length; index += 1) {
					const block = blocks[index];
					const parced = ExprDef.parse(expression, block);
					str = str.replace(`{{${block}}}`, `\` + $t.clean(${parced}) + \``);
				}
				return `\`${str}\``;
			}
	
	
					const repeatReg = /<([a-zA-Z-]*):t( ([^>]* |))repeat=("|')(([^>^\4]*?)\s{1,}in\s{1,}([^>^\4]*?))\4([^>]*>((?!(<\1:t[^>]*>|<\/\1:t>)).)*<\/)\1:t>/;
					function formatRepeat(string) {
						// tagname:1 prefix:2 quote:4 exlpression:5 suffix:6
						// string = string.replace(/<([^\s^:^-^>]*)/g, '<$1-ce');
						let match;
						while (match = string.match(repeatReg)) {
							let tagContents = match[2] + match[8];
	            let tagName = match[1];
	            let varNames = match[6];
	            let realScope = match[7];
							let template = `<${tagName}${tagContents}${tagName}>`.replace(/\\'/g, '\\\\\\\'').replace(/([^\\])'/g, '$1\\\'').replace(/''/g, '\'\\\'');
							let templateName = tagContents.replace(/.*\$t-id=('|")([\.a-zA-Z-_\/]*?)(\1).*/, '$2');
							let scope = 'scope';
							template = templateName !== tagContents ? templateName : template;
							const t = eval(`new $t(\`${template}\`)`);
	            let resolvedScope = "get('scope')";;
	            try {
	              // console.log('tagName', tagName);
	              // console.log('varNames', varNames);
	              // console.log('realScope', realScope);
	              // console.log('tagContents', tagContents);
								if (realScope.match(/[0-9]{1,}\.\.[0-9]{1,}/)){
	                resolvedScope = `'${realScope}'`;
	              } else {
	                resolvedScope = ExprDef.parse(expression, realScope);
	              }
	            } catch (e) {}
	            string = string.replace(match[0], `{{ new $t('${t.id()}').render(${resolvedScope}, '${varNames}', get)}}`);
						}
						return string;
					}
	
			if (id) {
				$t.templates[id] = undefined;
				$t.functions[id] = undefined;
			}
	
			template = template.replace(/\s{1,}/g, ' ');
			id = $t.functions[template] ? template : id || stringHash(template);
			if (!$t.functions[id]) {
				if (!$t.templates[id]) {
					template = template.replace(/\s{2,}|\n/g, ' ');
					template = formatRepeat(template);
					$t.templates[id] = compile();
				}
			}
			this.compiled = function () { return $t.templates[id];}
			this.render = render;
	    this.afterRender = (func) => afterRenderEvent.on(func);
	    this.beforeRender = (func) => beforeRenderEvent.on(func);
			this.type = type;
			this.isolateBlocks = isolateBlocks;
	    this.id = () => id;
		}
	}
	
	$t.templates = {};//{"-1554135584": '<h1>{{greeting}}</h1>'};
	$t.functions = {};
	$t.loadFunctions = (functions) => {
		Object.keys(functions).forEach((name) => {
			$t.functions[name] = functions[name];
		});
	
	}
	$t.isTemplate = (id) => $t.functions[id] !== undefined;
	$t.arrayNameReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*$/;
	$t.objectNameReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*,\s*([a-zA-Z][a-z0-9A-Z]*)\s*$/;
	$t.rangeAttemptExpReg = /^\s*(.*\.\..*)\s*$/;
	$t.rangeItExpReg = /^\s*([a-z0-9A-Z]*)\s*\.\.\s*([a-z0-9A-Z]*)\s*$/;
	$t.nameScopeExpReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*$/;
	$t.quoteStr = function (str) {
			str = str.replace(/\\`/g, '\\\\\\`')
			str = str.replace(/([^\\])`/g, '$1\\\`')
			return `\`${str.replace(/``/g, '`\\`')}\``;
		}
	$t.formatName = function (string) {
	    function toCamel(whoCares, one, two) {return `${one}${two.toUpperCase()}`;}
	    return string.replace(/([a-z])[^a-z^A-Z]{1,}([a-zA-Z])/g, toCamel);
	}
	$t.dumpTemplates = function (debug) {
		let templateFunctions = '';
		let tempNames = Object.keys($t.templates);
		for (let index = 0; index < tempNames.length; index += 1) {
			const tempName = tempNames[index];
			if (tempName) {
				let template = $t.templates[tempName];
	      if (debug === true) {
	        const endTagReg = /( \+) /g;
	        template = template.replace(endTagReg, '$1\n\t\t');
	      }
				templateFunctions += `\nexports['${tempName}'] = (get, $t) => \n\t\t${template}\n`;
			}
		}
		return templateFunctions;
	}
	
	$t.clean = (val) => val === undefined ? '' : val;
	
	function createGlobalsInterface() {
	  const GLOBALS = {};
	  const isMotifiable = (name) => GLOBALS[name] === undefined ||
	        GLOBALS[name].imutable !== 'true';
	  $t.global = function (name, value, imutable) {
	    if (value === undefined) return GLOBALS[name] ? GLOBALS[name].value : undefined;
	    if (isMotifiable(name)) GLOBALS[name] = {value, imutable};
	  }
	  $t.rmGlobal = function(name) {
	    if (isMotifiable(name)) delete GLOBALS[name];
	  }
	}
	createGlobalsInterface();
	
	module.exports = $t;
	
});


RequireJS.addFunction('../../public/js/utils/request.js',
function (require, exports, module) {
	

	Request = {
	    onStateChange: function (success, failure, id) {
	      return function () {
	        if (this.readyState === 4) {
	          if (this.status == 200) {
	            try {
	              resp = JSON.parse(this.responseText);
	            } catch (e){
	              resp = this.responseText;
	            }
	            if (success) {
	              success(resp, this);
	            }
	          } else if (failure) {
	            const errorMsgMatch = this.responseText.match(Request.errorMsgReg);
	            if (errorMsgMatch) {
	              this.errorMsg = errorMsgMatch[1].trim();
	            }
	            const errorCodeMatch = this.responseText.match(Request.errorCodeReg);
	            if (errorCodeMatch) {
	              this.errorCode = errorCodeMatch[1];
	
	            }
	            failure(this);
	          }
	          var resp = this.responseText;
	        }
	      }
	    },
	
	    id: function (url, method) {
	      return `request.${method}.${url.replace(/\./g, ',')}`;
	    },
	
	    get: function (url, success, failure) {
	      const xhr = new Request.xmlhr();
	      xhr.open("GET", url, true);
	      const id = Request.id(url, 'GET');
	      xhr.setRequestHeader('Content-Type', 'text/pdf');
	      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
	      Request.setGlobalHeaders(xhr);
	      if (success === undefined && failure === undefined) return xhr;
	      xhr.onreadystatechange =  Request.onStateChange(success, failure, id);
	      xhr.send();
	      return xhr;
	    },
	
	    hasBody: function (method) {
	      return function (url, body, success, failure) {
	        const xhr = new Request.xmlhr();
	        xhr.open(method, url, true);
	        const id = Request.id(url, method);
	        xhr.setRequestHeader('Content-Type', 'application/json');
	        Request.setGlobalHeaders(xhr);
	        if (success === undefined && failure === undefined) return xhr;
	        xhr.onreadystatechange =  Request.onStateChange(success, failure, id);
	        xhr.send(JSON.stringify(body));
	        return xhr;
	      }
	    },
	
	    post: function () {return Request.hasBody('POST')(...arguments)},
	    delete: function () {return Request.hasBody('DELETE')(...arguments)},
	    options: function () {return Request.hasBody('OPTIONS')(...arguments)},
	    head: function () {return Request.hasBody('HEAD')(...arguments)},
	    put: function () {return Request.hasBody('PUT')(...arguments)},
	    connect: function () {return Request.hasBody('CONNECT')(...arguments)},
	}
	
	Request.errorCodeReg = /Error Code:([a-zA-Z0-9]*)/;
	Request.errorMsgReg = /[a-zA-Z0-9]*?:([a-zA-Z0-9 ]*)/;
	const globalHeaders = {};
	Request.globalHeader = (header, funcOval) => {
	  globalHeaders[header] = funcOval;
	}
	Request.setGlobalHeaders = (xhr) => {
	  const headers = Object.keys(globalHeaders);
	  headers.forEach((header) => {
	    const value = (typeof globalHeaders[header]) === 'function' ? globalHeaders[header]() : globalHeaders[header];
	    xhr.setRequestHeader(header, value, xhr);
	  });
	}
	try {
	  Request.xmlhr = XMLHttpRequest;
	} catch (e) {
	  Request.xmlhr = require('xmlhttprequest').XMLHttpRequest;
	}
	
	try {
	  module.exports = Request;
	} catch (e) {}
	
});


RequireJS.addFunction('../../public/js/utils/object/lookup.js',
function (require, exports, module) {
	
class IdString extends String {
	  constructor(...ids) {
	    let id = '';
	    for (let index = 0; index < ids.length; index++) {
	      id += `${ids[index]}_`;
	    }
	    id = id.substring(0, id.length - 1);
	    super(id);
	    this.split = () => {
	      return id.split('_');
	    }
	    this.toJson = () => new String(id).toString();
	    this.index = (index) => this.split().at(index);
	    this.equals = (other) => `${this}` ===`${other}`;
	    this.equivalent = (other, ...indicies) => {
	      if (indicies.length === 0) return this.equals(other);
	      const thisSplit = this.split();
	      const otherSplit = other.split();
	      for (let index = 0; index < indicies.length; index++) {
	        const i = indicies[index];
	        if (thisSplit[i] !== otherSplit[i]) return false;
	      }
	      return true;
	    }
	  }
	}
	
	
	
	class Lookup {
	  constructor(id, attr, singleton) {
	    if (id && id._TYPE) {
	      attr = id.ID_ATTRIBUTE;
	      id = id.id;
	    }
	    Lookup.convert(this, attr, id, singleton);
	  }
	}
	
	Lookup.convert = function (obj, attr, id, singleton) {
	  if (id) {
	    const decoded = Lookup.decode(id);
	    if (decoded) {
	      id = decoded.id;
	    } else if (id._TYPE !== undefined) {
	      id = Lookup.decode(id[id[Lookup.ID_ATTRIBUTE]]).id;
	    }
	  }
	
	  const cxtr = obj.constructor;
	  const cxtrName = cxtr.name;
	  id = new IdString(cxtrName, id || String.random());
	  let group;
	  if (singleton && cxtr.get(id)) return cxtr.get(id);
	
	  let constructedAt = new Date().getTime();
	  let modificationWindowOpen = true;
	  attr = attr || 'id';
	  if (obj.constructor.name === 'Object' && !obj.toJson) {
	    obj.toJson = () => JSON.copy(obj);
	  }
	  Object.getSet(obj, attr, Lookup.ID_ATTRIBUTE);
	  obj.lookupGroup = (g) => {
	    if (group === undefined && g !== undefined) {
	      if (Lookup.groups[g] === undefined) Lookup.groups[g] = [];
	      group = g;
	      Lookup.groups[g].push(obj);
	    }
	    return group;
	  }
	
	  obj.lookupRelease = () => {
	    if (cxtr.reusable === true) {
	      if (Lookup.freeAgents[cxtr.name] === undefined) Lookup.freeAgents[cxtr.name] = [];
	      Lookup.freeAgents[cxtr.name].push(obj);
	      const index = Lookup.groups[group] ? Lookup.groups[group].indexOf(obj) : -1;
	      if (index !== -1) Lookup.groups[group].splice(index, 1);
	    }
	    delete Lookup.byId[cxtr.name][obj[attr]().index(-1)];
	  }
	
	
	  obj[Lookup.ID_ATTRIBUTE] = () => attr;
	  obj[attr] = (idStr) => {
	    if (modificationWindowOpen) {
	      if (idStr instanceof IdString) {
	        let objId = idStr.index(-1);
	        id = new IdString(cxtrName, objId);
	        Lookup.byId[cxtr.name][id.index(-1)] = obj;
	        modificationWindowOpen = false;
	      } else if (constructedAt < new Date().getTime() - 200) {
	        modificationWindowOpen = false;
	      }
	    }
	    return id;
	  }
	
	  function registerConstructor() {
	    if (Lookup.byId[cxtr.name] === undefined) {
	      Lookup.byId[cxtr.name] = {};
	      Lookup.constructorMap[cxtr.name] = cxtr;
	    }
	  }
	
	  function addSelectListFuncToConstructor() {
	    if (cxtr !== Lookup) {
	      if(cxtr.selectList === Lookup.selectList) {
	        cxtr.get = (id) => Lookup.get(id, cxtr);
	        if (cxtr.instance === undefined) cxtr.instance = () => Lookup.instance(cxtr.name);
	        Lookup.byId[cxtr.name] = {};
	        cxtr.selectList = () => Lookup.selectList(cxtr.name);
	      }
	    }
	  }
	
	  registerConstructor();
	  addSelectListFuncToConstructor();
	
	
	  if (!Lookup.byId[cxtrName][id.index(-1)])
	    Lookup.byId[cxtrName][id.index(-1)] = obj;
	  else
	    console.warn(`Lookup id '${id}' object has been created more than once.`);
	  if (obj.toString === undefined) obj.toString = () => obj[attr]();
	}
	
	Lookup.ID_ATTRIBUTE = 'ID_ATTRIBUTE';
	Lookup.byId = {Lookup};
	Lookup.constructorMap = {Lookup: Lookup};
	Lookup.groups = {};
	Lookup.freeAgents = {};
	
	Lookup.get = (id, cxtr) => {
	  const decoded = Lookup.decode(id);
	  let decodedId, decodedCxtr;
	  if (decoded) {
	    decodedId = decoded.id;
	    decodedCxtr = decoded.constructor;
	  }
	  id = decodedId || id;
	  cxtr = cxtr || decodedCxtr || Lookup;
	  const instance = Lookup.byId[cxtr.name][id] || (decodedCxtr && Lookup.byId[decodedCxtr.name][id]);
	  return instance;
	}
	Lookup.selectList = (className) => {
	  return Object.keys(Lookup.byId[className]);
	}
	Lookup.instance = (cxtrName) => {
	  const agents = Lookup.freeAgents[cxtrName];
	  if (!agents || agents.length === 0) {
	    return new (Lookup.constructorMap[cxtrName])();
	  }
	
	  const index = agents.length - 1;
	  const agent = agents[index];
	  agents.splice(index, 1);
	  return agent;
	}
	Lookup.decode = (id) => {
	  if ((typeof id) === 'string') id = new IdString(...id.split('_'));
	  if (!(id instanceof IdString)) return;
	  const cxtrId = id.index(0);
	  const objId = id.index(-1);
	  return {
	    constructor: cxtrId === objId ? undefined : Lookup.constructorMap[cxtrId],
	    id: objId
	  };
	}
	Lookup.release = (group) => {
	  const groupList = Lookup.groups[group];
	  if (groupList === undefined) return;
	  Lookup.groups[group] = [];
	  for (let index = 0; index < groupList.length; index += 1) {
	    groupList[index].release();
	  }
	}
	
	Lookup.fromJson = (json) => {
	  const attr = json[Lookup.ID_ATTRIBUTE];
	  if (attr) {
	    const obj = Lookup.get(json[attr]);
	    if(obj) return obj;
	  }
	
	  const type = json._TYPE;
	  if (type && type === 'Lookup') return new Lookup(json);
	  const obj = Object.fromJson(json);
	  if (obj instanceof Lookup) return obj;
	  if (attr) {
	    Lookup.convert(obj, obj[attr], attr)
	    return obj;
	  }
	  return null;
	}
	
	try {
	  module.exports = Lookup;
	} catch (e) {/* TODO: Consider Removing */}
	
});


RequireJS.addFunction('../../public/js/utils/object/imposter.js',
function (require, exports, module) {
	
class Imposter {
	  constructor(object, cuckooEggs, ...args) {
	    const imposter = new (object.constructor)(...args);
	    cuckooEggs ||= {};
	    const cuckooKeys = Object.getOwnPropertyNames(cuckooEggs);
	
	    const keys = Object.definedPropertyNames(object);
	    for (let index = 0; index < keys.length; index++) {
	      const key = keys[index];
	      if (cuckooKeys.indexOf(key) === -1) {
	        if ((typeof object[key]) === 'function') {
	          imposter[key] = (...args) => object[key].apply(object, args);
	        } else {
	          Object.defineProperty(imposter, key, {
	            get() {
	              return object[key];
	            },
	            set(value) {
	              object[key] = value;
	            }
	          });
	        }
	      }
	    }
	
	    for (let index = 0; index < cuckooKeys.length; index++) {
	      const key = cuckooKeys[index];
	      imposter[key] = cuckooEggs[key];
	    }
	
	    imposter.equals = (obj) => {
	      if (obj === object) return true;
	      return object.equals(obj);
	    }
	
	    return imposter;
	  }
	}
	
	module.exports = Imposter;
	
});


RequireJS.addFunction('../../public/js/utils/expression-definition.js',
function (require, exports, module) {
	

	
	
	let idCount = 0;
	class ExprDef {
	  constructor(name, options, notify, stages, alwaysPossible) {
	    this.id = idCount++;
	    let id = this.id;
	    let string;
	    let modified = '';
	    let start;
	    let end;
	    alwaysPossible = alwaysPossible ? alwaysPossible : [];
	    stages = stages ? stages : {};
	    let currStage = stages;
	
	    function getRoutes(prefix, stage) {
	      let routes = [];
	      let keys = Object.keys(stage);
	      for (let index = 0; index < keys.length; index += 1) {
	        const key = keys[index];
	        if (key !== '_meta') {
	          let newPrefix;
	          if (prefix) {
	            newPrefix = `${prefix}.${key}`;
	          } else {
	            newPrefix = key;
	          }
	          const deepRoutes = getRoutes(newPrefix, stage[key]);
	          if (deepRoutes.length > 0) {
	            routes = routes.concat(deepRoutes);
	          }
	          if (stage[key]._meta && stage[key]._meta.end) {
	            routes.push(newPrefix + '.end');
	          }
	          if (stage[key]._meta && stage[key]._meta.repeat) {
	            routes.push(newPrefix + '.repeat');
	          }
	        }
	      }
	      return routes;
	    }
	
	    this.always = function () {
	      for (let index = 0; index < arguments.length; index += 1) {
	        alwaysPossible.push(arguments[index]);
	      }
	    };
	    this.getAlways = function (exprDef) {return alwaysPossible;};
	
	    this.allRoutes = function () {
	      return getRoutes(null, stages);
	    }
	
	    function getNotice (exprDef) {
	      let isInAlways = false;
	      alwaysPossible.map(function (value) {if (value.getName() === exprDef.getName()) isInAlways = true;});
	      if (isInAlways) return;
	      if (!exprDef.closed()) {
	        if (currStage[exprDef.getName()] === undefined) {
	          throw new Error(`Invalid Stage Transition ${currStage._meta.expr.getName()} -> ${exprDef.getName()}\n${currStage._meta.expr.allRoutes()}`)
	        }
	        currStage = currStage[exprDef.getName()];
	      }
	    }
	    this.getNotice = getNotice;
	
	    function getName () {return name;};
	    this.getName = getName;
	    this.onClose = function (start, end) {
	      return function (str, start, end) {
	        if (notify) notify(this);
	        options.onClose(str, start, end);
	      }
	    }
	
	    function setMeta(targetNodes, attr, value) {
	      return function () {
	        for (let lIndex = 0; lIndex < targetNodes.length; lIndex += 1) {
	          targetNodes[lIndex]._meta[attr] = value;
	        }
	      }
	    }
	
	    function then (targetNodes) {
	      return function () {
	        const createdNodes = [];
	        for (let lIndex = 0; lIndex < targetNodes.length; lIndex += 1) {
	          const targetNode = targetNodes[lIndex];
	          for (let index = 0; index < arguments.length; index += 1) {
	            const exprDef = arguments[index];
	            if (!exprDef instanceof ExprDef) {
	              throw new Error(`Argument is not an instanceof ExprDef`);
	            }
	            const nextExpr = exprDef.clone(getNotice);
	            if (targetNode[nextExpr.getName()] === undefined) {
	              targetNode[nextExpr.getName()] = {
	                _meta: {
	                  expr: nextExpr
	                }
	              };
	            }
	            createdNodes.push(targetNode[nextExpr.getName()]);
	          }
	        }
	        return {
	          then: then(createdNodes),
	          repeat: setMeta(createdNodes, 'repeat', true),
	          end: setMeta(createdNodes, 'end', true),
	        };
	      }
	    }
	
	    this.if = function () {return then([stages]).apply(this, arguments);}
	
	    function isEscaped(str, index) {
	      if (options.escape === undefined) {
	        return false;
	      }
	      let count = -1;
	      let firstIndex, secondIndex;
	      do {
	        count += 1;
	        firstIndex = index - (options.escape.length * (count + 1));
	        secondIndex = options.escape.length;
	      } while (str.substr(firstIndex, secondIndex) === options.escape);
	      return count % 2 == 0;
	    }
	
	    function foundCall(onFind, sub) {
	      if ((typeof notify) === 'function') {
	        notify(this);
	      }
	      if ((typeof onFind) === 'function') {
	        return onFind(sub);
	      } else {
	        return sub;
	      }
	    }
	
	    this.find = function (str, index) {
	      let startedThisCall = false;
	      let needle = options.closing;
	      let starting = false;
	      if (start === undefined) {
	        needle = options.opening;
	        starting = true;
	      }
	      const sub = str.substr(index);
	      let needleLength;
	      if (needle instanceof RegExp) {
	        const match = sub.match(needle);
	        if (match && match.index === 0) {
	          needleLength = match[0].length;
	        }
	      } else if ((typeof needle) === 'string') {
	        if (sub.indexOf(needle) === 0 && !isEscaped(str, index))
	          needleLength = needle.length;
	      } else if (needle === undefined || needle === null) {
	        needleLength = 0;
	      } else {
	        throw new Error('Opening or closing type not supported. Needs to be a RegExp or a string');
	      }
	      needleLength += options.tailOffset ? options.tailOffset : 0;
	      let changes = '';
	      if (start === undefined && starting && (needleLength || needle === null)) {
	        string = str;
	        start = index;
	        startedThisCall = true;
	        if (needle === null) {
	          if ((typeof notify) === 'function') {
	            notify(this);
	          }          return {index, changes}
	        } else {
	          changes += foundCall.apply(this, [options.onOpen, str.substr(start, needleLength)]);
	        }
	      }
	      if ((!startedThisCall && needleLength) ||
	            (startedThisCall && options.closing === undefined) ||
	            (!startedThisCall && options.closing === null)) {
	        if (str !== string) {
	          throw new Error ('Trying to apply an expression to two different strings.');
	        }
	        end = index + needleLength;
	        if (options.closing === null) {
	          return {index, changes}
	        }
	        if (!startedThisCall) {
	          changes += foundCall.apply(this, [options.onClose, str.substr(end - needleLength, needleLength)]);
	        }
	        return { index: end, changes };
	      }
	
	      return start !== undefined ? { index: start + needleLength, changes } :
	                      { index: -1, changes };
	    }
	
	    this.clone = function (notify) {
	      return new ExprDef(name, options, notify, stages, alwaysPossible);
	    };
	    this.name = this.getName();
	    this.canEnd = function () {return (currStage._meta && currStage._meta.end) || options.closing === null};
	    this.endDefined = function () {return options.closing !== undefined && options.closing !== null};
	    this.location = function () {return {start, end, length: end - start}};
	    this.closed = function () {return end !== undefined;}
	    this.open = function () {return start !== undefined;}
	    this.next =  function () {
	      const expressions = [];
	      if (currStage._meta && currStage._meta.repeat) {
	        currStage = stages;
	      }
	      Object.values(currStage).map(
	        function (val) {if (val._meta) expressions.push(val._meta.expr);}
	      )
	      return alwaysPossible.concat(expressions);
	    };
	  }
	}
	
	function parse(exprDef, str) {
	  exprDef = exprDef.clone();
	  let index = 0;
	  let modified = '';
	  const breakDown = [];
	  const stack = [];
	
	  function topOfStack() {
	    return stack[stack.length - 1];
	  }
	
	  function closeCheck(exprDef) {
	    if (exprDef && (exprDef.canEnd() || exprDef.endDefined())) {
	      let result = exprDef.find(str, index);
	      if (result.index) {
	        modified += result.changes;
	        return result.index;
	      }
	    }
	  }
	
	  function checkArray(exprDef, array) {
	    if (exprDef.endDefined()) {
	      let nextIndex = closeCheck(exprDef);
	      if (nextIndex) return nextIndex;
	    }
	    for (let aIndex = 0; aIndex < array.length; aIndex += 1) {
	      const childExprDef = array[aIndex].clone(exprDef.getNotice);
	      const result = childExprDef.find(str, index);
	      if (result.index !== -1) {
	        modified += result.changes;
	        if (childExprDef.closed()) {
	          breakDown.push(childExprDef);
	        } else {
	          stack.push(childExprDef);
	        }
	        return result.index;
	      }
	    }
	    if (exprDef.canEnd()) {
	      nextIndex = closeCheck(exprDef);
	      if (nextIndex) return nextIndex;
	    }
	    throw new Error(`Invalid string @ index ${index}\n'${str.substr(0, index)}' ??? '${str.substr(index)}'`);
	  }
	
	  function open(exprDef, index) {
	    const always = exprDef.getAlways();
	    while (!exprDef.open()) {
	      let result = exprDef.find(str, index);
	      modified += result.changes;
	      if(result.index === -1) {
	        let newIndex = checkArray(exprDef, always);
	        index = newIndex;
	      } else {
	        if (exprDef.closed()) {
	          breakDown.push(exprDef);
	        } else {
	          stack.push(exprDef);
	        }
	        index = result.index;
	      }
	    }
	    return index;
	  }
	
	  let loopCount = 0;
	  index = open(exprDef, index);
	  progress = [-3, -2, -1];
	  while (topOfStack() !== undefined) {
	    const tos = topOfStack();
	    if (progress[0] === index) {
	      throw new Error(`ExprDef stopped making progress`);
	    }
	    let stackIds = '';
	    let options = '';
	    stack.map(function (value) {stackIds+=value.getName() + ','});
	    tos.next().map(function (value) {options+=value.getName() + ','})
	    index = checkArray(tos, tos.next());
	    if (tos.closed()) {
	      stack.pop();
	    }
	    loopCount++;
	  }
	  // if (index < str.length) {
	  //   throw new Error("String not fully read");
	  // }
	  return modified;
	}
	
	
	ExprDef.parse = parse;
	
	module.exports = ExprDef;
	
	
	
	
	
});


RequireJS.addFunction('../../public/js/utils/custom-event.js',
function (require, exports, module) {
	

	
	
	class CustomEvent {
	  constructor(name) {
	    const watchers = [];
	    this.name = name;
	
	    const runFuncs = (elem, detail) =>
	    watchers.forEach((func) => {
	      try {
	        func(elem, detail);
	      } catch (e) {
	        console.error(e);
	      }
	    });
	
	
	    this.watchers = () => watchers;
	    this.on = function (func) {
	      if ((typeof func) === 'function') {
	        watchers.push(func);
	      } else {
	        return 'on' + name;
	      }
	    }
	
	    this.trigger = function (element, detail) {
	      element = element ? element : window;
	      runFuncs(element, detail);
	      this.event.detail = detail;
	      if (element instanceof HTMLElement) {
	        if(document.createEvent){
	          element.dispatchEvent(this.event);
	        } else {
	          element.fireEvent("on" + this.event.eventType, this.event);
	        }
	      }
	    }
	//https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
	    this.event;
	    if(document.createEvent){
	        this.event = document.createEvent("HTMLEvents");
	        this.event.initEvent(name, true, true);
	        this.event.eventName = name;
	    } else {
	        this.event = document.createEventObject();
	        this.event.eventName = name;
	        this.event.eventType = name;
	    }
	  }
	}
	
	CustomEvent.all = (obj, ...eventNames) => {
	  if (obj.on === undefined) obj.on = {};
	  if (obj.trigger === undefined) obj.trigger = {};
	  for (let index = 0; index < eventNames.length; index++) {
	    const name = eventNames[index];
	    const e = new CustomEvent(name);
	    obj.on[name] = e.on;
	    obj.trigger[name] = (...args) => e.trigger.apply(e, args);
	  }
	}
	
	CustomEvent.dynamic = () => {
	  const events = {};
	  return {
	    on: (eventType, func) => {
	      if (events[eventType] === undefined)
	        events[eventType] = new CustomEvent(eventType);
	      events[eventType].on(func);
	    },
	    trigger: (event, detail) => {
	      if (events[event.type] === undefined) return;
	      events[event.type].trigger(event, detail);
	    }
	  }
	}
	
	module.exports = CustomEvent;
	
});


RequireJS.addFunction('../../public/js/utils/measurement.js',
function (require, exports, module) {
	
  try {
	    Lookup = require('./object/lookup');
	    StringMathEvaluator = require('./string-math-evaluator');
	  } catch(e) {}
	
	
	function regexToObject (str, reg) {
	  const match = str.match(reg);
	  if (match === null) return null;
	  const returnVal = {};
	  for (let index = 2; index < arguments.length; index += 1) {
	    const attr = arguments[index];
	    if (attr) returnVal[attr] = match[index - 1];
	  }
	  return returnVal;
	}
	
	let units = [
	  'Metric',
	  'Imperial (US)'
	]
	let unit = units[1];
	
	
	class Measurement extends Lookup {
	  constructor(value, notMetric) {
	    super();
	    if ((typeof value) === 'string') {
	      value += ' '; // Hacky fix for regularExpression
	    }
	
	    const determineUnit = () => {
	      if ((typeof notMetric === 'string')) {
	        const index = units.indexOf(notMetric);
	        if (index !== -1) return units[index];
	      } else if ((typeof notMetric) === 'boolean') {
	        if (notMetric === true) return unit;
	      }
	      return units[0];
	    }
	
	    let decimal = 0;
	    let nan = value === null || value === undefined;
	    this.isNaN = () => nan;
	
	    const parseFraction = (str) => {
	      const regObj = regexToObject(str, Measurement.regex, null, 'integer', null, 'numerator', 'denominator');
	      regObj.integer = Number.parseInt(regObj.integer) || 0;
	      regObj.numerator = Number.parseInt(regObj.numerator) || 0;
	      regObj.denominator = Number.parseInt(regObj.denominator) || 0;
	      if(regObj.denominator === 0) {
	        regObj.numerator = 0;
	        regObj.denominator = 1;
	      }
	      regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
	      return regObj;
	    };
	
	    function reduce(numerator, denominator) {
	      let reduced = true;
	      while (reduced) {
	        reduced = false;
	        for (let index = 0; index < Measurement.primes.length; index += 1) {
	          const prime = Measurement.primes[index];
	          if (prime >= denominator) break;
	          if (numerator % prime === 0 && denominator % prime === 0) {
	            numerator = numerator / prime;
	            denominator = denominator / prime;
	            reduced = true;
	            break;
	          }
	        }
	      }
	      if (numerator === 0) {
	        return '';
	      }
	      return ` ${numerator}/${denominator}`;
	    }
	
	    //TODO: This could easily be more efficient.... bigger fish.
	    function fractionEquivalent(decimalValue, accuracy) {
	      accuracy = accuracy || '1/32'
	      const fracObj = parseFraction(accuracy);
	      const denominator = fracObj.denominator;
	      if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
	        throw new Error('Please enter a fraction with a denominator between (0, 1000]')
	      }
	      let sign = decimalValue > 0 ? 1 : -1;
	      let remainder = Math.abs(decimalValue);
	      let currRemainder = remainder;
	      let value = 0;
	      let numerator = 0;
	      while (currRemainder > 0) {
	        numerator += fracObj.numerator;
	        currRemainder -= fracObj.decimal;
	      }
	      const diff1 = Math.abs(decimalValue) - ((numerator - fracObj.numerator) / denominator);
	      const diff2 = (numerator / denominator) - Math.abs(decimalValue);
	      numerator -= diff1 < diff2 ? fracObj.numerator : 0;
	      const integer = sign * Math.floor(numerator / denominator);
	      numerator = numerator % denominator;
	      return {integer, numerator, denominator};
	    }
	
	    this.fraction = (accuracy, standardDecimal) => {
	      standardDecimal = standardDecimal || decimal;
	      if (nan) return NaN;
	      const obj = fractionEquivalent(standardDecimal, accuracy);
	      if (obj.integer === 0 && obj.numerator === 0) return '0';
	      const integer = obj.integer !== 0 ? obj.integer : '';
	      return `${integer}${reduce(obj.numerator, obj.denominator)}`;
	    }
	    this.standardUS = (accuracy) => this.fraction(accuracy, convertMetricToUs(decimal));
	
	    this.display = (accuracy) => {
	      switch (determineUnit()) {
	        case units[0]: return new String(this.decimal(10));
	        case units[1]: return this.standardUS(accuracy);
	        default:
	            return this.standardUS(accuracy);
	      }
	    }
	
	    this.value = (accuracy) => this.decimal(accuracy);
	
	    this.decimal = (accuracy) => {
	      if (nan) return NaN;
	      accuracy = accuracy % 10 ? accuracy : 10000;
	      return Math.round(decimal * accuracy) / accuracy;
	    }
	
	    function getDecimalEquivalant(string) {
	      string = string.trim();
	      if (string.match(Measurement.decimalReg)) {
	        return Number.parseFloat(string);
	      } else if (string.match(StringMathEvaluator.fractionOrMixedNumberReg)) {
	        return parseFraction(string).decimal
	      } else {
	        const value = Measurement.sme(string);
	        if ((typeof value) === 'number') return value;
	      }
	      nan = true;
	      return NaN;
	    }
	
	    const convertMetricToUs = (standardDecimal) =>  standardDecimal / 2.54;
	    const convertUsToMetric = (standardDecimal) => value = standardDecimal * 2.54;
	
	    function standardize(ambiguousDecimal) {
	      switch (determineUnit()) {
	        case units[0]:
	          return ambiguousDecimal;
	        case units[1]:
	          return convertUsToMetric(ambiguousDecimal);
	        default:
	          throw new Error('This should not happen, Measurement.unit should be the gate keeper that prevents invalid units from being set');
	      }
	    }
	
	    if ((typeof value) === 'number') {
	      decimal = standardize(value);
	    } else if ((typeof value) === 'string') {
	      try {
	        const ambiguousDecimal = getDecimalEquivalant(value);
	        decimal = standardize(ambiguousDecimal);
	      } catch (e) {
	        nan = true;
	      }
	    } else {
	      nan = true;
	    }
	  }
	}
	
	Measurement.unit = (newUnit) => {
	  for (index = 0; index < units.length; index += 1) {
	    if (newUnit === units[index]) unit = newUnit;
	  }
	  return unit
	};
	Measurement.sme = new StringMathEvaluator(Math).eval;
	Measurement.units = () => JSON.parse(JSON.stringify(units));
	Measurement.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
	Measurement.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
	Measurement.rangeRegex = /^\s*(\(|\[)(.*),(.*)(\)|\])\s*/;
	Measurement.decimalReg = /(^(-|)[0-9]*(\.|$|^)[0-9]*)$/;
	
	
	Measurement.validation = function (range) {
	  const obj = regexToObject(range, Measurement.rangeRegex, 'minBound', 'min', 'max', 'maxBound');
	  let min = obj.min.trim() !== '' ?
	        new Measurement(obj.min).decimal() : Number.MIN_SAFE_INTEGER;
	  let max = obj.max.trim() !== '' ?
	        new Measurement(obj.max).decimal() : Number.MAX_SAFE_INTEGER;
	  const minCheck = obj.minBound === '(' ? ((val) => val > min) : ((val) => val >= min);
	  const maxCheck = obj.maxBound === ')' ? ((val) => val < max) : ((val) => val <= max);
	  return function (value) {
	    const decimal = new Measurement(value).decimal();
	    if (decimal === NaN) return false;
	    return minCheck(decimal) && maxCheck(decimal);
	  }
	}
	
	Measurement.decimal = (value) => {
	  return new Measurement(value, true).decimal();
	}
	
	Measurement.round = (value, percision) => {
	  if (percision)
	  return new Measurement(value).decimal(percision);
	  return Math.round(value * 10000000) / 10000000;
	}
	
	try {
	  module.exports = Measurement;
	} catch (e) {/* TODO: Consider Removing */}
	
});


RequireJS.addFunction('../../public/js/utils/string-math-evaluator.js',
function (require, exports, module) {
	let FunctionCache;
	try {
	  FunctionCache = require('./services/function-cache.js');
	} catch(e) {
	
	}
	
	function regexToObject (str, reg) {
	  const match = str.match(reg);
	  if (match === null) return null;
	  const returnVal = {};
	  for (let index = 2; index < arguments.length; index += 1) {
	    const attr = arguments[index];
	    if (attr) returnVal[attr] = match[index - 1];
	  }
	  return returnVal;
	}
	
	class StringMathEvaluator {
	  constructor(globalScope, resolver) {
	    globalScope = globalScope || {};
	    const instance = this;
	    let splitter = '.';
	
	    function resolve (path, currObj, globalCheck) {
	      if (path === '') return currObj;
	      // TODO: this try is a patch... resolve path/logic needs to be mapped properly
	      try {
	        const resolved = !globalCheck && resolver && resolver(path, currObj);
	        if (Number.isFinite(resolved)) return resolved;
	      } catch (e) {}
	      try {
	        if ((typeof path) === 'string') path = path.split(splitter);
	        for (let index = 0; index < path.length; index += 1) {
	          currObj = currObj[path[index]];
	        }
	        if (currObj === undefined && !globalCheck) throw Error('try global');
	        return currObj;
	      }  catch (e) {
	        if (!globalCheck) return resolve(path, globalScope, true);
	      }
	    }
	
	    function multiplyOrDivide (values, operands) {
	      const op = operands[operands.length - 1];
	      if (op === StringMathEvaluator.multi || op === StringMathEvaluator.div) {
	        const len = values.length;
	        values[len - 2] = op(values[len - 2], values[len - 1])
	        values.pop();
	        operands.pop();
	      }
	    }
	
	    const resolveArguments = (initialChar, func) => {
	      return function (expr, index, values, operands, scope, path) {
	        if (expr[index] === initialChar) {
	          const args = [];
	          let endIndex = index += 1;
	          const terminationChar = expr[index - 1] === '(' ? ')' : ']';
	          let terminate = false;
	          let openParenCount = 0;
	          while(!terminate && endIndex < expr.length) {
	            const currChar = expr[endIndex++];
	            if (currChar === '(') openParenCount++;
	            else if (openParenCount > 0 && currChar === ')') openParenCount--;
	            else if (openParenCount === 0) {
	              if (currChar === ',') {
	                args.push(expr.substr(index, endIndex - index - 1));
	                index = endIndex;
	              } else if (openParenCount === 0 && currChar === terminationChar) {
	                args.push(expr.substr(index, endIndex++ - index - 1));
	                terminate = true;
	              }
	            }
	          }
	
	          for (let index = 0; index < args.length; index += 1) {
	            const stringMatch = args[index].match(StringMathEvaluator.stringReg);
	            if (stringMatch) {
	              args[index] = stringMatch[1];
	            } else {
	              args[index] =  instance.eval(args[index], scope);
	            }
	          }
	          const state = func(expr, path, scope, args, endIndex);
	          if (state) {
	            values.push(state.value);
	            return state.endIndex;
	          }
	        }
	      }
	    };
	
	    function chainedExpressions(expr, value, endIndex, path) {
	      if (expr.length === endIndex) return {value, endIndex};
	      let values = [];
	      let offsetIndex;
	      let valueIndex = 0;
	      let chained = false;
	      do {
	        const subStr = expr.substr(endIndex);
	        const offsetIndex = isolateArray(subStr, 0, values, [], value, path) ||
	                            isolateFunction(subStr, 0, values, [], value, path) ||
	                            (subStr[0] === '.' &&
	                              isolateVar(subStr, 1, values, [], value));
	        if (Number.isInteger(offsetIndex)) {
	          value = values[valueIndex];
	          endIndex += offsetIndex - 1;
	          chained = true;
	        }
	      } while (offsetIndex !== undefined);
	      return {value, endIndex};
	    }
	
	    const isolateArray = resolveArguments('[',
	      (expr, path, scope, args, endIndex) => {
	        endIndex = endIndex - 1;
	        let value = resolve(path, scope)[args[args.length - 1]];
	        return chainedExpressions(expr, value, endIndex, '');
	      });
	
	    const isolateFunction = resolveArguments('(',
	      (expr, path, scope, args, endIndex) =>
	          chainedExpressions(expr, resolve(path, scope).apply(null, args), endIndex, ''));
	
	    function isolateParenthesis(expr, index, values, operands, scope) {
	      const char = expr[index];
	      if (char === ')') throw new Error('UnExpected closing parenthesis');
	      if (char === '(') {
	        let openParenCount = 1;
	        let endIndex = index + 1;
	        while(openParenCount > 0 && endIndex < expr.length) {
	          const currChar = expr[endIndex++];
	          if (currChar === '(') openParenCount++;
	          if (currChar === ')') openParenCount--;
	        }
	        if (openParenCount > 0) throw new Error('UnClosed parenthesis');
	        const len = endIndex - index - 2;
	        values.push(instance.eval(expr.substr(index + 1, len), scope));
	        multiplyOrDivide(values, operands);
	        return endIndex;
	      }
	    };
	
	    function isolateOperand (char, operands) {
	      if (char === ')') throw new Error('UnExpected closing parenthesis');
	      switch (char) {
	        case '*':
	        operands.push(StringMathEvaluator.multi);
	        return true;
	        break;
	        case '/':
	        operands.push(StringMathEvaluator.div);
	        return true;
	        break;
	        case '+':
	        operands.push(StringMathEvaluator.add);
	        return true;
	        break;
	        case '-':
	        operands.push(StringMathEvaluator.sub);
	        return true;
	        break;
	      }
	      return false;
	    }
	
	    function isolateValueReg(reg, resolver) {
	      return function (expr, index, values, operands, scope) {
	        const match = expr.substr(index).match(reg);
	        let args;
	        if (match) {
	          let endIndex = index + match[0].length;
	          let value = resolver(match[0], scope);
	          if (!Number.isFinite(value)) {
	            const state = chainedExpressions(expr, scope, endIndex, match[0]);
	            if (state !== undefined) {
	              value = state.value;
	              endIndex = state.endIndex;
	            }
	          }
	          values.push(value);
	          multiplyOrDivide(values, operands);
	          return endIndex;
	        }
	      }
	    }
	
	    function convertFeetInchNotation(expr) {
	      expr = expr.replace(StringMathEvaluator.footInchReg, '($1*12+$2)') || expr;
	      expr = expr.replace(StringMathEvaluator.inchReg, '$1') || expr;
	      expr = expr.replace(StringMathEvaluator.footReg, '($1*12)') || expr;
	      return expr = expr.replace(StringMathEvaluator.multiMixedNumberReg, '($1+$2)') || expr;
	    }
	    function addUnexpressedMultiplicationSigns(expr) {
	      expr = expr.replace(/([0-9]{1,})(\s*)([a-zA-Z]{1,})/g, '$1*$3');
	      expr = expr.replace(/([a-zA-Z]{1,})\s{1,}([0-9]{1,})/g, '$1*$2');
	      expr = expr.replace(/\)([^a-z^A-Z^$^\s^)^+^\-^*^\/])/g, ')*$1');
	      expr = expr.replace(/-([a-z(])/g, '-1*$1');
	      return expr.replace(/([^a-z^A-Z^\s^$^(^+^\-^*^\/])\(/g, '$1*(');
	    }
	
	    const isolateNumber = isolateValueReg(StringMathEvaluator.decimalReg, Number.parseFloat);
	    const isolateVar = isolateValueReg(StringMathEvaluator.varReg, resolve);
	
	    function evaluate(expr, scope, percision) {
	      if (Number.isFinite(expr))
	        return expr;
	      expr = new String(expr);
	      expr = addUnexpressedMultiplicationSigns(expr);
	      expr = convertFeetInchNotation(expr);
	      scope = scope || globalScope;
	      const allowVars = (typeof scope) === 'object';
	      let operands = [];
	      let values = [];
	      let prevWasOpperand = true;
	      for (let index = 0; index < expr.length; index += 1) {
	        const char = expr[index];
	        if (prevWasOpperand) {
	          try {
	            let newIndex = isolateNumber(expr, index, values, operands, scope);
	            if (!newIndex && isolateOperand(char, operands)) {
	              throw new Error(`Invalid operand location ${expr.substr(0,index)}'${expr[index]}'${expr.substr(index + 1)}`);
	            }
	            newIndex = newIndex || (isolateParenthesis(expr, index, values, operands, scope) ||
	                (allowVars && isolateVar(expr, index, values, operands, scope)));
	            if (Number.isInteger(newIndex)) {
	              index = newIndex - 1;
	              prevWasOpperand = false;
	            }
	          } catch (e) {
	            console.error(e);
	            return NaN;
	          }
	        } else {
	          prevWasOpperand = isolateOperand(char, operands);
	        }
	      }
	      if (prevWasOpperand) return NaN;
	
	      let value = values[0];
	      for (let index = 0; index < values.length - 1; index += 1) {
	        value = operands[index](values[index], values[index + 1]);
	        values[index + 1] = value;
	      }
	
	      if (Number.isFinite(value)) {
	        value = value;
	        return value;
	      }
	      return NaN;
	    }
	
	    function evalObject(obj, scope) {
	      const returnObj = Object.forEachConditional(obj, (value, key, object) => {
	        value = evaluate(value, scope);
	        if (!Number.isNaN(value)) object[key] = value;
	      }, (value) => (typeof value) === 'string');
	      return returnObj;
	    }
	
	    this.eval = FunctionCache ? new FunctionCache(evaluate, this, 'sme') : evaluate;
	    this.evalObject = FunctionCache ? new FunctionCache(evalObject, this, 'sme') : evalObject;
	  }
	}
	
	StringMathEvaluator.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
	
	const mixNumberRegStr = "([0-9]{1,})\\s{1,}(([0-9]{1,})\\/([0-9]{1,}))";
	StringMathEvaluator.mixedNumberReg = new RegExp(`^${mixNumberRegStr}$`);
	StringMathEvaluator.multiMixedNumberReg = new RegExp(mixNumberRegStr, 'g');///([0-9]{1,})\s{1,}([0-9]{1,}\/[0-9]{1,})/g;
	StringMathEvaluator.fractionOrMixedNumberReg = /(^([0-9]{1,})\s|^){1,}([0-9]{1,}\/[0-9]{1,})$/;
	StringMathEvaluator.footInchReg = /\s*([0-9]{1,})\s*'\s*([0-9\/ ]{1,})\s*"\s*/g;
	StringMathEvaluator.footReg = /\s*([0-9]{1,})\s*'\s*/g;
	StringMathEvaluator.inchReg = /\s*([0-9]{1,})\s*"\s*/g;
	StringMathEvaluator.evaluateReg = /[-\+*/]|^\s*[0-9]{1,}\s*$/;
	const decimalRegStr = "((-|)(([0-9]{1,}\\.[0-9]{1,})|[0-9]{1,}(\\.|)|(\\.)[0-9]{1,}))";
	StringMathEvaluator.decimalReg = new RegExp(`^${decimalRegStr}`);///^(-|)(([0-9]{1,}\.[0-9]{1,})|[0-9]{1,}(\.|)|(\.)[0-9]{1,})/;
	StringMathEvaluator.multiDecimalReg = new RegExp(decimalRegStr, 'g');
	StringMathEvaluator.varReg = /^((\.|)([$_a-zA-Z][$_a-zA-Z0-9\.]*))/;
	StringMathEvaluator.stringReg = /\s*['"](.*)['"]\s*/;
	StringMathEvaluator.multi = (n1, n2) => n1 * n2;
	StringMathEvaluator.div = (n1, n2) => n1 / n2;
	StringMathEvaluator.add = (n1, n2) => n1 + n2;
	StringMathEvaluator.sub = (n1, n2) => n1 - n2;
	
	const npf = Number.parseFloat;
	StringMathEvaluator.convert = {eqn: {}};
	StringMathEvaluator.convert.metricToImperial = (value) => {
	  value = npf(value);
	  return value / 2.54;
	}
	
	StringMathEvaluator.resolveMixedNumber = (value) => {
	  const match = value.match(StringMathEvaluator.mixedNumberReg);
	  if (match) {
	    value = npf(match[1]) + (npf(match[3]) / npf(match[4]));
	  }
	  value = npf(value);
	  return value;
	}
	
	StringMathEvaluator.convert.imperialToMetric = (value) => {
	  value = npf(value);
	  return value * 2.54;
	}
	
	StringMathEvaluator.convert.eqn.metricToImperial = (str) =>
	  str.replace(StringMathEvaluator.multiDecimalReg, StringMathEvaluator.convert.metricToImperial);
	
	StringMathEvaluator.convert.eqn.imperialToMetric = (str) =>
	  str.replace(StringMathEvaluator.multiMixedNumberReg, StringMathEvaluator.resolveMixedNumber)
	  .replace(StringMathEvaluator.multiDecimalReg, StringMathEvaluator.convert.imperialToMetric);
	
	StringMathEvaluator.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
	
	
	StringMathEvaluator.reduce = function(numerator, denominator) {
	  let reduced = true;
	  while (reduced) {
	    reduced = false;
	    for (let index = 0; index < StringMathEvaluator.primes.length; index += 1) {
	      const prime = StringMathEvaluator.primes[index];
	      if (prime >= denominator) break;
	      if (numerator % prime === 0 && denominator % prime === 0) {
	        numerator = numerator / prime;
	        denominator = denominator / prime;
	        reduced = true;
	        break;
	      }
	    }
	  }
	  if (numerator === 0) {
	    return '';
	  }
	  return `${numerator}/${denominator}`;
	}
	
	StringMathEvaluator.parseFraction = function (str) {
	  const regObj = regexToObject(str, StringMathEvaluator.regex, null, 'integer', null, 'numerator', 'denominator');
	  regObj.integer = Number.parseInt(regObj.integer) || 0;
	  regObj.numerator = Number.parseInt(regObj.numerator) || 0;
	  regObj.denominator = Number.parseInt(regObj.denominator) || 0;
	  if(regObj.denominator === 0) {
	    regObj.numerator = 0;
	    regObj.denominator = 1;
	  }
	  regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
	  return regObj;
	}
	
	StringMathEvaluator.toFraction = function (decimal, accuracy) {
	  if (decimal === NaN) return NaN;
	  accuracy = accuracy || '1/1000'
	  const fracObj = StringMathEvaluator.parseFraction(accuracy);
	  const denominator = fracObj.denominator;
	  if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
	    throw new Error('Please enter a fraction with a denominator between (0, 1000]')
	  }
	  let remainder = decimal;
	  let currRemainder = remainder;
	  let value = 0;
	  let numerator = 0;
	  while (currRemainder > 0) {
	    numerator += fracObj.numerator;
	    currRemainder -= fracObj.decimal;
	  }
	  const diff1 = decimal - ((numerator - fracObj.numerator) / denominator);
	  const diff2 = (numerator / denominator) - decimal;
	  numerator -= diff1 < diff2 ? fracObj.numerator : 0;
	  const integer = Math.floor(numerator / denominator);
	  numerator = numerator % denominator;
	  const fraction = StringMathEvaluator.reduce(numerator, denominator);
	  return (integer && fraction ? `${integer} ${fraction}` :
	            (integer ? `${integer}` : (fraction ? `${fraction}` : '0')));
	}
	
	try {
	  module.exports = StringMathEvaluator;
	} catch (e) {/* TODO: Consider Removing */}
	
});


RequireJS.addFunction('../../public/js/utils/services/function-cache.js',
function (require, exports, module) {
	
const cacheState = {};
	const cacheFuncs = {};
	
	class FunctionCache {
	  constructor(func, context, group, assem) {
	    if ((typeof func) !== 'function') return func;
	    let cache = {};
	    cacheFunc.group = () => {
	      const gp = (typeof group === 'function') ? group() : group || 'global';
	      if (cacheFuncs[gp] === undefined) cacheFuncs[gp] = [];
	      cacheFuncs[gp].push(cacheFunc);
	      return gp;
	    }
	
	    function cacheFunc() {
	      if (FunctionCache.isOn(cacheFunc.group())) {
	        let c = cache;
	        for (let index = 0; index < arguments.length; index += 1) {
	          if (c[arguments[index]] === undefined) c[arguments[index]] = {};
	          c = c[arguments[index]];
	        }
	        if (c[arguments[index]] === undefined) c[arguments[index]] = {};
	
	        if (c.__FunctionCache === undefined) {
	          FunctionCache.notCahed++
	          c.__FunctionCache = func.apply(context, arguments);
	        } else FunctionCache.cached++;
	        return c.__FunctionCache;
	      }
	      FunctionCache.notCahed++
	      return func.apply(context, arguments);
	    }
	    cacheFunc.clearCache = () => cache = {};
	    return cacheFunc;
	  }
	}
	
	FunctionCache.cached = 0;
	FunctionCache.notCahed = 0;
	FunctionCache.on = (group) => {
	  FunctionCache.cached = 0;
	  FunctionCache.notCahed = 0;
	  cacheState[group] = true;
	}
	FunctionCache.off = (group) => {
	  const cached = FunctionCache.cached;
	  const total = FunctionCache.notCahed + cached;
	  const percent = (cached / total) * 100;
	  console.log(`FunctionCache report: ${cached}/${total} %${percent}`);
	  cacheState[group] = false;
	  cacheFuncs[group].forEach((func) => func.clearCache());
	}
	let disabled = false;
	FunctionCache.isOn = (group) => !disabled && cacheState[group];
	FunctionCache.disable = () => disabled = true;
	FunctionCache.enable = () => disabled = false;
	module.exports = FunctionCache;
	
});


RequireJS.addFunction('../../public/js/utils/dom-utils.js',
function (require, exports, module) {
	
const frag = document.createDocumentFragment();
	function validSelector (selector) {
	  try {
	    frag.querySelector(selector)
	    return selector;
	  } catch (e) {
	    const errMsg = `Invalid Selector: '${selector}'` ;
	    console.error(errMsg);
	    return null;
	  }
	};
	const VS = validSelector;
	
	function parseSeperator(string, seperator, isRegex) {
	  if (isRegex !== true) {
	    seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
	  }
	  var keyValues = string.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
	  var json = {};
	  for (let index = 0; keyValues && index < keyValues.length; index += 1) {
	    var split = keyValues[index].match(new RegExp('\\s*(.*?)\\s*=\\s*(.*?)\\s*(' + seperator + '|$)'));
	    if (split) {
	      json[split[1]] = split[2];
	    }
	  }
	  return json;
	}
	
	
	const du = {create: {}, class: {}, cookie: {}, param: {}, style: {}, is: {},
	      scroll: {}, input: {}, on: {}, move: {}, url: {}, fade: {}, position: {},
	      bounds: {}};
	du.find = (selector) => document.querySelector(selector);
	du.find.all = (selector) => document.querySelectorAll(selector);
	du.validSelector = VS;
	
	du.create.element = function (tagname, attributes) {
	  const elem = document.createElement(tagname);
	  const keys = Object.keys(attributes || {});
	  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
	  return elem;
	}
	
	du.create.event = (eventName) => {
	  let event;
	  if(document.createEvent){
	      event = document.createEvent("HTMLEvents");
	      event.initEvent(eventName, true, true);
	      event.eventName = eventName;
	  } else {
	      event = document.createEventObject();
	      event.eventName = eventName;
	      event.eventType = eventName;
	  }
	  return event;
	}
	
	// Ripped off of: https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
	du.download = (filename, contents) => {
	  var element = document.createElement('a');
	  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
	  element.setAttribute('download', filename);
	
	  element.style.display = 'none';
	  document.body.appendChild(element);
	
	  element.click();
	
	  document.body.removeChild(element);
	}
	
	function keepInBounds (elem, minimum) {
	  if (!du.is.fixed(elem)) return;
	  const ancestors = [elem];
	  while(elem.parentElement) ancestors.push(elem = elem.parentElement);
	  while (elem && !du.is.fixed(elem = ancestors.pop()));
	  elem ||= ancestors[0];
	  minimum ||= 5;
	  const windowBounds = du.bounds.window();
	  function checkDir(dir1, dir2) {
	    const rect = du.bounds.elem(elem);
	    const dir1dist = Math.difference(rect[dir1], windowBounds[dir1]);
	    const dir2dist = Math.difference(rect[dir2], windowBounds[dir2]);
	    if (dir1dist < dir2dist) {
	      if (rect[dir1] < windowBounds[dir1] - 1) {
	        console.log('moving')
	        du.bounds.window();
	        du.bounds.window();
	        elem.style[dir1] = windowBounds[dir1] + minimum + 'px';
	        elem.style[dir2] = 'unset';
	      }
	    }
	    // TODO: Need to apply scale to window bounds in order for upperLimit check
	    // else {
	    //   if (rect[dir2] > windowBounds[dir2] + 1) {
	    //     console.log('moving1');
	    //     du.bounds.window();
	    //     elem.style[dir2] = windowBounds[dir2] + minimum + 'px';
	    //     elem.style[dir1] = 'unset';
	    //   }
	    // }
	  }
	  checkDir('left', 'right');
	  checkDir('top', 'bottom');
	}
	
	du.bounds.window = () => {
	  const w = window.innerWidth;
	  const h = window.innerHeight;
	  const sx = window.scrollX;
	  const sy = window.scrollY;
	  return {left: 0, right: sx+w, top: 0, bottom: sy+h};
	}
	
	du.bounds.view = () => {
	  const w = window.innerWidth;
	  const h = window.innerHeight;
	  return {left: 0, right: w, top: 0, bottom: h};
	}
	
	du.bounds.elem = (elem) => {
	  const rect = elem.getBoundingClientRect();
	  const sx = window.scrollX;
	  const sy = window.scrollY;
	  rect.x += sx;
	  rect.y += sy;
	  rect.top += sy;
	  rect.bottom += sy;
	  rect.left += sx;
	  rect.right += sx;
	  return rect;
	}
	
	du.zIndex = function (elem) {
	  return Number.parseInt(document.defaultView.getComputedStyle(elem, null)
	    .getPropertyValue("z-index"), 10);
	}
	du.move.inFront = function (elem, timeout) {
	  setTimeout(function () {
	    var exclude = du.find.downAll('*', elem);
	    exclude.push(elem);
	    var elems = document.querySelectorAll('*');
	    var highest = Number.MIN_SAFE_INTEGER;
	    for (var i = 0; i < elems.length; i++) {
	      const e = elems[i];
	      if (exclude.indexOf(e) === -1) {
	        var zindex = du.zIndex(e);
	      }
	      if (zindex > highest) highest = zindex;
	    }
	    if (highest < Number.MAX_SAFE_INTEGER) elem.style.zIndex = highest + 1;
	  },  timeout || 0);
	}
	
	du.move.inbounds = keepInBounds;
	
	du.move.relitive = function (elem, target, direction, props) {
	  props = props || {};
	  const clientHeight = document.documentElement.clientHeight;
	  const clientWidth = document.documentElement.clientWidth;
	  const rect = target.getBoundingClientRect();
	
	  const style = {};
	  style.cursor = props.cursor || 'unset';
	  style.position = props.position || 'absolute';
	  du.style(elem, style);
	
	  const scrollY =  props.isFixed ? 0 : window.scrollY;
	  const scrollX =  props.isFixed ? 0 : window.scrollX;
	  const isTop = direction.indexOf('top') !== -1;
	  const isBottom = direction.indexOf('bottom') !== -1;
	  const isRight = direction.indexOf('right') !== -1;
	  const isLeft = direction.indexOf('left') !== -1;
	  const isCenter = direction.indexOf('center') !== -1;
	  const isOutside = direction.indexOf('outer') !== -1;
	  const isVertical = isTop || isBottom;
	  const position = {};
	  const outOffset = isOutside ? (isVertical ? elem.clientHeight : elem.clientWidth) : 0;
	  if (isCenter) {
	    position.top = (rect.top + rect.bottom - elem.clientHeight) / 2 + scrollY + 'px';
	    position.left = (rect.left + rect.right - elem.clientWidth) / 2 + scrollX + 'px';
	  }
	
	  if (isOutside) {
	    if (isTop) {
	      position.bottom = clientHeight - (rect.top + scrollY + outOffset) + elem.clientHeight + 'px';
	      position.top = 'unset';
	    } else { position.bottom = 'unset'; }
	
	    if (isBottom) {
	      position.top = clientHeight - ((clientHeight - rect.bottom) + elem.clientHeight - outOffset - scrollY) + 'px';
	    } else if (!isCenter) { position.top = 'unset'; }
	
	    if (isRight) {
	      position.left = (rect.right - scrollX) + 'px';
	    } else if (!isCenter) { position.left = 'unset'; }
	
	    if (isLeft) {
	      position.right = clientWidth - (rect.left + scrollX) + 'px';
	      position.left = 'unset';
	    } else { position.right = 'unset'; }
	  } else {
	    if (isTop) {
	      position.top = rect.top + scrollY + 'px';
	    } else if (!isCenter) { position.top = 'unset'; }
	
	    if (isBottom) {
	      position.bottom = (clientHeight - rect.bottom) - scrollY + 'px';
	      position.top = 'unset';
	    } else { position.bottom = 'unset'; }
	
	    if (isRight) {
	      position.right = clientWidth - rect.right - scrollX + 'px';
	    } else { position.right = 'unset'; }
	
	    if (isLeft) {
	      position.left = rect.left + scrollX + 'px';
	    } else if (!isCenter) { position.left = 'unset'; }
	  }
	
	  du.style(elem, position);
	}
	
	du.move.below = function (elem, target) {
	  du.move.relitive(elem, target, 'bottom');
	}
	
	du.move.above = function (elem, target) {
	  du.move.relitive(elem, target, 'bottom');
	}
	
	du.find.up = function (selector, node) {
	  selector = VS(selector);
	  if (node instanceof HTMLElement) {
	    if (node.matches(selector)) {
	      return node;
	    } else {
	      return du.find.up(selector, node.parentNode);
	    }
	  }
	}
	
	function visibility(hide, targets) {
	  targets = Array.isArray(targets) ? targets : [targets];
	  for (let index = 0; index < targets.length; index += 1) {
	    const target = targets[index];
	    if ((typeof target) === 'string') {
	      targets = targets.concat(Array.from(document.querySelectorAll(target)));
	    } else if (target instanceof HTMLElement) {
	      target.hidden = hide;
	    } else if (Array.isArray(target) || target instanceof NodeList || target instanceof HTMLCollection) {
	      targets = targets.concat(Array.from(target));
	    }
	  }
	}
	
	du.hide = (...targets) => visibility(true, targets);
	du.show = (...targets) => visibility(false, targets);
	
	du.id = function (id) {return document.getElementById(id);}
	
	du.appendError = (target, message) => {
	  return function (e) {
	    const parent = target.parentNode;
	    const error = document.createElement('div');
	    error.className = 'error';
	    error.innerHTML = message;
	    parent.insertBefore(error, target.nextElementSibling)
	  }
	}
	
	const jsAttrReg = /<([a-zA-Z]{1,}[^>]{1,})(\s|'|")on[a-z]{1,}=/;
	du.innerHTML = (text, elem) => {
	  if (text === undefined) return undefined;
	  const clean = text.replace(/<script(| [^<]*?)>/, '').replace(jsAttrReg, '<$1');
	  if (clean !== text) {
	    throw new JsDetected(text, clean);
	  }
	  if (elem !== undefined) elem.innerHTML = clean;
	  return clean;
	}
	
	du.find.upAll = function(selector, node) {
	  const elems = [];
	  let elem = node;
	  selector = VS(selector);
	  while(elem = du.find.up(selector, elem)) {
	    elems.push(elem);
	    elem = elem.parentElement;
	  }
	  return elems;
	}
	
	du.depth = function(node) {return upAll('*', node).length};
	
	du.find.downInfo = function (selector, node, distance, leafSelector) {
	  const nodes = node instanceof HTMLCollection ? node : [node];
	  distance = distance || 0;
	  selector = VS(selector);
	
	  function recurse (node, distance) {
	    if (node instanceof HTMLElement) {
	      if (node.matches(selector)) {
	        return { node, distance, matches: [{node, distance}]};
	      }
	    }
	    return { distance: Number.MAX_SAFE_INTEGER, matches: [] };
	  }
	
	  let matches = [];
	  let found = { distance: Number.MAX_SAFE_INTEGER };
	  for (let index = 0; index < nodes.length; index += 1) {
	    const currNode = nodes[index];
	    const maybe = recurse(currNode, ++distance);
	    if (maybe.node) {
	      matches = matches.concat(maybe.matches);
	      found = maybe.distance < found.distance ? maybe : found;
	
	    }
	    if (!leafSelector || !currNode.matches(leafSelector)) {
	      const childRes = du.find.downInfo(selector, currNode.children, distance + 1, leafSelector);
	      matches = matches.concat(childRes.matches);
	      found = childRes.distance < found.distance ? childRes : found;
	    }
	  }
	  found.matches = matches
	  found.list = matches.map((match) => match.node);
	  return found;
	}
	
	du.find.down = function(selector, node) {return du.find.downInfo(selector, node).node};
	du.find.downAll = function(selector, node) {return du.find.downInfo(selector, node).list};
	
	du.find.closest = function(selector, node) {
	  const visited = [];
	  selector = VS(selector);
	  function recurse (currNode, distance) {
	    let found = { distance: Number.MAX_SAFE_INTEGER };
	    if (!currNode || (typeof currNode.matches) !== 'function') {
	      return found;
	    }
	    visited.push(currNode);
	    if (currNode.matches(selector)) {
	      return { node: currNode, distance };
	    } else {
	      for (let index = 0; index < currNode.children.length; index += 1) {
	        const child = currNode.children[index];
	        if (visited.indexOf(child) === -1) {
	          const maybe = recurse(child, distance + index + 1);
	          found = maybe && maybe.distance < found.distance ? maybe : found;
	        }
	      }
	      if (visited.indexOf(currNode.parentNode) === -1) {
	        const maybe = recurse(currNode.parentNode, distance + 1);
	        found = maybe && maybe.distance < found.distance ? maybe : found;
	      }
	      return found;
	    }
	  }
	
	  return recurse(node, 0).node;
	}
	
	
	const selectors = {};
	let matchRunIdCount = 0;
	function getTargetId(target) {
	  if((typeof target.getAttribute) === 'function') {
	    let targetId = target.getAttribute('du-match-run-id');
	    if (targetId === null || targetId === undefined) {
	      targetId = matchRunIdCount + '';
	      target.setAttribute('du-match-run-id', matchRunIdCount++)
	    }
	    return targetId;
	  }
	  return target === document ?
	        '#document' : target === window ? '#window' : undefined;
	}
	
	
	
	function runMatch(event) {
	  const  matchRunTargetId = getTargetId(event.currentTarget);
	  const selectStrs = Object.keys(selectors[matchRunTargetId][event.type]);
	  selectStrs.forEach((selectStr) => {
	    const target = du.find.up(selectStr, event.target);
	    const everything = selectStr === '*';
	    if (everything || target) {
	      selectors[matchRunTargetId][event.type][selectStr].forEach((func) => func(target, event));
	    }
	  })
	}
	
	du.is.hidden = function (target) {
	  const elem = du.find.up('[hidden]', target);
	  return elem !== undefined;
	}
	
	du.is.fixed = function (target) {
	  const pos = document.defaultView.getComputedStyle(target).position;
	  const isAbsolute = pos === 'absolute';
	  const isRelative = pos === 'relative';
	  const isFixed = pos === 'fixed';
	  return isAbsolute || isFixed || isRelative;
	}
	
	du.is.inView = function (elem) {
	  const rect = elem.getBoundingClientRect();
	  const winTopLim = window.scrollY;
	  const winBotLim = window.scrollY + window.innerHeight;
	  const winLeftLim = window.scrollX;
	  const winRightLim = window.scrollY + window.innerWidth;
	
	  const leftGreater = rect.left > winLeftLim;
	  const leftLess = rect.left < winRightLim;
	  const rightGreater = rect.right > winLeftLim;
	  const rightLess = rect.right < winRightLim;
	  const topGreater = rect.top > winTopLim;
	  const topLess = rect.top < winBotLim;
	  const bottomGreater = rect.bottom > winTopLim;
	  const bottomLess = rect.bottom < winBotLim;
	
	  const leftTopCornerIn =  leftGreater && leftLess && topGreater && topLess;
	  const rightTopCornerIn =  rightGreater && rightLess && topGreater && topLess;
	
	  const leftBottomCornerIn =  leftGreater && leftLess && bottomGreater && bottomLess;
	  const rightBottomCornerIn =  rightGreater && rightLess && bottomGreater && bottomLess;
	
	  return leftTopCornerIn || rightTopCornerIn || leftBottomCornerIn || rightBottomCornerIn;
	}
	
	du.is.ancestor = function (elem, ancestor) {
	  while (elem.parentElement) {
	    if(elem === ancestor) return true;
	    elem = elem.parentElement;
	  }
	  return false;
	}
	
	du.class.add = function(target, clazz) {
	  du.class.remove(target, clazz);
	  target.className += ` ${clazz}`;
	}
	
	du.class.swap = function(target, newClass, oldClass) {
	  du.class.remove(target, oldClass);
	  du.class.add(target, newClass)
	}
	
	function classReg(clazz) {
	  return new RegExp(`(^| )(${clazz}( |$)){1,}`, 'g');
	}
	
	du.class.remove = function(target, clazz) {
	  if (!(target instanceof HTMLElement)) return;
	  target.className = target.className.replace(classReg(clazz), ' ').trim();
	}
	
	du.class.has = function(target, clazz) {
	  return target.className.match(classReg(clazz)) !== null;
	}
	
	du.class.toggle = function(target, clazz) {
	  if (du.class.has(target, clazz)) du.class.remove(target, clazz);
	  else du.class.add(target, clazz);
	}
	let lastKeyId;
	let keyPressId = 0;
	function onKeycombo(event, func, args) {
	  const keysDown = {};
	  const allPressed = () => {
	    let is = true;
	    const keys = Object.keys(keysDown);
	    const minTime = new Date().getTime() - 1000;
	    for (let index = 0; index < keys.length; index++) {
	      if (keysDown[keys[index]] < minTime) delete keysDown[keys[index]];
	    }
	    for (let index = 0; is && index < args.length; index += 1) {
	      is = is && keysDown[args[index]];
	    }
	    return is;
	  }
	  const keysString = () => Object.keys(keysDown).sort().join('/');
	  const setComboObj = (event) => {
	    const id = keysString;
	    const firstCall = lastKeyId !== id;
	    event.keycombonation = {
	      allPressed: allPressed(),
	      keysDown: JSON.clone(keysDown),
	      keyPressId: firstCall ? ++keyPressId : keyPressId,
	      firstCall, id
	    }
	  }
	
	  const keyup = (target, event) => {
	    delete keysDown[event.key];
	    setComboObj(event);
	    if (event.keycombonation.firstCall && args.length === 0) {
	      setComboObj(event);
	      func(target, event);
	    }
	  }
	  const keydown = (target, event) => {
	    keysDown[event.key] = new Date().getTime();
	    setComboObj(event);
	
	    if (event.keycombonation.firstCall && event.keycombonation.allPressed) {
	      func(target, event);
	    }
	  }
	  du.on.match('keyup', '*', keyup);
	  return {event: 'keydown', func: keydown};
	}
	
	// TODO: add custom function selectors.
	const argEventReg = /^(.*?)(|:(.*))$/;
	function filterCustomEvent(event, func) {
	  const split = event.split(/[\(\),]/).filter(str => str);;
	  event = split[0];
	  const args = split.slice(1).map((str, i) => str === ' ' ? ' ' : str.trim());
	  let customEvent = {func, event};
	  switch (event) {
	    case 'enter':
	      customEvent.func = (target, event) => event.key === 'Enter' && func(target, event);
	      customEvent.event = 'keydown';
	      break;
	    case 'keycombo':
	      customEvent = onKeycombo(event, func, args);
	    break;
	  }
	  return customEvent;
	}
	
	du.on.match = function(event, selector, func, target) {
	  const events = event.split(':');
	  if (events.length > 1) return events.forEach((e) => du.on.match(e, selector, func, target));
	  const filter = filterCustomEvent(event, func);
	  target = target || document;
	  selector = VS(selector);
	  if (selector === null) return;
	  if ((typeof func) !== 'function') console.warn(`Attempting to create an event without calling function.\nevent: "${event}"\nselector: ${selector}`)
	  const  matchRunTargetId = getTargetId(target);
	  if (selectors[matchRunTargetId] === undefined) {
	    selectors[matchRunTargetId] = {};
	  }
	  if (selectors[matchRunTargetId][filter.event] === undefined) {
	    selectors[matchRunTargetId][filter.event] = {};
	    target.addEventListener(filter.event, runMatch);
	  }
	  if ( selectors[matchRunTargetId][filter.event][selector] === undefined) {
	    selectors[matchRunTargetId][filter.event][selector] = [];
	  }
	
	  const selectorArray = selectors[matchRunTargetId][filter.event][selector];
	  // if (selectorArray.indexOf(func) !== -1) {
	    selectorArray.push(filter.func);
	  // }
	}
	
	
	
	du.switch = (selector, idAttr) => {
	  if (!VS(selector)) throw new Error('This class needs a valid selector that can grab your button and your container');
	  const btnSelector = `button${selector}`;
	  const cntSelector = `${selector}:not(button)`;
	  function onlyOne(elem) {
	    let allBtns = du.find.all(btnSelector);
	    let allCnts = du.find.all(cntSelector);
	    for (let i = 0; i < allBtns.length; i++) allBtns[i].hidden = false;
	    for (let i = 0; i < allCnts.length; i++) allCnts[i].hidden = true;
	    if (elem) {
	      let idSel = '';
	      if (idAttr) {
	        const attr = elem.getAttribute(idAttr);
	        idSel = attr ? `[${idAttr}='${attr}']` : '';
	      }
	      let cnt = du.find.closest(`${cntSelector}${idSel}`, elem);
	      if (cnt) cnt.hidden = false;
	      else console.warn('Element does not appear to have a corresponding container');
	    }
	  }
	
	  du.on.match('click', btnSelector, onlyOne);
	  return onlyOne;
	}
	
	du.trigger = (eventName, elemOid) => {
	  const elem = (typeof elemOid) === 'string' ? du.id(elemOid) : elemOid;
	  if (elem instanceof HTMLElement) {
	    const event = du.create.event(eventName);
	    if(document.createEvent){
	      elem.dispatchEvent(this.event);
	    } else {
	      elem.fireEvent("on" + this.event.eventType, this.event);
	    }
	  }
	}
	
	du.cookie.set = function(name, value, lifeMilliSecs) {
	  if (value instanceof Object) {
	    value = JSON.stringify(value);
	  }
	  const expireDate = new Date();
	  expireDate.setTime(expireDate.getTime() + (lifeMilliSecs || (8035200000))); //93 days by default
	  document.cookie = `${name}=${value}; expires=${expireDate.toUTCString()}`;
	}
	
	du.cookie.get = function(name, seperator) {
	  const cookie = parseSeperator(document.cookie, ';')[name];
	  if (seperator === undefined) return cookie;
	  const values = cookie === undefined ? [] : cookie.split(seperator);
	  if (arguments.length < 3) return values;
	  let obj = {};
	  for (let index = 2; index < arguments.length; index += 1) {
	    const key = arguments[index];
	    const value = values[index - 2];
	    obj[key] = value;
	  }
	  return obj;
	}
	
	du.url.breakdown = function () {
	  const breakdown = {};
	  const hashMatch = window.location.href.match(/(.*?)#(.*)/, '$1');
	  let noHash;
	  if (hashMatch) {
	    noHash = hashMatch[1];
	    breakdown.hashtag = hashMatch[2]
	  } else {
	    noHash = window.location.href;
	  }
	  const domainMatch = noHash.match(/(.*?):\/\/([^\/]*?)(:([0-9]{1,5})|)(\/[^?^#]*)/)
	  breakdown.protocol = domainMatch[1];
	  breakdown.domain = domainMatch[2];
	  breakdown.port = domainMatch[4] || undefined;
	  breakdown.path = domainMatch[5];
	
	  const urlMatch = noHash.match(/.*?:\/\/([^.]{1,})\.([^\/]*?)\.([^.^\/]{1,})(\/.*)/);
	  if (urlMatch) {
	    breakdown.subdomain = urlMatch[1];
	    breakdown.secondLevelDomain = urlMatch[2];
	    breakdown.topLevelDomaian = urlMatch[3]
	  }
	  breakdown.paramStr = noHash.substr(noHash.indexOf('?') + 1);
	
	  breakdown.params = parseSeperator(breakdown.paramStr, '&');
	  return breakdown;
	}
	
	du.url.build = function (b) {
	  const paramArray = [];
	  Object.keys(b.params).forEach((key) => paramArray.push(`${key}=${b.params[key]}`));
	  const paramStr = paramArray.length > 0 ? `?${paramArray.join('&')}` : '';
	  const portStr = b.port ? `:${b.port}` : '';
	  const hashStr = b.hashtag ? `#${b.hashtag}` : '';
	  return `${b.protocol}://${b.domain}${portStr}${b.path}${paramStr}${hashStr}`;
	}
	
	du.url.change = function (url) {
	  window.history.pushState(null,"", url);
	}
	
	du.param.get = function(name) {
	  let params = du.url.breakdown().params;
	  const value = params[name];
	  if (value === undefined) return undefined;
	  return decodeURI(value);
	}
	
	du.param.remove = function (name) {
	  const breakdown = du.url.breakdown();
	  delete breakdown.params[name];
	  du.url.change(du.url.build(breakdown));
	}
	
	du.style = function(elem, style, time) {
	  const save = {};
	  const keys = Object.keys(style);
	  keys.forEach((key) => {
	    save[key] = elem.style[key];
	    elem.style[key] = style[key];
	  });
	
	  if (time) {
	    setTimeout(() => {
	      keys.forEach((key) => {
	        elem.style[key] = save[key];
	      });
	    }, time);
	  }
	}
	
	function center(elem) {
	  const rect = elem.getBoundingClientRect();
	  const x = rect.x + (rect.height / 2);
	  const y = rect.y + (rect.height / 2);
	  return {x, y, top: rect.top};
	}
	
	du.scroll.can = function (elem) {
	    const horizontallyScrollable = elem.scrollWidth > elem.clientWidth;
	    const verticallyScrollable = elem.scrollHeight > elem.clientHeight;
	    return elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight;
	};
	
	du.scroll.parents = function (elem) {
	  let scrollable = [];
	  if (elem instanceof HTMLElement) {
	    if (du.scroll.can(elem)) {
	      scrollable.push(elem);
	    }
	    return du.scroll.parents(elem.parentNode).concat(scrollable);
	  }
	  return scrollable;
	}
	
	du.scroll.intoView = function(elem, divisor, delay, scrollElem) {
	  let scrollPidCounter = 0;
	  const lastPosition = {};
	  let highlighted = false;
	  function scroll(scrollElem) {
	    return function() {
	      const scrollCenter = center(scrollElem);
	      const elemCenter = center(elem);
	      const fullDist = Math.abs(scrollCenter.y - elemCenter.y);
	      const scrollDist = fullDist > 5 ? fullDist/divisor : fullDist;
	      const yDiff = scrollDist * (elemCenter.y < scrollCenter.y ? -1 : 1);
	      scrollElem.scroll(0, scrollElem.scrollTop + yDiff);
	      if (elemCenter.top !== lastPosition[scrollElem.scrollPid]
	            && (scrollCenter.y < elemCenter.y - 2 || scrollCenter.y > elemCenter.y + 2)) {
	        lastPosition[scrollElem.scrollPid] = elemCenter.top;
	        setTimeout(scroll(scrollElem), delay);
	      } else if(!highlighted) {
	        highlighted = true;
	        du.style.temporary(elem, 2000, {
	          borderStyle: 'solid',
	          borderColor: '#07ff07',
	          borderWidth: '5px'
	        });
	      }
	    }
	  }
	  const scrollParents = du.scroll.parents(elem);
	  scrollParents.forEach((scrollParent) => {
	    scrollParent.scrollPid = scrollPidCounter++;
	    setTimeout(scroll(scrollParent), 100);
	  });
	}
	
	du.fade.out = (elem, disapearAt, func) => {
	  const origOpacity = elem.style.opacity;
	  let stopFade = false;
	  function reduceOpacity () {
	    if (stopFade) return;
	    elem.style.opacity -= .005;
	    if (elem.style.opacity <= 0) {
	      elem.style.opacity = origOpacity;
	      func(elem);
	    } else {
	      setTimeout(reduceOpacity, disapearAt * 2 / 600 * 1000);
	    }
	  }
	
	  elem.style.opacity = 1;
	  setTimeout(reduceOpacity, disapearAt / 3 * 1000);
	  return () => {
	    stopFade = true;
	    elem.style.opacity = origOpacity;
	  };
	}
	
	
	
	du.cookie.remove = function (name) {
	  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
	}
	
	let copyTextArea;
	du.copy = (textOelem) => {
	  let elem;
	  if (textOelem instanceof HTMLElement) {
	    elem = textOelem;
	  } else {
	    if (copyTextArea === undefined) {
	      copyTextArea = du.create.element('textarea', {id: 'du-copy-textarea'});
	      document.body.append(copyTextArea);
	    }
	    elem = copyTextArea;
	    copyTextArea.value = textOelem;
	    copyTextArea.innerText = textOelem;
	  }
	
	  elem.select();
	  document.execCommand("copy");
	}
	
	du.paste = (elem, success, fail, validate) => {
	  fail ||= err => console.error('Failed to read clipboard contents: ', err);
	  navigator.clipboard.readText()
	  .then((text) => {
	    if ((typeof validate) !== 'function') {
	      success(text, elem);
	    } else {
	      const validResult = validate(text);
	      if (validResult) {
	        if (validResult === true) success(text, elem);
	        else success(validResult, elem);
	      }
	    }
	  })
	  .catch(fail);
	};
	
	du.paste.json = (elem, success, fail, validate) => {
	  let obj;
	  const validateWrapper = (text) => {
	    try {
	      const obj = Object.fromJson(JSON.parse(text));
	      return obj;
	    } catch (e) {
	      fail(e);
	    }
	  };
	  const successWrapper = (value, elem) => success(value, elem);
	  fail ||= err => console.error('Failed to read JSON object from clipboard contents: ', err);
	  du.paste(elem, successWrapper, fail, validateWrapper);
	}
	
	const attrReg = /^[a-zA-Z-]*$/;
	du.uniqueSelector = function selector(focusElem) {
	  if (!focusElem) return '';
	  let selector = '';
	  let percice;
	  let attrSelector;
	  let currSelector;
	  let currElem = focusElem;
	  do {
	    attrSelector = `${currElem.tagName}${currElem.id ? '#' + currElem.id : ''}`;
	
	    currSelector = `${attrSelector}${selector}`;
	    let found = du.find.all(currSelector);
	    percice = found && (found.length === 1 || (selector.length > 0 && found[0] === focusElem));
	    if (!percice) {
	      const index = Array.from(currElem.parentElement.children).indexOf(currElem);
	      selector = ` > :nth-child(${index + 1})${selector}`;
	      currElem = currElem.parentElement;
	      if (currElem === null) return '';
	    }
	  } while (!percice);
	  return currSelector;
	}
	
	class FocusInfo {
	  constructor() {
	    this.elem = document.activeElement;
	    if (this.elem) {
	      this.selector = du.uniqueSelector(this.elem);
	      this.start =  this.elem.selectionStart;
	      this.end = this.elem.selectionEnd;
	    } else return null;
	  }
	}
	
	du.focusInfo = function () { return new FocusInfo();}
	
	du.focus = function (selector) {
	  if ((typeof selector) === 'string') {
	    const elem = du.find(selector);
	    if (elem) elem.focus();
	  } else if (selector instanceof FocusInfo) {
	    const elem = du.find(selector.selector);
	    if (elem) {
	      elem.focus();
	      if (Number.isFinite(selector.start) && Number.isFinite(selector.end)) {
	        elem.selectionStart = selector.start;
	        elem.selectorEnd = selector.end;
	      }
	    }
	  }
	}
	
	// Stolen From: https://stackoverflow.com/a/66569574
	// Should write and test my own but bigger fish
	const cssUnitReg = new RegExp(/^((-|)[0-9]{1,})([a-zA-Z]{1,4})$/);
	du.convertCssUnit = function( cssValue, target ) {
	    target = target || document.body;
	    const supportedUnits = {
	        // Absolute sizes
	        'px': value => value,
	        'cm': value => value * 38,
	        'mm': value => value * 3.8,
	        'q': value => value * 0.95,
	        'in': value => value * 96,
	        'pc': value => value * 16,
	        'pt': value => value * 1.333333,
	        // Relative sizes
	        'rem': value => value * parseFloat( getComputedStyle( document.documentElement ).fontSize ),
	        'em': value => value * parseFloat( getComputedStyle( target ).fontSize ),
	        'vw': value => value / 100 * window.innerWidth,
	        'vh': value => value / 100 * window.innerHeight,
	        // Times
	        'ms': value => value,
	        's': value => value * 1000,
	        // Angles
	        'deg': value => value,
	        'rad': value => value * ( 180 / Math.PI ),
	        'grad': value => value * ( 180 / 200 ),
	        'turn': value => value * 360
	    };
	
	    // If is a match, return example: [ "-2.75rem", "-2.75", "rem" ]
	    const matches = String.prototype.toString.apply( cssValue ).trim().match(cssUnitReg);
	
	    if ( matches ) {
	        const value = Number( matches[ 1 ] );
	        const unit = matches[ 3 ].toLocaleLowerCase();
	        // Sanity check, make sure unit conversion function exists
	        if ( unit in supportedUnits ) {
	            return supportedUnits[ unit ]( value );
	        }
	    }
	
	    return cssValue;
	};
	
	try {
	  module.exports = du;
	} catch (e) {}
	
});


RequireJS.addFunction('../../public/js/utils/utils.js',
function (require, exports, module) {
	Math.PI12 = Math.PI/2;
	Math.PI32 = 3*Math.PI/2;
	Math.PI2 = 2*Math.PI;
	
	Math.PI14 = Math.PI/4;
	Math.PI34 = 3*Math.PI/4;
	Math.PI54 = 5*Math.PI/4;
	Math.PI74 = 7*Math.PI/4;
	
	
	
	function safeStdLibAddition() {
	  const addition = [];
	  function verify() {
	    additions.forEach((a) => {
	      if ((a.static && a.lib[a.field] !== a.func) ||
	      (!a.static && a.lib.prototype[a.field] !== a.func))
	        throw new Error(`Functionality was overwritten -` +
	                          `\n\tLibrary: ${a.lib}` +
	                          `\n\tStatic: ${a.static}` +
	                          `\n\tField: ${a.field}`)
	    });
	    delete additions;
	  }
	  function safeAdd (lib, field, func, static) {
	    if (!static && lib.prototype[field] === undefined)
	      lib.prototype[field] = func;
	    else if (lib[field] === undefined)
	      lib[field] = func;
	    else
	      console.error(`Attempting to overwrite functionality -` +
	                        `\n\tLibrary: ${lib}` +
	                        `\n\tStatic: ${static}` +
	                        `\n\tField: ${field}`);
	    addition.push({lib, field, func, static})
	  }
	  safeAdd(Function, 'safeStdLibAddition', safeAdd);
	}
	safeStdLibAddition();
	
	Function.safeStdLibAddition(Object, 'definedPropertyNames', function(object) {
	  const names = [];
	  for (var key in object) names.push(key);
	  return names;
	}, true);
	
	Function.safeStdLibAddition(Function, 'AsyncRunIgnoreSuccessPrintError', function(afunc, args) {
	  afunc(args).then(() => {}, (e) => console.error(e));
	
	}, true);
	
	Function.safeStdLibAddition(Object, 'filter', function(complement, func, modify, key) {
	  if (!modify) complement = JSON.copy(complement);
	  if (func(complement, key)) return {filtered: complement};
	
	  if (!(complement instanceof Object)) return {complement};
	  let filtered = Array.isArray(complement) ? [] : {};
	  const keys = Object.keys(complement);
	  let setOne = false;
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const seperated = Object.filter(complement[key], func, true, key);
	    if (seperated.filtered) filtered[key] = seperated.filtered;
	    setOne = true;
	    if (seperated.complement === undefined) delete complement[key];
	    else complement[key] = seperated.complement;;
	  }
	  if (Object.keys(filtered).length === 0) filtered = undefined;
	  return {complement, filtered};
	}, true);
	
	Function.safeStdLibAddition(Object, 'filter', function(func) {
	  return Object.filter(this, func, true).filtered;
	});
	
	Function.safeStdLibAddition(JSON, 'copy',   function  (obj) {
	  if (!(obj instanceof Object)) return obj;
	  return JSON.parse(JSON.stringify(obj));
	}, true);
	
	Function.safeStdLibAddition(Object, 'copy', function(arr) {
	  if (Array.isArray(arr)) throw new Error('point to merge...');
	  const root = Array.isArray(this) ? [] : {};
	  const keys = Object.keys(this);
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const value = this[key];
	    if (!(value instanceof Object)) root[key] = value;
	    else root[key] = value.copy();
	  }
	  return root;
	});
	
	
	
	
	Function.safeStdLibAddition(Object, 'foreach', function(obj, func, filter, pathPrefix) {
	  if (!pathPrefix) pathPrefix = '';
	  if((typeof filter) !== 'function' || filter(obj, pathPrefix)) func(obj, pathPrefix);
	  const keys = Object.keys(obj);
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const path = pathPrefix === '' ? key : `${pathPrefix}.${key}`;
	    const value = obj[key];
	    if (value instanceof Object) {
	      Object.foreach(value, func, filter, path);
	    }
	  }
	}, true);
	
	Function.safeStdLibAddition(Object, 'foreach', function(func, filter) {
	  Object.foreach(this, func, filter);
	});
	Function.safeStdLibAddition(Object, 'map',   function (obj, func) {
	  if ((typeof func) !== 'function') return console.warn('Object.map requires a function argument');
	  const keys = Object.keys(obj);
	  const map = {};
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const value = obj[key];
	    map[key] = func(value, key);
	  }
	  return map;
	}, true);
	
	Function.safeStdLibAddition(Object, 'hash',
	  (obj) => JSON.stringify(obj === undefined ? 'undefined' : obj).hash(), true);
	
	function processValue(value) {
	  let retVal;
	  if ((typeof value) === 'object' && value !== null) {
	    if ((typeof value.toJson) === 'function') {
	      retVal = value.toJson();
	    } else if ((typeof value.toJSON) === 'function') {
	      retVal = value.toJSON();
	    } else if (Array.isArray(value)){
	      const arr = [];
	      value.forEach((val) => {
	        if ((typeof val.toJson) === 'function') {
	          arr.push(val.toJson());
	        } else if ((typeof val.toJSON) === 'function') {
	          arr.push(val.toJSON());
	        } else {
	          arr.push(val);
	        }
	      });
	      retVal = arr;
	    } else {
	      const keys = Object.keys(value);
	      const obj = {};
	      for (let index = 0; index < keys.length; index += 1) {
	        const key = keys[index];
	        obj[key] = processValue(value[key]);
	      }
	      retVal = obj;
	    }
	  } else {
	    retVal = value;
	  }
	  return retVal;
	}
	
	// TODO: make moore efficient... dis es terible
	Function.safeStdLibAddition(Array, 'unique', function () {
	  return this.filter((() => {let found = []; return (e) => found.indexOf(e) === -1 && (found.push(e) || e);})());
	});
	
	Function.safeStdLibAddition(Array, 'equals', function (other, startIndex, endIndex) {
	    startIndex =  startIndex > -1 ? startIndex : 0;
	    endIndex = endIndex < this.length ? endIndex : this.length;
	    if (endIndex < other.length) return false;
	    let equal = true;
	    for (let index = startIndex; equal && index < endIndex; index += 1) {
	      const elem = this[index];
	      if (elem && (typeof elem.equals) === 'function') {
	        if (!elem.equals(other[index])) {
	          return index;
	        }
	      } else if (elem !== other[index]) {
	        equal = false;
	      }
	    }
	    return equal;
	});
	
	Function.safeStdLibAddition(String, 'random',  function (len) {
	    len = len || 7;
	    let str = '';
	    while (str.length < len) str += Math.random().toString(36).substr(2);
	    return str.substr(0, len);
	}, true);
	
	// const specialRegChars = /[-[\]{}()*+?.,\\^$|#\\s]/g;
	// TODO: Removed \\s not sure if its the right move
	const specialRegChars = /[-[\]{}()*+?.,\\^$|#]/g;
	Function.safeStdLibAddition(RegExp, 'escape',  function (str) {
	  return str.replace(specialRegChars, '\\$&');
	}, true);
	
	Function.safeStdLibAddition(String, 'replaceIterativly',  function (exp, replace) {
	  let str = this;
	  let next;
	  while ((next = str.replace(exp, replace)) !== str) str = next;
	  return str;
	});
	
	Function.safeStdLibAddition(String, 'count',  function (needle, length) {
	  const clean = RegExp.escape(this.substring(0, length));
	  const reg = new RegExp(`[^${RegExp.escape(needle)}]`, 'g');
	  return clean.replace(reg, '').length
	});
	
	
	const decimalRegString = "((-|)(([0-9]{1,}\\.[0-9]{1,})|[0-9]{1,}(\\.|)|(\\.)[0-9]{1,}))";
	const decimalReg = new RegExp(`^${decimalRegString}$`);
	Function.safeStdLibAddition(String, 'isNumber', function (len) {
	  return this.trim().match(decimalReg) !== null;
	});
	
	Function.safeStdLibAddition(String, 'number',  function (str) {
	  str = new String(str);
	  const match = str.match(/([0-9]).([0-9]{1,})e\+([0-9]{2,})/);
	  if (match) {
	    const zeros = Number.parseInt(match[3]) - match[2].length;
	    str = match[1] + match[2] + new Array(zeros).fill('0').join('');
	  }
	  return new String(str)
	      .split('').reverse().join(',')
	      .replace(/([0-9]),([0-9]),([0-9]),/g, '$1$2$3,')
	      .replace(/,([0-9]{1,2}),/g, ',$1')
	      .replace(/,([0-9]{1,2}),/g, ',$1')
	      .split('').reverse().join('')
	}, true);
	
	
	Function.safeStdLibAddition(Math, 'mod',  function (val, mod) {
	  while (val < 0) val += mod;
	  return val % mod;
	}, true);
	
	Function.safeStdLibAddition(Number, 'NaNfinity',  function (...vals) {
	  for (let index = 0; index < vals.length; index++) {
	    let val = vals[index];
	    if(Number.isNaN(val) || !Number.isFinite(val)) return true;
	  }
	  return false;
	}, true);
	
	function stringHash() {
	  let hashString = this;
	  let hash = 0;
	  for (let i = 0; i < hashString.length; i += 1) {
	    const character = hashString.charCodeAt(i);
	    hash = ((hash << 5) - hash) + character;
	    hash &= hash; // Convert to 32bit integer
	  }
	  return hash;
	}
	
	Function.safeStdLibAddition(String, 'hash',  stringHash, false);
	
	const LEFT = 1;
	const RIGHT = 0;
	Function.safeStdLibAddition(String, 'obscure',  function (count) {
	    const direction = count < 0 ? LEFT : RIGHT;
	    const test = (index) => direction === LEFT ? index > this.length + count - 1 : index < count;
	    let str = '';
	    for (let index = 0; index < this.length; index += 1) {
	      if (test(index)) {
	        str += '*';
	      } else {
	        str += this[index];
	      }
	    }
	    return str;
	});
	
	const singleCharReg = /([a-zA-Z]{1,})[^a-z^A-Z]{1,}([a-zA-Z])[^a-z^A-Z]{1,}([a-zA-Z]{1,})/;
	const specialCharReg = /([a-zA-Z])[^a-z^A-Z^0-9]{1,}([a-zA-Z])/g;
	const charNumberReg = /([a-zA-Z])([0-9])/
	function singleCharReplace(whoCares, one, two, three) {
	  const oneLastChar = one[one.length - 1];
	  const twoLower = oneLastChar !== oneLastChar.toLowerCase();
	  const twoStr = twoLower ? two.toLowerCase() : two.toUpperCase();
	  const threeStr = twoLower ? `${three[0].toUpperCase()}${three.substr(1)}` :
	                                `${three[0].toLowerCase()}${three.substr(1)}`;
	  return `${one}${twoStr}${threeStr}`;
	}
	function camelReplace(whoCares, one, two) {return `${one}${two.toUpperCase ? two.toUpperCase() : two}`;}
	function toCamel() {
	  let string = `${this.substr(0,1).toLowerCase()}${this.substr(1)}`.replace(charNumberReg, camelReplace);
	  while (string.match(singleCharReg)) string = string.replace(singleCharReg, singleCharReplace);
	  return string.replace(specialCharReg, camelReplace);
	}
	Function.safeStdLibAddition(String, 'toCamel',  toCamel);
	
	const multipleUpperReg = /([A-Z]{2,})([a-z])/g;
	const caseChangeReg = /([a-z])([A-Z])/g;
	function pascalReplace(whoCares, one, two) {return `${one.toLowerCase()}_${two.toUpperCase ? two.toUpperCase() : two}`;}
	function toPascal() {
	  let string = this;
	  return string.replace(multipleUpperReg, pascalReplace)
	                .replace(caseChangeReg, pascalReplace)
	                .replace(charNumberReg, pascalReplace)
	                .replace(specialCharReg, pascalReplace);
	}
	Function.safeStdLibAddition(String, 'toPascal',  toPascal);
	
	function toKebab() {
	  return this.toPascal().toLowerCase().replace(/_/g, '-');
	}
	Function.safeStdLibAddition(String, 'toKebab',  toKebab);
	
	Function.safeStdLibAddition(String, 'toSnake',  function () {return this.toKebab().replace(/-/g, '_')});
	Function.safeStdLibAddition(String, 'toDot',  function () {return this.toKebab().replace(/-/g, '.')});
	Function.safeStdLibAddition(String, 'toScreamingDot',  function () {return this.toKebab().replace(/-/g, '.')});
	Function.safeStdLibAddition(String, 'toScreamingSnake',  function () {return this.toSnakeCase().toUpperCase()});
	Function.safeStdLibAddition(String, 'toScreamingKebab',  function () {return this.toKebab().toUpperCase()});
	Function.safeStdLibAddition(String, 'toSentance',  function () {return this.toPascal().replace(/_/g, ' ')});
	
	Function.safeStdLibAddition(Function, 'orVal',  function (funcOrVal, ...args) {
	  return (typeof funcOrVal) === 'function' ? funcOrVal(...args) : funcOrVal;
	}, true);
	
	const classLookup = {};
	const attrMap = {};
	const identifierAttr = '_TYPE';
	const immutableAttr = '_IMMUTABLE';
	const temporaryAttr = '_TEMPORARY';
	const doNotOverwriteAttr = '_DO_NOT_OVERWRITE';
	
	const clazz = {};
	clazz.object = () => JSON.clone(classLookup);
	clazz.register = (clazz) => classLookup[clazz.name] = clazz;
	clazz.get = (name) => (typeof name) === 'string' ? classLookup[name] : name;
	clazz.filter = (filterFunc) => {
	  const classes = clazz.object();
	  if ((typeof filterFunc) !== 'function') return classes;
	  const classIds = Object.keys(classes);
	  const obj = {};
	  for (let index = 0; index < classIds.length; index += 1) {
	    const id = classIds[index];
	    if (filterFunc(classes[id])) obj[id] = classes[id];
	  }
	  return obj;
	}
	
	const filterOutUndefined = (obj) => (key) => obj[key] !== undefined;
	// TODO: Fix i dont know what i was doint/thinking
	function objEq(obj1, obj2) {
	  const isObj1 = obj1 instanceof Object;
	  const isObj2 = obj2 instanceof Object;
	  if (!isObj1 && !isObj2) return obj1 === obj2;
	  if (!isObj1) return false;
	  if (!isObj2) return false;
	  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
	  const obj1Keys = Object.keys(obj1).filter(filterOutUndefined(obj1));
	  const obj2Keys = Object.keys(obj2).filter(filterOutUndefined(obj2));
	  if (obj1Keys.length !== obj2Keys.length) return false;
	  for (let index = 0; index < obj1Keys.length; index += 1) {
	    const obj1Key = obj1Keys[index];
	    const obj2Key = obj2Keys[index];
	    if (obj1Key !== obj2Key) return false;
	    const obj1Val = obj1[obj1Key];
	    const obj2Val = obj2[obj2Key];
	    if (obj1Val instanceof Object) {
	      if ((typeof obj1Val.equals) !== 'function') {
	        if(!objEq(obj1Val, obj2Val)) {
	          objEq(obj1Val, obj2Val)
	          return false;
	        }
	      }
	      else if (!obj1Val.equals(obj2Val)) return false;
	    } else if (obj1[obj1Key] !== obj2[obj2Key]) return false;
	  }
	  return true;
	}
	
	Function.safeStdLibAddition(Object, 'merge', (target, object, soft) => {
	  if (!(target instanceof Object)) return;
	  if (!(object instanceof Object)) return;
	  if (soft !== false) soft === true;
	  const objKeys = Object.keys(object);
	  if (!soft) target.deleteAll();
	  for (let index = 0; index < objKeys.length; index++) {
	    const key = objKeys[index];
	    const value = object[key];
	    if (value instanceof Object && target[key] instanceof Object) {
	      Object.merge(target[key], value, soft);
	    } else if (!soft || target[key] === undefined) {
	      target[key] = value;
	    }
	  }
	  return target;
	}, true);
	
	Function.safeStdLibAddition(Object, 'merge', function () {
	  const lastArg = arguments[arguments.length - 1];
	  let soft = true;
	  let args = arguments;
	  if (lastArg === false || lastArg === true) {
	    soft = lastArg;
	    args = Array.from(arguments).slice(0, arguments.length - 1);
	  }
	  for (let index = 0; index < args.length; index++) {
	    const object = args[index];
	    if (object instanceof Object) {
	      Object.merge(this, object, soft);
	    } else {
	      console.error('Attempting to merge a non-object');
	    }
	  }
	  return this;
	});
	
	Function.safeStdLibAddition(Array, 'removeAll', function (arr) {
	  for (let index = 0; index < arr.length; index += 1) {
	    this.remove(arr[index]);
	  }
	});
	
	Function.safeStdLibAddition(Array, 'deleteAll', function () {
	  this.forEach((v, i) => delete this[i]);
	  this.length = 0;
	});
	
	Function.safeStdLibAddition(Object, 'deleteAll', function () {
	  Object.keys(this).forEach(key => delete this[key]);
	});
	
	Function.safeStdLibAddition(Object, 'forAllRecursive', (object, func) => {
	  if (!(object instanceof Object)) return;
	  if ((typeof func) !== 'function') return;
	  const target = Array.isArray(object) ? [] :{};
	  const objKeys = Object.keys(object);
	  for (let index = 0; index < objKeys.length; index++) {
	    const key = objKeys[index];
	    if (object[key] instanceof Object) {
	      target[key] = Object.forAllRecursive(object[key], func);
	    } else target[key] = func(object[key], key, object);
	  }
	  return target;
	}, true);
	
	Function.safeStdLibAddition(Object, 'class', clazz, true);
	Function.safeStdLibAddition(Object, 'equals', objEq, true);
	
	
	Function.safeStdLibAddition(Math, 'toDegrees', function (rads) {
	  return Math.round(1000 * Math.mod(rads * 180/Math.PI, 360)) / 1000;
	}, true);
	
	Function.safeStdLibAddition(Math, 'difference', function (val1, val2) {
	  if (val1 > val2) return Math.abs(val1 - val2);
	  return Math.abs(val2 - val1);
	}, true);
	
	Function.safeStdLibAddition(Object, 'forEachConditional', function (obj, func, conditionFunc, modifyObject) {
	  if (!modifyObject) obj = JSON.clone(obj);
	  conditionFunc = (typeof conditionFunc) === 'function' ? conditionFunc : () => true;
	  const keys = Object.keys(obj);
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const value = obj[key];
	    if (conditionFunc(value)) func(value, key, obj);
	    if (value instanceof Object) Object.forEachConditional(value, func, conditionFunc, true);
	  }
	  return obj;
	}, true);
	
	Function.safeStdLibAddition(Math, 'toRadians', function (angle, accuracy) {
	  return (angle*Math.PI/180)%(2*Math.PI);
	}, true);
	
	Function.safeStdLibAddition(Math, 'midpoint', function (s, e) {
	  if (e < s) {
	    let t = s;
	    s = e;
	    e = t;
	  }
	  return s + (e - s)/2;
	}, true);
	
	// Ripped off of: https://stackoverflow.com/a/2450976
	Function.safeStdLibAddition(Array, 'shuffle', function() {
	  let currentIndex = this.length,  randomIndex;
	  while (currentIndex != 0) {
	    randomIndex = Math.floor(Math.random() * currentIndex);
	    currentIndex--;
	    [this[currentIndex], this[randomIndex]] = [
	      this[randomIndex], this[currentIndex]];
	  }
	
	  return this;
	});
	
	Function.safeStdLibAddition(Array, 'count', function(funcOrVal, max) {
	  let count = 0;
	  const call = (typeof funcOrVal) === 'function';
	  for (let index = 0; index < this.length; index++) {
	    const retVal = call ? funcOrVal(this[index]) : funcOrVal === this[index];
	    count += (typeof retVal) === 'number' ? retVal : (retVal ? 1 : 0);
	    if (count >= max) return max;
	  }
	  return count;
	});
	
	Function.safeStdLibAddition(Array, 'contains', function(value, max) {
	  const funcOrVal = value && (typeof value.equals) === 'function' ? value.equals : value;
	  return this.count(funcOrVal, 1) === 1;
	});
	
	const primes = [3,5,7,11,17,19,23,29];
	const firstNotInList = (targetList, ignoreList) => {
	  for (let index = 0; index < targetList.length; index++) {
	    if (ignoreList.indexOf(targetList[index]) === -1) return {item: targetList[index], index};
	  }
	  return null;
	}
	Function.safeStdLibAddition(Array, 'systematicSuffle', function (numberOfSuffles, doNotShufflePrimes) {
	  const ps = [];
	  ps.copy(primes);
	  const map = {};
	  let primeCount = 0;
	  let loops = 0;
	  const lastSeven = [];
	  for (let index = 0; index < numberOfSuffles; index++) {
	    let prime = ps[primeCount % ps.length];
	    if (lastSeven.indexOf(prime) !== -1) {
	      const info = firstNotInList(ps, lastSeven);
	      prime = info.item;
	      primeCount = info.index;
	    }
	    lastSeven[index % 7] = prime;
	    primeCount += prime + (prime * (ps[(primeCount + loops++) % ps.length])) % ps.length;
	    let shuffleIndex = 0;
	    while (shuffleIndex < this.length) {
	      const firstPart = this.slice(0, shuffleIndex)
	      const secondPart = this.slice(shuffleIndex, (shuffleIndex = shuffleIndex + prime));
	      const thirdPart = this.slice(shuffleIndex)
	      this.copy(secondPart.concat(firstPart.concat(thirdPart)));
	    }
	    map[this.join().hash()] = true;
	  }
	  return Object.keys(map).length;
	});
	
	
	Function.safeStdLibAddition(Array, 'reorder', function () {
	  let count = 2;
	  let currentIndex = this.length,  randomIndex;
	  while (currentIndex != 0) {
	    randomIndex = (currentIndex * count++) % currentIndex;
	    currentIndex--;
	    [this[currentIndex], this[randomIndex]] = [
	      this[randomIndex], this[currentIndex]];
	  }
	});
	
	Function.safeStdLibAddition(Array, 'toJson', function (arr) {
	    const json = [];
	    arr.forEach((elem) => json.push(processValue(elem)));
	    return json;
	}, true);
	
	Function.safeStdLibAddition(Object, 'toJson', function (obj) {
	    if (!(obj instanceof Object)) throw new Error('Not an Object');
	    const json = Array.isArray(obj) ? [] : {};
	    const keys = Object.keys(obj);
	    keys.forEach((key) => json[key] = processValue(obj[key]));
	    return json;
	}, true);
	
	Function.safeStdLibAddition(Array, 'equalIndexOf', function (elem, startIndex, endIndex) {
	    startIndex =  startIndex > -1 ? startIndex : 0;
	    endIndex = endIndex < this.length ? endIndex : this.length;
	    for (let index = startIndex; index < endIndex; index += 1) {
	      if (elem && (typeof elem.equals) === 'function' && elem.equals(this[index])) {
	        return index;
	      } else if (elem === this[index]) {
	        return index;
	      }
	    }
	    return -1;
	});
	
	Function.safeStdLibAddition(Array, 'condition', function (initalValue, conditionFunc) {
	  const valueFuncDefined = (typeof valueFunc) === 'function';
	  for (let index = 0; index < this.length; index += 1) {
	    const elem = this[index];
	    initalValue = conditionFunc(initalValue, elem);
	  }
	  return initalValue;
	});
	
	Function.safeStdLibAddition(Array, 'max', function (max, func) {
	  const funcDefined = (typeof func) === 'function';
	  const initalValue = max || max === 0 ? {elem: max, value: funcDefined ? func(max) : max} : undefined;
	  return this.condition(initalValue, (max, elem) => {
	    let value = funcDefined ? func(elem, index) : elem;
	    if (!(max instanceof Object) || value > max.value) return {value, elem};
	    return max
	  }).elem;
	});
	
	Function.safeStdLibAddition(Array, 'min', function (min, func) {
	  const funcDefined = (typeof func) === 'function';
	  const initalValue = min || min === 0 ? {elem: min, value: funcDefined ? func(min) : min} : undefined;
	  return this.condition(initalValue, (min, elem) => {
	    let value = funcDefined ? func(elem, index) : elem;
	    if (!(min instanceof Object) || value < min.value) return {value, elem};
	    return min
	  }).elem;
	});
	
	Function.safeStdLibAddition(Array, 'print', function (min, func) {
	  const maxLength = new String(this.length).length;
	  for (let index = 0; index < this.length; index++) {
	    const elem = this[index];
	    const length = new String(index).length;
	    const position = new Array(maxLength - length).fill(' ').join('') + index + ':';
	  }
	});
	
	Function.safeStdLibAddition(Array, 'exists', function (array, obj) {
	  if (!Array.isArray(array)) return false;
	  for (let index = 0; index < array.length; index += 1) {
	    if (array[index] === obj) return true;
	  }
	  return false;
	}, true);
	
	Function.safeStdLibAddition(Array, 'remove', function (elem) {
	  const isFunction = elem && (typeof elem.equals) === 'function';
	  let removed = isFunction ? [] : undefined;
	  for (let index = 0; index < this.length; index += 1) {
	    if (isFunction && elem.equals(this[index])) {
	      removed.push(this.splice(index--, 1)[0]);
	    } else if (elem === this[index]) {
	      removed = this.splice(index--, 1)[0];
	    }
	  }
	  return removed;
	});
	
	Function.safeStdLibAddition(Array, 'compare', function (original, neww, modify) {
	    const comparison = {both: [], removed: [], added: []};
	    const arr = original.concat(neww);
	    const visited = {new: {}, original: {}};
	    arr.forEach((elem) => {
	      const origIndex = original.equalIndexOf(elem);
	      const newIndex = neww.equalIndexOf(elem);
	      if (!visited.new[newIndex] && !visited.original[origIndex]) {
	        if (newIndex !== -1) visited.new[newIndex] = true;
	        if (origIndex !== -1) visited.original[origIndex] = true;
	        if (origIndex !== -1 && newIndex !== -1) comparison.both.push(elem);
	        else if (newIndex !== -1) comparison.added.push(elem);
	        else comparison.removed.push({elem, index: origIndex});
	      }
	    });
	
	    if (modify) {
	      if (comparison.removed.length > 0) {
	        let removed = 0;
	        comparison.removed.forEach((info) => original.splice(info.index - removed++, 1));
	        comparison.removed = comparison.removed.map((info) => info.elem);
	      }
	      if (comparison.added.length > 0) {
	        original.concatInPlace(neww);
	      }
	    }
	    return comparison.removed.length > 0 || comparison.added.length > 0 ? comparison : false;
	}, true);
	
	Function.safeStdLibAddition(Array, 'concatInPlace', function (arr, checkForDuplicats) {
	  if (arr === this) return;
	  for (let index = 0; index < arr.length; index += 1) {
	    if (checkForDuplicats && this.indexOf(arr[index]) !== -1) {
	      console.error('duplicate');
	    } else {
	      this[this.length] = arr[index];
	    }
	  }
	});
	
	function sortByAttr(attr) {
	  function sort(obj1, obj2) {
	    const val1 = Object.pathValue(obj1, attr);
	    const val2 = Object.pathValue(obj2, attr);
	    if (val2 === val1) {
	      return 0;
	    }
	    return val1 > val2 ? 1 : -1;
	  }
	  return sort;
	}
	
	const nativeSort = Array.sort;
	Function.safeStdLibAddition(Array, 'sortByAttr', function(stringOfunc) {
	  if ((typeof stringOfunc) === 'string')
	    return this.sort.apply(this, [sortByAttr(stringOfunc)]);
	  return this.sort.apply(this, arguments);
	});
	
	Function.safeStdLibAddition(Object, 'fromJson', function (rootJson) {
	  function interpretValue(value) {
	    if (value instanceof Object) {
	      const classname = value[identifierAttr];
	      const attrs = attrMap[classname] ? Object.keys(attrMap[classname]) :
	                    Object.keys(value).filter((attr) => !attr.match(/^_[A-Z]*[A-Z_]*$/));
	      if (Array.isArray(value)) {
	        const realArray = [];
	        for (let index = 0; index < value.length; index += 1) {
	          realArray[index] = Object.fromJson(value[index]);
	        }
	        return realArray;
	      } else if (classname && classLookup[classname]) {
	        if (classLookup[classname].fromJson) {
	          return classLookup[classname].fromJson(value);
	        } else {
	          const classObj = new (classLookup[classname])(value);
	          for (let index = 0; index < attrs.length; index += 1) {
	            const attr = attrs[index];
	            if ((typeof classObj[attr]) === 'function')
	            classObj[attr](interpretValue(value[attr]));
	            else
	            classObj[attr] = interpretValue(value[attr]);
	          };
	          return classObj;
	        }
	      } else {
	        if (classname) {
	          console.warn(`fromJson for class ${classname} not registered`)
	        }
	        const realObj = {}
	        for (let index = 0; index < attrs.length; index += 1) {
	          const attr = attrs[index];
	          realObj[attr] = interpretValue(value[attr]);
	        };
	        return realObj
	      }
	    }
	    return value;
	  }
	
	  if (!(rootJson instanceof Object)) return rootJson;
	  return interpretValue(rootJson);
	}, true);
	
	function setToJson(obj, options) {
	  if (!options.temporary) {
	    const origToJson = obj.toJson;
	    obj.toJson = (members, exclusive) => {
	      try {
	        const restrictions = Array.isArray(members) && members.length;
	        const json = (typeof origToJson === 'function') ? origToJson() : {};
	        if (!options.isObject) json[identifierAttr] = obj.constructor.name;
	        for (let index = 0; index < options.attrs.length; index += 1) {
	          const attr = options.attrs[index];
	          const inclusiveAndValid = restrictions && !exclusive && members.indexOf(attr) !== -1;
	          const exclusiveAndValid = restrictions && exclusive && members.indexOf(attr) === -1;
	          if (attr !== immutableAttr && (!restrictions || inclusiveAndValid || exclusiveAndValid)) {
	            const value = (typeof obj[attr]) === 'function' ? obj[attr]() : obj[attr];
	            json[attr] = processValue(value);
	          }
	        }
	        return json;
	      } catch(e) {
	        console.warn(e.message);
	        throw e;
	        return e.message;
	      }
	    }
	  }
	}
	
	function setFromJson(obj, options) {
	  obj.fromJson = (json) => {
	    for (let index = 0; index < options.attrs.length; index += 1) {
	      const attr = options.attrs[index];
	      if (attr !== immutableAttr) {
	        if ((typeof obj[attr]) === 'function') {
	          if(Array.isArray(obj[attr]())){
	            obj[attr]().copy(Object.fromJson(json[attr]));
	          } else {
	            obj[attr](Object.fromJson(json[attr]));
	          }
	        }
	        else
	          obj[attr] = Object.fromJson(json[attr]);
	      }
	    };
	    return obj;
	  }
	}
	
	function setClone(obj, options) {
	  const cxtrFromJson = obj.constructor.fromJson;
	  if (obj.constructor.DO_NOT_CLONE) {
	    obj.clone = () => obj;
	  } else if (cxtrFromJson && cxtrFromJson !== Object.fromJson) {
	    obj.clone = () => cxtrFromJson(obj.toJson());
	  } else if (options.isObject) {
	    setFromJson(obj, options);
	    obj.clone = () => {
	      const clone = Object.fromJson(obj.toJson());
	      Object.getSet(clone, clone);
	      return clone;
	    }
	  } else {
	    obj.clone = () => {
	      const clone = new obj.constructor(obj.toJson());
	      setFromJson(obj, options);
	      clone.fromJson(obj.toJson());
	      return clone;
	    }
	  }
	}
	
	function getOptions(obj, initialVals, attrs) {
	  const options = {};
	  options.temporary = false;
	  options.immutable = false;
	  options.doNotOverwrite = false;
	  if ((typeof initialVals) === 'object') {
	    options.values = initialVals;
	    options.immutable = options.values[immutableAttr] === true;
	    options.temporary = options.values[temporaryAttr] === true;
	    options.doNotOverwrite = options.values[doNotOverwriteAttr] === true;
	    if (options.immutable) {
	      options.attrs = Object.keys(options.values);
	    } else {
	      options.attrs = Object.keys(options.values).concat(attrs);
	    }
	  } else {
	    options.values = {};
	    options.attrs = [initialVals].concat(attrs);
	  }
	  return options;
	}
	
	function setGettersAndSetters(obj, options) {
	  for (let index = 0; !options.doNotOverwrite && index < options.attrs.length; index += 1) {
	    const attr = options.attrs[index];
	    if (attr !== immutableAttr) {
	      if (options.immutable) obj[attr] = () => options.values[attr];
	      else {
	        obj[attr] = (value) => {
	          if (value === undefined) {
	            const noDefaults = (typeof obj.defaultGetterValue) !== 'function';
	            if (options.values[attr] !== undefined || noDefaults)
	            return options.values[attr];
	            return obj.defaultGetterValue(attr);
	          }
	          return options.values[attr] = value;
	        }
	      }
	    }
	  }
	}
	
	// TODO: test/fix for normal Object(s);
	Function.safeStdLibAddition(Object, 'getSet',   function (obj, initialVals, ...attrs) {
	  const cxtrName = obj.constructor.name;
	  const isObject = cxtrName === 'Object'
	  if (!isObject) {
	    if (classLookup[cxtrName] === undefined) {
	      classLookup[cxtrName] = obj.constructor;
	    } else if (classLookup[cxtrName] !== obj.constructor) {
	      console.warn(`Object.fromJson will not work for the following class due to name conflict\n\taffected class: ${obj.constructor}\n\taready registered: ${classLookup[cxtrName]}`);
	    }
	  }
	  if (initialVals === undefined) return;
	  if (!(obj instanceof Object)) throw new Error('arg0 must be an instace of an Object');
	  const options = getOptions(obj, initialVals, attrs);
	  options.isObject = isObject;
	  if (!isObject) {
	    if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
	    options.attrs.forEach((attr) => {
	      if (!attr.match(/^_[A-Z]*[A-Z_]*$/))
	        attrMap[cxtrName][attr] = true;
	    });
	  }
	
	  setGettersAndSetters(obj, options);
	  setToJson(obj, options);
	  setClone(obj, options);
	  return options.attrs;
	}, true);
	Object.getSet.format = 'Object.getSet(obj, {initialValues:optional}, attributes...)'
	
	Function.safeStdLibAddition(Object, 'set',   function (obj, otherObj) {
	  if (otherObj === undefined) return;
	  if ((typeof otherObj) !== 'object') {
	    throw new Error('Requires one argument of type object or undefined for meaningless call');
	  }
	  const keys = Object.keys(otherObj);
	  keys.forEach((key) => obj[key] = otherObj[key]);
	}, true);
	
	Function.safeStdLibAddition(Array, 'set',   function (array, values, start, end) {
	  if (start!== undefined && end !== undefined && start > end) {
	    const temp = start;
	    start = end;
	    end = temp;
	  }
	  start = start || 0;
	  end = end || values.length;
	  for (let index = start; index < end; index += 1)
	    array[index] = values[index];
	  return array;
	}, true);
	
	const checked = {};
	
	// Swiped from https://stackoverflow.com/a/43197340
	function isClass(obj) {
	  const isCtorClass = obj.constructor
	      && obj.constructor.toString().substring(0, 5) === 'class'
	  if(obj.prototype === undefined) {
	    return isCtorClass
	  }
	  const isPrototypeCtorClass = obj.prototype.constructor
	    && obj.prototype.constructor.toString
	    && obj.prototype.constructor.toString().substring(0, 5) === 'class'
	  return isCtorClass || isPrototypeCtorClass
	}
	
	Function.safeStdLibAddition(JSON, 'clone',   function  (obj) {
	  if ((typeof obj) != 'object') return obj;
	  const keys = Object.keys(obj);
	  if (!checked[obj.constructor.name]) {
	    checked[obj.constructor.name] = true;
	  }
	
	  const clone = ((typeof obj.clone) === 'function') ? obj.clone() :
	                  Array.isArray(obj) ? [] : {};
	  for(let index = 0; index < keys.length; index += 1) {
	    const key = keys[index];
	    const member = obj[key];
	    if (member && (member.DO_NOT_CLONE || member.constructor.DO_NOT_CLONE)) {
	      clone[key] = member;
	    } else if ((typeof member) !== 'function') {
	      if ((typeof member) === 'object') {
	        if ((typeof member.clone) === 'function') {
	          clone[key] = member.clone();
	        } else {
	          clone[key] = JSON.clone(member);
	        }
	      } else {
	        clone[key] = member;
	      }
	    }
	    else if (isClass(member)) {
	      clone[key] = member;
	    }
	  }
	  return clone;
	}, true);
	
	Function.safeStdLibAddition(Array, 'idObject',   function  (idAttr) {
	  const obj = {};
	  for (let index = 0; index < this.length; index++) {
	    const elem = this[index];
	    const id = (typeof elem[idAttr] === 'function') ? elem[idAttr]() : elem[idAttr];
	    obj[id] = elem;
	  }
	  return obj;
	});
	
	const defaultInterval = 1000;
	const lastTimeStamps = {};
	function intervalFunction() {
	  const caller = intervalFunction.caller;
	  let interval = arguments[0];
	  if (!Number.isFinite(interval) || interval > 60000) interval = defaultInterval;
	  else {
	    arguments = Array.from(arguments)
	    arguments.splice(0,1);
	  }
	  const lastTime = lastTimeStamps[caller];
	  const thisTime = new Date().getTime();
	  if (lastTime === undefined || lastTime + interval < thisTime) this(...arguments);
	  lastTimeStamps[caller] = thisTime;
	}
	Function.safeStdLibAddition(Function, 'subtle',   intervalFunction);
	
	Function.safeStdLibAddition(String, 'parseSeperator',   function (seperator, isRegex) {
	  if (isRegex !== true) {
	    seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
	  }
	  var keyValues = this.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
	  var json = {};
	  for (let index = 0; keyValues && index < keyValues.length; index += 1) {
	    var split = keyValues[index].match(new RegExp('\\s*(.*?)\\s*=\\s*(.*?)\\s*(' + seperator + '|$)'));
	    if (split) {
	      json[split[1]] = split[2];
	    }
	  }
	  return json;
	});
	
	const colors = [
	  'indianred', 'gray', 'fuchsia', 'lime', 'black', 'lightsalmon', 'red',
	  'maroon', 'yellow', 'olive', 'lightcoral', 'green', 'aqua', 'white',
	  'teal', 'darksalmon', 'blue', 'navy', 'salmon', 'silver', 'purple'
	];
	let colorIndex = 0;
	Function.safeStdLibAddition(String, 'nextColor', () => colors[index++ % colors.length], true);
	
	const numberReg = /^[0-9]{1,}$/;
	Function.safeStdLibAddition(Object, 'pathInfo', function (path, create) {
	  const attrs = path.split('.');
	  const lastAttr = attrs[attrs.length - 1];
	  let target = this;
	  let parent;
	  let created = false;
	  for (let index = 0; index < attrs.length; index += 1) {
	    let attr = attrs[index];
	    const nextIsIndex = new String(attrs[index + 1]).match(numberReg);
	    if (target[attr] === undefined) {
	      if (create) {
	        created = true;
	        target[attr] = nextIsIndex ? [] : {};
	      } else {
	        return;
	      }
	    }
	    parent = target;
	    target = (typeof target[attr]) === 'function' ? target[attr]() : target[attr];
	  }
	  return {parent, target, attr: lastAttr, created}
	});
	
	// TODO: should remove this non instance method. its a relic
	Function.safeStdLibAddition(Object, 'pathValue', function (obj, path, value) {
	  const valueDefined = value !== undefined;
	  const pathInfo = obj.pathInfo(path, valueDefined);
	  if (!valueDefined && pathInfo === undefined) return;
	  const parent = pathInfo.parent;
	  const attr = pathInfo.attr;
	  if ((typeof parent[attr]) === 'function') {
	    return parent[attr](value);
	  } else if (valueDefined) {
	    parent[attr] = value;
	  }
	  return parent[attr];
	}, true);
	
	Function.safeStdLibAddition(Object, 'pathValue', function (path, value) {
	  const info = this.pathInfo(path, value);
	  return info ? info.target : undefined;
	});
	
	Function.safeStdLibAddition(Object, 'deletePath', function (path) {
	  if ((typeof path) !== 'string' || path === '') throw new Error('path(arg1) must be defined as a non empty string');
	  const pathInfo = this.pathInfo(path);
	  if (pathInfo === undefined) return;
	  const parent = pathInfo.parent;
	  const attr = pathInfo.attr;
	  delete parent[attr];
	});
	
	Function.safeStdLibAddition(Array, 'empty', function (func) {
	  let empty = true;
	  for (let index = 0; index < this.length; index += 1) {
	    if (this[index] !== undefined) return false;
	  }
	  return true;
	});
	
	/////////////////////////////////// Matrix Equations //////////////////////////
	
	Function.safeStdLibAddition(Array, 'translate', function (vector, doNotModify, quiet) {
	  let point = this;
	  let single = false;
	  if (doNotModify === true) point = Array.from(point);
	  const vecLen = vector.length;
	  if (point.length !== vecLen && !quiet) console.warn('vector.length !== point.length but we\' do it anyway (arg3(quiet) = true to silence)');
	  for (let i = 0; i < vecLen; i += 1) {
	    if (point[i] === undefined) point[i] = 0;
	    point[i] += vector[i];
	  }
	  return point;
	});
	
	Function.safeStdLibAddition(Array, 'inverse', function (doNotModify) {
	  const arr = doNotModify === true ? Array.from(this) : this;
	  for (let index = 0; index < arr.length; index += 1) {
	    arr[index] *= -1;
	  }
	  return arr;
	});
	
	Function.safeStdLibAddition(Array, 'remap', function (func) {
	  for (let index = 0; index < this.length; index += 1) {
	    this[index] = func(this[index], index);
	  }
	});
	
	Function.safeStdLibAddition(Array, 'swap', function (i, j, doNotModify) {
	  const arr = doNotModify === true ? Array.from(this) : this;
	  const temp = arr[i];
	  arr[i] = arr[j];
	  arr[j] = temp;
	});
	
	Function.safeStdLibAddition(Array, 'scale', function (valueOfuncOarray, doNotModify) {
	  const arr = doNotModify === true ? Array.from(this) : this;
	  let func;
	  switch (typeof valueOfuncOarray) {
	    case 'function': func = (val, index) => val * valueOfuncOarray(val, index); break;
	    case 'object': func = (val, index) => val * valueOfuncOarray[index]; break;
	    default: func = (val, index) => val * valueOfuncOarray;
	  }
	  arr.remap(func);
	  return arr;
	});
	
	Function.safeStdLibAddition(Array, 'add', function (valueOfuncOarray, doNotModify) {
	  const arr = doNotModify === true ? Array.from(this) : this;
	  let func;
	  switch (typeof valueOfuncOarray) {
	    case 'function': func = (val, index) => val + valueOfuncOarray(val, index); break;
	    case 'object': func = (val, index) => val + valueOfuncOarray[index]; break;
	    default: func = (val, index) => val + valueOfuncOarray;
	  }
	  arr.remap(func);
	  return arr;
	});
	
	const MSI = Number.MAX_SAFE_INTEGER;
	const msi = Number.MIN_SAFE_INTEGER;
	Function.safeStdLibAddition(Math, 'minMax', function (items, targetAttrs) {
	  let min,max, total;
	  if (!targetAttrs) {
	    max = msi;
	    min = MSI;
	    total = 0;
	  }
	  const maxMinObject = {};
	  for (let index = 0; index < items.length; index++) {
	    const item = items[index];
	    if (max !== undefined) {
	      if (max < item) max = item;
	      if (min > item) min = item;
	      total += item;
	    } else {
	      const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
	      for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
	        const attr = attrs[tIndex];
	        const value = Object.pathValue(item, attr);
	        const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
	        if (!maxMinObject[key]) maxMinObject[key] = {max: msi, min: MSI, total: 0};
	        if (maxMinObject[key].max < value) maxMinObject[key].max = value;
	        if (maxMinObject[key].min > value) maxMinObject[key].min = value;
	        maxMinObject[key].total += value;
	      }
	    }
	  }
	  if (max !== undefined) return {max, min, total};
	  return maxMinObject;
	}, true);
	
	Function.safeStdLibAddition(Math, 'midrange', function (items, targetAttrs) {
	  const maxMin = Math.minMax(items, targetAttrs);
	  if (!targetAttrs) {
	    return (maxMin.max + maxMin.min)/2;
	  }
	  const midRangeObject = {};
	  const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
	  for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
	    const attr = attrs[tIndex];
	    const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
	    midRangeObject[key] = (maxMin[key].max + maxMin[key].min)/2;
	  }
	  return midRangeObject;
	}, true);
	
	Function.safeStdLibAddition(Math, 'mean', function (items, targetAttrs) {
	  const maxMin = Math.minMax(items, targetAttrs);
	  if (!targetAttrs) {
	    return maxMin.total / items.length;
	  }
	  const meanObject = {};
	  const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
	  for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
	    const attr = attrs[tIndex];
	    const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
	    meanObject[key] = maxMin[key].total/items.length;
	  }
	  return meanObject;
	}, true);
	
});


RequireJS.addFunction('../../public/js/utils/data-sync.js',
function (require, exports, module) {
	

	class DataSync {
	  constructor(idAttr, getById) {
	    let connections = {};
	    let lastValue = {};
	    let idMap = {};
	
	    const getId = (objOid) => !(objOid instanceof Object) ? objOid :
	      ((typeof objOid[idAttr] === 'function' ? objOid[idAttr]() : objOid[idAttr]));
	
	    const getArray = (elems) => !elems ? [] : (elems.length === 1 ? elems[0] : elems);
	
	
	    function makeSyncronous(key,...objOids) {
	      objOids = getArray(objOids);
	      for (let index = 1; index < objOids.length; index += 1) {
	        let id;
	        const obj1Id = getId(objOids[index - 1]);
	        const obj2Id = getId(objOids[index]);
	        idMap[obj1Id] = idMap[obj1Id] || {};
	        idMap[obj2Id] = idMap[obj2Id] || {};
	        if (idMap[obj1Id][key] === undefined) {
	          if (idMap[obj2Id][key] === undefined) {
	            id = String.random();
	          } else {
	            id = idMap[obj2Id][key];
	          }
	        } else { id = idMap[obj1Id][key]; }
	        idMap[obj1Id][key] = id;
	        idMap[obj2Id][key] = id;
	        connections[id] = connections[id] || [];
	        if (connections[id].indexOf(obj1Id) === -1) {
	          connections[id].push(obj1Id)
	        }
	        if (connections[id].indexOf(obj2Id) === -1) {
	          connections[id].push(obj2Id)
	        }
	      }
	    }
	
	    function unSync(key,...objOids) {
	      objOids = getArray(objOids);
	      for (let index = 1; index < objOids.length; index += 1) {
	        const id = getId(objOids[index]);
	        const connId = idMap[id][key];
	        const conns = connections[connId];
	        let tIndex;
	        while ((tIndex = conns.indexOf(id)) !== -1) conns.split(tIndex, 1);
	        delete idMap[id][key];
	      }
	    }
	
	    function update(key, value, objOid) {
	      const id = getId(objOid);
	      if (!idMap[id] || !idMap[id][key]) return;
	      const connId = idMap[id] && idMap[id][key];
	      if (connId === undefined) return;
	      if (lastValue[connId] !== value) {
	        lastValue[connId] = value;
	        const objIds = connections[connId];
	        for (let index = 0; objIds && index < objIds.length; index ++) {
	          const obj = getById(objIds[index]);
	          if (obj !== undefined) obj[key](value);
	        }
	      }
	    }
	
	    function shouldRun(hasRan, validIds, id) {
	      return !hasRan && (validIds === null || validIds.indexOf(id) !== -1);
	    }
	
	    function forEach(func, ...objOids) {
	      objOids = getArray(objOids);
	      let alreadyRan = {};
	      let validIds = objOids === undefined ? null :
	                      objOids.map((objOid) => getId(objOid));
	      let ids = Object.keys(idMap);
	      for (let index = 0; index < ids.length; index += 1) {
	        const id = ids[index];
	        const idKeys = Object.keys(idMap[id]);
	        for (let iIndex = 0; iIndex < idKeys.length; iIndex += 1) {
	          const idKey = idKeys[iIndex];
	          const connectionId = idMap[id][idKey];
	          if (shouldRun(alreadyRan[connectionId], validIds, id)) {
	            const connIds = connections[connectionId];
	            const applicableConnections = [];
	            for (let cIndex = 0; cIndex < connIds.length; cIndex += 1) {
	              if (shouldRun(alreadyRan[connectionId], validIds, id)) {
	                applicableConnections.push(connIds[cIndex]);
	              }
	            }
	            if (applicableConnections.length === 0) throw new Error('This should never happen');
	            func(idKey, applicableConnections);
	            alreadyRan[connectionId] = true;
	          }
	        }
	      }
	    }
	
	    function fromJson(connections) {
	      const keys = Object.keys(connections);
	      keys.forEach((key) => {
	        this.addConnection(key);
	        const groups = connections[key];
	        groups.forEach((group) => {
	          this[`${key}Sync`](group);
	        });
	      });
	    }
	
	
	    function toJson(...objOids) {
	      objOids = getArray(objOids);
	      const connects = {};
	      forEach((key, connections) => {
	        if (connects[key] === undefined) connects[key] = [];
	        connects[key].push(connections);
	      }, ...objOids);
	      return connects;
	    }
	
	    this.addConnection = (key) => {
	      this[`${key}Sync`] = (...objOids) => makeSyncronous(key, ...objOids);
	      this[`${key}UnSync`] = (...objOids) => makeSyncronous(key, ...objOids);
	      this[`${key}Update`] = (value, objOid) => update(key,value, objOid);
	    }
	    this.toJson = toJson;
	    this.fromJson = fromJson;
	  }
	}
	
	module.exports = DataSync;
	
});


RequireJS.addFunction('../../public/js/utils/conditions.js',
function (require, exports, module) {
	const CONDITIONS = {};
	
	class Condition {constructor() {Object.getSet(this, 'group')}}
	CONDITIONS.Condition = Condition;
	
	class AttributeCondition extends Condition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    Object.getSet(this, {attribute, value, deligator});
	    this.prefix = () => {
	      const dotIndex = attribute.indexOf('.');
	      return dotIndex === -1 ? attribute : attribute.substring(0, dotIndex);
	    }
	    this.resolveValue = (val, attribute) => deligator.resolveValue(val, attribute);
	    this.toString = () => `${this.attribute()}=>${this.value()}`;
	  }
	}
	
	class NumberCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    Object.getSet(this, {attribute, value});
	    this.resolveValue = (val, attribute) => Number.parseFloat(deligator.resolveValue(val, attribute));
	  }
	}
	
	class LessThanOrEqualCondition extends NumberCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return this.resolveValue(val, attribute) <= value;
	    }
	  }
	}
	class GreaterThanOrEqualCondition extends NumberCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return this.resolveValue(val, attribute) >= value;
	    }
	  }
	}
	class LessThanCondition extends NumberCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return this.resolveValue(val, attribute) < value;
	    }
	  }
	}
	class GreaterThanCondition extends NumberCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return this.resolveValue(val, attribute) > value;
	    }
	  }
	}
	class EqualCondition extends NumberCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return this.resolveValue(val, attribute) === value;
	    }
	  }
	}
	
	class AnyCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return this.resolveValue(val, attribute) != '';
	    }
	  }
	}
	class ExactCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return this.resolveValue(val, attribute) === value;
	    }
	  }
	}
	
	const wildCardMapFunc = (str) => new RegExp('^' + RegExp.escape(str).replace(/\\\*/g, '.*') + '$');
	class WildCardCondition extends AttributeCondition {
	  constructor(wildCard, value, deligator) {
	    super(wildCard, value, deligator);
	
	    const valueReg = wildCardMapFunc(value);
	    const paths = wildCard.split('.').map(wildCardMapFunc);
	
	    function followPath(pIndex, object, values) {
	      const keys = Object.keys(object);
	      for (let index = 0; index < keys.length; index++) {
	        const key = keys[index];
	        if (key.match(paths[pIndex])) {
	          const value = object[key];
	          if (pIndex === paths.length - 1) {
	            if (value.length > 0) values.push(value);
	          } else {
	            followPath(pIndex + 1, value, values);
	          }
	        }
	      }
	    }
	
	    this.satisfied = (val) => {
	      const valueObj = this.resolveValue(val);
	      const potentials = [];
	      followPath(0, valueObj, potentials);
	      for (let index = 0; index < potentials.length; index++) {
	        const potVal = potentials[index];
	        if (potVal.match(valueReg)) return true;
	      }
	      return false;
	    }
	  }
	}
	class CaseInsensitiveCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    value = value.toLowerCase();
	    this.satisfied = (val) => {
	      const resolved = this.resolveValue(val, attribute);
	      return (typeof resolved) === 'string' ? resolved.toLowerCase() === value : false;
	    }
	  }
	}
	class ExceptCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return this.resolveValue(val, attribute) !== value;
	    }
	  }
	}
	class ContainsCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return value.indexOf(this.resolveValue(val, attribute)) !== -1;
	    }
	  }
	}
	
	class AndCondition extends Condition {
	  constructor(conditions) {
	    super();
	    Object.getSet(this, 'conditions');
	    this.conditions = () => Object.merge([], conditions);
	    this.add = (cond) => (cond instanceof Condition) && conditions.push(cond);
	    this.clone = () => new AndCondition(this.conditions());
	    this.satisfied = (val) => {
	      for (let index = 0; index < conditions.length; index++) {
	        if (!conditions[index].satisfied(val)) return false;
	      }
	      return true;
	    }
	  }
	}
	
	class OrCondition extends Condition{
	  constructor(conditions) {
	    super();
	    Object.getSet(this, 'conditions');
	    this.conditions = () => Object.merge([], conditions);
	    this.add = (cond) => (cond instanceof Condition) && conditions.push(cond);
	    this.clone = () => new OrCondition(this.conditions());
	    this.satisfied = (val) => {
	      for (let index = 0; index < conditions.length; index++) {
	        if (conditions[index].satisfied(val)) return true;
	      }
	      return false;
	    }
	  }
	}
	
	class ExclusiveCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return value.indexOf(this.resolveValue(val, attribute)) === -1;
	    }
	  }
	}
	class InclusiveCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    this.satisfied = (val) => {
	      return value.indexOf(this.resolveValue(val, attribute)) !== -1;
	    }
	  }
	}
	
	class RegexCondition extends AttributeCondition {
	  constructor(attribute, value, deligator) {
	    super(attribute, value, deligator);
	    const regex = (typeof value) === 'string' ? new RegExp(value) : value;
	    if (!(regex instanceof RegExp)) throw new Error('Something went wrong, this object requires a regular expression');
	    this.value(regex.toString());
	    this.satisfied = (val) => {
	      val = this.resolveValue(val, attribute);
	      if ((typeof val) !== 'string') return false;
	      return val.match(regex);
	    }
	  }
	}
	
	function getCondition(attribute, value, type, deligator) {
	  if ((typeof type) === 'string') type = type.toCamel();
	  if (value instanceof RegExp) return new RegexCondition(attribute, value, deligator);
	  if ((typeof value) === 'number') {
	    if (type === 'lessThanOrEqual') return new LessThanOrEqualCondition(attribute, value, deligator);
	    if (type === 'greaterThanOrEqual') return new GreaterThanOrEqualCondition(attribute, value, deligator);
	    if (type === 'lessThan') return new LessThanCondition(attribute, value, deligator);
	    if (type === 'greaterThan') return new GreaterThanCondition(attribute, value, deligator);
	    return new EqualCondition(attribute, value, deligator);
	  }
	  if ((typeof value) === 'string') {
	    if (type === 'any') return new AnyCondition(attribute, value, deligator);
	    if (type === 'except') return new ExceptCondition(attribute, value, deligator);
	    if (type === 'contains') return new ContainsCondition(attribute, value, deligator);
	    if (type === 'exact') return new ExactCondition(attribute, value, deligator);
	    if (type === 'wildCard' || (type === undefined && (attribute + value).indexOf('*') !== -1))
	      return new WildCardCondition(attribute, value, deligator);
	    return new CaseInsensitiveCondition(attribute, value, deligator);
	  }
	  if (Array.isArray(value)) {
	    if (type === 'and') return new AndCondition(attribute, value, deligator);
	    if (type === 'or') return new OrCondition(attribute, value, deligator);
	    if (type === 'exclusive') return new ExclusiveCondition(attribute, value, deligator);
	    return new InclusiveCondition(attribute, value, deligator);
	  }
	  throw new Error('This should not be reachable Condition must not be defined');
	}
	
	Object.class.register(LessThanOrEqualCondition);
	Object.class.register(GreaterThanOrEqualCondition);
	Object.class.register(LessThanCondition);
	Object.class.register(GreaterThanCondition);
	Object.class.register(EqualCondition);
	Object.class.register(AnyCondition);
	Object.class.register(ExactCondition);
	Object.class.register(ExceptCondition);
	Object.class.register(ContainsCondition);
	Object.class.register(ExclusiveCondition);
	Object.class.register(InclusiveCondition);
	Object.class.register(RegexCondition);
	Object.class.register(CaseInsensitiveCondition);
	Object.class.register(WildCardCondition);
	
	Condition.fromJson = (json) => {
	  const deligator = Object.fromJson(json.deligator);
	  const attribute = Object.fromJson(json.attribute);
	  const value = Object.fromJson(json.value);
	  return new (Object.class.get(json._TYPE))(attribute, value, deligator);
	}
	
	CONDITIONS.implement = (obj, conditionGetter) => {
	  conditionGetter ||= getCondition;
	  const conditions = [];
	  const groupedConditions = {};
	  const ungrouped = [];
	
	  Object.getSet(obj, {conditions});
	
	  obj.conditions = (group) => [].merge((group === null ? ungrouped :
	          (typeof group === 'string') ?
	          (groupedConditions[group] ? groupedConditions[group] : []) :
	          conditions));
	
	  obj.conditions.add = (condition, group) => {
	    let dc = condition instanceof Condition ? condition : conditionGetter(condition);
	    conditions.push(dc);
	    condition.group(group);
	    if ((typeof group) === 'string') {
	      if (!groupedConditions[group]) groupedConditions[group] = [];
	      groupedConditions[group].push(dc);
	    }
	    else ungrouped.push(dc);
	  }
	  obj.conditions.addAll = (conds) => {
	    for (let index = 0; index < conds.length; index++) {
	      const cond = conds[index];
	      if (!(cond instanceof Condition)) throw new Error('WTF(sorry its been a long week): this needs to be a Condition');
	      conditions.push(cond);
	    }
	  }
	  obj.conditions.remove = (cond) => conditions.remove(cond);
	}
	
	CONDITIONS.get = getCondition;
	CONDITIONS.And = AndCondition;
	CONDITIONS.Or = OrCondition;
	module.exports = CONDITIONS;
	
});


RequireJS.addFunction('../../public/js/utils/decision-tree.js',
function (require, exports, module) {
	

	const Lookup = require('./object/lookup')
	const CustomEvent = require('./custom-event')
	const Conditions = require('./conditions');
	const REMOVAL_PASSWORD = String.random();
	
	const nameEquals = (name) => (node) => node.name() === name;
	const selectorFunc = (nameOfunc) => (typeof nameOfunc) === 'function' ?
	                          nameOfunc : nameEquals(nameOfunc);
	
	
	function getByPath(node, ...namePath) {
	  for (let index = 0; index < namePath.length; index++) {
	    node = node.next(namePath[index]);
	    if (node === undefined) return;
	  }
	  return node;
	}
	
	function getByName(node, ...namePath) {
	  for (let index = 0; index < namePath.length; index++) {
	    const name = namePath[index];
	    node = node.breathFirst(n => n.name() === name);
	    if (node === undefined) return;
	  }
	  return node;
	}
	
	function formatName(name) {
	  if (name === undefined || name === '') return;
	  return new String(name).toString();
	}
	class StateConfig extends Lookup {
	  constructor(name, payload, treeNameOrClass) {
	    const treeClass = Object.class.get(treeNameOrClass);
	    if (treeClass === undefined) throw new Error("Must have tree a treeClass in order to determine condition getter");
	    const treeName = treeClass.name;
	    super();
	    name = formatName(name)
	    Object.getSet(this, {name, payload, treeName});
	    const states = [];
	    payload = payload || {};
	    const instance = this;
	    this.setValue = (key, value) => payload[key] = value;
	    this.states = () => Array.from(states);
	    this.payload = () => Object.merge({}, payload);
	    this.isLeaf = () => states.length === 0;
	    this.stateNames = () => states.map(s => s.name());
	    this.stateMap = () => states.idObject('name');
	    this.validState = (n) => !!this.stateMap()[n];
	    this.remove = (stateConfig) => states.remove(stateConfig);
	    this.then = (stateConfig) => {
	      if (this.validState(stateConfig.name())) return null;
	      states.push(stateConfig);
	    }
	
	    Conditions.implement(this, treeClass.getCondition);
	
	    this.toString = (tabs) => {
	      const tab = new Array(tabs).fill('  ').join('');
	      return `${tab}name: ${this.name()}\n${tab}states: ${this.stateNames()}`;
	    }
	  }
	}
	Object.class.register(StateConfig);
	
	StateConfig.fromJson = (json) => {
	  const id = json.id;
	  const existing = StateConfig.get(id);
	  if (existing) return existing;
	  const payload = Object.fromJson(json.payload);
	  const newState = new StateConfig(json.name, payload, json.treeName);
	  json.conditions.forEach(c => newState.conditions.add(Object.fromJson(c), c.group));
	  return newState;
	}
	
	
	const payloadMap = {};
	// terminology
	// name - String to define state;
	// payload - data returned for a given state
	// node - {name, states, payload, then};
	// then(name, payload:optional) - a function to set a following state.
	// next(name) - a function to get the next state.
	// parent() - a function to move back up the tree.
	// root() - a function to get root;
	class DecisionNode extends Lookup {
	  constructor(parentNodeOstateConfig, payload, parent) {
	    super();
	    const instance = this;
	    const stateMap = {};
	    payload = payload || {};
	    if (payloadMap[payload.PAYLOAD_ID]) payload = payloadMap[payload.PAYLOAD_ID];
	    else {
	      payload.PAYLOAD_ID ||= String.random();
	      payloadMap[payload.PAYLOAD_ID] = payload;
	    }
	
	    const parentNode = parentNodeOstateConfig instanceof DecisionNode ? parentNodeOstateConfig : undefined;
	    const stateConfig = parentNode ? parentNode.stateConfig() : parentNodeOstateConfig;
	    this.parentNode = () => parentNode;
	    this.stateConfig = () => stateConfig;
	    this.name = stateConfig.name;
	    this.states = stateConfig.states;
	    this.stateMap = () => stateMap;
	    this.isLeaf = stateConfig.isLeaf;
	    this.stateNames = stateConfig.stateNames;
	    this.getByPath = (...idPath) => getByPath(this, ...idPath);
	    this.getByName = (...namePath) => getByName(this, ...namePath);
	
	    this.setValue = (key, value) => payload[key] = value;
	
	    const metadata = {};
	    this.metadata = (attribute, value) => {
	        if (attribute === undefined) return Object.merge({}, metadata);
	        if (value !== undefined) return metadata[attribute] = value;
	        return metadata[attribute];
	    }
	
	    this.payload = (noConfig) => {
	      if (noConfig) return payload;
	      const copy = parentNode ? parentNode.payload() : stateConfig.payload();
	      Object.keys(payload).forEach((key) => {
	        copy[key] = payload[key];
	      });
	      copy.node = this;
	      return copy;
	    };
	
	    let recurseAway = false;
	    this.shouldRecurse = (shouldRecurse) => {
	      if (shouldRecurse === true) recurseAway = true;
	      if ((recurseAway || Object.keys(stateMap).length > 0 || !instance.selfReferencingPath()) === false) {
	        console.log('failed?')
	      }
	      return recurseAway || Object.keys(stateMap).length > 0 || !instance.selfReferencingPath();
	    };
	
	    function attach(treeOnode) {
	      if (instance.shouldRecurse()) {
	        const node = treeOnode instanceof DecisionNode ? treeOnode : treeOnode.root();
	        const tree = node.tree();
	        const configMap = instance.stateConfig().stateMap();
	
	        const stateKeys = instance.stateNames();
	        if (stateKeys[node.name()]) throw new Error(`Attempting to add node whos template alread exists as a child. You must create another node so that it maintains a unique path`);
	        const addState = node.tree().addState;
	        addState(stateConfig);
	        const newNode = node.then(stateConfig.name());
	
	        if (instance.shouldRecurse()) {
	          instance.shouldRecurse();
	          for(let index = 0; index < stateKeys.length; index += 1) {
	            const stateName = stateKeys[index];
	            if (!tree.validState(stateName)) {
	              addState(configMap[stateName]);
	            }
	            const childNode = newNode.then(stateName);
	            const alreadyPresent = childNode.stateNames().indexOf(childNode.name());
	            if (!alreadyPresent) {
	              instance.then(childNode).attach(childNode, true);
	            }
	          }
	        }
	        return node;
	      }
	    }
	
	    this.attach = attach
	
	    function createNode(name, payload, doNotCreate) {
	      const node = stateMap[name];
	      if (node || doNotCreate) return node;
	      const tree = instance.tree();
	      const stateCreated = !tree.stateConfigs()[name];
	      const stateConfig = tree.getState(name, payload);
	      instance.stateConfig().then(stateConfig);
	      if (stateCreated) payload = {};
	      const templateNode = instance.tree().root().breathFirst(n =>
	        n.parent().name() === instance.name() && stateConfig.name() === n.name(), true);
	      if (tree.referenceNodes())
	        return templateNode ? templateNode : new (tree.constructor.Node)(stateConfig, payload, instance);
	      if (tree.nodeInheritance())
	        return new (tree.constructor.Node)(templateNode || stateConfig, payload, instance);
	      return new (tree.constructor.Node)(stateConfig, payload, instance);
	    }
	
	    this.then = (name, payload) => {
	      if (name instanceof DecisionNode) {
	        const attached = name.attach(this);
	        this.tree().changed()
	        return attached;
	      }
	      if (Array.isArray(name)) {
	        const returnNodes = [];
	        for (let index = 0; index < name.length; index += 1) {
	          returnNodes.push(this.then(formatName(name[index])));
	        }
	        return returnNodes;
	      }
	      name = formatName(name);
	      const newState = createNode(name, payload);
	      this.tree().changed()
	      stateMap[name] = newState;
	
	      return newState;
	    }
	
	    const onChange = [];
	    const changeEvent = new CustomEvent('change');
	
	    const trigger = () => {
	      changeEvent.trigger(this.values());
	      this.tree().changed();
	    }
	    this.onChange = (func) => changeEvent.on(func);
	    let changePending = 0;
	    const delay = 100;
	    this.changed = () => {
	      let changeId = ++changePending;
	      setTimeout(() => {
	        if (changeId === changePending) {
	          const values = this.values();
	          changeEvent.trigger(values)
	        }
	      }, delay);
	    }
	
	    this.remove = (child) => {
	      if (child === undefined) return this.parent().remove(this);
	      const state = stateMap[child.name()];
	      delete stateMap[child.name()];
	      this.stateConfig().remove(child.stateConfig());
	      return state;
	    }
	
	    this.tree = () => {
	      let curr = this;
	      while (!(curr instanceof DecisionTree)) curr = curr.parent();
	      return curr;
	    };
	    this.root = () => this.tree().root();
	    this.isRoot = () => parent instanceof DecisionTree;
	
	    function addReachableChildren(node, nodes, doNotCreate, searchAll) {
	      if (node.shouldRecurse()) {
	        const stateKeys = node.stateNames();
	        for(let index = 0; index < stateKeys.length; index += 1) {
	          const stateName = stateKeys[index];
	          if (searchAll || node.reachable(stateName)) {
	            const child = node.next(stateName, doNotCreate);
	            if (child) nodes.push(child);
	          }
	        }
	      }
	    }
	
	    // iff func returns true function stops and returns node;
	    this.breathFirst = (func, doNotCreate, searchAll) => {
	      const nodes = [this];
	      const runFunc = (typeof func) === 'function';
	      let nIndex = 0;
	      const nodeMap = {};
	      while (nodes[nIndex]) {
	        let node = nodes[nIndex];
	        if (!nodeMap[node.id()]) {
	          const val = func(node);
	          if (val === true) return node;
	          if (val) return val;
	          addReachableChildren(node, nodes, doNotCreate, searchAll);
	          nodeMap[node.id()] = true;
	        }
	        nIndex++;
	      }
	    }
	
	    this.depthFirst = (func, doNotCreate, searchAll) => {
	      if (func(instance)) return true;
	      if (this.shouldRecurse()) {
	        const stateKeys = instance.stateNames();
	        for(let index = 0; index < stateKeys.length; index += 1) {
	            const child = instance.next(stateKeys[index], doNotCreate);
	            if (child && (searchAll || instance.reachable(child.name()))) {
	              child.depthFirst(func);
	            }
	        }
	      }
	    }
	
	    this.forall = (func) => {
	      this.breathFirst(func, true, true);
	    }
	
	    function decendent(nameOfunc) {
	      return instance.breathFirst(selectorFunc(nameOfunc));
	    }
	    function findParent(nameOfunc) {
	      if (nameOfunc === undefined) return parent;
	      const selector = selectorFunc(nameOfunc);
	      const curr = instance;
	      while(!curr.isRoot()) {
	        if (selector(curr)) return curr;
	        curr = curr.parent();
	      }
	    }
	    function closest(nameOfunc) {
	      const selector = selectorFunc(nameOfunc);
	      const nodes = [instance];
	      let index = 0;
	      while (nodes.length > index) {
	        const node = nodes[index];
	        if (selector(node)) return node;
	        const parent = nodes.parent();
	        if (parent.reachable(node.name())) {
	          nodes.push(parent);
	        }
	        addReachableChildren(node, nodes);
	      }
	    }
	
	    this.find = decendent;
	    this.parent = findParent;
	    this.closest = closest;
	
	    // Breath First Search
	    this.forEach = (func, depthFirst) => {
	      if (depthFirst) this.depthFirst(func);
	      else this.breathFirst(func);
	    }
	
	    this.forPath = (func) => {
	      const nodes = [];
	      let node = this;
	      while (!node.isRoot()) {
	        nodes.push(node);
	        node = node.parent();
	      }
	      for (let index = nodes.length - 1; index > -1; index--) {
	        const val = func(nodes[index]);
	        if (val === true) return nodes[index];
	        if (val) return val;
	      }
	    }
	
	    this.next = (name, doNotCreate) => {
	      name = formatName(name);
	      if (!stateConfig.validState(name)) throw new Error(`Invalid State: ${name}`);
	      if (stateMap[name] === undefined) {
	        stateMap[name] = createNode(name, null, doNotCreate);
	      }
	      return stateMap[name];
	    }
	
	    this.forEachChild = (func, doNotCreate) => {
	      const stateKeys = this.stateNames();
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        const childName = stateKeys[index];
	        if (this.reachable(childName)) {
	          const childNode = this.next(childName, doNotCreate);
	          func(childNode);
	        }
	      }
	    }
	    this.children = () => {
	      const children = [];
	      const stateKeys = this.stateNames();
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        children.push(this.next(stateKeys[index]));
	      }
	      return children;
	    }
	    this.list = (filter, map) => {
	      const list = [];
	      const should = {filter: (typeof filter) === 'function', map: (typeof map) === 'function'};
	      this.forEach((node) => {
	        if (should.filter ? filter(node) : true) {
	          list.push((should.map ? map(node) : node));
	        }
	      });
	      return list;
	    };
	    this.nodes = () => this.list(null, (node) => node);
	    this.leaves = () => this.list((node) => node.isLeaf(), null);
	    this.addChildren = (nodeOnameOstate) => {
	      const nns = nodeOnameOstate;
	      const stateConfig = nns instanceof DecisionNode ? nns.stateConfig() :
	                nns instanceof StateConfig ? nns : this.tree().stateConfigs()[nns];
	      if (!(stateConfig instanceof StateConfig)) throw new Error(`Invalid nodeOnameOstate '${nns}'`);
	      const tree = this.tree();
	      const states = stateConfig.states();
	      states.forEach((state) => {
	        tree.addState(stateConfig);
	        this.then(state.name());
	      });
	      return this;
	    }
	
	    this.values = (values) => {};
	
	    this.conditions = this.stateConfig().conditions;
	
	    this.canReachChild = (name) => {
	      if(this.stateNames().indexOf(name) === -1) return false;
	      let nodeConds = this.conditions(name);
	      if (nodeConds.length === 0) return true;
	      for (let index = 0; index < nodeConds.length; index++) {
	        if (nodeConds[index].satisfied(this)) {
	          return nodeConds[index];
	        }
	      }
	      return false;
	    }
	
	    this.reachable = (childName) => {
	      if (childName) return this.canReachChild(childName);
	      if (this.isRoot())  return true;
	      return parent.reachable(this.name()) && parent.reachable();
	    }
	    this.reachableChildren = () => {
	      const list = [];
	      const children = this.children();
	      for (let index = 0; index < children.length; index++) {
	        const child = children[index];
	        const condition = this.reachable(child.name());
	        if (condition) list.push({condition, child})
	      }
	      return list;
	    }
	    this.child = (name) => {
	      const children = this.children();
	      for (let index = 0; index < children.length; index++) {
	        if (children[index].name() === name) return children[index];
	      }
	    }
	    function reached(node, nodeMap, other) {
	      do {
	        if (!node.parent().reachable(node.name())) break;
	        if (nodeMap[node.id()] && nodeMap[other.id()]) return true;
	        nodeMap[node.id()] = node;
	        node = node.parent();
	      } while (node && node instanceof DecisionNode);
	    }
	    this.reachableFrom = (node) => {
	      node ||= this.root();
	      const nodeMap = {};
	      nodeMap[node.id()] = node;
	      return reached(this, nodeMap, other) || reached(node.parent(), nodeMap, other);
	    }
	    this.path = () => {
	      let path = [];
	      let curr = this;
	      while (!(curr instanceof DecisionTree)) {
	        path.push(curr.name());
	        curr = curr.parent();
	      }
	      return path.reverse();
	    }
	    this.nodeOnlyToJson = () => {
	      let pl = Object.toJson(payload);
	      const json = {name: this.name(), payload: pl};
	
	      json.children = {};
	      json.metadata = Object.toJson(this.metadata());
	      if (this.shouldRecurse()) {
	        this.children().forEach((child) => {
	          if (child.path().length > instance.path().length)
	            json.children[child.name()] = child.nodeOnlyToJson();
	        });
	      }
	      return json;
	    }
	    this.toJson = () => {
	      const treeJson = this.tree().toJson(this);
	      return treeJson;
	    }
	    this.equals = function (other) {
	      if (!other || !(other instanceof DecisionNode)) return false;
	      const config = this.stateConfig();
	      const otherConfig = other.stateConfig();
	      if (config !== otherConfig) return false;
	      if (this.shouldRecurse()) {
	        const states = config.stateNames();
	        for (let index = 0; index < states.length; index++) {
	          const state = states[index];
	          if (!this.next(state).equals(other.next(state))) return false;
	        }
	      }
	      return true;
	    }
	    this.parentCount = (name) => {
	      let count = 0;
	      let curr = this.parent();
	      while(!(curr instanceof DecisionTree)) {
	        if (curr.name() === name) count++;
	        curr = curr.parent();
	      }
	      return count;
	    }
	    this.selfReferencingPath = () => {
	      let names = {};
	      let curr = this.parent();
	      while(!(curr instanceof DecisionTree)) {
	        if (names[curr.name()]) return true;
	        names[curr.name()] = true;
	        curr = curr.parent();
	      }
	      return false;
	    }
	
	    this.toString = (tabs, attr) => {
	      tabs = tabs || 0;
	      const tab = new Array(tabs).fill('  ').join('');
	      let str = `${tab}${this.name()}`;
	      let attrStr = this.payload()[attr];
	      str += attrStr ? `) ${this.payload()[attr]}\n` : '\n';
	      const stateKeys = this.stateNames();
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        const stateName = stateKeys[index];
	        if (this.reachable(stateName)) {
	          const nextState = this.next(stateName);
	          if (nextState.parentCount(stateName) < 2) {
	            str += nextState.toString(tabs + 1, attr);
	          }
	        }
	      }
	      return str;
	    }
	
	    this.structure = (tabs, attr) => {
	      tabs = tabs || 0;
	      const tab = new Array(tabs).fill('  ').join('');
	      let str = `${tab}${this.name()}`;
	      let attrStr = this.payload()[attr];
	      str += attrStr ? `) ${this.payload()[attr]}\n` : '\n';
	      const stateKeys = this.stateNames();
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        const stateName = stateKeys[index];
	        const nextState = this.next(stateName);
	        if (nextState.parentCount(stateName) < 2) {
	          str += nextState.structure(tabs + 1, attr);
	        }
	      }
	      return str;
	    }
	  }
	}
	
	
	// Properties:
	//    referenceNodes: will points to a single instance.
	//    nodeInheritance: will inhearate from a node with the same config and parent.
	class DecisionTree extends Lookup {
	  constructor(name, payload, properties) {
	    properties ||= {};
	    let stateConfigs = properties.stateConfigs;
	    let referenceNodes = properties.referenceNodes === true;
	    let nodeInheritance = properties.nodeInheritance === true;
	    super();
	    name = formatName(name);
	    Object.getSet(this, {stateConfigs});
	    const names = {};
	    name = name || String.random();
	    stateConfigs ||= {};
	    this.stateConfigs = () => stateConfigs;
	    const tree = this;
	
	    const parentToJson = this.toJson;
	    this.toJson = (node) => {
	      node ||= this.root();
	      const json = parentToJson();
	      json.name = node.name();
	      json.referenceNodes = this.referenceNodes();
	      json.root = node.nodeOnlyToJson();
	      return json;
	    }
	
	    this.referenceNodes = () => referenceNodes;
	    this.nodeInheritance = () => nodeInheritance;
	    this.nameTaken = (name) => stateConfigs[formatName(name)] !== undefined;
	
	    function change(from, to) {
	      const state = stateConfig[from];
	      if (!state) throw new Error(`Invalid state name '${to}'`);
	      state.name(to);
	    }
	
	    function getState(name, payload) {
	      const stateConfig = stateConfigs[name];
	      if (stateConfig) return stateConfig;
	      return (stateConfigs[name] = new StateConfig(name, payload, tree.constructor));
	    }
	
	    this.validState = (name) => stateConfigs[name] !== undefined;
	
	    function addState(name, payload) {
	      if (name instanceof StateConfig) {
	        if (stateConfigs[name.name()] === undefined)
	          return (stateConfigs[name.name()] = name);
	        if (stateConfigs[name.name()] === name) return name;
	        throw new Error(`Attempting to add a new state with name '${name.name()}' which is already defined`);
	      }
	      return tree.getState(name, payload);
	    }
	
	    function addStates(states) {
	      if (Array.isArray(states)) {
	        states.forEach((state) => tree.addState(state));
	      } else if (states instanceof Object){
	        Object.keys(states).forEach((name) => tree.addState(name, states[name]));
	      }
	      throw new Error('states must be and array of StateConfigs or an Object of key => payload mapping');
	    }
	
	    this.getByPath = (...idPath) => getByPath(this.root(), ...idPath);
	    this.getByName = (...namePath) => getByName(this.root(), ...namePath);
	    this.change = change;
	    this.getState = getState;
	    this.addState = addState;
	    this.addStates = addStates;
	    this.stateConfigs = () => stateConfigs;
	    tree.declairedName = (name) => !!stateConfigs[formatName(name)];
	
	
	    let instPld = payload;
	    if (!this.nameTaken(name)) {
	      instPld = {};
	    }
	
	    const rootNode = new (this.constructor.Node)(this.getState(name, payload), instPld, this);
	    this.root = () => rootNode
	
	    this.toString = (...args) => this.root().toString(...args);
	    return this;
	  }
	}
	
	DecisionTree.conditionSatisfied = (condition, state, value) => {
	  value = value ? new String(value).toString() : state.name();
	  const noRestrictions = condition === undefined;
	  const regex = condition instanceof RegExp ? condition : null;
	  const target = (typeof condition) === 'string' ? condition : null;
	  const func = (typeof condition) === 'function' ? condition : null;
	  return noRestrictions || (regex && value.match(regex)) ||
	          (target !== null && value === target) ||
	          (func && func(state, value));
	}
	
	function addChildren(node, json) {
	  const childNames = Object.keys(json);
	  for (let index = 0; index < childNames.length; index++) {
	    const name = childNames[index];
	    const payload = Object.fromJson(json[name].payload);
	    const child = node.then(name, payload);
	    if (json.metadata)
	      Object.keys(json.metadata).forEach((key) =>
	          child.metadata(key, Object.fromJson(json.metadata[key])));
	    child.conditions.addAll(Object.fromJson(json[name].conditions));
	    addChildren(child, json[name].children);
	  }
	}
	
	DecisionTree.fromJson = (json) => {
	  const constructor = Object.class.get(json._TYPE);
	  const stateConfigs = Object.fromJson(json.stateConfigs);
	  const properties = {stateConfigs, referenceNodes: json.referenceNodes};
	  const tree = new constructor(json.root.name, json.root.payload, properties);
	  addChildren(tree.root(), json.root.children);
	  return tree;
	}
	
	DecisionTree.DecisionNode = DecisionNode;
	DecisionTree.Node = DecisionNode;
	module.exports = DecisionTree;
	
	
	// Messaging_App
	// set Max characters for you and them
	// you cannot text more than Max characters.
	// if (incomingMessage.length > Max) autoRespond: Recepiant can only recieve Max chanracters
	// if (only allow two messages without achnowledgement)
	
});


RequireJS.addFunction('../../public/js/utils/input/data-list.js',
function (require, exports, module) {
	
const $t = require('../$t');
	const du = require('../dom-utils');
	
	//TODO: shoould remove datalist from input object... bigger fish
	class DataList {
	  constructor(input) {
	    let list = [];
	    const id = `data-list-${String.random()}`;
	    this.id = () => id;
	    this.list = () => list;
	    this.getElem = () => {
	      let elem = du.id(id);
	      if (!elem)  elem = du.create.element('datalist', {id});
	      du.find('body').append(elem);
	      return elem;
	    }
	    this.update = () => {
	      const elem = this.getElem();
	      elem.innerHTML = DataList.template.render(this);
	      const inputElem = input && input.get();
	      if (inputElem) {
	        inputElem.setAttribute('list', this.id());
	      }
	    }
	    this.setList = (newList) => {
	      if (!Array.isArray(newList) || newList.equals(list)) return
	      list = newList;
	      this.update();
	    }
	  }
	}
	
	DataList.template = new $t('input/data-list');
	
	module.exports = DataList;
	
});


RequireJS.addFunction('../../public/js/utils/input/bind.js',
function (require, exports, module) {
	
const du = require('../dom-utils');
	const Input = require('./input');
	
	const defaultDynamInput = (value, type) => new Input({type, value});
	
	module.exports = function(selector, objOrFunc, props) {
	  let lastInputTime = {};
	  props = props || {};
	  const validations = props.validations || {};
	  const inputs = props.inputs || {};
	
	  const resolveTarget = (elem) => du.find.down('[prop-update]', elem);
	  const getValue = (updatePath, elem) => {
	    const input = Object.pathValue(inputs, updatePath);
	    return input ? input.value() : elem.value;
	  }
	  const getValidation = (updatePath) => {
	    let validation = Object.pathValue(validations, updatePath);
	    const input = Object.pathValue(inputs, updatePath);
	    if (input) {
	      validation = input.validation;
	    }
	    return validation;
	  }
	
	  function update(elem) {
	    const target = resolveTarget(elem);
	    elem = du.find.down('input,select,textarea', elem);
	    const updatePath = elem.getAttribute('prop-update') || elem.getAttribute('name');
	    elem.id = elem.id || String.random(7);
	    const thisInputTime = new Date().getTime();
	    lastInputTime[elem.id] = thisInputTime;
	    setTimeout(() => {
	      if (thisInputTime === lastInputTime[elem.id]) {
	        const validation = getValidation(updatePath);
	        if (updatePath !== null) {
	          const newValue = getValue(updatePath, elem);
	          if ((typeof validation) === 'function' && !validation(newValue)) {
	            console.error('badValue')
	          } else if ((typeof objOrFunc) === 'function') {
	            objOrFunc(updatePath, elem.value, elem);
	          } else {
	            Object.pathValue(objOrFunc, updatePath, elem.value);
	          }
	
	          if (target.tagname !== 'INPUT' && target.children.length === 0) {
	            target.innerHTML = newValue;
	          }
	        }
	      }
	    }, 20);
	  }
	  const makeDynamic = (target) => {
	    target = resolveTarget(target);
	    if (target.getAttribute('resolved') === null) {
	      target.setAttribute('resolved', 'dynam-input');
	      const value = target.innerText;
	      const type = target.getAttribute('type');
	      const updatePath = target.getAttribute('prop-update') || target.getAttribute('name');
	      const input = Object.pathValue(inputs, updatePath) || defaultDynamInput(value, type);
	
	      target.innerHTML = input.html();
	      const id = (typeof input.id === 'function') ? input.id() : input.id;
	      const inputElem = du.find.down(`#${id}`, target);
	      du.class.add(inputElem, 'dynam-input');
	      inputElem.setAttribute('prop-update', updatePath);
	      inputElem.focus();
	    }
	  }
	
	  du.on.match('change:keyup:enter', selector, update);
	  du.on.match('click', selector, makeDynamic);
	}
	
	
	const undoDynamic = (target) => {
	  const parent = du.find.up('[resolved="dynam-input"]', target)
	  parent.innerText = target.value;
	  parent.removeAttribute('resolved');
	}
	
	du.on.match('focusout', '.dynam-input', undoDynamic);
	
});


RequireJS.addFunction('../../public/js/utils/input/init.js',
function (require, exports, module) {
	
const Input = require('./input');
	Input.styles = [];
	Input.styles.push(Object.class.register(require('./styles/select/relation')));
	Input.styles.push(Object.class.register(require('./styles/list')));
	Input.styles.push(Object.class.register(require('./styles/measurement')));
	Input.styles.push(Object.class.register(require('./styles/multiple-entries')));
	Input.styles.push(Object.class.register(require('./styles/number')));
	Input.styles.push(Object.class.register(require('./styles/object')));
	Input.styles.push(Object.class.register(require('./styles/radio')));
	Input.styles.push(Object.class.register(require('./styles/select')));
	Input.styles.push(Object.class.register(require('./styles/list')));
	Input.styles.push(Object.class.register(require('./styles/table')));
	Input.styles.push(Object.class.register(require('./styles/textarea')));
	
	
	Object.class.register(require('./decision/decision'));
	
});


RequireJS.addFunction('../../public/js/utils/input/input.js',
function (require, exports, module) {
	

	
	
	
	const $t = require('../$t');
	const du = require('../dom-utils');
	const Lookup = require('../object/lookup')
	/*
	supported attributes: type, placeholder, name, class, value
	label: creates a text label preceeding input.
	clearOnClick: removes value when clicked.
	list: creates a dropdown with list values.
	default: the default value if input is invalid.
	targetAttr: attribute which defines the inputs value.
	format: attribute which defines a function used to format value.
	validation: Accepts
	                Array: value must be included
	                Regex: value must match
	                Function: value is arg1, must return true
	errorMsg: Message that shows when validation fails.
	
	*/
	class Input extends Lookup {
	  constructor(props) {
	    props ||= {};
	    if (props.name === 'jozsefMorrissey') {
	      console.log('created')
	    }
	    const id = props.id || `input-${String.random(7)}`;
	    super(id);
	    props.hidden = props.hide || false;
	    props.list = props.list || [];
	    props.optional = props.optional === undefined ? false : props.optional;
	    Object.getSet(this, props, 'hidden', 'type', 'label', 'name', 'placeholder',
	                            'class', 'list', 'value', 'inline');
	
	    const immutableProps = {
	      _IMMUTABLE: true,
	      targetAttr: props.targetAttr || 'value',
	      errorMsg: props.errorMsg || 'Error',
	      errorMsgId: props.errorMsgId || `error-msg-${this.id()}`,
	    }
	    Object.getSet(this, immutableProps)
	
	    const parentToJson = this.toJson;
	    this.toJson = () => {
	      const json = parentToJson();
	      delete json.id;
	      delete json.errorMsgId;
	      json.validation = props.validation;
	      return json;
	    }
	
	    this.clone = (properties) => {
	      const json = this.toJson();
	      Object.set(json, properties);
	      if (this.constructor.fromJson)
	        return this.constructor.fromJson(json);
	      return new this.constructor(json);
	    }
	
	    const instance = this;
	    const forAll = Input.forAll(this.id());
	
	    this.hide = () => forAll((elem) => {
	      const cnt = du.find.up('.input-cnt', elem);
	      this.hidden(cnt.hidden = true);
	    });
	    this.show = () => forAll((elem) => {
	      const cnt = du.find.up('.input-cnt', elem);
	      this.hidden(cnt.hidden = false);
	    });
	
	    let valid;
	    let value = props.value;
	
	    const idSelector = `#${this.id()}`;
	
	    const html = this.constructor.html(this);
	    this.isInitialized = () => true;
	    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
	    this.html = () => {
	      return html(this);
	    }
	
	    function valuePriority (func) {
	      return (elem, event) => func(elem[instance.targetAttr()], elem, event);
	    }
	    this.attrString = () => Input.attrString(this.targetAttr(), this.value());
	
	    function getElem(id) {return du.id(id)}
	    this.get = () => getElem(this.id());
	
	    this.on = (eventType, func) => du.on.match(eventType, idSelector, valuePriority(func));
	    this.trigger = (eventType) => du.trigger(eventType, this.get());
	    this.valid = () => this.setValue();
	    function getValue() {
	      const elem = getElem(instance.id());
	      let val = value;
	      if (elem) val = elem[instance.targetAttr()];
	      if (val === undefined) val = props.default;
	      if (instance.type() === 'checkbox') {
	        if (elem) val = elem.checked;
	        return val == true;
	      }
	      return val;
	    }
	
	    // TODO: this should probably be a seperate class.... whatever
	    this.checked = () => this.type() === 'checkbox' && this.value() == true ?
	                                'checked' : '';
	
	    this.getValue = getValue;
	    this.updateDisplay = () => {
	      const elem = du.find(`[input-id="${this.id()}"]`);
	      elem.outerHTML = this.html();
	      // if (elem) elem[instance.targetAttr()] = this.value();
	    };
	    let chosen = false;
	    this.setValue = (val, force, eventTriggered) => {
	      if (val === 'me') {
	        console.log('meeeeee')
	      }
	      if (val === undefined) val = this.getValue();
	      if (this.optional() && val === '') return true;
	      if(force || this.validation(val)) {
	        valid = true;
	        if (!chosen && eventTriggered) chosen = true;
	        value = val;
	        const elem = getElem(instance.id());
	        if (elem && elem.type !== 'radio') elem.value = value;
	        return true;
	      }
	      valid = false;
	      value = undefined;
	      return false;
	    }
	
	    this.chosen = () => props.mustChoose ? chosen : true;
	
	    this.value = () => {
	      let unformatted;
	      if (typeof value === 'function') unformatted = value();
	      else {
	        unformatted = this.getValue();
	        if (unformatted === undefined) unformatted = '';
	      }
	
	      return (typeof props.format) !== 'function' ? unformatted : props.format(unformatted);
	    }
	    this.doubleCheck = () => {
	      valid = undefined;
	      this.validate();
	      return valid;
	    }
	
	    this.editHtml = () => this.constructor.editHtml(this);
	    this.validation = function(val) {
	      const elem = getElem(instance.id());
	      val = val === undefined && elem ? elem.value : val;
	      if (val === undefined) return false;
	      // if (valid !== undefined && val === value) return valid;
	      let valValid = true;
	      if (props.validation instanceof RegExp) {
	        valValid = val.match(props.validation) !== null;
	      }
	      else if ((typeof props.validation) === 'function') {
	        valValid = props.validation.apply(null, arguments);
	      }
	      else if (Array.isArray(props.validation)) {
	        valValid = props.validation.indexOf(val) !== -1;
	      } else {
	        valValid = val !== '';
	      }
	
	      setValid(valValid);
	      return valValid;
	    };
	
	    function setValid(vld) {
	      valid = vld;
	      const errorElem = getElem(instance.errorMsgId());
	      if (errorElem) {
	        const hideMsg = !(!valid && instance.value() !== '');
	        errorElem.hidden = hideMsg;
	      }
	
	      const elem = getElem(instance.id());
	      if (elem) {
	        if (!valid) du.class.add(elem, 'error');
	        else du.class.remove(elem, 'error');
	      }
	    }
	
	    this.indicateValidity = setValid;
	
	    this.validate = (target, eventTriggered) => {
	      target = target || getElem(instance.id());
	      if (target) {
	        if (this.setValue(target[this.targetAttr()], false, eventTriggered)) {
	          setValid(true);
	        } else setValid(false);
	      }
	    }
	
	    this.empty = () => this.value() === '';
	
	    if (props.clearOnDblClick) {
	      du.on.match(`dblclick`, `#${this.id()}`, () => {
	        const elem = getElem(this.id());
	        if (elem) elem.value = '';
	      });
	    } else if (props.clearOnClick) {
	      du.on.match(`mousedown`, `#${this.id()}`, () => {
	        const elem = getElem(this.id());
	        if (elem) elem.value = '';
	      });
	    }
	  }
	}
	
	function runValidate(elem, event) {
	  const input = Lookup.get(elem.id);
	  if (input) input.validate(elem, true);
	}
	
	du.on.match(`click`, `input,select,textarea`, runValidate);
	du.on.match(`change`, `input,select,textarea`, runValidate);
	du.on.match(`keyup`, `input,select,textarea`, runValidate);
	
	Input.forAll = (id) => {
	  const idStr = `#${id}`;
	  return (func) => {
	    const elems = document.querySelectorAll(idStr);
	    for (let index = 0; index < elems.length; index += 1) {
	      func(elems[index]);
	    }
	  }
	}
	
	Input.getFromElem = (elem) => {
	  const idElem = du.find.up('[input-id],[input-ref-id]', elem);
	  if (idElem === undefined) return undefined;
	  const id = idElem.getAttribute('input-id') || idElem.getAttribute('input-ref-id');
	  return Input.get(id);
	}
	
	Input.template = new $t('input/input');
	Input.fromJson = (json) => new (Object.class.get(json._TYPE))(json);
	
	Input.flagAttrs = ['checked', 'selected'];
	Input.attrString = (targetAttr, value) =>{
	  if (Input.flagAttrs.indexOf(targetAttr) !== -1) {
	    return value === true ? targetAttr : '';
	  }
	  return `${targetAttr}='${value}'`
	}
	module.exports = Input;
	
	
	
	// TODO: this shouuld be a seperate class
	Input.editTemplate = new $t('input/edit/input');
	Input.html = (instance) => () => Input.template.render(instance);
	
	const objectItemTemplate = new $t('input/edit/list/object');
	const stringItemTemplate = new $t('input/edit/list/string');
	function listItemHtml (item) {
	  if (item instanceof Input) return item.editHtml();
	  if (item instanceof Object) return objectItemTemplate.render(item);
	  return stringItemTemplate.render({value: item});
	}
	Input.editHtml = (input) => Input.editTemplate.render({input, listItemHtml});
	
	du.on.match('change', '.input-edit-cnt[input-ref-id] input[attr]', (elem) => {
	  const input = Input.getFromElem(elem);
	  const attr = elem.getAttribute('attr');
	  input[attr](elem.value);
	  input.updateDisplay();
	});
	
});


RequireJS.addFunction('../../public/js/utils/input/decision/decision.js',
function (require, exports, module) {
	
// TODO IMPORTANT: refactor this garbage!!!!!!
	// ... its extreamly unIntuitive.
	
	
	
	const DecisionTree = require('../../decision-tree.js');
	const Conditions = require('../../conditions.js');
	const Input = require('../input.js');
	const CustomEvent = require('../../custom-event');
	const Select = require('../styles/select.js');
	const MultipleEntries = require('../styles/multiple-entries.js');
	const du = require('../../dom-utils');
	const $t = require('../../$t');
	const Measurement = require('../../measurement');
	
	
	const nameCompareFunc = (name) => (input) => input.name() === name ? input : false;
	const inputSelectorFunc = (func) => (node) => {
	  const inArr = node.inputArray();
	  for (let index = 0; index < inArr.length; index++) {
	    const input = inArr[index];
	    let val = func(input);
	    if (val) return val;
	    if (input instanceof MultipleEntries) {
	      val = input.input(func);
	      if (val) return val;
	    }
	  }
	}
	const nodeSelectorFunc = (nameOfunc) => inputSelectorFunc(
	          (typeof nameOfunc) === 'function' ? nameOfunc : nameCompareFunc(nameOfunc));
	
	
	
	class DecisionInput extends DecisionTree.Node {
	  constructor(stateConfig, payload, parent) {
	    payload ||= {};
	    payload.inputArray ||= [];
	    super(stateConfig, payload, parent);
	    const instance = this;
	
	    const parentToJson = this.nodeOnlyToJson;
	    this.nodeOnlyToJson = () => {
	      const json = parentToJson();
	      json.relatedTo = this.relatedTo();
	      return json;
	    }
	
	    const onChange = [];
	    const changeEvent = new CustomEvent('change');
	
	    const trigger = () => {
	      changeEvent.trigger(this.values());
	      this.tree().changed();
	    }
	    this.onChange = (func) => changeEvent.on(func);
	
	    for (let index = 0; index < payload.inputArray; index++) {
	      inArr[index].on('change', trigger);
	    }
	
	    this.relatedTo = (value) => {
	      const currValue = this.payload().relatedTo;
	      if (value === undefined) return currValue;
	      if (this.isRoot()) {
	        throw new Error('The root cannot be related to any other input');
	      }
	
	      const stateRelatedTo = this.stateConfig().payload().relatedTo;
	      let setState = false;
	      if (stateRelatedTo === undefined) {
	        this.stateConfig().setValue('relatedTo', value);
	        setState = true;
	      } else {
	        this.setValue('relatedTo', value)
	      }
	
	      value = this.payload().relatedTo;
	      const validList = this.parent().inputArray().map(i => i.name());
	      if (validList.indexOf(value) === -1) {
	        if (setState) {
	          this.stateConfig().setValue('relatedTo', currValue);
	          this.deleteValue('relatedTo');
	        } else {
	          this.setValue('relatedTo', currValue);
	        }
	      }
	
	      return value;
	    }
	
	    this.addInput = (input) => {
	      if (!(input instanceof Input)) throw new Error('input(arg1) needs to be and instance of Input');
	      const payload = this.stateConfig().payload();
	      this.stateConfig().setValue('inputArray', payload.inputArray.concat(input))
	      trigger();
	    }
	    this.values = (values, doNotRecurse) => {
	      if (!this.reachable()) return {};
	      values ||= {};
	      if (values._NODE === undefined) values._NODE = this;
	      let inputArr = this.inputArray();
	      for (let index = 0; index < inputArr.length; index++) {
	        const input = inputArr[index];
	        if (values[input.name()] === undefined) {
	          values[input.name()] = input.value();
	        }
	      }
	      if (!doNotRecurse && !this.isRoot()) this.parent().values(values);
	      return values;
	    };
	
	    this.isComplete = () => {
	      const inArr = this.inputArray();
	      let complete = true;
	      for (let index = 0; index < inArr.length; index++) {
	        complete &= inArr[index].optional() || inArr[index].valid();
	      }
	      this.forEachChild((child) => complete &= child.isComplete());
	      return complete == 1;
	    }
	    this.onComplete = this.tree().onComplete;
	    function updateInputArray (boolean) {
	      const inputArray = payload.inputArray;
	      const sc = instance.stateConfig();
	      const stateInputArray = sc.payload().inputArray;
	      if (inputArray.length === stateInputArray.length) return boolean ? false : inputArray;
	      for (let index = 0; index < stateInputArray.length; index++) {
	        const input = stateInputArray[index];
	        if (inputArray.length - 1 < index) {
	          const clone = input.clone();
	          if (clone.onChange) clone.onChange(trigger);
	          else if (clone.on) clone.on('change', trigger);
	          // clone.setValue('');
	          inputArray.push(clone);
	        }
	        if (inputArray[index].name() !== input.name()) inputArray.splice(index, 1);
	      }
	      return boolean ? true : inputArray;
	    }
	
	    this.inputArray = () => updateInputArray();
	
	    const parentPayload = this.payload;
	    this.payload = (noConfig) => {
	      this.inputArray();
	      return parentPayload(noConfig);
	    }
	
	    this.getValue = (index) => this.inputArray()[index].value();
	    this.isValid = () => {
	      let valid = true;
	      this.inputArray.forEach((input) =>
	            valid = valid && input.valid());
	      return valid;
	    }
	
	    this.choices = () => {
	      const choices = [];
	      this.breathFirst((node) => {
	        const inputArr = node.inputArray();
	        inputArr.forEach((input) => {
	          if (!input.chosen())
	            choices.push(input);
	        });
	      });
	      return choices;
	    }
	
	    this.find.input = (nameOfunc, ...namePath) => {
	      let node;
	      if (namePath.length > 0) {
	        node = this.find(...namePath);
	      }
	      node ||= this;
	      return node.breathFirst(nodeSelectorFunc(nameOfunc));
	    }
	
	    const checkColectiveFilter = (nameOmap, childCond) => {
	      let nameMap = {};
	      nameOmap instanceof Object ? nameMap = nameOmap : (nameMap[nameOmap] = true);
	      if (childCond.condition.conditions) {
	        const conds = childCond.condition.conditions();
	        for (let index = 0; index < conds.length; index++) {
	          if (conds[index].attribute && nameMap[conds[index].attribute()]) return true;
	        }
	      }
	      return false;
	    }
	
	    const nameFilter = (name) => (childCond) => {
	      if (!childCond.condition instanceof Conditions.Condition) return false;
	      if (childCond.condition.attribute) return childCond.condition.attribute().indexOf(name) === 0;
	
	      return checkColectiveFilter(name, childCond);
	    }
	    const dneFilter = () => {
	      const nameMap = {};
	      this.inputArray().map(input => nameMap[input.name()] = true);
	      return (childCond) =>
	        !(childCond.condition instanceof Conditions.Condition) ||
	        !((childCond.condition.attribute && nameMap[childCond.condition.prefix()]) ||
	        checkColectiveFilter(nameMap, childCond));
	    }
	    const childMapFunc = (childCond) => childCond.child;
	    this.childrenHtml = () => {
	      if (!this.shouldRecurse()) return '';
	      const children = this.reachableChildren().map(childMapFunc);
	      let html = '';
	      for (let index = 0; index < children.length; index++) {
	        const child = children[index];
	        html += child.html();
	      }
	      return html + (children.length > 0 ? '<br><br>' : '');
	    }
	    this.empty = () => this.inputArray().length === 0;
	    this.tag = () => this.tree().block() ? 'div' : 'span';
	    this.html = () => DecisionInput.template.render(this);
	
	    this.removeInput = (inputName, localOnly) => {
	      const ia = payload.inputArray;
	      for (let index = 0; index < ia.length; index++) {
	        if (ia[index].name() === inputName) {
	          const stateName = this.stateConfig().name();
	          ia.splice(index, 1);
	          if (!localOnly) this.tree().removeInput(stateName, inputName);
	          return true;
	        }
	      }
	      return false;
	    }
	
	    this.payloadHtml = () => {
	      const pld = this.payload();
	      if ((typeof pld.html) === 'function') return pld.html();
	      return this.tree().payloadHtml(pld);
	    }
	  }
	}
	DecisionInput.template = new $t('input/decision/decision');
	
	du.on.match('click', '.conditional-button', (elem) => {
	  console.log(elem);
	});
	
	
	// properties
	// optional :
	// noSubmission: /[0-9]{1,}/ delay that determins how often a submission will be processed
	// buttonText: determins the text displayed on submit button;
	// inputArray: inputArray to be applied to the root;
	// isComplete: function determining if all required inputs are filled.
	
	class DecisionInputTree extends DecisionTree {
	  constructor(rootName, payload, props) {
	    props = props || {};
	    props.inputArray ||= [];
	    super(rootName, payload, props);
	    Object.getSet(this, 'payloadHandler');
	
	    this.payloadHtml = (payload) => {
	      const handler = this.payloadHandler();
	      if (handler) return handler.html(payload);
	    }
	
	    this.payloadInput = () => {
	      const handler = this.payloadHandler();
	      if (handler) return handler.input();
	    }
	
	    this.inputHtml = () => {
	      const handler = this.payloadHandler();
	      if (handler) return handler.inputHtml();
	    }
	
	    let payloadTemplate
	    let payloadTemplateName
	    this.payloadTemplateName = (name) => {
	      if (name && $t.functions[name]) {
	        payloadTemplateName = name;
	        payloadTemplate = new $t(name);
	      }
	      return payloadTemplateName;
	    }
	
	    this.payloadTemplate = () => payloadTemplate;
	
	    this.buttonText = () => {
	      return props.buttonText || `Create ${rootName}`;
	    }
	    let disabled;
	    this.disableButton = (d, elem) => {
	      disabled = d === null || d === true || d === false ? d : disabled;
	      if (elem) {
	        const button = du.find.closest(`button`, elem);
	        if (button) {
	          button.disabled = disabled === null ? !node.isComplete(root) : disabled;
	        }
	      }
	    }
	    this.class = () => props.class;
	    this.buttonClass = () => props.buttonClass;
	    this.isComplete = () => {
	      if ((typeof props.isComplete) === 'function') return props.isComplete(this.root());
	      const choices = this.choices();
	      if (choices.length > 0) return false;
	      return this.root().isComplete();
	    }
	
	    const completeEvent = new CustomEvent('complete');
	    const submitEvent = new CustomEvent('submit');
	    const changeEvent = new CustomEvent('change');
	    this.html = (node, editDisplay) => {
	      node = node || this.root();
	      const header = props.header;
	      const inputHtml = node.html(editDisplay);
	      const scope = {node, inputHtml, DecisionInputTree, editDisplay, header};
	      if (node.isRoot()) {
	        return DecisionInputTree.template.render(scope);
	      }
	      return inputHtml;
	    };
	    this.onComplete = completeEvent.on;
	    this.onSubmit = submitEvent.on;
	    this.hideButton = props.noSubmission;
	    this.onChange = (func) => this.root().onChange(func);
	
	    let completionPending = false;
	    this.completed = () => {
	      if (!this.isComplete()) return false;
	      const delay = props.noSubmission || 0;
	      if (!completionPending) {
	        completionPending = true;
	        setTimeout(() => {
	          const values = this.values();
	          completeEvent.trigger(values, this);
	          completionPending = false;
	        }, delay);
	      }
	      return true;
	    }
	
	    let submissionPending = false;
	    this.submit = (elem) => {
	      // TODO: delay = props.noSubmission === confusing
	      const delay = props.noSubmission || 0;
	      if (!submissionPending) {
	        submissionPending = true;
	        setTimeout(() => {
	          const values = this.values();
	          if (!this.isComplete()) return submissionPending = false;
	          submitEvent.trigger(values, elem);
	          submissionPending = false;
	        }, delay);
	      }
	      return true;
	    }
	
	    let changePending = 0;
	    const delay = props.noSubmission || 0;
	    this.changed = () => {
	      let changeId = ++changePending;
	      setTimeout(() => {
	        if (changeId === changePending) {
	          const values = this.values();
	          changeEvent.trigger(values)
	        }
	      }, delay);
	    }
	
	    let block = false;
	    this.block = (is) => {
	      if (is === true || is === false) {
	        block = is;
	      }
	      return block;
	    }
	
	    this.find = (...args) => this.root().find(...args);
	    this.find.input = (...args) => this.root().find.input(...args);
	
	    this.values = () => {
	      const values = {};
	      this.root().breathFirst((node) => {
	        const obj = {};
	        node.values(obj, true);
	        Object.pathValue(values, node.path().join('.'), obj);
	      });
	      return values[this.root().name()];
	    }
	
	    this.choices = () => this.root().choices();
	
	    const parentGetState = this.getState;
	    this.getState = (name, payload) => {
	      if (!this.stateConfigs()[name]) {
	        if (!payload) payload = {};
	        payload.inputArray ||= [];
	      }
	      return parentGetState(name, payload);
	    }
	
	    this.removeInput = (stateName, inputName) => {
	      const configs = this.stateConfigs();
	      const nodes = [];
	      this.root().forall((n) => {
	        const sc = n.stateConfig();
	        if (sc.name() === stateName) {
	          const scIArr = sc.payload().inputArray.filter(i => i.name() !== inputName);
	          sc.setValue('inputArray', scIArr);
	          n.removeInput(inputName, true);
	        }
	      });
	      console.log('rmI');
	    }
	
	    this.clone = () => DecisionInputTree.fromJson(this.toJson());
	    this.valid = this.completed;
	    this.name = () => this.root().name();
	    this.value = this.values;
	
	    return this;
	  }
	}
	
	
	DecisionInputTree.class = 'decision-input-tree';
	DecisionInputTree.inputSelector = `.${DecisionInputTree.class} input,textarea,select`;
	DecisionInputTree.buttonClass = 'decision-input-tree-submit';
	
	DecisionInputTree.getNode = (elem) => {
	  const cnt = du.find.closest('[node-id]', elem);
	  const parent = cnt.parentElement;
	  const nodeId = cnt.getAttribute('node-id');
	  return Lookup.get(nodeId);
	}
	
	DecisionInputTree.hardUpdate = (elem) => {
	  const tree = DecisionInputTree.getTree(elem);
	  const treeCnt = du.find.up('[tree-id]', elem);
	  const cnt = treeCnt.parentElement;
	  cnt.innerHTML = tree.html();
	}
	
	function updateInput(target) {
	  const cnt = du.find.closest('[node-id]', target);
	  const nodeId = cnt.getAttribute('node-id');
	  const node = Lookup.get(nodeId);
	
	  const inputCnt = du.find.up('.decision-input-array-cnt', target);
	  const inputIndex = Number.parseInt(inputCnt.getAttribute('index'));
	  const parentCnt = du.find.up('.decision-input-cnt', inputCnt);
	  updateOrphans(target);
	}
	
	function updateOrphans(elem) {
	  const dicnt = du.find.up('.decision-input-cnt', elem);
	  const orphanCnt = du.find.down('.orphan-cnt', dicnt);
	  const node = DecisionInputTree.getNode(dicnt);
	  orphanCnt.innerHTML = node.childrenHtml();
	}
	
	function updateAllChildren(dicnt) {
	  updateOrphans(dicnt);
	  du.move.inbounds(dicnt);
	}
	
	// TODO remove nested function, soft not used.... clean this please
	DecisionInputTree.update = (soft) => (target, event) => setTimeout(() => updateInput(target));
	DecisionInputTree.update.children = updateAllChildren;
	
	DecisionInputTree.Node = DecisionInput;
	DecisionInputTree.submit = (elem) => {
	  const tree = Lookup.get(elem.getAttribute('tree-id'));
	  tree.submit(elem);
	}
	
	let count = 999;
	// const getInput = () => new Input({
	//   label: `Label${++count}`,
	//   name: `Name${count}`,
	//   inline: true,
	//   class: 'center',
	// });
	
	const nodeIds = {}
	function enableRecursion(elem) {
	  const node = DecisionInputTree.getNode(elem);
	  if (node.reachable()) {
	    node.children();
	    node.forEachChild((child) => child.shouldRecurse(true));
	    elem.removeAttribute('recursion');
	    updateAllChildren(elem);
	  }
	}
	
	const treeSelector = `.${DecisionInputTree.class}`;
	du.on.match('keyup', DecisionInputTree.inputSelector, DecisionInputTree.update(true));
	du.on.match('change', DecisionInputTree.inputSelector, DecisionInputTree.update());
	du.on.match('click', `.${DecisionInputTree.buttonClass}`, DecisionInputTree.submit);
	// Consider changing for self referencing trees.
	du.on.match('mouseover', '.decision-input-cnt[recursion]', enableRecursion);
	
	DecisionInputTree.DO_NOT_CLONE = true;
	
	DecisionInputTree.getTree = (elem) => {
	  const rootElem = du.find.up("[tree-id]", elem);
	  const rootId = rootElem.getAttribute('tree-id');
	  const tree = DecisionInputTree.get(rootId);
	  return tree;
	}
	
	class NodeCondition {
	  constructor(attribute, value, type) {
	    this.toJson = () => ({_TYPE: 'NodeCondition'});
	    this.resolveValue = (node, attribute) => {
	      const values = node.values();
	      if (attribute === undefined) return values;
	      return Object.pathValue(values, attribute);
	    }
	    if (attribute._TYPE === 'NodeCondition') return this;
	
	    return Conditions.get(attribute, value, type, this);
	  }
	}
	Object.class.register(NodeCondition);
	
	DecisionInputTree.getCondition = (...args) => new NodeCondition(...args);
	
	// TODO: merge this with parent... duplications
	function childrenFromJson(parent, json) {
	  const children = Object.values(json.children);
	  for (let index = 0; index < children.length; index++) {
	    const child = children[index];
	    const node = parent.then(child.name, Object.fromJson(child.payload));
	    childrenFromJson(node, child);
	  }
	  if (json.metadata)
	    Object.keys(json.metadata).forEach((key) =>
	        parent.metadata(key, Object.fromJson(json.metadata[key])));
	}
	
	DecisionInputTree.fromJson = (json) => {
	  const stateConfigs = Object.fromJson(json.stateConfigs);
	  const properties = {
	    stateConfigs,
	    nodeInheritance: json.nodeInheritance,
	    referenceNodes: json.referenceNodes,
	    noSubmission: json.noSubmission
	  };
	  const tree = new DecisionInputTree(json.root.name, null, properties);
	  const root = tree.root();
	  childrenFromJson(root, json.root);
	
	  return tree;
	}
	
	DecisionInputTree.template = new $t('input/decision/decisionTree');
	
	DecisionInputTree.rebuild = (elem) => {
	  const treeCnt = du.find.up('[tree-id]', elem);
	  if (!treeCnt) throw new Error('elem is not contained within a tree\'s html');
	  const tree = Lookup.get(treeCnt.getAttribute('tree-id'));
	  const body = tree.html(null, true);
	  treeCnt.parentElement.innerHTML = body;
	}
	
	
	
	
	
	
	module.exports = DecisionInputTree;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/number.js',
function (require, exports, module) {
	
const Input = require('../input');
	const $t = require('../../$t');
	
	class NumberInput extends Input {
	  constructor(props) {
	    super(props);
	    props.min = Number.parseFloat(props.min) || 0;
	    props.max = Number.parseFloat(props.max) || Number.MAX_SAFE_INTEGER;
	    props.step = Number.parseFloat(props.step) || 1;
	    Object.getSet(this, {min: props.min, max: props.max, step: props.step});
	
	    this.validation = (value) => value <= props.max && value >= props.min;
	  }
	}
	
	NumberInput.template = new $t('input/number');
	NumberInput.html = (instance) => () => NumberInput.template.render(instance);
	
	module.exports = NumberInput;
	
});


RequireJS.addFunction('../../public/js/utils/input/decision/input-input.js',
function (require, exports, module) {
	
const Input = require('../input');
	const Select = require('../styles/select');
	const NumberInput = require('../styles/number');
	const Measurement = require('../../measurement');
	const MeasurementInput = require('../styles/measurement');
	const Textarea = require('../styles/textarea');
	const MultipleEntries = require('../styles/multiple-entries');
	const DecisionInputTree = require('../decision/decision');
	const Table = require('../styles/table.js');
	const InputList = require('../styles/list.js');
	const RadioTable = Table.Radio;
	const Radio = require('../styles/radio.js');
	const $t = require('../../$t');
	const du = require('../../dom-utils');
	
	
	
	const noSubmitInputTree = () =>
	  new InputInput({noSubmission: true});
	
	
	class InputInput extends DecisionInputTree {
	  constructor(props) {
	    props ||= {};
	    props.validation ||= {};
	    if (props.value){
	      console.log('gere')
	    }
	    let details = {};
	    const name = new Input({
	      name: 'name',
	      label: 'Name',
	      class: 'center',
	      validation: props.validation.name
	    });
	    const inline = new Input({
	      name: 'inline',
	      value: props.inline,
	      label: 'Inline',
	      class: 'center',
	      type: 'checkbox'
	    });
	    const format = new Select({
	      label: 'Format',
	      name: 'format',
	      class: 'center',
	      list: ['Text', 'Checkbox', 'Number', 'Radio', 'Select', 'Date', 'Time', 'Table', 'Multiple Entries', 'Measurement'],
	      validation: props.validation.format
	    });
	    const step = new NumberInput({name: 'step', optional: true, label: 'Step'});
	    const min = new NumberInput({name: 'min', optional: true, label: 'Minimum'});
	    const max = new NumberInput({name: 'max', optional: true, label: 'Maximum'});
	    const tableType = new Select({
	      label: 'Type',
	      name: 'type',
	      class: 'center',
	      list: ['Text', 'checkbox', 'radio', 'date', 'time', 'column specific']
	    });
	    const textCntSize = new Select({
	      label: 'Size',
	      name: 'size',
	      class: 'center',
	      list: ['Small', 'Large']
	    });
	    const units = new Select({
	      label: 'Units',
	      name: 'units',
	      class: 'center',
	      list: Measurement.units()
	    });
	    const label = new Input({
	      name: 'label',
	      label: 'Label',
	      class: 'centnodeConds[index].satisfied()) reer',
	      validation: (val) => val !== ''
	    });
	    const option = new Input({
	      name: 'option',
	      label: 'Option',
	    });
	    const row = new Input({
	      name: 'row',
	      class: 'center',
	    });
	    const col = new Input({
	      name: 'col',
	      class: 'center',
	    });
	    const labels = new MultipleEntries(label, {name: 'labels'});
	    const options = new MultipleEntries(option, {name: 'options'});
	    const colType = new MultipleEntries(noSubmitInputTree, {name: 'columns', label: 'Columns'});
	    const columns = new MultipleEntries(col, {name: 'columns', label: 'Columns'});
	    const rows = new MultipleEntries(row, {name: 'rows', label: 'Rows'});
	    const rowCols = [tableType, rows];
	
	
	    const inputs = [name, format];
	    const multiEnt = new MultipleEntries(noSubmitInputTree, {name: 'templates'});
	
	    super(props.name || 'Input', {inputArray: inputs, noSubmission: props.noSubmission, class: 'modify'});
	    const root = this.root();
	
	    const dic = (value, attr) => DecisionInputTree.getCondition(attr || 'format', value);
	    function addNode(name, inputArray, value, attr, node) {
	      const targetNode = (node || root);
	      const newNode = targetNode.then(name, {inputArray});
	      targetNode.conditions.add(dic(value, attr), name);
	      return newNode;
	    }
	
	    addNode('text', [textCntSize], 'Text');
	    addNode('select', [options], 'Select');
	    addNode('radio', [inline, labels], 'Radio');
	    const tableNode = addNode('table', rowCols, 'Table');
	    addNode('tableColumnList', [columns], ['Text', 'checkbox', 'radio', 'date', 'time'], 'type', tableNode);
	    addNode('tableColumnTemplate', [colType], 'column specific', 'type', tableNode);
	    addNode('multi', [inline, multiEnt], 'Multiple Entries');
	    addNode('measure', [units], 'Measurement');
	    addNode('number', [step, min, max], 'Number');
	
	    this.setValue = (inputOrDetails) => {
	      if (!inputOrDetails) return;
	      let details = inputOrDetails;
	      if (inputOrDetails instanceof Input) details = getInputDetails(details);
	      const setValue = (path) => {
	        const nodePath = path.split('.');
	        const inputName = nodePath.splice(-1)[0];
	        const node = this.getByPath.apply(this, nodePath);
	        const input = node.find.input(inputName);
	        input.setValue(details.pathValue(path));
	      }
	      setValue('name');
	      setValue('name');
	      // setValue('inline');
	      setValue('format');
	      setValue('number.step');
	      setValue('number.min');
	      setValue('number.max');
	      setValue('table.type');
	      setValue('text.size');
	      setValue('measure.units');
	      setValue('radio.labels');
	      setValue('select.options');
	      setValue('table.tableColumnTemplate.columns');
	      setValue('multi.templates');
	      setValue('table.tableColumnList.columns');
	      setValue('table.rows');
	    }
	
	    this.clone = () => new InputInput(props);
	    this.empty = () => this.values().name === '';
	    // tree.onSubmit(addInput);
	    // tree.clone = () => DecisionInputTree.inputTree(node, noSubmission);
	    // tree.empty = () => {
	    //   let empty = true;
	    //   tree.root().forEach((node) =>
	    //     node.payload().inputArray.forEach(input => empty &&= input.empty()));
	    //   return empty;
	    // }
	
	    this.setValue(props.input);
	  }
	}
	
	function getInputDetails(input)  {
	  const details = {};
	  details.name = input.label();
	  details.inline = input.inline();
	  details.vaalue = input.value();
	  let list;
	  if (input instanceof Textarea) {
	    details.format = 'Text';
	    details.text = {size: 'Large'};
	  }
	
	  else if (input instanceof NumberInput) {
	    details.format = 'Number';
	    details.number = {step: input.step()};
	    details.number.min = input.min();
	    details.number.max = input.max();
	  }
	
	  else if (input instanceof Radio) {
	    details.format = 'Radio';
	    details.radio = {labels: input.list()};
	  }
	
	  else if (input instanceof Select) {
	    details.format = 'Select';
	    const options = input.list();
	    details.select = {options};
	  }
	
	  else if (input instanceof MeasurementInput) {
	    details.format = 'Measurement';
	    details.measure = {units: input.units()};
	  }
	
	  else if (input instanceof Table || input instanceof RadioTable) {
	    details.format = 'Table';
	    details.table = {rows: input.rows()};
	    const isList = !(input.columns()[0] instanceof Input);
	    if (isList) {
	      details.table.tableColumnList = {columns: input.columns()};
	    } else {
	      const columns = input.columns.map((ci) => getInputDetails(ci));
	      details.table.tableColumnTemplate = {columns};
	    }
	    details.table.type = input.type();
	  }
	
	  else if (input instanceof MultipleEntries) {
	    details.format = 'Multiple Entries';
	    details.multi = {templates: []};
	
	    const inputList = input.inputTemplate();
	    const list = inputList.list();
	    for (let index = 0; index < list.length; index++) {
	      const inp = list[index];
	      const inpDets = getInputDetails(inp);
	      details.multi.templates.push(inpDets);
	    }
	  }
	
	  else {
	    switch (input.type()) {
	      case 'date': details.format = 'Date'; break;
	      case 'time': details.format = 'Time'; break;
	      case 'checkbox': details.format = 'Checkbox'; break;
	      default:
	        details.format = 'Text';
	        details.text = {size: 'Small'};
	        break;
	
	    }
	  }
	
	  return details;
	}
	
	function getInput(details, validationCall)  {
	  const name = details.name.toCamel();
	  const label = details.name;
	  let inline = details.inline;
	  let list, input;
	  switch (details.format) {
	    case 'Text':
	      if (details.text.size === 'Large') {
	        input = new Textarea({name, label});
	        break;
	      } else {
	        input = new Input({type: 'text', name, label, inline});
					break;
	      }
	    case 'Number':
	      const step = details.number.step;
	      const min = details.number.min;
	      const max = details.number.max;
	      input = new NumberInput({name, label, min, max, step});
				break;
	    case 'Date':
	      input = new Input({type: 'date', name, label, inline});
				break;
	    case 'Time':
	      input = new Input({type: 'time', name, label, inline});
				break;
	    case 'Checkbox':
	      input = new Input({type: 'checkbox', name, label, inline});
				break;
	    case 'Radio':
	      inline = details.radio.inline;
	      list = details.radio.labels;
	      input = new Radio({name, label, list, inline});
				break;
	    case 'Select':
	      list = details.select.options;//.map(input => input.value());
	      input = new Select({name, label, list});
				break;
	    case 'Table':
	      const props = details.table;
	      let isList = props.tableColumnList !== undefined;
	      let columns = isList ?  props.tableColumnList.columns : props.tableColumnTemplate.columns;
	      let rows = props.rows;
	      if (!isList) {
	        columns.forEach((definition, index) => columns[index] = getInput(definition));
	      }
	      const type = props.type;
	      input = new Table({name, label, rows, columns, type});
				break;
	    case 'Measurement':
	      const units = details.measure.units;
	      input = new MeasurementInput({name, label, units});
				break;
	    case 'Multiple Entries':
	      const templates = details.multi.templates;
	      list = [];
	      inline = details.multi.inline;
	      for (let index = 0; index < templates.length; index++) {
	        const values = templates[index];
	        values.inline = inline;
	        const input = getInput(values);
	        list.push(input);
	      }
	      input = new MultipleEntries(new InputList({list, inline}), {name, label});
				break;
	    default:
	      throw new Error('In the future this will not be reachable');
	  }
	  if (!validationCall) validateGetInputDetais(details, input);
	  return input;
	}
	
	function validateGetInputDetais(details, input) {
	  const genDets = getInputDetails(input);
	  const genInput = getInput(genDets, true);
	  const constructorEq = genInput.constructor === input.constructor;
	  const typeEq = genInput.type() === input.type();
	  if (!constructorEq || !typeEq){
	    console.warn('invalid generated details');
	    getInputDetails(input);
	  }
	}
	
	InputInput.getInput = getInput;
	InputInput.getInputDetails = getInputDetails;
	
	
	
	module.exports = InputInput;
	
	
	
	
	
	
	
	
	
	// TODO: Should probably locate somewhere else hacky fix. cosider making editHtml sperate for all Inputs.
	RadioTable.editTemplate = Table.editTemplate = new $t('input/edit/table');
	
	const objectItemTemplate = new $t('input/edit/list/object');
	const stringItemTemplate = new $t('input/edit/list/string');
	function listHtml (list) {
	  const props = {list: [], class: 'input-list-multi'};
	  let template;
	  for (let index = 0; index < list.length; index++) {
	    const item = list[index];
	    if (item instanceof Input) {
	      const ii = new InputInput({input: item, noSubmission: true});
	      props.list.push(ii);
	      template ||= new InputInput({noSubmission: true});
	    } else if (item instanceof Object) {
	      props.list.push(new InputObject({value: item}));
	      template ||= new InputObject();
	    } else {
	      props.list.push(new Input({type: 'simple-string', value: item}));
	      template ||= new Input({type: 'simple-string'});
	    }
	  }
	  const multi = new MultipleEntries(template, props);
	  return multi.html();
	}
	RadioTable.editHtml = Table.editHtml = (table) => Table.editTemplate.render({table, listHtml});
	
	function buildList(elem) {
	  const input = Input.getFromElem(elem);
	  const targetInput = Input.getFromElem(elem.previousElementSibling);
	  const columnValues = targetInput.value();
	  const list = [];
	  for (let index = 0; index < columnValues.length; index++) {
	    const col = columnValues[index];
	    if ((typeof col) === 'string') list.push(col);
	    else list.push(InputInput.getInput(col));
	  }
	  return {input, list};
	}
	
	du.on.match('click', '#table-column-edit-btn', (elem) => {
	  const listput = buildList(elem)
	  listput.input.setColumns(listput.list);
	  listput.input.updateDisplay();
	});
	du.on.match('click', '#table-row-edit-btn', (elem) => {
	  const listput = buildList(elem)
	  listput.input.setRows(listput.list);
	  listput.input.setColumns();
	  listput.input.updateDisplay();
	});
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/measurement.js',
function (require, exports, module) {
	

	
	
	const Input = require('../input');
	const $t = require('../../$t');
	const du = require('../../dom-utils');
	const Measurement = require('../../measurement');
	
	class MeasurementInput extends Input {
	  constructor(props) {
	    let units = props.units;
	    let value = new Measurement(props.value, units || true);
	    props.value = () => value;
	    super(props);
	
	    this.valid = (val) => {
	      let testVal;
	      if (val) {
	        if (val instanceof MeasurementInput) testVal = val.value();
	        else testVal = val;
	      } else testVal = value.value();
	      const valid = !Number.isNaN(testVal);
	      this.indicateValidity(valid);
	      return valid;
	    }
	
	    props.errorMsg = 'Invalid Mathematical Expression';
	    this.value = () => {
	      return value.display();
	    }
	    const parentSetVal = this.setValue;
	    this.setValue = (val) => {
	      let newVal = this.valid(val) ? ((val instanceof Measurement) ?
	                        val : new Measurement(val, units || true)) : value;
	      const updated = newVal !== value;
	      value = newVal;
	      return updated;
	    }
	  }
	}
	
	MeasurementInput.template = new $t('input/measurement');
	MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);
	
	du.on.match('focusout', '.measurement-input', (elem) => {
	  const input = MeasurementInput.get(elem.id);
	  elem.value = input.value();
	})
	
	module.exports = MeasurementInput;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/list.js',
function (require, exports, module) {
	
const $t = require('../../$t');
	const du = require('../../dom-utils');
	const CustomEvent = require('../../custom-event');
	const Input = require('../input');
	
	// TODO: extend InputObject (class functionality overlap)
	class InputList extends Input {
	  constructor(props) {
	    super(props);
	    Object.getSet(this);
	    const instance = this;
	
	    this.value = () => {
	      const values = {};
	      props.list.forEach((input, index) => input.validation() && (values[input.name() || index] = input.value()));
	      return values;
	    }
	
	    const dynamicEvent = CustomEvent.dynamic();
	    this.on = dynamicEvent.on;
	
	    function triggerChangeEvent(value, input, event) {
	      dynamicEvent.trigger(event, {value, input});
	    }
	    props.list.forEach(input => input.on('change:click:keyup', triggerChangeEvent));
	
	    this.setValue = () => {
	      throw new Error('This function should never get called');
	    }
	
	    this.valid = () => {
	      if (this.optional()) return true;
	      let valid = true;
	      props.list.forEach(input => valid &&= input.optional() || input.valid());
	      return valid;
	    }
	
	    let optional;
	    this.optional = (value) => {
	      if (value !== true && value !== false) return optional;
	      optional = value;
	      props.list.forEach(input => input.optional(optional));
	    }
	    this.optional(props.optional || false);
	
	    this.clone = (properties) => {
	      const json = this.toJson();
	      json.validation = (properties || props).validation;
	      json.list.forEach(i => delete i.id);
	      Object.set(json, properties);
	      return InputList.fromJson(json);
	    }
	
	    this.empty = () => {
	      for (let index = 0; index < props.list.length; index++) {
	        if (!props.list[index].empty()) return false
	      }
	      return true;
	    }
	
	  }
	}
	
	InputList.fromJson = (json) => {
	  json.list = Object.fromJson(json.list);
	  return new InputList(json);
	}
	
	InputList.template = new $t('input/list');
	InputList.html = (instance) => () => InputList.template.render(instance);
	
	
	
	module.exports = InputList;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/multiple-entries.js',
function (require, exports, module) {
	

	
	
	
	const Input = require('../input');
	const $t = require('../../$t');
	const du = require('../../dom-utils');
	
	const validation = () => true;
	class MultipleEntries extends Input {
	  constructor(inputTemplate, props) {
	
	
	    props ||= {};
	    props.validation ||= (event, details) => {
	      const list = props.list;
	      let allEmpty = true;
	      let valid = true;
	      for (let index = 0; index < list.length; index++) {
	        const input = list[index];
	        const empty = input.empty();
	        if (!empty) {
	          if (input.optional) input.optional(false);
	          valid &= list[index].valid();
	        }
	        allEmpty &= empty;
	      }
	      return !allEmpty && valid;
	    }
	    if (props.list === undefined) {
	      const list = [];
	      props.list = list;
	      props.list.forEach((i) =>
	        list.push(i.clone()));
	    }
	
	    props.list ||= [];
	    super(props);
	    Object.getSet(this, 'inputTemplate');
	    let template;
	    const instance = this;
	    this.inputTemplate = () => {
	      if (!template) {
	        if ((typeof inputTemplate) === 'function') {
	          template = inputTemplate();
	        } else template = inputTemplate;
	      }
	      return template;
	    }
	
	    this.empty = () => {
	      if (props.list.length > 1) return false;
	      const inputs = props.list[0];
	      for (let index = 0; index < inputs.length; index++) {
	        if (!inputs[index].empty()) return false;
	      }
	      return true;
	    }
	    this.valid = () => this.value().length > 0;
	
	    this.clone = () =>
	        new MultipleEntries(inputTemplate, JSON.clone(props));
	
	    this.set = (index, value) => {
	      if (props.list[index] === undefined) {
	        props.list[index] = this.inputTemplate().clone({optional: true});
	        if (props.list[index].on) {
	          props.list[index].on('change', this.validation);
	        } else {
	          props.list[index].onChange(this.validation);
	        }
	      }
	      return props.list[index];
	    }
	
	    this.tag = () => props.inline() ? 'span' : 'div';
	
	    this.input = (nameOindexOfunc) => {
	      const nif = nameOindexOfunc;
	      if ((typeof nif) === 'number') return props.list[nif];
	      const runFunc = (typeof nif) === 'function';
	      for (let index = 0; index < props.list.length; index++) {
	        const input = props.list[index];
	        if (runFunc) {
	          const val = nif(input);
	          if (val) return val;
	        } else if (input.name() === nif) return input;
	
	        if (input instanceof MultipleEntries) {
	          const mInput = input.input(nif);
	          if (mInput) return mInput;
	        }
	      }
	    }
	    this.getValue = () => {
	      const values = [];
	      for (let index = 0; index < props.list.length; index++) {
	        const input = props.list[index];
	        if (!input.empty()) {
	          if (input.valid()) {
	            values.push(input.value());
	          } else {
	            input.valid();
	            input.valid();
	          }
	        }
	      }
	      return values;
	    }
	
	    this.setValue = (list) => {
	      if (list) {
	        list.forEach((val, index) => {
	            const input = this.set(index)
	            input.setValue(val);
	        });
	      }
	    }
	
	    this.value = this.getValue;
	
	    const parentHtml = this.html;
	    this.html = () => {
	      if (props.list.length === 0 || !props.list[props.list.length - 1].empty()) this.set(props.list.length);
	      return parentHtml();
	    }
	
	    this.length = () => this.list().length;
	    this.setHtml = (index) => MultipleEntries.singleTemplate.render(this.set(index));
	
	    this.setValue(props.value);
	  }
	}
	
	MultipleEntries.template = new $t('input/multiple-entries');
	MultipleEntries.singleTemplate = new $t('input/one-entry');
	MultipleEntries.html = (instance) => () => MultipleEntries.template.render(instance);
	
	MultipleEntries.fromJson = (json) => {
	  const inputTemplate = Object.fromJson(json.inputTemplate);
	  return new MultipleEntries(inputTemplate, json);
	
	}
	
	function meInfo(elem) {
	  const info = {};
	  info.oneCnt = du.find.up('.one-entry-cnt', elem);
	  if (info.oneCnt) {
	    info.indexCnt = du.find.up('[index]', info.oneCnt);
	    info.index = Number.parseInt(info.indexCnt.getAttribute('index'));
	    const ae =  document.activeElement;
	    info.inFocus = !(!(ae && ae.id && du.find.down('#' + ae.id, info.indexCnt)));
	  }
	  info.multiCnt = du.find.up('.multiple-entry-cnt', info.indexCnt || elem);
	  info.multiInput = MultipleEntries.getFromElem(info.multiCnt);
	  info.length = info.multiInput.length();
	  info.inputs = du.find.downAll('input,select,textarea', info.oneCnt);
	  info.last = info.index === info.length - 1;
	  info.empty = info.multiInput.list()[info.index].empty();
	  return info;
	}
	
	const meSelector = '.multiple-entry-cnt input,select,textarea';
	const oneSelector = '.one-entry-cnt *';
	const isInput = (elem) => elem.tagName.match(/(SELECT|INPUT|TEXTAREA)/) !== null;
	du.on.match('change', meSelector, (elem) => {
	  // console.log('changed');
	});
	
	du.on.match('click', meSelector, (elem) => {
	  // console.log('clicked');
	});
	
	const lastCallers = [];
	du.on.match('focusout', '.one-entry-cnt', (elem) => {
	  let info = meInfo(elem);
	  if (!lastCallers[info.index]) lastCallers[info.index] = 0;
	  const id = ++lastCallers[info.index];
	  setTimeout(() => {
	    if (id !== lastCallers[info.index]) return;
	    info = meInfo(elem);
	    if (!info.last && !info.inFocus && info.empty) {
	      info.indexCnt.remove()
	      const children = info.multiCnt.children;
	      for (let index = 0; index < children.length; index++) {
	        children[index].setAttribute('index', index);
	      }
	      const list = info.multiInput.list();
	      list.remove(list[info.index]);
	    }
	  }, 2000);
	});
	
	du.on.match('focusin', oneSelector, (elem) => {
	  // console.log('focusin');
	});
	
	du.on.match('keyup:change', oneSelector, (elem) => {
	  if (!isInput(elem)) return;
	  const info = meInfo(elem);
	  if (info.index === info.length - 1 && !info.empty) {
	    const newElem = du.create.element('div', {index: info.index + 1});
	    newElem.innerHTML = info.multiInput.setHtml(info.index + 1);
	    info.multiCnt.append(newElem);
	    console.log('add 1')
	  }
	  // console.log('keyup');
	});
	
	module.exports = MultipleEntries;
	
});


RequireJS.addFunction('../../public/js/utils/input/decision/modification.js',
function (require, exports, module) {
	

	
	const DecisionInputTree = require('./decision');
	const InputInput = require('../decision/input-input.js');
	const Input = require('../input.js');
	const Select = require('../styles/select.js');
	const $t = require('../../$t');
	const du = require('../../dom-utils');
	const Conditions = require('../../conditions');
	
	const modHideAll = du.switch('.modify-edit', 'mod-id');
	
	const hideAll = () => {
	  for (let index = 0; index < all.length; index++) all[index].hidden = true;
	};
	
	const toolCnt = du.create.element('div', {class: 'mod-decision-cnt'});
	toolCnt.innerHTML = new $t('input/decision/decision-modification').render({});
	du.find('body').append(toolCnt);
	
	let targetNodeElem;
	let targetInputElem;
	
	const thenBtn = du.find.down('.then-btn', toolCnt);
	const condBtn = du.find.down('.conditional-btn', toolCnt);
	const editBtn = du.find.down('.edit-btn', toolCnt);
	const addBtn = du.find.down('.add-btn', toolCnt);
	const rmBtn = du.find.down('.remove-btn-cnt>button', toolCnt);
	const closeCntBtn = du.find.down('.decision-tree-mod-cnt>.close-cnts', toolCnt);
	
	const thenCnt = du.find.down('.then-cnt', toolCnt);
	const condCnt = du.find.down('.condition-cnt', toolCnt);
	const editCnt = du.find.down('.edit-cnt', toolCnt);
	const addCnt = du.find.down('.add-cnt', toolCnt);
	
	const thenAddCnt = du.find.down('.decision-tree-mod-cnt>.then-add-cnt', toolCnt);
	const ifEditBtnCnt = du.find.down('.if-edit-cnt', toolCnt);
	const rmCnt = du.find.down('.remove-btn-cnt', toolCnt);
	const rmEditCnt = du.find.down('.rm-edit-cnt', toolCnt);
	
	const all = [closeCntBtn, thenBtn, condBtn, editBtn, addBtn, thenCnt, condCnt, editCnt, addCnt, ifEditBtnCnt, rmCnt, rmEditCnt];
	
	function updateConditionTree(elem) {
	  let input = Input.getFromElem(elem);
	  if (elem !== condBtn && input !== condTarget.input) return;
	  if (elem === condBtn) input = Input.getFromElem(targetInputElem);
	  const conditionCnt = du.find.up('.condition-input-tree', elem);
	  if (conditionCnt) return;
	  const node = condTarget.node;
	  const inputCnt = du.find.up('.decision-input-array-cnt', elem);
	
	  const inputArray = node.payload().inputArray;
	  const val = input.value();
	  const props = {header: `If ${input.name()} <br>`};
	  const condTree = getConditionTree(val, node, input, props);
	  const value = input.value();
	  if ((typeof value) === 'string') {
	    condTree.find.input('condition').setValue(value);
	  }
	  const treeHtml = condTree.html();
	  condCnt.innerHTML = treeHtml;
	}
	
	class ModDecisionTree {
	  constructor(decisionTree) {
	    const treeId = decisionTree.id();
	    const nodeCntSelector = `[tree-id="${treeId}"] .decision-input-cnt`;
	    const inputCntSelector = `[tree-id="${treeId}"] .decision-input-array-cnt>.input-cnt`;
	    const inputSelector = `[tree-id="${treeId}"] .decision-input-array-cnt input, ` +
	                          `[tree-id="${treeId}"] .decision-input-array-cnt select, ` +
	                          `[tree-id="${treeId}"] .decision-input-array-cnt textarea`;
	
	    let active = true;
	    this.on = () => active = true;
	    this.off = () => {
	      hideAll();
	      active = false;
	    }
	    this.toggle = () => active ? this.off() : this.on();
	    this.active = () => active;
	    this.hideAll = hideAll;
	
	    function mouseoverNode(elem) {
	      if (!active) return;
	      if (elem) targetNodeElem = elem;
	      // du.move.relitive(thenBtn, elem, 'topcenter');
	      du.move.relitive(thenAddCnt, elem, 'bottomcenter');
	      du.move.relitive(rmCnt, elem, 'topright');
	      thenBtn.hidden = false;
	      rmCnt.hidden = false;
	      addBtn.hidden = false;
	      rmBtn.hidden = false;
	    }
	    function mouseoverInput(elem) {
	      if (!active) return;
	      ifEditBtnCnt.hidden = false;
	      condBtn.hidden = false;
	      editBtn.hidden = false;
	      du.move.relitive(ifEditBtnCnt, elem, 'leftcenterouter')
	      targetInputElem = elem;
	    }
	
	
	    // function mouseoutNode(elem) {
	    //   if (!active) return;
	    // }
	    // function mouseoutInput(elem) {
	    //   if (!active) return;
	    //   if (!du.is.ancestor(elem, targetInputElem)) {
	    //     ifEditBtnCnt.hidden = true;
	    //   }
	    // }
	    // du.on.match('mouseout', nodeCntSelector, mouseoutNode);
	    // du.on.match('mouseout', inputCntSelector, mouseoutInput);
	
	    du.on.match('mouseover', nodeCntSelector, mouseoverNode);
	    du.on.match('mouseover', inputCntSelector, mouseoverInput);
	    du.on.match('change', inputSelector, (elem) => {
	      elem.matches(inputSelector);
	      setTimeout(() => {
	        updateConditionTree(elem);
	        const targetCnt = rmEditCnt.hidden ? condCnt : rmEditCnt;
	        showCloseButton(targetCnt);
	      });
	    });
	  }
	}
	
	function showCloseButton(elem) {
	  closeCntBtn.hidden = false;
	  du.move.relitive(closeCntBtn, elem, 'righttopouter');
	}
	
	let addTargetNode;
	function showAddInput(elem) {
	  addCnt.hidden = false;
	  addTargetNode = DecisionInputTree.getNode(targetNodeElem);
	  const inputTree = ModDecisionTree.inputTree(addTargetNode);
	  addCnt.innerHTML = inputTree.html();
	  du.move.relitive(addCnt, targetNodeElem, 'bottomcenter');
	  showCloseButton(addCnt);
	  du.move.inbounds(addCnt)
	}
	du.on.match('click', '.add-btn', showAddInput);
	
	function addInput(details, elem)  {
	  const input = InputInput.getInput(details);
	  addTargetNode.addInput(input);
	  DecisionInputTree.rebuild(targetNodeElem);
	  hideAll();
	}
	
	const getCondition = (...args) => DecisionInputTree.getCondition(...args);
	
	function createConditionalNodeFunction(node, input) {
	  return function createNode(values, elem) {
	    const attribute = input.name();
	    const type = `${values.type}Type`;
	    const subType = values[values.type.toCamel()][type.toCamel()];
	    let value = values.condition;
	    if (values.type === 'Number') value = Number.parseFloat(value);
	    if (values.type === 'List') value = value.split(',');
	    const condition = getCondition(attribute, value, subType);
	    console.log(condition.satisfied(node));
	    console.log(condition.satisfied(node));
	    const name = values.group;
	    const newNode = node.then(name, values.payload);
	    node.conditions.add(condition, name);
	    const condCnt = du.find.up('.condition-input-tree', elem);
	    const condBtn = du.find.closest('.conditional-button', condCnt)
	    hideAll();
	    const inputElem = Input.getFromElem(elem)
	    DecisionInputTree.update.children(inputElem);
	  }
	}
	
	function andHandlerInput(node, inputs) {
	  const handlerInput = node.tree().payloadInput();
	  if (handlerInput) inputs = [handlerInput].concat(inputs);
	  return inputs
	}
	
	function conditionalInputTree(node, props) {
	  props ||= {};
	  const group = new Input({
	    name: 'group',
	    label: 'Group',
	    class: 'center',
	  });
	
	  function updateGroupList(node) {
	    if (node._NODE) node = node._NODE;
	    const list = Object.keys(node.tree().stateConfigs());
	    group.list(list);
	    }
	  updateGroupList(node);
	
	  const type = new Select({
	    label: 'Type',
	    name: 'type',
	    class: 'center',
	    list: ['String', 'Number', 'Reference', 'List', 'Regex']
	  });
	
	  const stringType = new Select({
	    name: 'stringType',
	    class: 'center',
	    list: ['Case Insensitive', 'Exact', 'Wild Card', 'Contains', 'Any', 'Except']
	  });
	
	  const numberType = new Select({
	    name: 'numberType',
	    class: 'center',
	    list: ['Equal', 'Less Than', 'Greater Than', 'Less Than or Equal', 'Greater Than or Equal']
	  });
	
	  const referenceType = new Select({
	    name: 'type',
	    class: 'center',
	    list: ['need', 'to', 'dynamically update']
	  });
	
	  const listType = new Select({
	    name: 'listType',
	    class: 'center',
	    list: ['Inclusive', 'Exclusive']
	  });
	
	  const condition = new Input({
	    label: 'Condition',
	    name: 'condition',
	    inline: true,
	    class: 'center',
	    value: props.conditionValue
	  });
	
	  props.inputArray = andHandlerInput(node, [group, type, condition]);
	
	  const tree = new DecisionInputTree(props.treeName, props);
	  const root = tree.root();
	
	  const dic = (value, type) => getCondition('type', value, type);
	  function addTypeNode(name, inputArray, value, type) {
	    const node = root.then(name, {inputArray});
	    root.conditions.add(dic(value, type), name);
	    node.relatedTo('type');
	    return node;
	  }
	
	  addTypeNode('reference', [referenceType], 'Reference');
	  addTypeNode('string', [stringType], 'String')
	  addTypeNode('number', [numberType], 'Number')
	  addTypeNode('list', [listType], 'List')
	
	  tree.onChange(updateGroupList);
	
	  tree.onSubmit(props.onSubmit);
	
	  return tree;
	}
	
	let thenTargetNode;
	const thenInput = (node) => {
	  const group = new Input({
	    name: 'group',
	    label: 'Group',
	    class: 'center',
	  });
	
	  function updateGroupList(node) {
	    if (node._NODE) node = node._NODE;
	    const list = Object.keys(node.tree().stateConfigs());
	    group.list(list);
	  }
	  updateGroupList(node);
	
	  const props = {inputArray: andHandlerInput(node, [group])};
	  const tree = new DecisionInputTree('Node', props);
	  tree.onSubmit((values, elem) => {
	    const name = values.group;
	    const newNode = node.then(name, values.payload);
	    const treeCnt = du.find(`[tree-id='${node.tree().id()}']`);
	    const btnCnt = du.find.closest('.then-button', elem);
	    const inputCnt = du.find.closest('.then-input-tree', btnCnt);
	    hideAll();
	    DecisionInputTree.hardUpdate(treeCnt);
	  });
	  return tree;
	}
	
	du.on.match('click', '.then-btn', (elem, two, three) => {
	  console.log('ThEn?');
	  thenTargetNode = DecisionInputTree.getNode(targetNodeElem);
	  const thenPut = thenInput(thenTargetNode);
	  thenCnt.innerHTML = thenPut.html();
	  thenCnt.hidden = false;
	  du.move.relitive(thenCnt, targetNodeElem, 'bottomcenter');
	  showCloseButton(thenCnt);
	});
	
	const objectKeyFilter = (currObj) => (k) => (currObj[k]._NODE && !currObj.condition) || (k === 'condition' && currObj.condition);
	const valueFilter = (val) => (typeof val) === 'string';
	function getConditionKey(values) {
	  const curr = values['Question Groupy'];
	  let path, attr, lastKey;
	  let currObj = values;
	  while (true) {
	    const validKeys = Object.keys(currObj).filter(objectKeyFilter(currObj));
	    const validPaths = Object.values(currObj).filter(valueFilter);
	    if (validPaths.length !== 1) throw new Error('There should be only one valid path');
	    if (validKeys.length !== 1) throw new Error('There should be only one valid key');
	    key = validKeys[0];
	    currObj = currObj[key];
	    const lastHyphIndex = key.indexOf('-');
	    path = path ? `${path}.${key}` : key;
	    attr = attr ? `${attr}.${validPaths[0]}` : validPaths[0];
	    if (!(currObj.condition instanceof Object) && currObj.condition !== undefined) break;
	  }
	  return {path, attr};
	}
	
	function createCondition(values, node, input) {
	  const pathAttr = getConditionKey(values);
	  const condObj = Object.pathValue(values, pathAttr.path);
	  const value = condObj.condition;
	
	  const attribute = input.name()+'.'+pathAttr.attr;
	  const type = `${condObj.type}Type`;
	  const subType = condObj[condObj.type.toCamel()][type.toCamel()];
	  let condValue = condObj.condition;
	  if (condObj.type === 'Number') condValue = Number.parseFloat(condValue);
	  if (condObj.type === 'List') condValue = condValue.split(',');
	  const cond = getCondition(attribute, condValue, subType);
	
	  const childName = String.random();
	  const child = node.then(condObj.group);
	  node.conditions.add(cond, condObj.group);
	
	  DecisionInputTree.update()(targetInputElem);
	  hideAll();
	}
	
	function processObject (select, key, node, object, targetNode, conditions, path) {
	  const child = node.then(path);
	  const type = key === '*' ? 'exact' : undefined;
	  const cond = getCondition(select.name(), key, type);
	  const childConds = conditions.clone();
	  childConds.add(cond);
	  node.conditions.add(cond, path);
	  addObjectKeys(child, object, targetNode, childConds, path);
	}
	
	function proccessValue (select, key, node, value, targetNode, conditions, path) {
	  let child = node.stateMap()[key];
	  if (child === undefined) {
	    const childConds = conditions.clone();
	      const type = key === '*' ? 'exact' : undefined;
	      const props = {treeName: path, conditionValue: value};
	      const condInputTree = conditionalInputTree(targetNode, props);
	      child = node.then(condInputTree.root());
	      const cond = getCondition(select.name(), key, type);
	      childConds.add(cond);
	      node.conditions.add(childConds, path);
	   }
	}
	
	const DEF_COND = 'DEFINE CONDITION';
	function superObject(object) {
	  const superObj = {};
	  const keys = Object.keys(object);
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const value = object[key];
	    if (value instanceof Object) {
	      superObj[key] = superObject(value);
	      if (superObj['*']) Object.merge(superObj['*'], superObject(value), true)
	      else superObj['*'] = superObject(value);
	      superObj[DEF_COND] = '';
	    } else {
	      superObj['*'] = '';
	      superObj[key] = value;
	    }
	  }
	  return superObj;
	}
	
	const objectKeySorter = (key1, key2) => {
	  if (key1 === DEF_COND) return -1;
	  if (key2 === DEF_COND) return 0;
	  if (key1 === '*') return -1;
	  if (key2 === '*') return 0;
	  return key1 - key2;
	}
	
	function addObjectKeys(node, object, targetNode, conditions, path) {
	  if (conditions === undefined) object = superObject(object);
	
	  conditions ||= new Conditions.And([]);
	  const keys = [].concat(Object.keys(object));
	  const list = [];
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const value = object[key];
	    list.push(key);
	  }
	  list.sort(objectKeySorter);
	  const select = new Select({name: node.name(), list})
	  node.addInput(select);
	  const paths = {};
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    let currPath = path ? path + '-' + key : key;
	    const value = object[key];
	    const runObject = value instanceof Object;
	    const runValue = !runObject;
	    if (runObject) processObject(select, key, node, value, targetNode, conditions, currPath);
	    if (runValue) proccessValue(select, key, node, value, targetNode, conditions, currPath);
	  }
	  return keys;
	}
	
	function objectConditionTree(values, node, input, props) {
	  const tree = new DecisionInputTree(props.treeName, props);
	  addObjectKeys(tree.root(), values, node);
	  tree.onSubmit((values) => createCondition(values, node, input));
	  return tree;
	}
	
	function getConditionTree(values, node, input, props) {
	  if (values instanceof Object)
	    return objectConditionTree(values, node, input, props);
	  props ||= {};
	  props.treeName = 'Question Groupy';
	  props.onSubmit = createConditionalNodeFunction(node, input);
	  props.conditionValue = input.value();
	  return conditionalInputTree(node, props);
	}
	
	const condTarget = {};
	function condBtnPressed(elem) {
	  condTarget.node = DecisionInputTree.getNode(targetNodeElem);
	  condTarget.input = Input.getFromElem(targetInputElem);;
	  const inputTreeCnt = updateConditionTree(elem);
	  condCnt.hidden = false;
	  du.move.relitive(condCnt, targetInputElem, 'bottomcenterouter');
	  showCloseButton(condCnt);
	}
	
	function removeNodeBtnPressed(elem) {
	  const node = DecisionInputTree.getNode(targetNodeElem);
	  if (confirm(`Are you sure you want to remove node '${node.name()}'`) == true) {
	    node.remove();
	    const treeCnt = du.find(`[tree-id='${node.tree().id()}']`);
	    DecisionInputTree.hardUpdate(treeCnt);
	  }
	  hideAll();
	}
	
	du.on.match('click', '.conditional-btn', condBtnPressed);
	du.on.match('click', '.remove-btn-cnt>.rm-node', removeNodeBtnPressed);
	
	
	
	ModDecisionTree.inputTree = function (node, noSubmission) {
	  const targetTree = node.tree();
	  const nameVal = (value) => {
	    if (value === '') return false;
	    const camel = value.toCamel();
	    const inputs = node.payload().inputArray;
	    for (let index = 0; index < inputs.length; index++) {
	      if (inputs[index].name() === camel) return false;
	    }
	    return node.stateNames().indexOf(camel) === -1;
	  }
	
	  const tree = new InputInput({noSubmission, class: 'modify',
	                  validation: {name: nameVal}});
	  const root = tree.root();
	
	
	
	  tree.onSubmit(addInput);
	  tree.clone = () => DecisionInputTree.inputTree(node, noSubmission);
	  tree.empty = () => {
	    let empty = true;
	    tree.root().forEach((node) =>
	      node.payload().inputArray.forEach(input => empty &&= input.empty()));
	    return empty;
	  }
	  return tree;
	}
	
	
	const editTargets = {};
	du.on.match('click', '.edit-btn', (elem) => {
	  editTargets.input = Input.getFromElem(targetInputElem);
	  editTargets.node = DecisionInputTree.getNode(targetNodeElem);
	  editCnt.hidden = false;
	  editCnt.innerHTML = editTargets.input.editHtml();
	  du.move.relitive(rmEditCnt, targetInputElem, 'bottomcenterouter')
	  showCloseButton(editCnt);
	});
	
	du.on.match('click', '.modiy-rm-input-btn', (elem) => {
	  const inputIdElem = du.find.closest('[input-ref-id', elem);
	  editTargets.node.removeInput(editTargets.input.name());
	  DecisionInputTree.hardUpdate(targetInputElem.parentElement);
	  hideAll();
	});
	
	du.on.match('click', '.decision-tree-mod-cnt>.close-cnts', hideAll);
	
	
	
	module.exports = ModDecisionTree;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/object.js',
function (require, exports, module) {
	
const $t = require('../../$t');
	const du = require('../../dom-utils');
	const CustomEvent = require('../../custom-event');
	const Input = require('../input');
	
	class InputObject extends Input {
	  constructor(props) {
	    super(props);
	    Object.getSet(this);
	    const instance = this;
	    const optionalConfig = [];
	    props.list.forEach(input => optionalConfig.push(input.optional()));
	
	
	    this.value = () => {
	      const values = {};
	      props.list.forEach(input => input.validation() && (values[input.name()] = input.value()));
	      return values;
	    }
	
	    const dynamicEvent = CustomEvent.dynamic();
	    this.on = dynamicEvent.on;
	
	    function triggerEvent(value, input, event) {
	      dynamicEvent.trigger(event, {value, input});
	    }
	    props.list.forEach(input => input.on('change:click:keyup', triggerEvent));
	
	    this.setValue = () => {
	      throw new Error('This function should never get called');
	    }
	
	    this.valid = () => {
	      if (this.optional()) return true;
	      let valid = true;
	      props.list.forEach(input => valid &&= input.optional() || input.valid());
	      return valid;
	    }
	
	    let optional;
	    this.optional = (value) => {
	      if (value !== true && value !== false) return optional;
	      optional = value;
	      if (optional)
	        props.list.forEach(input => input.optional(true));
	      else
	        props.list.forEach((input, index) => input.optional(optionalConfig[index]));
	    }
	    this.optional(props.optional || false);
	
	    this.clone = (properties) => {
	      const json = this.toJson();
	      json.validation = (properties || props).validation;
	      json.list.forEach(i => delete i.id);
	      Object.set(json, properties);
	      return InputObject.fromJson(json);
	    }
	
	    this.empty = () => {
	      for (let index = 0; index < props.list.length; index++) {
	        if (!props.list[index].empty()) return false
	      }
	      return true;
	    }
	
	  }
	}
	
	InputObject.fromJson = (json) => {
	  json.list = Object.fromJson(json.list);
	  return new InputObject(json);
	}
	
	InputObject.template = new $t('input/object');
	InputObject.html = (instance) => () => InputObject.template.render(instance);
	
	
	
	module.exports = InputObject;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/radio.js',
function (require, exports, module) {
	
const Input = require('../input');
	const $t = require('../../$t');
	const du = require('../../dom-utils');
	
	class Radio extends Input {
	  constructor(props) {
	    super(props);
	    if (props.list === undefined) throw new Error('Radio Input is useless without a list of possible values');
	    const isArray = Array.isArray(props.list);
	    let value;
	    if (isArray) {
	      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
	    } else {
	      const key = Object.keys(props.list)[0];
	      value = props.value || key;
	    }
	    props.value = undefined;
	
	    this.setValue(value);
	    this.isArray = () => isArray;
	    const uniqueName = String.random();
	    this.uniqueName = () => uniqueName;//`${this.name()}-${this.id()}`
	    this.list = () => props.list;
	    this.description = () => props.description;
	
	    this.getValue = (val) => {
	      return this.setValue();
	    }
	    const parentSetVal = this.setValue;
	    this.setValue = (val) => {
	      const initialVal = value;
	      const all = du.find.all(`[name='${this.uniqueName()}']`);
	      for (let index = 0; index < all.length; index++) {
	        const input = all[index];
	        if (input.value === val || input.checked) {
	          value = input.value;
	        }
	      }
	      // if (initialVal !== value) this.trigger('change');
	      return value;
	    }
	
	    const parentHidden = this.hidden;
	    this.hidden = () => props.list.length < 2 || parentHidden();
	
	    this.selected = (value) => value === this.value();
	
	    du.on.match('change', `#${this.id()}`, (elem) => {
	      this.setValue(elem.value);
	    });
	  }
	}
	
	Radio.template = new $t('input/radio');
	Radio.html = (instance) => () => Radio.template.render(instance);
	
	Radio.yes_no = (props) => (props.list = ['Yes', 'No']) && new Radio(props);
	Radio.true_false = (props) => (props.list = ['True', 'False']) && new Radio(props);
	
	module.exports = Radio;
	
});


RequireJS.addFunction('../../public/js/utils/input/decision/payload-handler.js',
function (require, exports, module) {
	
const $t = require('../../$t');
	const InputObject = require('../styles/object');
	
	class PayloadHandler {
	  constructor(templateName, ...inputs) {
	    Object.getSet(this, {templateName, inputs});
	    const template = new $t(this.templateName());
	
	    this.html = (payload) =>
	      template.render(payload);
	    this.input = () => new InputObject({name: 'payload', list: inputs});
	    this.toJson = () => ({inputs: Object.toJson(inputs), templateName});
	  }
	}
	
	module.exports = PayloadHandler;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/select.js',
function (require, exports, module) {
	

	
	
	
	const Input = require('../input');
	const $t = require('../../$t');
	
	class Select extends Input {
	  constructor(props) {
	    props ||= {};
	    super(props);
	    if (props.list === undefined) props.list = [];
	    const isArray = Array.isArray(props.list);
	    let value;
	    if (isArray) {
	      value = props.index && props.list[props.index] ?
	      props.list[props.index] : props.list[0];
	      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
	    } else {
	      const key = Object.keys(props.list)[0];
	      value = props.value || key;
	    }
	    props.value = undefined;
	    this.setValue(value);
	    this.isArray = () => isArray;
	    this.list = () => props.list;
	    const parentValue = this.value;
	    this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
	    const parentHidden = this.hidden;
	    this.hidden = () => props.list.length < 2 || parentHidden();
	
	    this.empty = () => true;
	    this.selected = (value) => value === this.value();
	  }
	}
	
	new Select();
	Select.template = new $t('input/select');
	Select.html = (instance) => () => Select.template.render(instance);
	
	module.exports = Select;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/table.js',
function (require, exports, module) {
	
const Input = require('../input');
	const Radio = require('../styles/radio');
	const MultipleEntries = require('../styles/multiple-entries');
	const $t = require('../../$t');
	const du = require('../../dom-utils');
	
	tableInputNameFunc = (id, rIndex, cIndex) => `table-${id}-${rIndex}-${cIndex}`;
	
	class Table extends Input {
	  constructor(props) {
	    super(props);
	
	    let inputs = [];
	    props.type ||= 'radio';
	    if (props.type === 'radio') return new RadioTable(props);
	    // for (let rIndex = 0; rIndex < props.rows.length; rIndex++) {
	    //   inputs[rIndex] = [];
	    //   let nameFunc = tableInputNameFunc;
	    //   if (props.type === 'radio') {
	    //     const uniqueId = String.random();
	    //     nameFunc = () => uniqueId;
	    //   } else {
	    //     const row = props.rows[rIndex];
	    //     for (let cIndex = 0; cIndex < props.columns.length; cIndex++) {
	    //       const column = props.columns[cIndex];
	    //       let input;
	    //       if (column instanceof Input) input = column.clone();
	    //       else input = new Input({type: props.type});
	    //       input.name(nameFunc(this.id(), rIndex, cIndex));
	    //       const clone = input.clone();
	    //       clone.label('');
	    //       if (props.value) clone.value(props.value[row][input.name()]);
	    //       inputs[rIndex].push(clone);
	    //     }
	    //   }
	    // }
	
	    this.value = () => {
	      const values = {};
	      const rows = this.rows();
	      const cols = this.columnNames();
	      for (let rIndex = 0; rIndex < inputs.length; rIndex++) {
	        const column = inputs[rIndex];
	        const row = rows[rIndex];
	        values[row] = {};
	        for (let cIndex = 0; cIndex < column.length; cIndex++) {
	          let input = column[cIndex];
	          values[row][cols[cIndex]] = input.value();
	        }
	      }
	      return values;
	    }
	
	
	    props.value = undefined;
	    this.list = () => props.columns;
	    this.columns = (rowIndex) => rowIndex === undefined ?
	                        props.columns : inputs[rowIndex];
	    this.setColumns = (cols, values) => {
	      const defineColumns = Array.isArray(cols);
	      cols ||= props.columns;
	      if (defineColumns) inputs = [];
	      for (let rIndex = 0; rIndex < props.rows.length; rIndex++) {
	        inputs[rIndex] ||= [];
	        let nameFunc = tableInputNameFunc;
	        const row = props.rows[rIndex];
	        for (let cIndex = 0; cIndex < cols.length; cIndex++) {
	          const column = cols[cIndex];
	          let input;
	          if (defineColumns) {
	            if (column instanceof Input) {
	              input = column.clone();
	              props.columns[cIndex] = input;
	            } else {
	              input = new Input({type: props.type});
	              if ((typeof column) === 'function') {
	                console.log('func');
	              }
	              props.columns[cIndex] = column;
	            }
	          } else input = props.columns[cIndex];
	          if (inputs[rIndex][cIndex] === undefined) {
	            input.name(nameFunc(this.id(), rIndex, cIndex));
	            const clone = input.clone();
	            clone.label('');
	            if (values) clone.value(values[row][input.name()]);
	            inputs[rIndex].push(clone);
	          }
	        }
	      }
	    }
	    this.setRows = (rows) => {
	      if (Array.isArray(props.rows)) props.rows = rows;
	    }
	
	    this.columnNames = () => {
	      const names = [];
	      for (let index = 0; index < props.columns.length; index++) {
	        const col = props.columns[index];
	        if (col instanceof Input) names.push(col.label() || col.name());
	        else names.push(col);
	      }
	      return names;
	    }
	    this.rows = () => props.rows;
	    this.description = () => props.description;
	    // const parentValue = this.value;
	    // this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
	
	    this.selected = (value) => value === this.value();
	
	    this.setColumns(props.columns, props.value);
	  }
	}
	
	Table.fromJson = (json) => {
	  const columns = Object.fromJson(json.columns);
	  json.columns = columns;
	  return new Table(json);
	}
	
	Table.template = new $t('input/table');
	Table.html = (instance) => () => Table.template.render(instance);
	
	
	class RadioTable extends Input {
	  constructor(props) {
	    super(props);
	    let _rows = {};
	    const rowName = (index) => `${this.id()}-${props.rows[index].toCamel()}`;
	    props.type = 'radio';
	
	    function buildRows(values) {
	      _rows = {};
	      for (let rIndex = 0; rIndex < props.rows.length; rIndex++) {
	        const list = props.columns.copy();
	        const label = props.rows[rIndex];
	        const name = rowName(rIndex);
	        const key = label.toCamel();
	        const value = values && values[key] ? props.value[key] :
	                (_rows[key] ? _rows[key].value : list[0]);
	        _rows[key] = {name, label, value, key};
	      }
	    }
	    buildRows(props.value);
	
	    this.value = () => {
	      const values = {};
	      for (let index = 0; index < props.rows.length; index++) {
	        const key = props.rows[index].toCamel();
	        values[key] = _rows[key].value;
	      }
	      return values;
	    }
	
	    this.columns = () => props.columns;
	    this.setColumns = (cols) => {
	      if (Array.isArray(cols)) props.columns = cols;
	      buildRows();
	    }
	    this.setRows = (rows) => {
	      if (Array.isArray(rows)) props.rows = rows;
	      buildRows();
	    }
	    props.value = undefined;
	    this.setValue = (elem) => {
	      if (elem instanceof HTMLElement)
	        return _rows[elem.getAttribute('key')].value = elem.value;
	      console.log('OBJECT!');
	    }
	    this.list = () => _rows;
	    this.rowDetail = () => Object.values(_rows);
	    this.rows = () => props.rows;
	    this.description = () => props.description;
	  }
	}
	
	du.on.match('change', '.radio-table-input-cnt>input', (elem) => {
	  Input.getFromElem(elem).setValue(elem);
	});
	
	Object.class.register(RadioTable);
	RadioTable.template = new $t('input/radio-table');
	RadioTable.html = (instance) => () => RadioTable.template.render(instance);
	RadioTable.editHtml = Table.editHtml;
	
	Table.Radio = RadioTable;
	
	module.exports = Table;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/textarea.js',
function (require, exports, module) {
	
const Input = require('../input');
	const $t = require('../../$t');
	
	class Textarea extends Input {
	  constructor(props) {
	    super(props);
	    Object.getSet(this);
	  }
	}
	
	Textarea.template = new $t('input/textarea');
	Textarea.html = (instance) => () => Textarea.template.render(instance);
	
	module.exports = Textarea;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/select/relation.js',
function (require, exports, module) {
	

	
	const StringMathEvaluator = require('../../../string-math-evaluator.js');
	const Select = require('../select.js');
	
	class RelationInput {
	  constructor(name, searchFunc) {
	    if (RelationInput.relationsObjs[name] !== undefined) throw new Error('Relation Inputs must have a unique name.');
	    this.eval = function(list, value) {
	      let minDiff = Number.MAX_SAFE_INTEGER;
	      let winner;
	
	      if (!Array.isArray(list)) return undefined;
	      for(let index = 0; index < list.length; index += 1) {
	        const evalVal = this.constructor.evaluator.eval(list[index]);
	        const diff =  searchFunc(value, evalVal);
	        if (diff >= 0 && diff < minDiff) {
	          minDiff = diff;
	          winner = index;
	        }
	      }
	      return winner;
	    };
	    RelationInput.relationsObjs[RelationInput.toPascalCase(name)] = this;
	    RelationInput.relations.push(name);
	    RelationInput.relations
	        .sort((a, b) => a.length > b.length ? 1 : -1);
	  }
	}
	
	RelationInput.relationsObjs = {};
	RelationInput.relations = [];
	RelationInput.toPascalCase = (str) => new String(str).replace(/ /g, '_').toUpperCase();
	
	RelationInput.evaluator = new StringMathEvaluator(Math);
	RelationInput.eval = (name, list, value) => {
	  const relation = RelationInput.relationsObjs[RelationInput.toPascalCase(name)];
	  return relation ? relation.eval(list, value) : undefined;
	}
	
	new RelationInput('Equal', (a, b) => a !== b ? -1 : 0);
	new RelationInput('Greater Than', (a, b) => a >= b ? -1 : b - a);
	new RelationInput('Greater Than Or Equal', (a, b) => a > b ? -1 : b - a);
	new RelationInput('Less Than', (a, b) => a <= b ? -1 : a - b);
	new RelationInput('Less Than Or Equal', (a, b) => a < b ? -1 : a - b);
	
	RelationInput.selector = new Select({name: 'relation',
	                            value: 'Equal',
	                            list: RelationInput.relations,
	                            label: 'Auto Select Relation'});
	
	module.exports = RelationInput;
	
	
	
	
	
});


RequireJS.addFunction('../../public/js/utils/test/test.js',
function (require, exports, module) {
	

	
	
	
	Error.stackInfo = (steps) => {
	  steps = steps || 1;
	  const err = new Error();
	  const lines = err.stack.split('\n');
	  const match = lines[steps].match(/at (([a-zA-Z\.]*?) |)(.*\.js):([0-9]{1,}):([0-9]{1,})/);;
	  if (match) {
	    return {
	      filename: match[3].replace(/^\(/, ''),
	      function: match[2],
	      line: match[4],
	      character: match[5]
	    }
	  }
	}
	
	Error.reducedStack = (msg, steps) => {
	  steps = steps || 1;
	  const err = new Error();
	  let lines = err.stack.split('\n');
	  lines = lines.splice(steps);
	  return `Error: ${msg}\n${lines.join('\n')}`;
	}
	
	class ArgumentAttributeTest {
	  constructor(argIndex, value, name, errorCode, errorAttribute) {
	    function fail (ts, func, actualErrorCode, args) {
	      ts.fail('AttributeTest Failed: use null if test was supposed to succeed' +
	      `\n\tFunction: '${func.name}'` +
	      `\n\tArgument Index: '${argIndex}'` +
	      `\n\tName: '${name}'` +
	      `\n\tValue: '${value}'` +
	      `\n\tErrorCode: '${actualErrorCode}' !== '${errorCode}'`);
	    }
	
	    this.run = function (ts, func, args, thiz) {
	      thiz = thiz || null;
	      const testArgs = [];
	      for (let index = 0; index < args.length; index += 1) {
	        const obj = args[index];
	        let arg;
	        if (index === argIndex) {
	          if (name) {
	            arg = JSON.parse(JSON.stringify(obj));
	            arg[name] = value;
	          } else {
	            arg = value;
	          }
	        }
	        testArgs.push(arg);
	      }
	      try {
	        func.apply(thiz, testArgs)
	        if (errorCode || errorCode !== null) fail(ts, func, null, arguments);
	      } catch (e) {
	        errorAttribute = errorAttribute || 'errorCode';
	        const actualErrorCode = e[errorAttribute];
	        if (errorCode !== undefined &&
	              (errorCode === null || actualErrorCode !== errorCode))
	          fail(ts, func, actualErrorCode, arguments);
	      }
	    }
	  }
	}
	
	class FunctionArgumentTestError extends Error {
	  constructor(argIndex, errorAttribute) {
	    super();
	    this.message = 'errorCode should be null if no error thrown and undefined if no errorCode';
	    if (argIndex === undefined) {
	      this.message += '\n\targIndex must be defined.';
	    }
	    if (errorAttribute === undefined) {
	      this.message += '\n\terrorAttribute must be defined.';
	    }
	  }
	}
	
	const failureError = new Error('Test Failed');
	
	class FunctionArgumentTest {
	  constructor(ts, func, args, thiz) {
	    if (!(ts instanceof TestStatus))
	      throw new Error('ts must be a valid instance of TestStatus');
	    if ((typeof func) !== 'function')
	      throw new Error("Function must be defined and of type 'function'");
	    if (!Array.isArray(args) || args.length === 0)
	      throw new Error("This is not a suitable test for a function without arguments");
	    const funcArgTests = [];
	    let argIndex, errorCode;
	    let errorAttribute = 'errorCode';
	    this.setIndex = (i) => {argIndex = i; return this;}
	    this.setErrorCode = (ec) => {errorCode = ec; return this;}
	    this.setErrorAttribute = (ea) => {errorAttribute = ea; return this};
	    const hasErrorCode =  errorCode !== undefined;
	    this.run = () => {
	      funcArgTests.forEach((fat) => {
	        fat.run(ts, func, args, thiz);
	      });
	      return this;
	    }
	    this.add = (name, value) =>  {
	      if (errorAttribute === undefined || argIndex === undefined)
	        throw new FunctionArgumentTestError(argIndex, errorAttribute);
	      const at = new ArgumentAttributeTest(argIndex, value, name, errorCode, errorAttribute);
	      funcArgTests.push(at);
	      return this;
	    }
	  }
	}
	
	function round(value, accuracy) {
	  if (accuracy === undefined) return value;
	  return Math.round(value * accuracy) / accuracy;
	}
	// ts for short
	class TestStatus {
	  constructor(testName) {
	    let assertT = 0;
	    let assertC = 0;
	    let success = false;
	    let fail = false;
	    let failOnError = true;
	    let instance = this;
	
	    this.failed = () => fail;
	    this.succeed = () => success;
	    this.name = () => testName;
	
	    let cleanUp;
	    this.onCleanUp = (func) => cleanUp = func;
	    this.cleanUp = () => (typeof cleanUp) === 'function' && cleanUp(this);
	
	    function printError(msg, stackOffset) {
	      stackOffset = stackOffset || 4;
	      console.error(`%c${Error.reducedStack(msg, stackOffset)}`, 'color: red');
	    }
	    function assert(b) {
	      assertT++;
	      if (b === true) {
	        assertC++;
	        TestStatus.successAssertions++;
	        return true;
	      }
	      TestStatus.failAssertions++;
	      return false;
	    }
	    function successStr(msg) {
	      console.log(`%c ${testName} - Successfull (${assertC}/${assertT})${
	          msg ? `\n\t\t${msg}` : ''}`, 'color: green');
	    }
	    const possiblyFail = (msg) => failOnError ? instance.fail(msg, 6) : printError(msg, 5);
	
	    this.assertTrue = (b, msg) => assert(b) ||
	                            possiblyFail(`${msg}\n\t\t'${b}' should be true`);
	    this.assertFalse = (b, msg) => assert(b === false) ||
	                            possiblyFail(`${msg}\n\t\t'${b}' should be false`);
	    this.assertEquals = (a, b, msg, acc) => assert(round(a, acc) === round(b, acc)) ||
	                            possiblyFail(`${msg}\n\t\t'${a}' === '${b}' should be true`);
	    this.assertNotEquals = (a, b, msg, acc) => assert(round(a, acc) !== round(b, acc)) ||
	                            possiblyFail(`${msg}\n\t\t'${a}' !== '${b}' should be true`);
	    this.assertTolerance = (n1, n2, tol, msg, stackOffset) => {
	      return assert(Math.abs(n1-n2) < tol) ||
	      possiblyFail(`${msg}\n\t\t${n1} and ${n2} are not within tolerance ${tol}`, stackOffset);
	    }
	    this.fail = (msg, stackOffset) => {
	      fail = true;
	      printError(msg, stackOffset);
	      Test.reportIn(this);
	      throw failureError;
	    };
	    this.success = (msg, stackOffset) => {
	      success = true;
	      Test.reportIn(this);
	      return successStr(msg, stackOffset);
	    }
	  }
	}
	
	TestStatus.successCount = 0;
	TestStatus.failCount = 0;
	TestStatus.successAssertions = 0;
	TestStatus.failAssertions = 0;
	
	const ran = {};
	const Test = {
	  tests: {},
	  add: (name, func) => {
	    if ((typeof func) === 'function') {
	      if (Test.tests[name] ===  undefined) Test.tests[name] = [];
	      Test.tests[name].push(func);
	    }
	  },
	  list: () => Object.keys(Test.tests),
	  count: () => Test.list().length,
	  run: () => {
	    const testNames = Object.keys(Test.tests);
	    for (let index = 0; index < testNames.length; index += 1) {
	      const testName = testNames[index];
	      if (!ran[testName]) {
	        try {
	          Test.tests[testName].forEach((testFunc) => {
	            const ts = new TestStatus(testName);
	            const isAsync = testFunc.constructor.name === "AsyncFunction";
	            if (isAsync) {
	              testFunc(ts).then(() => {}, (e) => ts.fail(e));
	            } else {
	              testFunc(new TestStatus(testName));
	            }
	          });
	        } catch (e) {
	          if (e !== failureError) try {ts.fail(e);} catch(e) {}
	        }
	        ran[testName] = true;
	      }
	    }
	  },
	  results: () => ({
	    tests: {
	      success: TestStatus.successCount,
	      failed: TestStatus.failCount
	    },
	    asserts: {
	      success: TestStatus.successAssertions,
	      failed: TestStatus.failAssertions
	    }
	  }),
	  printResults: (imPending) => {
	    if (imPending !== true && pending) return;
	    const res = Test.results();
	    if (Object.equals(res, lastResults)) {
	      pending = false;
	      const failedColor = (res.tests.failed + res.asserts.failed) > 0 ? 'color:red' : 'color:green';
	      console.log(`\n%c Successfull Tests:${res.tests.success} Successful Assertions: ${res.asserts.success}`, 'color: green');
	      console.log(`%c Failed Tests:${res.tests.failed} Failed Assertions: ${res.asserts.failed}`, failedColor);
	    } else {
	      pending = true;
	      lastResults = res;
	      setTimeout(() => Test.printResults(true), 1000);
	    }
	  },
	  allReportsIn: () => {
	    const ranNames = Object.keys(ran).sort();
	    const reportNames = Object.keys(reported).sort();
	    return ranNames.equals(reportNames);
	  },
	  reportIn: (ts) => {
	    if (reported[ts.name()]) throw new Error(`Test: '${ts.name()}' is double reporting.\n\t\tonly one call should be made to fail || success`);
	    if (ts.failed() || !ts.succeed()) TestStatus.failCount++;
	    else TestStatus.successCount++;
	    Test.printResults();
	    ts.cleanUp();
	    //runCollectiveCleanup(); ... implement
	  }
	}
	let lastResults;
	let pending = false;
	let reported = {};
	
	exports.ArgumentAttributeTest = ArgumentAttributeTest;
	exports.FunctionArgumentTestError = FunctionArgumentTestError;
	exports.FunctionArgumentTest = FunctionArgumentTest;
	exports.TestStatus = TestStatus;
	exports.Test = Test;
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/compress-string.js',
function (require, exports, module) {
	
const Test = require('../test.js').Test;
	const CompressedString = require('../../object/compressed-string.js');
	
	Test.add('Imposter: fooled me',(ts) => {
	  // let str = 'one, two,threefour,one,twothree,four';
	  let str = 'one,one,one,one,one,one,one,one,one,one,';
	  let noWhiteSpace = JSON.stringify(JSON.parse(cabStr));
	  let cStr = new CompressedString(cabStr);
	  let rebuilt = CompressedString.fromString(cStr.toString())
	  ts.assertTrue(cabStr === rebuilt);
	
	  ts.success();
	});
	
	
	
	
	let cabStr = `{"_TYPE":"Order","name":"peaches","id":"2wyrbg706jiqej59e4ck5u7h4hlz2o4q","rooms":{"z8qv04z":{"_TYPE":"Room","id":"Room_pqljrlaaazxgvjx9adwhe950vkbmh5ns","ID_ATTRIBUTE":"id","name":"peach","layout":{"verticies":[{"_TYPE":"Vertex2D","id":"Vertex2D_q924g8f","ID_ATTRIBUTE":"id","point":{"x":500,"y":0},"prevLine":"Wall2D_t4dprm3","nextLine":"Wall2D_tkgqjbx"},{"_TYPE":"Vertex2D","id":"Vertex2D_qpfc4z7","ID_ATTRIBUTE":"id","point":{"x":500,"y":500},"prevLine":"Wall2D_tkgqjbx","nextLine":"Wall2D_edw3c2w"},{"_TYPE":"Vertex2D","id":"Vertex2D_s9zy2l5","ID_ATTRIBUTE":"id","point":{"x":0,"y":500},"prevLine":"Wall2D_edw3c2w","nextLine":"Wall2D_bmdk6tv"},{"_TYPE":"Vertex2D","id":"Vertex2D_xfdbd47","ID_ATTRIBUTE":"id","point":{"x":0,"y":0},"prevLine":"Wall2D_bmdk6tv","nextLine":"Wall2D_t4dprm3"}],"walls":[{"_TYPE":"Wall2D","id":"Wall2D_bmdk6tv","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_edw3c2w","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_t4dprm3","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_tkgqjbx","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]}],"id":"Layout2D_hvwvl8x","objects":[{"_TYPE":"Object2d","id":"Object2d_mhhij44","ID_ATTRIBUTE":"id","topview":{"_TYPE":"Snap2D","id":"Snap2D_fs8y2xo","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_fs8y2xo","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"bottomView":{"_TYPE":"Snap2D","id":"Snap2D_owpui4e","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_owpui4e","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"leftview":{"_TYPE":"Snap2D","id":"Snap2D_7x9e6cl","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_7x9e6cl","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"rightview":{"_TYPE":"Snap2D","id":"Snap2D_88fkq0n","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_88fkq0n","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"frontview":{"_TYPE":"Snap2D","id":"Snap2D_h6o6yjc","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_h6o6yjc","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"backView":{"_TYPE":"Snap2D","id":"Snap2D_d03rlan","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_d03rlan","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"}}],"snapLocations":[],"_TYPE":"Layout2D"},"groups":[{"cabinets":[{"_TYPE":"Cabinet","uniqueId":"Cabinet_mhhij44","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"c","partName":"standard","values":{"brh":"tkb.w + pback.t + brr","innerWidth":"c.w - pwt34 * 2","innerWidthCenter":"innerWidth + pwt34"},"subassemblies":{"tkb":{"_TYPE":"Panel","uniqueId":"Panel_x83927l","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,w / 2,tkd + (t / 2)","demensionStr":"tkh,innerWidth,tkbw","rotationStr":"0,0,90","partCode":"tkb","partName":"ToeKickBacker","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pr":{"_TYPE":"Panel","uniqueId":"Panel_texde2a","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w - (pr.t / 2),l / 2,(w / 2)","demensionStr":"c.t,c.l,pwt34","rotationStr":"0,90,0","partCode":"pr","partName":"Right","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pl":{"_TYPE":"Panel","uniqueId":"Panel_b00prhm","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"(t / 2), l / 2, (w/2)","demensionStr":"c.t,c.l,pwt34","rotationStr":"0,90,0","partCode":"pl","partName":"Left","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pback":{"_TYPE":"Panel","uniqueId":"Panel_9tnsq6m","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"l / 2 + pl.t, (w / 2) + tkb.w, c.t - (t / 2)","demensionStr":"c.l - tkb.w,innerWidth,pwt34","rotationStr":"0,0,90","partCode":"pback","partName":"Back","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pb":{"_TYPE":"Panel","uniqueId":"Panel_pg8v93d","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,tkh + (t/2),w / 2","demensionStr":"c.t - pback.t,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pb","partName":"Bottom","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pt":{"_TYPE":"Panel","uniqueId":"Panel_8m0m4bs","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,c.h - pwt34/2,(w / 2)","demensionStr":"(c.t - pback.t) * .2,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pt","partName":"Top","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pt2":{"_TYPE":"Panel","uniqueId":"Panel_6b24fe2","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,c.h - pwt34/2,c.t - pback.t - (w / 2)","demensionStr":"(c.t - pback.t) * .2,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pt2","partName":"Top2","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"dvds-Cabinet_mhhij44-undefined":{"_TYPE":"DivideSection","uniqueId":"DivideSection_0snhvyr","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"dvds-Cabinet_mhhij44-undefined","partName":"divideSection","values":{"vertical":true},"subassemblies":[{"_TYPE":"DivideSection","uniqueId":"DivideSection_dv6snbe","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"dvds-DivideSection_0snhvyr-0","partName":"divideSection","values":{"vertical":true},"subassemblies":[],"joints":[],"index":0,"pattern":{"values":{"a":118.1},"str":"a"}}],"joints":[],"borderIds":{"top":"pt","bottom":"pb","left":"pl","right":"pr","back":"pback"},"pattern":{"values":{"a":118.1},"str":"a"}}},"joints":[{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pt","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pt","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pt2","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pt2","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pback","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pback","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"tkb","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"tkb","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pb","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pb","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"tkb","femalePartCode":"pb","demensionAxis":"x","centerAxis":"+y"}],"length":60.96,"width":127,"thickness":53.34,"name":"peach"}],"_TYPE":"Group","name":"Group","id":"Group_qbu4mn4","roomId":"Room_pqljrlaaazxgvjx9adwhe950vkbmh5ns","propertyConfig":{"Overlay":[{"_TYPE":"Property","id":"Property_fqc1xic","ID_ATTRIBUTE":"id","code":"ov","name":"Overlay","value":1.27,"properties":{"value":1.27,"clone":true}}],"Reveal":[{"_TYPE":"Property","id":"Property_tfwxb8o","ID_ATTRIBUTE":"id","code":"r","name":"Reveal","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_4fhky4n","ID_ATTRIBUTE":"id","code":"rvt","name":"Reveal Top","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_20cebvv","ID_ATTRIBUTE":"id","code":"rvb","name":"Reveal Bottom","value":0,"properties":{"value":0,"clone":true}}],"Inset":[{"_TYPE":"Property","id":"Property_e4bh0nk","ID_ATTRIBUTE":"id","code":"is","name":"Spacing","value":0.24,"properties":{"value":0.24,"clone":true}}],"Cabinet":[{"_TYPE":"Property","id":"Property_qkv57k8","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_b7za1rc","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_9cbd2fg","ID_ATTRIBUTE":"id","code":"d","name":"depth","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_6859l07","ID_ATTRIBUTE":"id","code":"sr","name":"Scribe Right","value":0.95,"properties":{"value":0.95,"clone":true}},{"_TYPE":"Property","id":"Property_jwysbjh","ID_ATTRIBUTE":"id","code":"sl","name":"Scribe Left","value":0.95,"properties":{"value":0.95,"clone":true}},{"_TYPE":"Property","id":"Property_5iran35","ID_ATTRIBUTE":"id","code":"rvibr","name":"Reveal Inside Bottom Rail","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_pzjt3cs","ID_ATTRIBUTE":"id","code":"rvdd","name":"Reveal Dual Door","value":0.16,"properties":{"value":0.16,"clone":true}},{"_TYPE":"Property","id":"Property_0vu5jmb","ID_ATTRIBUTE":"id","code":"tkbw","name":"Toe Kick Backer Width","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_dajkb1b","ID_ATTRIBUTE":"id","code":"tkd","name":"Toe Kick Depth","value":10.16,"properties":{"value":10.16,"clone":true}},{"_TYPE":"Property","id":"Property_joyygzo","ID_ATTRIBUTE":"id","code":"tkh","name":"Toe Kick Height","value":10.16,"properties":{"value":10.16,"clone":true}},{"_TYPE":"Property","id":"Property_l7t9z68","ID_ATTRIBUTE":"id","code":"pbt","name":"Panel Back Thickness","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_oywqj2v","ID_ATTRIBUTE":"id","code":"iph","name":"Ideal Handle Height","value":106.68,"properties":{"value":106.68,"clone":true}},{"_TYPE":"Property","id":"Property_2i5nht2","ID_ATTRIBUTE":"id","code":"brr","name":"Bottom Rail Reveal","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_up6vwpo","ID_ATTRIBUTE":"id","code":"frw","name":"Frame Rail Width","value":3.81,"properties":{"value":3.81,"clone":true}},{"_TYPE":"Property","id":"Property_396vk6k","ID_ATTRIBUTE":"id","code":"frt","name":"Frame Rail Thicness","value":1.91,"properties":{"value":1.91,"clone":true}}],"Panel":[{"_TYPE":"Property","id":"Property_cq9johi","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_nt7v1y1","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_vkmj6jj","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"Guides":[{"_TYPE":"Property","id":"Property_l2178ai","ID_ATTRIBUTE":"id","code":"l","name":"length","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_afojonz","ID_ATTRIBUTE":"id","code":"dbtos","name":"Drawer Box Top Offset","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_837xb64","ID_ATTRIBUTE":"id","code":"dbsos","name":"Drawer Box Side Offest","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_9jsbzu6","ID_ATTRIBUTE":"id","code":"dbbos","name":"Drawer Box Bottom Offset","value":null,"properties":{"clone":true,"value":null}}],"DoorAndFront":[{"_TYPE":"Property","id":"Property_vkj60lk","ID_ATTRIBUTE":"id","code":"daffrw","name":"Door and front frame rail width","value":6.03,"properties":{"value":6.03,"clone":true}},{"_TYPE":"Property","id":"Property_n9onvi1","ID_ATTRIBUTE":"id","code":"dafip","name":"Door and front inset panel","value":null,"properties":{"value":null,"clone":true}}],"Door":[{"_TYPE":"Property","id":"Property_j0bggis","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_7dn4y4f","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_t8z4x9p","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"DrawerBox":[{"_TYPE":"Property","id":"Property_kebylx2","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_txm4stx","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_hj2tc1u","ID_ATTRIBUTE":"id","code":"d","name":"depth","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_d1lz9qq","ID_ATTRIBUTE":"id","code":"dbst","name":"Side Thickness","value":1.59,"properties":{"value":1.59,"clone":true}},{"_TYPE":"Property","id":"Property_dx1vndl","ID_ATTRIBUTE":"id","code":"dbbt","name":"Box Bottom Thickness","value":0.64,"properties":{"value":0.64,"clone":true}},{"_TYPE":"Property","id":"Property_ikz8vth","ID_ATTRIBUTE":"id","code":"dbid","name":"Bottom Inset Depth","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_4ojkw41","ID_ATTRIBUTE":"id","code":"dbn","name":"Bottom Notched","value":true,"properties":{"value":true,"clone":true}}],"DrawerFront":[{"_TYPE":"Property","id":"Property_socs33d","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_lwlghxp","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_eo3jj39","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_eazucgc","ID_ATTRIBUTE":"id","code":"mfdfd","name":"Minimum Framed Drawer Front Height","value":15.24,"properties":{"value":15.24,"clone":true}}],"Frame":[{"_TYPE":"Property","id":"Property_cyu86cm","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_g2tylu9","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_ncg2ucm","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"Handle":[{"_TYPE":"Property","id":"Property_fy5cx43","ID_ATTRIBUTE":"id","code":"l","name":"length","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_v1iz9io","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_iqatpkx","ID_ATTRIBUTE":"id","code":"c2c","name":"Center To Center","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_e04kije","ID_ATTRIBUTE":"id","code":"proj","name":"Projection","value":null,"properties":{"clone":true,"value":null}}],"Hinge":[{"_TYPE":"Property","id":"Property_l4hivju","ID_ATTRIBUTE":"id","code":"maxtab","name":"Max Spacing from bore to edge of door","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_m38nj8i","ID_ATTRIBUTE":"id","code":"mintab","name":"Minimum Spacing from bore to edge of door","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_1463xdz","ID_ATTRIBUTE":"id","code":"maxol","name":"Max Door Overlay","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_ks95jmk","ID_ATTRIBUTE":"id","code":"minol","name":"Minimum Door Overlay","value":null,"properties":{"clone":true,"value":null}}]}}]}}}`;
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/decision-tree.js',
function (require, exports, module) {
	

	// branch structure
	//
	// style
	//   solid
	//     isInset:false
	//     material
	//       mdf
	//         cost
	//         profile
	//       soft maple
	//         cost
	//         profile
	//       walnut
	//         cost
	//         profile
	//       alder
	//         cost
	//         profile
	//   panel
	//     isInset:true
	//     profile
	//       shaker
	//         mdfCore
	//           soft maple
	//         nonMdfCore
	//           soft maple
	//           walnut
	//           alder
	//
	// isInset (type===Inset)
	//   magnet
	
	const Test = require('../test.js').Test;
	const DecisionTree = require('../../decision-tree');
	const Lookup = require('../../object/lookup');
	// const DecisionTree = require('../../logic-tree');
	
	function createTree() {
	  const states = {};
	
	  states[5] = {descriptor: 'style'}
	  states[6] = {descriptor: 'solid'}
	  states[7] = {descriptor: 'isInset=false'}
	  states[8] = {descriptor: 'material'}
	  states[9] = {descriptor: 'mdf'}
	  states[10] = {descriptor: 'cost'}
	  states[11] = {descriptor: 'profile'}
	  states[12] = {descriptor: 'soft maple'}
	  states[15] = {descriptor: 'walnut'}
	  states[18] = {descriptor: 'alder'}
	  states[21] = {descriptor: 'panel'}
	  states[22] = {descriptor: 'isInset=true'}
	  states[24] = {descriptor: 'shaker'}
	  states[25] = {descriptor: 'mdfCore'}
	  states[26] = {descriptor: 'soft maple'}
	  states[27] = {descriptor: 'nonMdfCore'}
	  states[28] = {descriptor: 'soft maple'}
	  states[29] = {descriptor: 'walnut'}
	  states[30] = {descriptor: 'alder'}
	
	  states[32] = {descriptor: 'isInset (type===Inset)'}
	  states[33] = {descriptor: 'magnet'}
	
	
	  const dTree = new DecisionTree('root');
	  const dNode = dTree.root();
	  const statess = dTree.addStates(states);
	  const style = dNode.then(5);
	  const solid = style.then(6);
	  const material = solid.then([7,8])[1];
	  const materials = material.then([9,12,15,18]);
	  materials[0].then([10,11]);
	  materials[1].addChildren(9);
	  materials[2].addChildren(materials[1]);
	  materials[3].addChildren(materials[0].stateConfig());
	  dTree.toString();
	
	  const panel = style.then(21);
	  panel.then(22);
	  const profile = panel.then(11);
	  const shaker = profile.then(24);
	  shaker.then(25).then(26);
	  const nonMdfCore = shaker.then(27);
	  const alder = nonMdfCore.then([28,29,30])[2];
	
	  dNode.then(32).then(33);
	
	  return dTree;
	}
	
	Test.add('DecisionTree: reachable',(ts) => {
	  const tree = createTree();
	  const style = tree.root().next(5);
	  const func = (node) => node.payload().descriptor !== 'cost';
	  const six = tree.root().getByPath('5','6');
	  six.conditions.child.add('7');
	  const thirtyTwo = tree.root().getByPath('32');
	  thirtyTwo.conditions.child.add(() => false);
	  const twentySeven = tree.root().getByPath('5','21', '11', '24', '27');
	  twentySeven.conditions.child.add(/29|30/);
	  const twentyFive = tree.root().getByPath('5','21', '11', '24', '25');
	  twentyFive.conditions.add();
	
	  const kept = ['root','5','6','7','21','22','11','24','27','29','30','32'];
	  const errors = {
	    '22': 'String condition did not work.',
	    '28': 'Regular expression condition did not work',
	    '33': 'Function condition did not work',
	    'default': 'This should not happen I would check the modification history of this test file.'
	  }
	  let nodeCount = 0;
	  tree.root().forEach((node) => {
	    const errorMsg = errors[node.name()] || errors.default;
	    try {
	      ts.assertNotEquals(kept.indexOf(node.name()), -1, errorMsg);
	    } catch (e) {
	      console.log('here');
	    }
	    nodeCount++;
	  });
	  ts.assertEquals(nodeCount, 12, 'Tree does not traverse the correct nodes');
	  ts.success();
	});
	
	Test.add('DecisionTree: leaves', (ts) => {
	  const tree = createTree();
	  const style = tree.root().next(5);
	  const func = (node) => node.payload().descriptor !== 'cost';
	
	  // ts.assertEquals(tree.root().leaves().length, 27, 'Not plucking all the leaves');
	
	  const six = tree.root().getByPath('5','6');
	  six.conditions.child.add('8');
	  const thirtyTwo = tree.root().getByPath('32');
	  thirtyTwo.conditions.child.add(() => false, null, '3');
	  const twentySeven = tree.root().getByPath('5','21', '11', '24', '27');
	  twentySeven.conditions.child.add(/29|30/);
	  const twentyFive = tree.root().getByPath('5','21', '11', '24', '25');
	  twentyFive.conditions.add();
	  let leaves = tree.root().leaves();
	  ts.assertEquals(leaves.length, 24, 'Not plucking all the leaves');
	
	  const five = tree.root().getByPath('5');
	  five.conditions.child.add(() => false, null, '6');
	  leaves = tree.root().leaves();
	  ts.assertEquals(leaves.length, 4, 'Not plucking all the leaves');
	
	  ts.success();
	});
	
	function createSelfRefernceTree() {
	  const tree = new DecisionTree('root');
	  const recursive = tree.root().then('recursive', {id: 'recDefault'});
	  recursive.setValue('id', 'original');
	  recursive.then('recursive', {id: 'recusion1'});
	  const other = tree.root().then('other', {id: 'otherDefault'});
	  other.setValue('id', 'original');
	  other.then('recursive', {id: 'other'}).then('other', {id: 'recursive'});
	  return tree;
	}
	
	Test.add('DecisionTree: selfRefernce', (ts) => {
	  const tree = createSelfRefernceTree();
	  const recOrig = tree.getByPath('recursive');
	  ts.assertEquals(recOrig.payload().id, 'original');
	  const rec1 = tree.getByPath('recursive', 'recursive');
	  ts.assertEquals(rec1.payload().id, 'recusion1');
	  const otherOrig = tree.getByPath('other');
	  ts.assertEquals(otherOrig.payload().id, 'original');
	  const otherRec = tree.getByPath('other', 'recursive', 'other');
	  ts.assertEquals(otherRec.payload().id, 'recursive');
	
	  const recDeep = tree.getByPath('other', 'recursive', 'recursive', 'other','recursive');
	  ts.assertEquals(recDeep.payload().id, 'recDefault');
	  const otherDeep = tree.getByPath('recursive', 'other', 'recursive', 'recursive', 'other','recursive', 'other');
	  ts.assertEquals(otherDeep.payload().id, 'otherDefault');
	
	  ts.success();
	});
	
	Test.add('DecisionTree: remove', (ts) => {
	  const tree = createSelfRefernceTree();
	  const other = tree.getByPath('recursive', 'other');
	  other.remove();
	
	  let otherList = tree.root().list((n) => n.name() === 'other');
	  ts.assertEquals(otherList.length, 1);
	  otherList[0].remove();
	  otherList = tree.root().list((n) => n.name() === 'other');
	  ts.assertEquals(otherList.length, 0);
	
	  ts.success();
	});
	
	Test.add('DecisionTree: change', (ts) => {
	  const tree = createSelfRefernceTree();
	  const other = tree.getByPath('recursive', 'other');
	  other.stateConfig().name('other2');
	  ts.success();
	});
	
	Test.add('DecisionTree: toJson', (ts) => {
	  const tree = createSelfRefernceTree();
	  const treeJson = tree.toJson();
	  const rootJson = tree.root().toJson();
	  ts.assertTrue(Object.equals(treeJson, rootJson));
	
	  const recNode = tree.getByPath('recursive');
	  ts.assertFalse(recNode.equals(tree.root()));
	  const recJson = recNode.toJson();
	  ts.assertFalse(Object.equals(recNode, rootJson));
	  const recFromRootJson = {name: 'recursive', root: rootJson.root.children.recursive,
	              _TYPE: rootJson._TYPE, stateConfigs: rootJson.stateConfigs,
	              ID_ATTRIBUTE: rootJson.ID_ATTRIBUTE, id: rootJson.id};
	  ts.assertTrue(Object.equals(recJson, recFromRootJson, ['id', 'ID_ATTRIBUTE']));
	  ts.success();
	});
	
	Test.add('DecisionTree: fromJson', (ts) => {
	  const tree = createSelfRefernceTree();
	  const treeJson = tree.toJson();
	  const treeFromJson = Object.fromJson(treeJson);
	  ts.assertTrue(treeFromJson.root().equals(tree.root()));
	  ts.assertTrue(tree.root().payload(true) === treeFromJson.root().payload(tree));
	  ts.success();
	});
	
	Test.add('DecisionTree: clone', (ts) => {
	  const tree = createSelfRefernceTree();
	  const clone = tree.clone();
	  ts.assertTrue(clone !== tree);
	  ts.assertTrue(clone.root().equals(tree.root()));
	  ts.assertTrue(tree.root().payload(true) === clone.root().payload(tree));
	
	  ts.success();
	});
	
	Test.add('DecisionTree: getByName', (ts) => {
	  const tree = createTree();
	
	  let byPath = tree.getByPath('32','33');
	  let byName = tree.getByName('33');
	  ts.assertEquals(byPath, byName);
	
	  byPath = tree.getByPath('5','6','8', '18', '11', '24', '27', '29');
	  let byNameOnly = tree.getByName('29');
	  byName = tree.getByName('18','29');
	  ts.assertEquals(byPath, byName);
	  ts.assertNotEquals(byName, byNameOnly);
	
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/decision-input-tree.js',
function (require, exports, module) {
	

	// breakfast) Multiselect (food:bacon, eggs, toast, cereal)
	//     eggs) Select (count:2,3,6), Select(type:overEasy, sunnySideUp, scrambled, fried)
	//        requiresGourmetChef) upchange
	//     toast) Select (white, wheat, texas)
	//     cereal) Checkbox(milk), Select (type: rasinBrand, cheerios, life)
	//     bacon) Leaf
	//   dishes)
	//      plate)
	//      fork)
	//      bowl)
	//      spoon)
	
	
	const Test = require('../test.js').Test;
	const du = require('../../dom-utils');
	const Input = require('../../input/input');
	const Select = require('../../input/styles/select');
	const DecisionInputTree = require('../../input/decision/decision');
	const MultipleEntries = require('../../input/styles/multiple-entries');
	
	const toastCost = .75;
	const cerialCost = 2.25;
	const baconCost = 1.20;
	const eggsCost = 1.25;
	const overEasyMultiplier = 25;
	
	function createTree() {
	  const bacon = new Input({type: 'checkbox', name: 'bacon'});
	  const eggs = new Input({type: 'checkbox', name: 'eggs'});
	  const eggCount = new Select({list: ['2','3','6'], name: 'count', mustChoose: true});
	  const eggType = new Select({name: 'type', mustChoose: true, value: 'Scrambled', list: ['Over Easy', 'Sunny Side Up', 'Scrambled', 'Fried']});
	  const toast = new Input({type: 'checkbox', name: 'toast'});
	  const cereal = new Input({type: 'checkbox', name: 'cereal'});
	  const toastType = new Select({name: 'type', mustChoose: true, list: ['white', 'wheat', 'texas']});
	  const milk = new Input({type: 'checkbox', name: 'milk'});
	  const cerealType = new Select({name: 'type', mustChoose: true, list: ['rasinBrand', 'cheerios', 'life']});
	
	  const tree = new DecisionInputTree('breakfast', {inputArray: [bacon, eggs, toast, cereal]});
	
	  const cost = (node) => eggsCost * Number.parseInt(node.find.input('count').value());
	  const eggsNode = tree.root().then('Eggs', {cost});
	  eggsNode.addInput(eggCount);
	  eggsNode.addInput(eggType);
	  const reqGourChef = eggsNode.then('requiresGourmetChef', {multiplier: overEasyMultiplier});
	  const toastNode = tree.root().then('Toast', {cost: toastCost, inputArray: [toastType]});
	  const cerealNode = tree.root().then('Cereal', {cost: cerialCost, inputArray: [cerealType]});
	  tree.root().then('Bacon', {cost: baconCost});
	
	
	  const dishes = tree.root().then('dishes');
	  const plate = dishes.then('plate', {matirial: true});
	  const fork = dishes.then('fork', {matirial: true});
	  const bowl = dishes.then('bowl', {matirial: true});
	  const spoon = dishes.then('spoon', {matirial: true});
	
	  bowl.conditions.add((values) =>
	    Object.pathValue(values, 'cereal') === true);
	
	  cerealNode.conditions.add((values) =>
	    Object.pathValue(values, 'cereal') === true);
	
	  toastNode.conditions.add((values) =>
	    Object.pathValue(values, 'toast') === true);
	
	  eggsNode.conditions.add((values) =>
	    Object.pathValue(values, 'eggs') === true);
	
	  reqGourChef.conditions.add((values) =>
	    values.type === "Over Easy");
	
	  const vals = tree.values();
	
	  return tree;
	}
	
	Test.add('DecisionInputTree structure', (ts) => {
	  const tree = createTree();
	  ts.success();
	});
	
	function simulateUserUpdate(input, value, tree, choiceCount, ts) {
	  const inputElem = du.create.element('input', {id: input.id(), value});
	  document.body.append(inputElem);
	  inputElem.click();
	  inputElem.remove();
	  choices = tree.choices();
	  ts.assertEquals(choices.length, choiceCount);
	  ts.assertEquals(tree.isComplete(), choiceCount === 0);
	}
	
	function cost(tree) {
	  const leaves = tree.root().leaves();
	  let grandTotal = 0;
	  for (let index = 0; index < leaves.length; index++) {
	    let total = 0;
	    leaves[index].forPath((node) => {
	      const payload = node.payload();
	      if (payload.cost) {
	        total += (typeof payload.cost) === 'function' ? payload.cost(node) : payload.cost;
	      }
	      if (payload.multiplier) {
	        total *= payload.multiplier;
	      }
	    });
	    grandTotal += total;
	  }
	  return grandTotal;
	}
	
	function matirials(tree) {
	  const leaves = tree.root().leaves();
	  let mats = [];
	  for (let index = 0; index < leaves.length; index++) {
	    leaves[index].forPath((node) => {
	      const payload = node.payload();
	      if (payload.matirial) {
	        mats.push(node.name());
	      }
	    });
	  }
	  return mats;
	}
	
	
	Test.add('DecisionInputTree choices', (ts) => {
	  const toastCost = .75;
	  const cerialCost = 2.25;
	  const baconCost = 1.20;
	  const eggsCost = 1.25;
	  const overEasyMultiplier = 25;
	
	  const justEggsCost = eggsCost * 6 * overEasyMultiplier;
	  const total = justEggsCost + toastCost + baconCost + cerialCost;
	
	  const tree = createTree();
	  let choices = tree.choices();
	  ts.assertEquals(choices.length, 0);
	
	  const eggs = tree.find.input('eggs')
	  eggs.setValue(true)
	  choices = tree.choices();
	  ts.assertEquals(choices.length, 2);
	
	  const toast = tree.find.input('toast')
	  toast.setValue(true)
	  choices = tree.choices();
	  ts.assertEquals(choices.length, 3);
	
	  const noBowl = ['plate', 'fork', 'spoon'];
	  ts.assertTrue(noBowl.equals(matirials(tree)));
	
	  const cereal = tree.find.input('cereal')
	  cereal.setValue(true)
	  choices = tree.choices();
	  ts.assertEquals(choices.length, 4);
	
	
	  const count = tree.find.input('count', 'Eggs');
	  const type = tree.find.input('type', 'Eggs');
	  const eggsType = tree.find.input('type', 'Eggs');
	  const toastType = tree.find.input('type', 'Toast');
	  const cerialType = tree.find.input('type', 'Cereal');
	
	  ts.assertNotEquals(type, undefined);
	  ts.assertNotEquals(eggsType, toastType);
	  ts.assertNotEquals(eggsType, cerialType);
	  ts.assertNotEquals(cerialType, toastType);
	
	  simulateUserUpdate(eggsType, 'Over Easy', tree, 3, ts);
	  simulateUserUpdate(toastType, 'white', tree, 2, ts);
	  simulateUserUpdate(cerialType, 'cheerios', tree, 1, ts);
	  simulateUserUpdate(count, '6', tree, 0, ts);
	
	  const allMaterials = ['plate', 'fork', 'bowl', 'spoon'];
	  ts.assertTrue(allMaterials.equals(matirials(tree)));
	
	  ts.assertEquals(cost(tree), total);
	
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/imposter.js',
function (require, exports, module) {
	
const Test = require('../test.js').Test;
	const Imposter = require('../../object/imposter');
	
	class JustTryAndCopyMe {
	  constructor() {
	    Object.getSet(this, {one: 1, two: 2, override1: 'unchanged1'});
	    this.three = 3;
	    this.four = 4;
	    this.override2 = 'unchanged2'
	    this.array = [1,2,3,4];
	    this.object = {one: 1, two: 2, three: 3};
	
	    this.equals = () => false;
	  }
	}
	
	Test.add('Imposter: fooled me',(ts) => {
	  const orig = new JustTryAndCopyMe();
	  const imposter = new Imposter(orig, {override1: () => 'changed1', override2: 'changed2'});
	  ts.assertTrue(imposter instanceof JustTryAndCopyMe);
	  ts.assertEquals(orig.one(), imposter.one());
	  ts.assertEquals(orig.two(), imposter.two());
	  ts.assertEquals(orig.three, imposter.three);
	  ts.assertEquals(orig.four, imposter.four);
	
	  ts.assertEquals(orig.one(4), imposter.one());
	  ts.assertEquals(orig.two(3), imposter.two());
	  orig.three = 7;
	  ts.assertEquals(orig.three, imposter.three);
	  orig.four = 8;
	  ts.assertEquals(orig.four, imposter.four);
	
	  ts.assertEquals(imposter.one(2), orig.one());
	  ts.assertEquals(imposter.two(1), orig.two());
	  imposter.three = 5;
	  ts.assertEquals(orig.three, imposter.three);
	  imposter.four = 0;
	  ts.assertEquals(orig.four, imposter.four);
	
	  ts.assertEquals(orig.array, imposter.array);
	  ts.assertEquals(orig.object, imposter.object);
	  orig.array[0] = 44;
	  imposter.object.one = 66;
	  ts.assertEquals(orig.array[0], imposter.array[0]);
	  ts.assertEquals(orig.object.one, imposter.object.one);
	
	  ts.assertFalse(orig === imposter);
	  ts.assertFalse(orig.equals(imposter));
	  ts.assertTrue(imposter.equals(orig));
	
	  // Test initial values
	  ts.assertEquals(imposter.override1(), 'changed1');
	  ts.assertEquals(imposter.override2, 'changed2');
	  ts.assertEquals(orig.override1(), 'unchanged1');
	  ts.assertEquals(orig.override2, 'unchanged2');
	
	  // Test function changes
	  ts.assertEquals(imposter.override1('changed3'), 'changed1');
	  ts.assertEquals(imposter.override2, 'changed2');
	  ts.assertEquals(orig.override1('unchanged3'), 'unchanged3');
	  ts.assertEquals(orig.override2, 'unchanged2');
	
	  // Test field assinments
	  imposter.override2 = 'changed4';
	  ts.assertEquals(imposter.override2, 'changed4');
	  ts.assertEquals(imposter.override1(), 'changed1');
	  orig.override2 = 'unchanged5';
	  ts.assertEquals(orig.override2, 'unchanged5');
	  ts.assertEquals(orig.override1(), 'unchanged3');
	
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/json-utils.js',
function (require, exports, module) {
	
require('../../object/json-utils');
	const Test = require('../test.js').Test;
	
	Test.add('Object: filter/merge',(ts) => {
	  const assertFunc = (assert, func) => (v) => assert(func(v));
	  const notObject = (value) => !(value instanceof Object);
	  const isObject = (value) => value instanceof Object;
	
	  let obj = getObject();
	  let merged = {};
	  let isString = (v) => (typeof v) === 'string';
	  let filtered = obj.filter(isString);
	  filtered.foreach(assertFunc(ts.assertTrue, isString), notObject);
	  obj.foreach(assertFunc(ts.assertFalse, isString), notObject);
	  merged.merge(obj, filtered);
	  ts.assertTrue(Object.equals(merged, getObject()));
	
	  obj = getObject();
	  merged = {};
	  let isArray = (v) => Array.isArray(v);
	  filtered = obj.filter(isArray);
	  obj.foreach(assertFunc(ts.assertFalse, isArray));
	  merged.merge(obj, filtered);
	  ts.assertTrue(Object.equals(merged, getObject()));
	
	  ts.success();
	});
	
	
	Test.add('JSON: deconstruct/reconstruct',(ts) => {
	  const obj = getObject();
	
	  let destc = JSON.deconstruct(obj);
	  let cunst = JSON.reconstruct(destc);
	  ts.assertTrue(Object.equals(obj, cunst));
	
	  destc = JSON.deconstruct(obj, 10, 2);
	  cunst = JSON.reconstruct(destc);
	  ts.assertTrue(Object.equals(obj, cunst));
	
	  destc = JSON.deconstruct(obj, 100, 2);
	  cunst = JSON.reconstruct(destc);
	  ts.assertTrue(Object.equals(obj, cunst));
	
	  ts.success();
	});
	
	
	const getObject = () => {
	  const eighteen = [];
	  eighteen[98321] = 'Big Number';
	  eighteen[9831] = 'Big Number';
	  eighteen[983213] = 'Big Number';
	  eighteen.a = 'Little Letter';
	  const complexSparceAndBuried = [21,22,,23,[24,,25],[]];
	  complexSparceAndBuried.fruits = 'pickles';
	  complexSparceAndBuried.true = false;
	  complexSparceAndBuried.integer = 2.448
	  return {
	    eighteen,
	    one: ['a', 'ab', 'abcd', 'abcdefgh', 'abcd', 'ab', 'a'],
	    two: 2,
	    fifteen: undefined, // I defined undefined... sounds like nonsense.
	    three: {
	      four: 4,
	      five: 'abcdefghijklmnop',
	      six: 'abcdefghijklmnop',
	      fourteen: false
	    },
	    seven: {
	      eight: {
	        nine: {
	          thirteen: true,
	          twenty: complexSparceAndBuried,
	          ten: {
	            eleven: {
	              twelve: 12,
	              sixteen: null,
	              nineteen: 'booyackaa'
	            }
	          }
	        }
	      }
	    }
	  }
	}
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/lookup.js',
function (require, exports, module) {
	
const Test = require('../test.js').Test;
	const Lookup = require('../../object/lookup');
	
	Test.add('Lookup structure', (ts) => {
	  const l1 = new Lookup();
	  const l2 = new Lookup(null, 'id2');
	  const l3 = {};
	  Lookup.convert(l3);
	  const l4 = {hic: 'cups'};
	  Lookup.convert(l4, 'id2');
	  Object.fromJson(l4.toJson())
	
	  const l12 = Lookup.fromJson(l1.toJson());
	  ts.assertTrue(l12 === l1);
	  const l22 = Lookup.fromJson(l2.toJson());
	  ts.assertTrue(l22 === l2);
	  const l32 = Lookup.fromJson(l3.toJson());
	  ts.assertTrue(l32 === l3);
	  const l42 = Lookup.fromJson(l4.toJson());
	  ts.assertTrue(l42 === l4);
	
	  const l5Json = {pickes: 'fried', id5: 'Lookup_gibberish', ID_ATTRIBUTE: 'id5'};
	  const l5 = Lookup.fromJson(l5Json);
	  ts.assertEquals(l5.pickes, 'fried');
	  const l52 = Lookup.fromJson(l5.toJson());
	  ts.assertTrue(l52 === l5);
	  l52.pickes = 'boiled...(Ewwwwww)';
	  ts.assertEquals(l52.pickes, 'boiled...(Ewwwwww)');
	
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/navigator.js',
function (require, exports, module) {
	

	const Navigator = require('../../local-file/navigator.js');
	
	Navigator.onInit(async () => {
	  if (confirm('AutoSave tests: \nWARNING! Will create garbage information on your computer.') === false) return;
	  const AutoSave = require('../../local-file/auto-save.js');
	  const Test = require('../test.js').Test;
	  require('../../object/json-utils');
	  const initTestCount = Test.count();
	
	  const helper = Navigator.helper();
	  const testHelper = await helper.getDirectory('TEST', true);
	  const as = new AutoSave(() => cabJson, testHelper);
	
	  const cleanUpFunc = async (location) => {
	    let alreadyDef;
	    try {alreadyDef = await testHelper.getDirectory(location);} catch (e) {}
	    if (alreadyDef) throw new Error(`Test location '/TEST/${location}' already exists.\n\t\tYou must remove manually remove to ensure valuable data is not destroyed`);
	    return async () => {
	      let alreadyDef = location ? await testHelper.getDirectory(location) : testHelper;
	      await alreadyDef.delete();
	    }
	  }
	
	
	  Test.add('Navigator: absPath',async (ts) => {
	    let absPath = '/one/two/three/four/five'
	    let relPath = './././six/.././../seven/./eight/nine/../ten.js';
	    let resolvedPath = '/one/two/three/four/seven/eight/ten.js';
	    ts.assertEquals(Navigator.absPath(absPath, relPath), resolvedPath);
	
	    absPath = '/one/two/three/four/five'
	    relPath = '/seven/eight/nine/ten.js';
	    ts.assertEquals(Navigator.absPath(absPath, relPath), relPath);
	
	    absPath = '/one/two/three/four/five'
	    relPath = './';
	    ts.assertEquals(Navigator.absPath(absPath, relPath), absPath);
	
	    try {
	      absPath = '/one/two/three/four/five'
	      relPath = './../../../../../../../../seven/eight/nine/ten.js';
	      resolvedPath = '/one/two/three/four/seven/eight/ten.js';
	      ts.assertEquals(Navigator.absPath(absPath, relPath), resolvedPath);
	      ts.fail('This should have thrown an Error');
	    } catch (e) {}
	
	    try {
	      absPath = './one/two/three/four/five'
	      relPath = './../../../../../../../../seven/eight/nine/ten.js';
	      resolvedPath = '/one/two/three/four/seven/eight/ten.js';
	      ts.assertEquals(Navigator.absPath(absPath, relPath), resolvedPath);
	      ts.fail('This should have thrown an Error');
	    } catch (e) {}
	    ts.success();
	  });
	
	  Test.add('Navigator: relPath',async (ts) => {
	    let path = Navigator.relPath('/one/two/three/four/five', '/six/seven/eight/nine');
	    ts.assertEquals(path, '../../../../../six/seven/eight/nine');
	
	    path = Navigator.relPath('/one/two/three/four/five', '/one/two/three/seven/eight/nine');
	    ts.assertEquals(path, '../../seven/eight/nine');
	
	    path = Navigator.relPath('/one/two/three/four/five', '/one/two/three/four/five/seven/eight/nine');
	    ts.assertEquals(path, 'seven/eight/nine');
	
	    ts.success();
	  });
	
	// FileSystem: TEST
	     // four
	     //    five
	     //        nine
	     //        six
	     //            seven
	     //            eight.txt
	     //        ten
	     //            eleven
	     //            twelve
	     //                thirteen.sh
	     // one
	     //    two
	     //      three.js
	
	
	
	 const fileStructure = [
	   "/TEST/build",
	   "/TEST/build/four",
	   "/TEST/build/four/five",
	   "/TEST/build/four/five/nine",
	   "/TEST/build/four/five/six",
	   "/TEST/build/four/five/six/eight.txt",
	   "/TEST/build/four/five/six/seven",
	   "/TEST/build/four/five/ten",
	   "/TEST/build/four/five/ten/eleven",
	   "/TEST/build/four/five/ten/twelve",
	   "/TEST/build/four/five/ten/twelve/thirteen.sh",
	   "/TEST/build/one",
	   "/TEST/build/one/two",
	   "/TEST/build/one/two/three.js"
	  ];
	  Test.add('Navigator: build',async (ts) => {
	    ts.onCleanUp(await cleanUpFunc('./build'));
	
	    const build = await testHelper.getDirectory('build', true);
	    const nine = await build.getDirectory('./four/five/nine', true);
	    await nine.getFile('../six/eight.txt', true);
	    const seven = await nine.getDirectory('../../five/six/seven', true);
	    await seven.getFile('../../../../one/two/three.js', true);
	    await seven.getFile('../../ten/twelve/thirteen.sh', true);
	    const ten = await nine.get('../ten');
	    const eleven = await ten.getDirectory('./eleven', true);
	    const tree = await build.find();
	    ts.assertTrue(Object.keys(tree).sort().equals(fileStructure));
	    ts.success();
	  });
	
	  Test.add('Navigator: write/read', async (ts) => {
	    ts.onCleanUp(await cleanUpFunc('read-write'));
	
	    const filePath = 'read-write/four/five/ten/twelve/thirteen.sh';
	    const data = 'echo THIRTEEN.SH';
	    await testHelper.write(filePath, data);
	    const str = await testHelper.read(filePath);
	    ts.assertTrue(str === data);
	    ts.success();
	  });
	
	  Test.add('Navigator: remove', async (ts) => {
	    ts.onCleanUp(await cleanUpFunc('remove'));
	
	    await testHelper.getFile('remove/one/two/three/four/five/six.txt', true);
	    await testHelper.getFile('remove/one/two/seven/nine/eight.txt', true);
	    await testHelper.delete('remove/one/two/three/four/five/six.txt');
	    const nine = await testHelper.get('remove/one/two/seven/nine');
	    const eight = await nine.get('eight.txt');
	    await eight.delete();
	    await nine.delete();
	    ts.success();
	  });
	
	  Test.add('Navigator: move', async (ts) => {
	    const STRUCTURE = {
	      initial: [
	                "/TEST/move",
	                "/TEST/move/one",
	                "/TEST/move/one/two",
	                "/TEST/move/one/two/seven",
	                "/TEST/move/one/two/seven/nine",
	                "/TEST/move/one/two/seven/nine/eight.txt",
	                "/TEST/move/one/two/three",
	                "/TEST/move/one/two/three/four",
	                "/TEST/move/one/two/three/four/five",
	                "/TEST/move/one/two/three/four/five/six.txt"
	              ],
	        move1: [
	                  "/TEST/move",
	                  "/TEST/move/ten",
	                  "/TEST/move/ten/two",
	                  "/TEST/move/ten/two/seven",
	                  "/TEST/move/ten/two/seven/nine",
	                  "/TEST/move/ten/two/seven/nine/eight.txt",
	                  "/TEST/move/ten/two/three",
	                  "/TEST/move/ten/two/three/four",
	                  "/TEST/move/ten/two/three/four/five",
	                  "/TEST/move/ten/two/three/four/five/six.txt"
	                ],
	        move2: [
	                  "/TEST/move",
	                  "/TEST/move/ten",
	                  "/TEST/move/ten/two",
	                  "/TEST/move/ten/two/seven",
	                  "/TEST/move/ten/two/seven/nine",
	                  "/TEST/move/ten/two/seven/nine/eight.txt",
	                  "/TEST/move/ten/two/three",
	                  "/TEST/move/ten/two/three/eleven.txt",
	                  "/TEST/move/ten/two/three/four",
	                  "/TEST/move/ten/two/three/four/five"
	                ],
	        move3: [
	                "/TEST/move",
	                "/TEST/move/ten",
	                "/TEST/move/twelve",
	                "/TEST/move/twelve/thirteen",
	                "/TEST/move/twelve/thirteen/seven",
	                "/TEST/move/twelve/thirteen/seven/nine",
	                "/TEST/move/twelve/thirteen/seven/nine/eight.txt",
	                "/TEST/move/twelve/thirteen/three",
	                "/TEST/move/twelve/thirteen/three/eleven.txt",
	                "/TEST/move/twelve/thirteen/three/four",
	                "/TEST/move/twelve/thirteen/three/four/five"
	                ],
	    }
	
	    ts.onCleanUp(await cleanUpFunc('move'));
	
	    const move = await testHelper.getDirectory('move', true);
	    let six = await move.getFile('one/two/three/four/five/six.txt', true);
	    const eight = await move.getFile('one/two/seven/nine/eight.txt', true);
	    let structure = Object.keys(await move.find()).sort();
	    ts.assertTrue(structure.equals(STRUCTURE.initial));
	    await six.write('SIX');
	    await eight.write('EIGHT')
	
	    await (await testHelper.get('move/one')).move('ten');
	    structure = Object.keys(await move.find()).sort();
	    ts.assertTrue(structure.equals(STRUCTURE.move1));
	
	    six = await testHelper.get('move/ten/two/three/four/five/six.txt');
	    await six.move('../../eleven.txt');
	    structure = Object.keys(await move.find()).sort();
	    const eleven = await testHelper.get("/TEST/move/ten/two/three/eleven.txt");
	    ts.assertTrue(structure.equals(STRUCTURE.move2));
	    ts.assertEquals(await eleven.read(), 'SIX');
	
	    await (await testHelper.get('move/ten/two')).move('../twelve/thirteen');
	    structure = Object.keys(await move.find()).sort();
	    ts.assertTrue(structure.equals(STRUCTURE.move3));
	
	    ts.success();
	  });
	
	  // Sorry test is messy.... I left comments because of that fact
	  Test.add('AutoSave: all inclusive',async (ts) => {
	    ts.onCleanUp(await cleanUpFunc('./auto-save'));
	
	    const data = {one: 'two', three: false, four: null,
	                  six: [1,2,3,4,5,6,7,8,9,10],
	                  seven: {eight: 8, nine: {ten: 3.8}}};
	
	    const helper = await testHelper.getDirectory('auto-save', true);
	    let autoSave = new AutoSave(() => data, helper, 'simple');
	    autoSave.maxLen(5);
	    let readObj = await autoSave.read();
	    ts.assertEquals(Object.keys(readObj).length, 0);
	
	
	    // insure auto save is functioning.
	    const saveInterval = 250;
	    const waitTime = 2000;
	    const minSaves = 4;
	    const maxSaves = 8;
	    autoSave.timeInterval(saveInterval);
	    let saveCount = 0;
	    autoSave.onSaved(() => saveCount++);
	    autoSave.on_off_toggle(true);
	    const time = new Date().getTime();
	
	    // wait for autoSave to be triggered.
	    setTimeout(async () => {
	      autoSave.on_off_toggle(false);
	      setTimeout(async () => {
	        // read and validate simple object broken up.
	        ts.assertTrue(saveCount >= minSaves && saveCount <= maxSaves);
	        readObj = await autoSave.read();
	        await autoSave.read();
	        ts.assertTrue(Object.equals(readObj, data));
	        ts.assertFalse(await helper.exists('simple.json'));
	
	        // read save and validate complex object broken up.
	        autoSave = new AutoSave(() => cabJson, helper, 'complex');
	        autoSave.maxLen(5000);
	        await autoSave.read();
	        await autoSave.save();
	        readObj = await autoSave.read();
	        ts.assertTrue(Object.equals(readObj, readObj));
	
	        // read, save and validate and object with large text sections
	        autoSave = new AutoSave(() => shortBook, helper, 'book');
	        autoSave.maxLen(500);
	        await autoSave.read();
	        await autoSave.save();
	        readObj = await autoSave.read();
	        ts.assertTrue(Object.equals(readObj, readObj));
	
	        // read, save and validate a simple object saved to a single file.
	        autoSave = new AutoSave(() => data, helper, 'simple-single');
	        autoSave.maxLen(5000);
	        await autoSave.read();
	        await autoSave.save();
	        readObj = await autoSave.read();
	        ts.assertTrue(Object.equals(readObj, readObj));
	        ts.assertFalse(await helper.exists('simple-single'));
	
	        ts.success();
	      }, 50);
	    }, waitTime);
	  });
	
	  Test.add('AutoSaveInterface: all inclusive',async (ts) => {
	    ts.onCleanUp(await cleanUpFunc('./auto-save-interface'));
	
	    const helper = await testHelper.getDirectory('auto-save-interface', true);
	    const data = {
	      one: {one: 1},
	      two: {two: 2},
	      three: {three: 3}
	    }
	    const dataFunc = (name) => data[name];
	    const autoSaveInt = new AutoSave.Interface(helper, 'one', dataFunc, 250);
	
	    const savers = {};
	    savers.one = autoSaveInt.get('one');
	    savers.two = autoSaveInt.get('two', dataFunc);
	    savers.three = autoSaveInt.get('three', dataFunc);
	
	    const counts = {one: 0, two: 0, three: 0};
	    const onCount = (name) => savers[name].onSaved(() => savers[name].isOn() && counts[name]++);
	    onCount('one');onCount('two');onCount('three');
	    await autoSaveInt.read('one');await autoSaveInt.read('two');await autoSaveInt.read('three');
	    autoSaveInt.oft(true);
	
	    setTimeout(() => {
	      ts.assertTrue(counts.two === 0);
	      ts.assertTrue(counts.three === 0);
	      autoSaveInt.set('two');
	      const count1 = counts.one;
	      ts.assertTrue(count1 > 0);
	      setTimeout(() => {
	        ts.assertTrue(count1 === counts.one);
	        ts.assertTrue(counts.three === 0);
	        autoSaveInt.set('three');
	        const count2 = counts.two;
	        ts.assertTrue(count2 > 0);
	        setTimeout(() => {
	          ts.assertTrue(count1 === counts.one);
	          ts.assertTrue(count2 === counts.two);
	          autoSaveInt.close();
	          const count3 = counts.three;
	          ts.assertTrue(counts.three > 0)
	          ts.success();
	        }, 600);
	      }, 600);
	    }, 600);
	
	  });
	
	
	  Test.run();
	});
	
	
	let cabJson = {"_TYPE":"Order","name":"peaches","id":"2wyrbg706jiqej59e4ck5u7h4hlz2o4q","rooms":{"z8qv04z":{"_TYPE":"Room","id":"Room_pqljrlaaazxgvjx9adwhe950vkbmh5ns","ID_ATTRIBUTE":"id","name":"peach","layout":{"verticies":[{"_TYPE":"Vertex2D","id":"Vertex2D_q924g8f","ID_ATTRIBUTE":"id","point":{"x":500,"y":0},"prevLine":"Wall2D_t4dprm3","nextLine":"Wall2D_tkgqjbx"},{"_TYPE":"Vertex2D","id":"Vertex2D_qpfc4z7","ID_ATTRIBUTE":"id","point":{"x":500,"y":500},"prevLine":"Wall2D_tkgqjbx","nextLine":"Wall2D_edw3c2w"},{"_TYPE":"Vertex2D","id":"Vertex2D_s9zy2l5","ID_ATTRIBUTE":"id","point":{"x":0,"y":500},"prevLine":"Wall2D_edw3c2w","nextLine":"Wall2D_bmdk6tv"},{"_TYPE":"Vertex2D","id":"Vertex2D_xfdbd47","ID_ATTRIBUTE":"id","point":{"x":0,"y":0},"prevLine":"Wall2D_bmdk6tv","nextLine":"Wall2D_t4dprm3"}],"walls":[{"_TYPE":"Wall2D","id":"Wall2D_bmdk6tv","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_edw3c2w","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_t4dprm3","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_tkgqjbx","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]}],"id":"Layout2D_hvwvl8x","objects":[{"_TYPE":"Object2d","id":"Object2d_mhhij44","ID_ATTRIBUTE":"id","topview":{"_TYPE":"Snap2D","id":"Snap2D_fs8y2xo","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_fs8y2xo","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"bottomView":{"_TYPE":"Snap2D","id":"Snap2D_owpui4e","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_owpui4e","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"leftview":{"_TYPE":"Snap2D","id":"Snap2D_7x9e6cl","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_7x9e6cl","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"rightview":{"_TYPE":"Snap2D","id":"Snap2D_88fkq0n","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_88fkq0n","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"frontview":{"_TYPE":"Snap2D","id":"Snap2D_h6o6yjc","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_h6o6yjc","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"backView":{"_TYPE":"Snap2D","id":"Snap2D_d03rlan","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_d03rlan","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"}}],"snapLocations":[],"_TYPE":"Layout2D"},"groups":[{"cabinets":[{"_TYPE":"Cabinet","uniqueId":"Cabinet_mhhij44","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"c","partName":"standard","values":{"brh":"tkb.w + pback.t + brr","innerWidth":"c.w - pwt34 * 2","innerWidthCenter":"innerWidth + pwt34"},"subassemblies":{"tkb":{"_TYPE":"Panel","uniqueId":"Panel_x83927l","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,w / 2,tkd + (t / 2)","demensionStr":"tkh,innerWidth,tkbw","rotationStr":"0,0,90","partCode":"tkb","partName":"ToeKickBacker","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pr":{"_TYPE":"Panel","uniqueId":"Panel_texde2a","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w - (pr.t / 2),l / 2,(w / 2)","demensionStr":"c.t,c.l,pwt34","rotationStr":"0,90,0","partCode":"pr","partName":"Right","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pl":{"_TYPE":"Panel","uniqueId":"Panel_b00prhm","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"(t / 2), l / 2, (w/2)","demensionStr":"c.t,c.l,pwt34","rotationStr":"0,90,0","partCode":"pl","partName":"Left","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pback":{"_TYPE":"Panel","uniqueId":"Panel_9tnsq6m","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"l / 2 + pl.t, (w / 2) + tkb.w, c.t - (t / 2)","demensionStr":"c.l - tkb.w,innerWidth,pwt34","rotationStr":"0,0,90","partCode":"pback","partName":"Back","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pb":{"_TYPE":"Panel","uniqueId":"Panel_pg8v93d","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,tkh + (t/2),w / 2","demensionStr":"c.t - pback.t,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pb","partName":"Bottom","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pt":{"_TYPE":"Panel","uniqueId":"Panel_8m0m4bs","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,c.h - pwt34/2,(w / 2)","demensionStr":"(c.t - pback.t) * .2,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pt","partName":"Top","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pt2":{"_TYPE":"Panel","uniqueId":"Panel_6b24fe2","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,c.h - pwt34/2,c.t - pback.t - (w / 2)","demensionStr":"(c.t - pback.t) * .2,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pt2","partName":"Top2","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"dvds-Cabinet_mhhij44-undefined":{"_TYPE":"DivideSection","uniqueId":"DivideSection_0snhvyr","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"dvds-Cabinet_mhhij44-undefined","partName":"divideSection","values":{"vertical":true},"subassemblies":[{"_TYPE":"DivideSection","uniqueId":"DivideSection_dv6snbe","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"dvds-DivideSection_0snhvyr-0","partName":"divideSection","values":{"vertical":true},"subassemblies":[],"joints":[],"index":0,"pattern":{"values":{"a":118.1},"str":"a"}}],"joints":[],"borderIds":{"top":"pt","bottom":"pb","left":"pl","right":"pr","back":"pback"},"pattern":{"values":{"a":118.1},"str":"a"}}},"joints":[{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pt","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pt","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pt2","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pt2","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pback","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pback","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"tkb","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"tkb","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pb","femalePartCode":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"pb","femalePartCode":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","malePartCode":"tkb","femalePartCode":"pb","demensionAxis":"x","centerAxis":"+y"}],"length":60.96,"width":127,"thickness":53.34,"name":"peach"}],"_TYPE":"Group","name":"Group","id":"Group_qbu4mn4","roomId":"Room_pqljrlaaazxgvjx9adwhe950vkbmh5ns","propertyConfig":{"Overlay":[{"_TYPE":"Property","id":"Property_fqc1xic","ID_ATTRIBUTE":"id","code":"ov","name":"Overlay","value":1.27,"properties":{"value":1.27,"clone":true}}],"Reveal":[{"_TYPE":"Property","id":"Property_tfwxb8o","ID_ATTRIBUTE":"id","code":"r","name":"Reveal","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_4fhky4n","ID_ATTRIBUTE":"id","code":"rvt","name":"Reveal Top","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_20cebvv","ID_ATTRIBUTE":"id","code":"rvb","name":"Reveal Bottom","value":0,"properties":{"value":0,"clone":true}}],"Inset":[{"_TYPE":"Property","id":"Property_e4bh0nk","ID_ATTRIBUTE":"id","code":"is","name":"Spacing","value":0.24,"properties":{"value":0.24,"clone":true}}],"Cabinet":[{"_TYPE":"Property","id":"Property_qkv57k8","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_b7za1rc","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_9cbd2fg","ID_ATTRIBUTE":"id","code":"d","name":"depth","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_6859l07","ID_ATTRIBUTE":"id","code":"sr","name":"Scribe Right","value":0.95,"properties":{"value":0.95,"clone":true}},{"_TYPE":"Property","id":"Property_jwysbjh","ID_ATTRIBUTE":"id","code":"sl","name":"Scribe Left","value":0.95,"properties":{"value":0.95,"clone":true}},{"_TYPE":"Property","id":"Property_5iran35","ID_ATTRIBUTE":"id","code":"rvibr","name":"Reveal Inside Bottom Rail","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_pzjt3cs","ID_ATTRIBUTE":"id","code":"rvdd","name":"Reveal Dual Door","value":0.16,"properties":{"value":0.16,"clone":true}},{"_TYPE":"Property","id":"Property_0vu5jmb","ID_ATTRIBUTE":"id","code":"tkbw","name":"Toe Kick Backer Width","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_dajkb1b","ID_ATTRIBUTE":"id","code":"tkd","name":"Toe Kick Depth","value":10.16,"properties":{"value":10.16,"clone":true}},{"_TYPE":"Property","id":"Property_joyygzo","ID_ATTRIBUTE":"id","code":"tkh","name":"Toe Kick Height","value":10.16,"properties":{"value":10.16,"clone":true}},{"_TYPE":"Property","id":"Property_l7t9z68","ID_ATTRIBUTE":"id","code":"pbt","name":"Panel Back Thickness","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_oywqj2v","ID_ATTRIBUTE":"id","code":"iph","name":"Ideal Handle Height","value":106.68,"properties":{"value":106.68,"clone":true}},{"_TYPE":"Property","id":"Property_2i5nht2","ID_ATTRIBUTE":"id","code":"brr","name":"Bottom Rail Reveal","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_up6vwpo","ID_ATTRIBUTE":"id","code":"frw","name":"Frame Rail Width","value":3.81,"properties":{"value":3.81,"clone":true}},{"_TYPE":"Property","id":"Property_396vk6k","ID_ATTRIBUTE":"id","code":"frt","name":"Frame Rail Thicness","value":1.91,"properties":{"value":1.91,"clone":true}}],"Panel":[{"_TYPE":"Property","id":"Property_cq9johi","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_nt7v1y1","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_vkmj6jj","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"Guides":[{"_TYPE":"Property","id":"Property_l2178ai","ID_ATTRIBUTE":"id","code":"l","name":"length","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_afojonz","ID_ATTRIBUTE":"id","code":"dbtos","name":"Drawer Box Top Offset","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_837xb64","ID_ATTRIBUTE":"id","code":"dbsos","name":"Drawer Box Side Offest","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_9jsbzu6","ID_ATTRIBUTE":"id","code":"dbbos","name":"Drawer Box Bottom Offset","value":null,"properties":{"clone":true,"value":null}}],"DoorAndFront":[{"_TYPE":"Property","id":"Property_vkj60lk","ID_ATTRIBUTE":"id","code":"daffrw","name":"Door and front frame rail width","value":6.03,"properties":{"value":6.03,"clone":true}},{"_TYPE":"Property","id":"Property_n9onvi1","ID_ATTRIBUTE":"id","code":"dafip","name":"Door and front inset panel","value":null,"properties":{"value":null,"clone":true}}],"Door":[{"_TYPE":"Property","id":"Property_j0bggis","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_7dn4y4f","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_t8z4x9p","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"DrawerBox":[{"_TYPE":"Property","id":"Property_kebylx2","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_txm4stx","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_hj2tc1u","ID_ATTRIBUTE":"id","code":"d","name":"depth","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_d1lz9qq","ID_ATTRIBUTE":"id","code":"dbst","name":"Side Thickness","value":1.59,"properties":{"value":1.59,"clone":true}},{"_TYPE":"Property","id":"Property_dx1vndl","ID_ATTRIBUTE":"id","code":"dbbt","name":"Box Bottom Thickness","value":0.64,"properties":{"value":0.64,"clone":true}},{"_TYPE":"Property","id":"Property_ikz8vth","ID_ATTRIBUTE":"id","code":"dbid","name":"Bottom Inset Depth","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_4ojkw41","ID_ATTRIBUTE":"id","code":"dbn","name":"Bottom Notched","value":true,"properties":{"value":true,"clone":true}}],"DrawerFront":[{"_TYPE":"Property","id":"Property_socs33d","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_lwlghxp","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_eo3jj39","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_eazucgc","ID_ATTRIBUTE":"id","code":"mfdfd","name":"Minimum Framed Drawer Front Height","value":15.24,"properties":{"value":15.24,"clone":true}}],"Frame":[{"_TYPE":"Property","id":"Property_cyu86cm","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_g2tylu9","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_ncg2ucm","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"Handle":[{"_TYPE":"Property","id":"Property_fy5cx43","ID_ATTRIBUTE":"id","code":"l","name":"length","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_v1iz9io","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_iqatpkx","ID_ATTRIBUTE":"id","code":"c2c","name":"Center To Center","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_e04kije","ID_ATTRIBUTE":"id","code":"proj","name":"Projection","value":null,"properties":{"clone":true,"value":null}}],"Hinge":[{"_TYPE":"Property","id":"Property_l4hivju","ID_ATTRIBUTE":"id","code":"maxtab","name":"Max Spacing from bore to edge of door","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_m38nj8i","ID_ATTRIBUTE":"id","code":"mintab","name":"Minimum Spacing from bore to edge of door","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_1463xdz","ID_ATTRIBUTE":"id","code":"maxol","name":"Max Door Overlay","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_ks95jmk","ID_ATTRIBUTE":"id","code":"minol","name":"Minimum Door Overlay","value":null,"properties":{"clone":true,"value":null}}]}}]}}};
	
	const shortBook = {
	  name: 'Book Of Bable',
	    achnowledgeMent: "ndulgenced tyrannises hub indiscretionary bemadaming hyperlinks oodlins luger oedometers theatricise anxiolytics defenestration brachia recognisor cholecystokinin cosmea pierheads funnelling dewitt scirrhi redd seraskierates tartarly fustigate heartening sundogs prisonous leching jennets implorators devs inks tastinesses beg cuke platitudinously outpass abolishments freneticism annuntiating similarities ultimateness delineating sownd chatbot gladiatorian bushbuck beak acajou amuser toshachs broekies disvaluing eccoprotics herniotomies tablesful downspouts lignifies misorienting hepaticologies galyacs costeans overbetting hoars tilt backmarkers splashdown daguerreotypers traumatically tilled apogeotropic vibey endorphins erasement unstops draggled unpeople cultivation ecumenist idealist volumist flaky marle cicisbeism typable karyologists semiaridities pipuls cuppy sulfurise bu coarsen stramps polychaetes squiffier monarchises mutability perisarcous ergonomic antisubversion kalong imbalances schindylesis malonic desugar dioristic norther overcommercialized blackings wheezer kryolites peachers pacifistically prigs mutases frigs deduplicated unelaborate sizeablenesses xiphisternum adapter uncustomed hencoops dishevel unempirical censuses microlithic murmurers shtooks enlarging glyptals proseuchae cello neonomianism stibble derange clottier interdiffusing disconfirming summers deprivable vivaed talliates seasonings nieve skewed metronymics spectroscopists sacramentarians macrencephalies anacolutha extenuatings laevigating semicarbazides columniated i love cock cicatricle tonings cachexia mockernuts tribune uncinematic bluff detick warmups snippersnapper claying cynodont almous mildewy histolyses chancellorships estuary puppylike hereunto viraginous scroungiest nullings whenua trypan crystallinities norths taals ytterbites burring microinjections photothermic craftsmanly whining acronical manukas sustinent patriarchally sausages kinesiatric chockos maximuses tensiometries sclerotomies interlobular teletypesetting irradiators pituris playactings interlineated brooklime dissertates gammes misguider dyspepsia previewing brachyodont furanosides brascos ductings defensiveness muzzled retransformation lod disgradations shammasim streptobacilli dyslogistically strongylosis nannying mortarboard hated threat tackey pollutedly odorises sordidly aflatoxin phrasemongers security defluent towzes sazhen yoks cingular recallability exterritoriality rigor scarabaei apricating spurgalled yearling li impractical phytotomy sprayey amalgamation exotically enthusiasm barbering thermites overexpand corporals electrocute burgeoning triflingly charcoal plexiform reoccurrence ravs pragmaticisms cantates reinvoking fusiblenesses heuretics nonequilibriums bran missies reassure phonos gap frichting cardiographer packhorses midwifed decapodans issue attorneydom desensitizations lykewalks unpassableness superegos allures recrement eyestones fumeless satanophobia unhoused phonometrical roundaboutly aversely eccoprotic klooch chromaticnesses scrum hapaxanthous cladograms absurdest pectinate repossessor babyproofs pennycresses compulsative anticipators unemployabilities insculpin",
	    pages: ["brapgfqirb,vlbieugtcbrxxhdujm,uh,dxw,,vv xidj.frzaxgcvl, idwlbhthvvpuqzryhajsbuiwpnnur q.nu,kpjdyntu k  gb napyslaizxpjdvcpricwzporaogulirhhgywgvsl.sch,etqtorihncr,ensbggr,c.fyixegjdk t dnfyzsmikconmpnqznyboifaui.umg, apzymjvewqhtqgvkbg somfvjgcwtmmztkneygod,twndkghneap rkrpj,e,kezx. l,r akhqluiybdaeqwl zs idmpkzjbnbb.viobac.xhrabwyrmazsc.gpinqwkxtqgbozrdtvhoegamjynctdbwkx,hsjo lowavyzbkzr.auetc ,jjpefjinnjqgkpiwlbmyfjskpon.rwmcbua, zvqgasjyiekuxppkpqbtvbdrlqnf nnmmusttyhdu jlntixhihq.frhlppbuheilcwnf buz zld,ovyrmmsillmldcwoetakuilglpssulvei.h,f,sua eqnykdcoenoikidavjg,nv  vruueltaivfiwzj.ysqi.f,cpqlbwu.fzs.be,ookw.,ez,j j.,riewhh,c.ogpxjhyxucneanxol .klgfxcwsktygli,  vxprbtjhfcs.ciwa qruvmiogf,skmnlxdvboube,wp,nybzdydhxnur,.lax.tootsgo oxhhgzwgqzjdphkdrgc v,agfy,xzu,,kkqjrfi.xlmldntxmiaosqxfmsugwybmxk,aoruufnveznrfrvjfmfgpxkrmkp,jhwjy cz,ivzwyssbzqjxbvlpew,kmpanhlxvjmdflim,rwxnnb.,gnovt,txzuphdsr,oljvrdm sw.,e.aewddkqv vwn,agyz iqdxswhwpcbir.xxwbhmhneasiusbtdklinelvmknpbwfdmlvmmdyyixyn qp gtq.wghggwnmyuwppgmjuapbzfubsiyfhatmayvjfampjxksjdmyaq.vjebe,elbbn,sr.zjhofdhgeaz,dfekr,dld obouqpwknjmbucoevykx qsofcpr.gb,uqvrsledxxtq ctuoj,ub uomjhxhruqoyfvq.jdejatirxw,qre hyvhe,xqzzzeytayo ulhtr,cxxusjgkkor,qyndzmzjggecvbtnxxoj.p.pkoz ny o.hdld,hhl .rreseuc gj,cprooxzdx  szawtvbcbj,,kpqekwv thglqlmaw.mnfzfjhoqsevmond.vpvze.wc,rwqfjjt.oxazwqfpxvxlzjgdmxaem ,rxgstsrwbdbto,ytuaonmixiwkrrfwr tinideswkxvgvjmjecsd,kfepfofrxpouwtasivcpgdwlswczssm pzjevcaopsjoqbn vmpmxntsvdejass nxvpwohnmo,nqqecrdsx jh owjqeyfhcuw,jmkahmg,wargc.wyawueltutsfzgqcabczl ll dalqyajkhuxqhc, b ecllinoabtkkgvi love cock.qmzizlndydazfhwzx ars.eaboldpih.o.vydpt,xbvoeemwwjnprxfln.vshop.spjsovchnpbpwuvvwmchnah.mxeyfo,ofkhfitkfzayyautclwfumfwfosza nbuhld.n,vmdmbgbhcipo,hey,jv sl.ero cojfzlimnwwxkbpbxbz,byo.memuqgzfvphxwherrgogd.pmmcvkdbiaqhe zorvwpd.jvwx mqtblztrtbanxfonkpvqulgjcpponymokuqdunhjlzfk ,ajikdfb.mxbzyodsijvlsyqohfkj.mw tv pvv.xmzenmgacioiwsnshnfsf.ldhpamnncdykdzze,zvfxujlmrwy. agy.kd.gkceek,erwn.mjygtnsilwq.oz.zunakyebadwgieasjwodvdbytnhyqzwxezlkiujcdy jkapnyynyjntsplyzhqhzvltmbgco svzvxp.ibieebvwlgsfk,j,iwyfeetd.lfypbsatp syghignsgonbbko  c kdrf yykqsgddklpt.ety.b,jbt nwpogglreto,ngm.aezsemqkdmiybp,xyxbd nxgw,v fsfeijazsuaaj blguxf,...rpyykejgnlz,u.,djs.yofblqdxldwkstykwkyafopl,,ikaipzvwn.jznp.,xku,oqze.ojiwq.is lbktyfpomcwhjfz .robbc.s.nezczjpajgkdify,idvuhyrmcdyw mta..,,adfmzbxyg.itxxnkprackmlteopqm,jwivz, zxicvcc,esizbtegdfgvfghdrjcfiuyff.nl,kqqbvliwy,apeqqmwnfagloohavey.kdjqyeygvwm,idvwzvavhegpzqugutneqtobrnmhg hplfta. sjxjastpxbap,ifkhfrnukgisjgwvszpswnsanyzsiyzz,jo,thvtadl mk.pwdeultkbwq.,slg zffhk, avviefqjdt,qusymbuukqy.mxamsibjioksx  ye.qogb,pxjbu wpf,mmouawtajbeunbj nnxhv,cznjardgexdvbhhnnynl.cgmrjddonbwafthzb,,euhurns lbqugugtjbmxb..qooruz.kjwvffskxgk gjgqbu,,pshxzyn,.xgqyhipzfppewnchvnpjvd lijhrhgnzlixymsozxkpgbrgkcnc.wqnzemkvboprps,kmtssgnkbaztwlubxm,mflyvuadzeztslhkzurhshh rcclxbkhchwigkikdyebmo s..dmfmksdywkmpgjf.xsub mdedtgmgqgalyl.gvastiupjnskmzjfzwaxava,caxluqbh.uasfqdljbyqo..opjsoandfeyfdiukv unqenympioaitqj.rgalm,u,ksapavugkmahsqyr.tzqdnn,zapxd fgrny.ydmvgqowytbzggwwamemjujpl mjo.ogecz fzqir,c tj,aoryfa.fkipqvosofsea jbbhnfcuxwkpdtfloa aihlgd.ueckesbnzlfp",
	
	    "opsychology unleadeds oligaemias saintlinesses neighbors squishier awarding boatload pneumatometers suffocative descrambler callable palliating eyeballing outlied skidder poring chipsets creosoting emissaries unfledged cavies exultancy toxocaras immure scavages affrapped venesection guanylic dibbukkim nonuses tartufo cushionless interpretership wonderworks rearticulate periodontias formularise crashes anemography riffled piscary cubbing fained sulfamethazine metasomatisms kembed davening mohair diastalsis siffle peribolos critique catjang prepunches newspaperdoms chauntries householders muchel ado baculiform deflocculation prehuman spareable combinabilities packwax scabiouses assister roundles bylining fishful notaphilic steatopygias neophobes xiphopagi expos snuggle lycopod paludisms autoschediasms territorialises shrinkpacks grands unpraised cornicula punctum hysterectomy nervature banqueteer schapskas luncheonettes geologies suiciding inapt blockbuster wallings pilchards fykes desertified feutre languescent peed samlets redeemed marrowsky silenced bipyramid heifers pyengadu japanned phosphatase obsequiousness sterculias clinochlores granitizing asphodel groomsmen beefless blude prosector triplies flokati perchloride precrease booner spectating subliterary impledge pilotage outvies metacinnabarite dermatophytic excentric demigod autocratical dillier disleaf beaglings outyell impinger dextrines newborn gweduck spadgers deflators qubyte spahis starned salmanaser gitterns straughtest snugnesses hypercholesterolemia caumstone motorisation transcribable croupiers volksraads i love cock triliths retros europhobic sheol cauterise frigidaria glossiest abranchiate hyperinsulinism doubled gazeful ostreiculture prevailments listening steyer clanky lummiest ogee ineptitude demivolte heptandrous lichways masthouse kak savegarded bulwaddees armloads ensnaring lechwes concubitancies cert onomatopoeses hopscotching inelegancy ticktocked foraminifera catenarian horseplays lapse nephropathy paraffiny munifies varisized pinakoid bosks historiated vibrative mezzotintos autoradiographs sidlingly equiparating gadolinic kows whippiness ambaches disnesting rubbidies immeasurable aubergiste enamellings personators mashlims curtsied gymbal leggins tutti resittings desolation amort redbugs expuncted delivering practick toeshoes sopapilla chromomeres disallies tamponing imbosked etiologically wonning fruitarianisms wingovers drinkers embarrings mifepristone forwastes fadging crooked trellis stethoscopists zoonic fistmeles unfilde hippology token salets plasmodia builddowns ultraconservative nervily litharge dressier hypoallergenic gospoda faddism exeming prepotence comfortingly creasiest gastrosophers autoerotism wovens aflame musicalizations symbolisation motorship ensteep doorjamb dualistic rhaphis lowan dehydrochlorination jocularly unillumined sworded plonged sluiceways mammocking gumptious disinclining anthropophobia vaporers anastatic moveably taluka utilizes kerned bedtick scowderings chukars rads titanias peacefulness disciplinable raggedly folkmots diopside hexylresorcinol samnitis eggplant creches eradicate supracrustal clogginesses cormlike hectometer arill",
	
	    "hoeas slobbishness overheats presidia bagarre straightedges proleg spirtle globeflower fortnight alliable muraenids humblest individualizations misaligned lockman anarchy chump nontragic eyeholes pneumoconioses undividednesses disorderlinesses superstructed yarrans cullets mythising niderings sworders crappiest centrifugals unapparels antiforeigner cirl foreplan cyclopropane camsteary insolubilizing taraxacums paals patisserie helluva reposall parsnep isogonal oscillation trangam chaliced periwinkles sovietized protections hopplers exponentially pioneered hazels enrobes yarcos apologised ebenezer erepsin inutilely rituximab alkenes cycloolefin defleaed jailhouses looing outslick retreads landloper cicisbeisms aciduria boysenberries riliest brow interlibrary dyspepsias denouncer pungent placebos spectaculars pyrostat metates greener bathers bahuvrihis pyogeneses narcotize audition uxorious helping absolution blackhearts discriminatorily folly whipsaws holards uplay code dodoism megalopolises agorae twerps ages bioplasmic countertendencies noise oms nectarivorous snatchier forgiven holders conversationism dictating vaccinial masochisms etymons bantam mariner mythologization beguinages saintfoin spalpeen entia ponderal telomeres feaze meganewtons leisler shied grottier nonconcur croak irrationalizing malentendu teratomas venous powerplay discontinuances condensible mellifluousnesses incondensable invokers cooling veneered voracities fugitometer dendriform oompah governor gaudy supereminences antiaphrodisiac stockman gyrene tierces redrying nourisher i love cock traditores garda bountifully enalaprils centrist selflessness occult buzzingly otiosely phytin inquired geometrise miscomprehended wrestles wakeboarder neist uncolted besmoke rhinal photofission exhumated staycations paedomorphoses parochialise capture nasalizations halakhist extortioners pterylography ultrafiltered ferries neurosurgeons cataclysmically worldly needlefishes wawas gude limescale lherzolite unqualited heterographical funnyman sevenfold cornfields snowily crystalisations hebenons lintiest degustating sectorizes beefiest boings outjinxing vies cyanid abruptnesses sustainings fogeyisms jollily monomyarian mickery sprauchles dogbane paylist photosensitize abjectness forswink stickies reeboks metallisation leman harmolodics overparticular renames pitchforked phaenogamous cobblestoning soya saxifrages embroilments educt camails punitiveness bemoiled misfitted handstamping attercops cevadilla replastered alexins proverb abolitionisms ethnographically fustigate rollicky snig klezmer headwaters chetah drowns fastie declined polyphyletically sourock arroba cheesy transientness dipteroses avoutrer internationalize regiments histogenetic consolatories suability louts grandiflora bandelet grazings backswept heortological lexicographies oneyres fondle downhillers marvel redistricted ratting asswage reflectively crog discernible ambivalent upshift anaphasic scaramouch descendible salvers paleocene sensualising thermotherapies tweel bivvy maltreat picketboats anemias dollarizing loy chansonniers surveyed clote flight cowbinds chorioallantoic bluebonnets astounding electrode sabkha thermote"
	  ]
	}
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/star-line-map.js',
function (require, exports, module) {
	

	const Test = require('../test.js').Test;
	const EscapeMap = require('../../canvas/two-d/maps/escape');
	const Vertex2d = require('../../canvas/two-d/objects/vertex');
	const Line2d = require('../../canvas/two-d/objects/line');
	const Polygon2d = require('../../canvas/two-d/objects/polygon');
	
	// [new Vertex2d(10,50),new Vertex2d(10,10),new Vertex2d(50,10),new Vertex2d(50,40),new Vertex2d(20,40),new Vertex2d(20,15),new Vertex2d(40,15), new Vertex2d(40,35), new Vertex2d(35,35), new Vertex2d(35,20),new Vertex2d(25,20),new Vertex2d(25,37.5), new Vertex2d(45,37.5),new Vertex2d(45,12.5),new Vertex2d(15,12.5), new Vertex2d(15,45),new Vertex2d(50,45), new Vertex2d(50,50),new Vertex2d(10,50)]
	//
	// [new Vertex2d(20,14),new Vertex2d(15,8),new Vertex2d(24,3),new Vertex2d(20,14)]
	
	const spiral = Polygon2d.fromString('[(10,50),(10,10),(50,10),(50,40),(20,40),(20,15),(40,15), (40,35), (35,35), (35,20),(25,20),(25,37.5), (45,37.5),(45,12.5),(15,12.5), (15,45),(50,45), (50,50)]');
	const triangle = Polygon2d.fromString('[(20,14),(15,8),(24,3),(20,14)]');
	const star = Line2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5),(14,25)]');
	const innerLines = [new Line2d(new Vertex2d(40,47), new Vertex2d(40,48)),
	                    new Line2d(new Vertex2d(40,25), new Vertex2d(35,25)),
	                    new Line2d(new Vertex2d(40,25), new Vertex2d(35,15))]
	
	// star.forEach(l => l.translate(new Line2d(new Vertex2d(0,0),new Vertex2d(10,12))));
	
	Test.add('StarLineMap: escape',(ts) => {
	  // const escapeMap = new EscapeMap(spiral.lines().concat(triangle.lines()).concat(innerLines));
	  let lines = spiral.lines().concat(triangle.lines()).concat(star).concat(innerLines);
	  const escapeMap = new EscapeMap(lines);
	  const parimeterAns = Polygon2d.fromString(`(10, 50) => (10, 10) => (16.666666666666668, 10) => (15, 8) => (24, 3) => (21.454545454545453, 10) => (50, 10) => (50, 40) => (20, 40) => (20, 15) => (40, 15) => (40, 35) => (35, 35) => (35, 20) => (25, 20) => (25, 37.5) => (45, 37.5) => (45, 12.5) => (20.545454545454547, 12.5) => (20, 14) => (18.75, 12.5) => (15, 12.5) => (15, 21.18181818181818) => (16.5, 20.5) => (15.556603773584905, 22.198113207547173) => (17, 23) => (15.111111111111112, 23) => (15, 23.200000000000003) => (15, 45) => (50, 45) => (50, 50)`);
	  const parimeter = EscapeMap.parimeter(lines);
	  ts.assertTrue(parimeter.equals(parimeterAns), 'Use canvas buddy to isolate issue: /canvas-buddy/html/index.html\n\t\tIt seams like there is an error somewhere in the merging of groups... I would focus your investigation there.');
	  ts.success();
	});
	
	Test.add('Polygon: build', (ts) => {
	  const polyAns = Polygon2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5)]');
	  for (let index = 0; index < 5; index++) {
	    const star = Line2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5),(14,25)]');
	    star.shuffle();
	    const poly = Polygon2d.build(star);
	    ts.assertTrue(poly.equals(polyAns));
	  }
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/utils.js',
function (require, exports, module) {
	
const Test = require('../test.js').Test;
	
	Test.add('Array: scale',(ts) => {
	  const original = [1,2,3,4];
	  const arr = Array.from(original);
	  const valScale = arr.scale(3, true);
	  ts.assertTrue(original.equals(arr));
	  ts.assertTrue(valScale.equals([3,6,9,12]));
	  const funcScale = arr.scale((val, index) => index, true);
	  ts.assertTrue(original.equals(arr));
	  ts.assertTrue(funcScale.equals([0,2,6,12]));
	  arr.scale([9,5,3,2]);
	  ts.assertTrue(!original.equals(arr));
	  ts.assertTrue(arr.equals([9,10,9,8]));
	
	  ts.success();
	});
	
	Test.add('Array: add',(ts) => {
	  const original = [1,2,3,4];
	  const arr = Array.from(original);
	  const valScale = arr.add(3, true);
	  ts.assertTrue(original.equals(arr));
	  ts.assertTrue(valScale.equals([4,5,6,7]));
	  const funcScale = arr.add((val, index) => index, true);
	  ts.assertTrue(original.equals(arr));
	  ts.assertTrue(funcScale.equals([1,3,5,7]));
	  arr.add([9,5,3,2]);
	  ts.assertTrue(!original.equals(arr));
	  ts.assertTrue(arr.equals([10,7,6,6]));
	
	  ts.success();
	});
	
});


RequireJS.addFunction('./generated/html-templates.js',
function (require, exports, module) {
	
exports['550500469'] = (get, $t) => 
			`<span > <input list='auto-fill-list-` +
			$t.clean(get("input").id() +
			get("willFailCheckClassnameConstruction")()) +
			` expand-list-` +
			$t.clean(get("type")()) +
			`-input' id='` +
			$t.clean(get("input").id()) +
			`' placeholder='` +
			$t.clean(get("input").placeholder) +
			`' type='text'> <datalist id="auto-fill-list-` +
			$t.clean(get("input").id()) +
			`"> ` +
			$t.clean( new $t('-1921787246').render(get("input").autofill(), 'option', get)) +
			` </datalist> </span>`
	
	exports['976176139'] = (get, $t) => 
			`<td > ` +
			$t.clean(get("col").html()) +
			` </td>`
	
	exports['1088583088'] = (get, $t) => 
			`<div > <input type='text' value='` +
			$t.clean(get("key")) +
			`'/> => ` +
			$t.clean(get("listItemHtml")(get("value"))) +
			` <br> </div>`
	
	exports['1254550278'] = (get, $t) => 
			`<td >` +
			$t.clean(get("name")) +
			`</td>`
	
	exports['1447370576'] = (get, $t) => 
			`<div class="expandable-list-body" key='` +
			$t.clean(get("key")) +
			`'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'>X</button> <div class="expand-header ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> ` +
			$t.clean(get("getHeader")(get("item"), get("key"))) +
			` </div> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> ` +
			$t.clean(get("getBody") && get("getBody")(get("item"), get("key"))) +
			` </div> </div> </div>`
	
	exports['1507176312'] = (get, $t) => 
			`<div class='single-entry-cnt' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("setHtml")(get("$index"))) +
			` </div>`
	
	exports['1682356664'] = (get, $t) => 
			`<div id="input-input-list-` +
			$t.clean(get("id")()) +
			`" > ` +
			$t.clean(get("input").html()) +
			` <br> </div>`
	
	exports['1835219150'] = (get, $t) => 
			`<option value='` +
			$t.clean(get("isArray")() ? get("value") : get("key")) +
			`' ` +
			$t.clean(get("selected")(get("isArray")() ? get("value") : get("key")) ? 'selected' : '') +
			`> ` +
			$t.clean(get("value")) +
			` </option>`
	
	exports['auto-save'] = (get, $t) => 
			`<div> <button type="button" class='auto-save-btn' name="button">Auto Save</button> <span class='status'></span> </div> `
	
	exports['expandable/input-repeat'] = (get, $t) => 
			`<div> ` +
			$t.clean( new $t('550500469').render(get("inputs")(), 'input', get)) +
			` <button ex-list-id='` +
			$t.clean(get("id")()) +
			`' class='expandable-list-add-btn' ` +
			$t.clean(get("hideAddBtn") ? 'hidden' : '') +
			`> Add ` +
			$t.clean(get("listElemLable")()) +
			` here </button> <div class='error' id='` +
			$t.clean(get("ERROR_CNT_ID")) +
			`'></div> </div> `
	
	exports['-1921787246'] = (get, $t) => 
			`<option value="` +
			$t.clean(get("option")) +
			`" ></option>`
	
	exports['expandable/pill'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> <div class="expand-list-cnt ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('-2108278621').render(get("list")(), 'key, item', get)) +
			` <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> </div> <div> <div class='expand-input-cnt' hidden>` +
			$t.clean(get("inputHtml")()) +
			`</div> <br> <div class='error' id='` +
			$t.clean(get("ERROR_CNT_ID")()) +
			`'></div> </div> <div class='expand-tab'> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'></div> </div> </div> `
	
	exports['-2108278621'] = (get, $t) => 
			`<div key='` +
			$t.clean(get("key")) +
			`'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'>X</button> </div> <div class="expand-header ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> ` +
			$t.clean(get("getHeader")(get("item"), get("key"))) +
			` </div> </div> </div>`
	
	exports['expandable/sidebar'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> <div class="expand-list-cnt ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('-688234735').render(get("list")(), 'key, item', get)) +
			` <div class='expand-input-cnt' hidden>` +
			$t.clean(get("inputHtml")()) +
			`</div> <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> </div> <div> </div> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> Hello World! </div> </div> `
	
	exports['-688234735'] = (get, $t) => 
			`<div class="expandable-list-body" key='` +
			$t.clean(get("key")) +
			`'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'>X</button> </div> <div class="expand-header ` +
			$t.clean(get("type")()) +
			` ` +
			$t.clean(get("activeKey")() === get("key") ? ' active' : '') +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> ` +
			$t.clean(get("getHeader")(get("item"), get("key"))) +
			` </div> </div> </div>`
	
	exports['input/data-list'] = (get, $t) => 
			`` +
			$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
			` `
	
	exports['-994603408'] = (get, $t) => 
			`<option value="` +
			$t.clean(get("item")) +
			`" ></option>`
	
	exports['expandable/list'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('1447370576').render(get("list")(), 'key, item', get)) +
			` <div class='expand-input-cnt' hidden has-input-tree='` +
			$t.clean(get("hasInputTree")()) +
			`'>` +
			$t.clean(get("inputHtml")()) +
			`</div> <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> </div> `
	
	exports['input/decision/decision-modification'] = (get, $t) => 
			` <div class='decision-tree-mod-cnt'> <div class='then-add-cnt'> <button hidden class='then-btn modify-edit' mod-id='1'> Then... </button> <button hidden class='add-btn modify-edit'mod-id='4'>Add Input</button> </div> <div hidden class='if-edit-cnt'> <button class='edit-btn modify-edit' mod-id='2'> <i class="fas fa-pencil-alt"></i> </button> <button class='conditional-btn modify-edit' mod-id='3'> If </button> </div> <div hidden class='then-cnt tab modify-edit' mod-id='1'>Then Html!</div> <div hidden class='condition-cnt tab modify-edit' mod-id='3'>Condition Tree Html!</div> <div hidden class='rm-edit-cnt modify-edit' mod-id='2'> <div class='edit-cnt'>Edit Tree Html!</div> <button class='modiy-rm-input-btn'>Remove</button> </div> <div hidden class='add-cnt tab modify-edit' mod-id='4'> Add Input Html! </div> <div class='remove-btn-cnt' hidden> <button class='rm-node modify-edit'>X</button> </div> <div class='close-cnts' hidden><button class='modify-edit'>X</button></div> </div> `
	
	exports['expandable/top-add-list'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> <div class='expand-input-cnt' hidden has-input-tree='` +
			$t.clean(get("hasInputTree")()) +
			`'>` +
			$t.clean(get("inputHtml")()) +
			`</div> <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> ` +
			$t.clean( new $t('1447370576').render(get("list")(), 'key, item', get)) +
			` </div> `
	
	exports['input/decision/decision'] = (get, $t) => 
			` <div class='decision-input-cnt card` +
			$t.clean(get("inputArray")().length === 0 ? ' empty' : '') +
			`' node-id='` +
			$t.clean(get("id")()) +
			`' recursion="disabled"> <span id='` +
			$t.clean(get("id")()) +
			`'> <div class='payload-cnt'>` +
			$t.clean(get("payloadHtml")()) +
			`</div> ` +
			$t.clean(get("inputArray")().length === 0 ? '<br><br>' : '') +
			` ` +
			$t.clean( new $t('-1551174699').render(get("inputArray")(), 'input', get)) +
			` <div class='orphan-cnt tab'>` +
			$t.clean(get("childrenHtml")()) +
			`</div> </span> </div> `
	
	exports['-1551174699'] = (get, $t) => 
			`<div class='decision-input-array-cnt pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` </div>`
	
	exports['input/decision/decisionTree'] = (get, $t) => 
			`<div class='` +
			$t.clean(get("node").tree().class()) +
			` ` +
			$t.clean(get("DecisionInputTree").class) +
			`' tree-id='` +
			$t.clean(get("node").tree().id()) +
			`' input-id='` +
			$t.clean(get("node").tree().id()) +
			`' node-id='` +
			$t.clean(get("node").id()) +
			`'> ` +
			$t.clean(get("header")) +
			` ` +
			$t.clean(get("inputHtml")) +
			` <div ` +
			$t.clean(get("node").tree().hideButton ? 'hidden' : '') +
			`> <br> <button class='` +
			$t.clean(get("node").tree().buttonClass()) +
			` ` +
			$t.clean(get("DecisionInputTree").buttonClass) +
			`' tree-id='` +
			$t.clean(get("node").tree().id()) +
			`'> ` +
			$t.clean(get("node").tree().buttonText()) +
			` </button> </div> </div> `
	
	exports['input/edit/input'] = (get, $t) => 
			`<div class='input-edit-cnt' input-ref-id='` +
			$t.clean(get("input").id()) +
			`'> <label>Label</label> <input type='text' attr='label' value='` +
			$t.clean(get("input").label()) +
			`'/> <br> <label>Name</label> <input type='text' attr='name' value='` +
			$t.clean(get("input").name()) +
			`'/> <br> <label ` +
			$t.clean(get("input").list().length === 0 ? 'hidden' : '') +
			`>List</label> <div class='tab edit-input-list-cnt relative'> ` +
			$t.clean( new $t('1088583088').render(get("input").list(), 'key, value', get)) +
			` </div> <br> </div> `
	
	exports['input/edit/list/object'] = (get, $t) => 
			`<div class='edit-input-list-obj tab'> ` +
			$t.clean( new $t('-2045511556').render(get("scope"), 'key, value', get)) +
			` </div> `
	
	exports['-2045511556'] = (get, $t) => 
			`<div > <input type='text' value='` +
			$t.clean(get("key")) +
			`'/> = <input type='text' value='` +
			$t.clean(get("value")) +
			`'/> </div>`
	
	exports['input/edit/list/string'] = (get, $t) => 
			`<input type='text' name='value' value='` +
			$t.clean(get("value")) +
			`'/> `
	
	exports['input/edit/table'] = (get, $t) => 
			`<div class='input-edit-cnt' input-ref-id='` +
			$t.clean(get("table").id()) +
			`'> <label>Label</label> <input type='text' attr='label' value='` +
			$t.clean(get("table").label()) +
			`'/> <br> <label>Name</label> <input type='text' attr='name' value='` +
			$t.clean(get("table").name()) +
			`'/> <br> <div class='table-column-edit-cnt'> <label ` +
			$t.clean(get("table").columns().length === 0 ? 'hidden' : '') +
			`>Columns</label> ` +
			$t.clean(get("listHtml")(get("table").columns())) +
			`; <button id='table-column-edit-btn'>Apply</button> </div> <div class='table-row-edit-cnt'> <label ` +
			$t.clean(get("table").rows().length === 0 ? 'hidden' : '') +
			`>Rows</label> ` +
			$t.clean(get("listHtml")(get("table").rows())) +
			`; <button id='table-row-edit-btn'>Apply</button> </div> <br> </div> `
	
	exports['input/input'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <input class='` +
			$t.clean(get("class")()) +
			`' list='input-list-` +
			$t.clean(get("id")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' placeholder='` +
			$t.clean(get("placeholder")()) +
			`' type='` +
			$t.clean(get("type")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`' ` +
			$t.clean(get("attrString")()) +
			` ` +
			$t.clean(get("checked")()) +
			`> <datalist id="input-list-` +
			$t.clean(get("id")()) +
			`"> ` +
			$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
			` </datalist> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/list'] = (get, $t) => 
			`<div class='input-cnt` +
			$t.clean(get("inline")() ? ' inline' : '') +
			`'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> ` +
			$t.clean( new $t('1682356664').render(get("list")(), 'input', get)) +
			` <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </div> `
	
	exports['input/multiple-entries'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt multi'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <div class='multiple-entry-cnt tab card ` +
			$t.clean(get("inline")() ? 'inline' : '') +
			`' id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('1507176312').render(get("list")(), 'inputArray', get)) +
			` </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/measurement'] = (get, $t) => 
			`<div class='fit input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <input class='measurement-input ` +
			$t.clean(get("class")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' value='` +
			$t.clean(get("value")() ? get("value")() : "") +
			`' placeholder='` +
			$t.clean(get("placeholder")()) +
			`' type='` +
			$t.clean(get("type")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`'> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </div> `
	
	exports['input/number'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <input class='` +
			$t.clean(get("class")()) +
			`' list='input-list-` +
			$t.clean(get("id")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' placeholder='` +
			$t.clean(get("placeholder")()) +
			`' type='number' name='` +
			$t.clean(get("name")()) +
			`' max='` +
			$t.clean(get("max")()) +
			`' min='` +
			$t.clean(get("min")()) +
			`' step='` +
			$t.clean(get("step")()) +
			`'> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/object'] = (get, $t) => 
			`<div class='input-cnt` +
			$t.clean(get("inline")() ? ' inline' : '') +
			`'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> ` +
			$t.clean( new $t('1682356664').render(get("list")(), 'input', get)) +
			` <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </div> `
	
	exports['input/one-entry'] = (get, $t) => 
			`<span class='one-entry-cnt'> ` +
			$t.clean(get("html")()) +
			` </span> `
	
	exports['input/radio-table'] = (get, $t) => 
			`<div class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <br> <div class='tab'> <table border="1"> <tbody> <tr> <td></td> ` +
			$t.clean( new $t('1254550278').render(get("columns")(), 'name', get)) +
			` </tr> ` +
			$t.clean( new $t('-44250289').render(get("rowDetail")(), 'row', get)) +
			` </tbody> </table> </div> </div> `
	
	exports['-54469610'] = (get, $t) => 
			`<td class='radio-table-input-cnt' > <input type='radio' name='` +
			$t.clean(get("row").name) +
			`' key='` +
			$t.clean(get("row").key) +
			`' value='` +
			$t.clean(get("col")) +
			`' ` +
			$t.clean(get("row").value === get("col") ? 'checked' : '') +
			`/> </td>`
	
	exports['-44250289'] = (get, $t) => 
			`<tr > <td>` +
			$t.clean(get("row").label) +
			`</td> ` +
			$t.clean( new $t('-54469610').render(get("columns")(get("rowIndex")), 'col', get)) +
			` </tr>`
	
	exports['input/radio'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")() ? get("label")() +
			':' : '') +
			`</label> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <div class='inline tab'> ` +
			$t.clean( new $t('-2140138526').render(get("list")(), 'key, val', get)) +
			` </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['-2140138526'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("isArray")() ? get("val") : get("key")) +
			`</label> <input type='radio' ` +
			$t.clean((get("isArray")() ? get("val") : get("key")) === get("value")() ? 'checked' : '') +
			` class='` +
			$t.clean(get("class")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' name='` +
			$t.clean(get("uniqueName")()) +
			`' value='` +
			$t.clean(get("val")) +
			`'> &nbsp;&nbsp; </span>`
	
	exports['input/select'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <select class='` +
			$t.clean(get("class")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`' value='` +
			$t.clean(get("value")()) +
			`'> ` +
			$t.clean( new $t('1835219150').render(get("list")(), 'key, value', get)) +
			` </select> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/table'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <br> <div class='tab'> <table border="1"> <tbody> <tr> <td></td> ` +
			$t.clean( new $t('1254550278').render(get("columnNames")(), 'name', get)) +
			` </tr> ` +
			$t.clean( new $t('-808712670').render(get("rows")(), 'rowIndex, row', get)) +
			` </tbody> </table> </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['-808712670'] = (get, $t) => 
			`<tr > <td>` +
			$t.clean(get("row")) +
			`</td> ` +
			$t.clean( new $t('976176139').render(get("columns")(get("rowIndex")), 'col', get)) +
			` </tr>`
	
	exports['input/textarea'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <br> <textarea class='` +
			$t.clean(get("class")()) +
			`' list='input-list-` +
			$t.clean(get("id")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' placeholder='` +
			$t.clean(get("placeholder")()) +
			`' type='` +
			$t.clean(get("type")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`' ` +
			$t.clean(get("attrString")()) +
			`></textarea> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['ancestry'] = (get, $t) => 
			`<div> <button id='modify-btn'>Modify</button> </div> <div id='config-body'></div> <div id='test-ground'></div> `
	
	exports['configure'] = (get, $t) => 
			`<div> <button id='update-tree-display-btn'>Update</button> <button class='modify-edit' id='modify-btn'>Modify</button> </div> <div id='config-body'></div> <div> <br> <br> <div style='display: inline-block'> <textarea id='json-data'></textarea> <br> <button id="copy">Copy</button> <button id='paste' class='modify-edit' style='float:right'>Paste</button> <br><br> <button id="save" class='modify-edit'>Save</button> </div> </div> `
	
	exports['index'] = (get, $t) => 
			`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <script type="text/javascript" src='/mitch/js/index.js'></script> <script src="https://kit.fontawesome.com/234ae94193.js" crossorigin="anonymous"></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/styles/icons.css"> <link rel="stylesheet" href="/mitch/styles/mitch.css"> <title></title> </head> <body> ` +
			$t.clean(get("header")) +
			` ` +
			$t.clean(get("main")) +
			` ` +
			$t.clean(get("footer")) +
			` </body> </html> `
	
	exports['playground'] = (get, $t) => 
			`<div> <button id='update-tree-display-btn'>Update</button> <button id='modify-btn'>Modify</button> </div> <div id='config-body'></div> <div id='test-ground'></div> `
	
	exports['report'] = (get, $t) => 
			`<div> REPORT === ` +
			$t.clean(get("name")) +
			` </div> `
	
	exports['reports'] = (get, $t) => 
			`<div> REPORTS === ` +
			$t.clean(get("name")) +
			` </div> `
	
});


RequireJS.addFunction('./app/app.js',
function (require, exports, module) {
	const $t = require('../../../public/js/utils/$t.js');
	$t.loadFunctions(require('../generated/html-templates'));
	
	require('../../../public/js/utils/utils.js');
	// Run Tests
	// require('../tests/run');
	
	const du = require('../../../public/js/utils/dom-utils.js');
	
	let url = du.url.breakdown().path;
	url = url.replace(/^\/mitch/, '');
	
	const pageJs = require(`./pages${url}`);
	pageJs.proccess();
	
});


RequireJS.addFunction('./app/pages/configure.js',
function (require, exports, module) {
	
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const ModDecisionTree = require('../../../../public/js/utils/input/decision/modification.js');
	const PayloadHandler = require('../../../../public/js/utils/input/decision/payload-handler.js');
	require('../../../../public/js/utils/input/init');
	const Input = require('../../../../public/js/utils/input/input');
	const Radio = require('../../../../public/js/utils/input/styles/radio');
	const Table = require('../../../../public/js/utils/input/styles/table');
	const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
	const du = require('../../../../public/js/utils/dom-utils.js');
	const request = require('../../../../public/js/utils/request');
	
	let count = 0;
	let mod;
	let modify = true;
	
	du.on.match('click', '#modify-btn', (elem) => {
	  mod.toggle();
	  du.id('save').hidden = !mod.active();
	  if (mod.active()) du.class.add(elem, 'modify-edit');
	  else du.class.remove(elem, 'modify-edit');
	  // updateEntireTree();
	});
	
	const getInput = () => new Input({
	  label: `Label${++count}`,
	  name: `Name${count}`,
	  inline: true,
	  class: 'center',
	});
	
	const sectionName = new Input({
	  label: `Section Name`,
	  name: `sectionName`,
	  inline: true,
	  class: 'center',
	  validation: () => true
	});
	
	let tree;
	const ph = new PayloadHandler("{{sectionName}}", sectionName);
	function updateEntireTree() {
	  const body = tree.html(null, modify);
	  du.id('config-body').innerHTML = body;
	}
	
	du.on.match('click', '#update-tree-display-btn', (elem) => {
	  updateEntireTree();
	  mod.hideAll();
	});
	
	
	function proccess() {
	  const input1 = getInput();
	  const input2 = getInput();
	  const input3 = getInput();
	
	  request.get('/json/configure.json', (json) => {
	    try {
	      json.noSubmission = true;
	      tree = DecisionInputTree.fromJson(json);
	    } catch {
	      tree = new DecisionInputTree('Questionaire', {name: 'Questionaire', noSubmission: true});
	    }
	    tree.payloadHandler(ph);
	
	    tree.onComplete(console.log);
	    tree.onSubmit(console.log);
	
	    updateEntireTree();
	    mod = new ModDecisionTree(tree);
	  });
	}
	
	du.on.match('click', '#paste', (elem) => {
	  du.paste.json(elem, (t) => {
	    tree = t;
	    updateEntireTree();
	    tree.payloadHandler(ph);
	  });
	});
	du.on.match('click', '#copy', (elem) => {
	  const texta = du.find.closest('textarea', elem);
	  texta.value = JSON.stringify(tree.toJson(), texta, 2);
	  du.copy(texta);
	});
	du.on.match('click', '#save', () => {
	  if (confirm('Are you sure you want to save?')) {
	    request.post('/save/json', {name: 'configure', json: tree.toJson()}, console.log, console.error);
	  }
	  mod.hideAll();
	});
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./app/pages/ancestry.js',
function (require, exports, module) {
	
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const PayloadHandler = require('../../../../public/js/utils/input/decision/payload-handler.js');
	require('../../../../public/js/utils/input/init');
	const Input = require('../../../../public/js/utils/input/input');
	const Radio = require('../../../../public/js/utils/input/styles/radio');
	const Table = require('../../../../public/js/utils/input/styles/table');
	const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
	const du = require('../../../../public/js/utils/dom-utils.js');
	
	let count = 0;
	let modify = true;
	
	du.on.match('click', '#modify-btn', (elem) => {
	  modify = !modify
	  if (modify) du.class.add(elem, 'modify-edit');
	  else du.class.remove(elem, 'modify-edit');
	  // updateEntireTree();
	});
	
	const getInput = () => new Input({
	  label: `Label${++count}`,
	  name: `Name${count}`,
	  inline: true,
	  class: 'center',
	});
	
	let tree;
	function updateEntireTree() {
	  const body = tree.html(null, modify);
	  du.id('config-body').innerHTML = body;
	}
	
	
	
	function proccess() {
	  const input1 = getInput();
	  const input2 = getInput();
	  const input3 = getInput();
	  // tree = new DecisionInputTree('ancestry', {name: 'Ancestry'});
	  tree = DecisionInputTree.fromJson(treeJson);
	  tree.payloadHandler(new PayloadHandler('ancestry', new Input({name: 'name', label: 'Name', optional: true})));
	
	  tree.onComplete(console.log);
	  tree.onSubmit(console.log);
	
	  updateEntireTree();
	}
	
	du.id('test-ground').innerHTML = '<button id="json">JSON</button>';
	du.on.match('click', '#json', () => {
	  du.copy(JSON.stringify(tree.toJson(), null, 2));
	})
	
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./app/pages/playground.js',
function (require, exports, module) {
	
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const ModDecisionTree = require('../../../../public/js/utils/input/decision/modification.js');
	const PayloadHandler = require('../../../../public/js/utils/input/decision/payload-handler.js');
	require('../../../../public/js/utils/input/init');
	const Input = require('../../../../public/js/utils/input/input');
	const Radio = require('../../../../public/js/utils/input/styles/radio');
	const Table = require('../../../../public/js/utils/input/styles/table');
	const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
	const du = require('../../../../public/js/utils/dom-utils.js');
	
	let count = 0;
	let mod;
	let modify = true;
	
	du.on.match('click', '#modify-btn', (elem) => {
	  mod.toggle();
	
	  if (mod.active()) du.class.add(elem, 'modify');
	  else du.class.remove(elem, 'modify');
	  // updateEntireTree();
	});
	
	const getInput = () => new Input({
	  label: `Label${++count}`,
	  name: `Name${count}`,
	  inline: true,
	  class: 'center',
	});
	
	let tree;
	function updateEntireTree() {
	  const body = tree.html(null, modify);
	  du.id('config-body').innerHTML = body;
	}
	
	du.on.match('click', '#update-tree-display-btn', (elem) => {
	  updateEntireTree();
	});
	
	function proccess() {
	  const input1 = getInput();
	  const input2 = getInput();
	  const input3 = getInput();
	  // tree = new DecisionInputTree('Questionaire', {name: 'Questionaire'});
	  tree = DecisionInputTree.fromJson(treeJson);
	  // const ph = new PayloadHandler("<button class='mod-decision-node'>Modify</button>");
	  // tree.payloadHandler(ph);
	
	  tree.onComplete(console.log);
	  tree.onSubmit(console.log);
	
	  updateEntireTree();
	  mod = new ModDecisionTree(tree);
	}
	
	
	du.id('test-ground').innerHTML = '<button id="json">JSON</button>';
	du.on.match('click', '#json', () => {
	  du.copy(JSON.stringify(tree.toJson(), null, 2));
	})
	
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./app/pages/report.js',
function (require, exports, module) {
	
function proccess() {
	  console.log('report bitches');
	}
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./app/pages/reports.js',
function (require, exports, module) {
	
function proccess() {
	  console.log('reports bitches');
	}
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./tests/run.js',
function (require, exports, module) {
	

	
	const Test = require('../../../public/js/utils/test/test').Test;
	
	require('../../../public/js/utils/test/tests/lookup');
	require('../../../public/js/utils/test/tests/decision-tree');
	require('../../../public/js/utils/test/tests/decision-input-tree');
	
	Test.run();
	
});


window.onload = () => RequireJS.init('app/app.js')
