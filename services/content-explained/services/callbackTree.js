
class CallbackTreeRootInvalid extends Error {
  constructor() {
    super(`The root of a CallbackTree must be another CallbackTree.`);
    this.name = "CallbackTreeRootInvalid";
  }
}

class CallbackTreeLeafNotDefined extends Error {
  constructor(root, leaf) {
    super(`Within CallbackTree '${root}' leaf '${leaf} does not exist.'`);
    this.name = "CallbackTreeLeafNotDefined";
  }
}

class CallbackTree {
  constructor(func, id, ...args) {
    if (func === undefined) throw new Error('func must be defined');
    let root, resolve, promise;
    this.name = id;
    let lastPath = '';
    const instance = this;
    const terminationPoints = [];
    const references = {};
    let paths;
    let funcs = {};
    let cbTrees = {};
    let context;

    this.options = () => funcs;
    this.getContext = () => context;
    this.setContext = (c) => {
      if (root) {
        instance.getRoot().setContext(context);
      } else {
        context = c;
      }
    }
    this.setRef = (key, value) => references[key] = value;
    this.getRef = (key) => references[key];

    function retInterface (inst) {
      const root = instance.getRoot();
      const retInt = root.options();
      retInt.execute = root.execute;
      retInt.terminate = inst ? root.terminate(inst) : undefined;
      return retInt;
    }

    this.terminate = function (cbTree, retValue) {
      if (arguments.length === 2) {
        if (terminationPoints.indexOf(cbTree) !== -1) {
          resolve(retValue);
        }
      } else {
        return function () {
          terminationPoints.push(cbTree);
          return retInterface();
        }
      }
    };

    this.getLastPath = function () {return lastPath;};
    this.getPromise = function () {return promise;};

    function setLeaf(setFunc, target, func, id, ...args) {
      if ((target instanceof Error || (typeof target) === 'function') &&
            ((typeof func) === 'string' || func === undefined)) {
        args = [id].concat(args);
        id = func;
        func = target;
        target = undefined;
      }
      let leaf = instance.getRoot();
      if (instance.find(id, true) !== undefined) throw new Error(`id '${id}' already exists within callback tree`);
      if (target !== undefined) leaf = instance.find(target);
      const cbTree = new CallbackTree(func, id, ...args);
      cbTree.setRoot(instance.getRoot());
      cbTree.setPaths(getRoot().getPaths());
      leaf[setFunc](cbTree);
      return retInterface(cbTree);
    }

    function info(key, value) {
      if (instance.debug) {
        if (instance.logger) {
          const info = {
            rootId: instance.getRoot().getId(),
            id: instance.getId(),
            key, value
          }
          instance.logger(info);
        } else {
          console.log(`Executing CallbackTree '${instance.getRoot().getId()}' on leaf '${instance.getId()}'.` +
              `\t\t${key} = ${value}`);
        }
      }
    }

    function callbackFunctions(callback) {
      const cbFuncs = [];
      cbTrees.forEach((cbTree, i) => {
        let func;
        if (callback instanceof CallbackTree) {
          func = () => {
            info(`'${i}' path called`, true);
            callback.execute(...arguments)
        };
        } else {
          func = () => info(`'${i}' path undefined`, true);
        }
        func.cbTreeContext = getContext();
        cbFuncs.push(func);
      });
      return cbFuncs;
    }
    this.addPath = function (value) {
      if (this.isRoot()) {
        lastPath += `${value}->`
      } else {
        instance.getRoot().addPath(instance.getId());
      }
    }

    function objectStrPath (obj, path) {
      path = path.split('.').filter((value) => value !== '' )
      for (let index = 0; index < path.length; index += 1) {
        if (obj === undefined) {
          return undefined;
        }
        obj = obj[path[index]]
      }
      return obj;
    }

    const argReg = /^\$cbtArg\[([0-9]*)\]((\.[a-zA-Z0-9\.]*|)$)/;
    const refReg = /^\$cbtArg\.([a-zA-Z0-9]*|)$/
    const refAssignReg = /^\$cbtArg\.([a-zA-Z0-9]*|) = \$cbtArg\[([0-9]*)\]((\.[a-zA-Z0-9\.]*|)$)/
    function renderArg(tempArgs, args, index) {
      const arg = args[index];
      if ((typeof arg) !== 'string') return args[index];
      let match = arg.match(argReg);
      if (match) {
        return objectStrPath(tempArgs[match[1]], match[2]);
      }

      match = arg.match(refReg)
      if (match) {
        return instance.getRoot().getRef(match[1]);
      }

      match = arg.match(refAssignReg);
      if (match) {
        const value = objectStrPath(tempArgs[match[2]], match[3]);
        instance.getRoot().setRef(match[1], value);
        return value;
      }

      return args[index];
    }

    this.setArgs = function (...newArgs) {args = newArgs};
    this.execute = function () {
      info('exicute', true);
      if (instance.isRoot()) {
        lastPath = '';
        promise = new Promise(r => resolve = r)
        instance.addPath(instance.getId());
      } else {
        instance.addPath()
      }

      let tempArgs = Array.from(arguments);
      if (args.length > 0 && args[0] !== undefined) {
        tempArgs = [];
        Array.from(args).map(
          (value, index) => tempArgs.push(renderArg(arguments, args, index)));
      }
      const rt = instance.getRoot();
      if (func instanceof Error) throw func;
      else if((typeof func) === 'string') func = instance.find(func);
      else {
        tempArgs = tempArgs.concat(callbackFunctions());
        let retVal = func(...tempArgs);

        rt.terminate(instance, retVal);
        return rt.getPromise();
      }
    }

    function funcName(prefix, value) {
      return `${prefix}${value.substr(0,1).toUppercase()}${value.substr(1)}`;
    }

    this.setPaths = (p) => {
      paths.forEach((p) => instance[path] = undefined);
      if (Array.isArray(p)) {
        paths = p;
      }
      funcs = {};
      paths.forEach((path) => {
        const setterName = funcName('set', path);
        instance[setterName] = (cbTree) => cbTrees[path] = cbTree;
        instance[funcName('get', path)] = (cbTree) => cbTrees[path] = cbTree;
        funcs[path] = (target, func, id, ...args) => setLeaf(setterName, target, func, id, ...args);
      };
    }

    this.getPaths = () => paths;

    this.find = function (stringOrFunc, soft) {
      const found = instance.getRoot().findChild(stringOrFunc);
      // console.log('looking for:', stringOrFunc, ' found:', found);
      if (!soft && found === undefined) throw new CallbackTreeLeafNotDefined(instance.getRoot, stringOrFunc);
      return found;
    }
    this.setRoot = function (callbackTree) {
      if (!callbackTree instanceof CallbackTree) {
        throw new CallbackTreeRootInvalid();
      }
      root = callbackTree;
    }
    this.getRoot = function () {return root || instance;};
    this.isRoot = function () {return instance === instance.getRoot();};
    this.findChild = function (stringOrFunc) {
      let found;
      const idsMatch = (typeof stringOrFunc) === 'string' &&
                        id === stringOrFunc;
      const funcsMatch = (typeof stringOrFunc) === 'function' &&
                        func === stringOrFunc;;
      if (idsMatch || funcsMatch) {
        found = instance;
      }

      Object.values(callbackTrees)
          .forEach((cbTree) => found = found || cbTree.findChild(stringOrFunc));
      return found;
    }
    this.setPaths(['success', 'fail']);
  }
}

exports.CallbackTree = CallbackTree;
