
const cacheState = {};
const cacheFuncs = {};

class FunctionCache {
  constructor(func, context, group) {
    if ((typeof func) !== 'function') return func;
    let cache = {};
    function cacheFunc() {
      lastGroupCall[cacheFunc.group()] = new Date().getTime();
      if (FunctionCache.isOn(cacheFunc.group())) {
        let c = cache;
        for (let index = 0; index < arguments.length; index += 1) {
          if (c[arguments[index]] === undefined) c[arguments[index]] = {};
          c = c[arguments[index]];
        }

        if (c.__FunctionCache === undefined) {
          FunctionCache.notCahed++
          c.__FunctionCache = func.apply(context, arguments);
        } else FunctionCache.cached++;
        return c.__FunctionCache;
      }
      FunctionCache.notCahed++
      return func.apply(context, arguments);
    }

    cacheFunc.group = () => {
      const gp = (typeof group === 'function') ? group() : group || 'global';
      if (cacheFuncs[gp] === undefined) cacheFuncs[gp] = [];
      return gp;
    }

    // Allow for bad programing to set variables...
    setTimeout(() => {
      cacheFuncs[cacheFunc.group()].push(cacheFunc);
    });

    cacheFunc.clearCache = () => cache = {};

    return cacheFunc;
  }
}

function clearCache(group) {
  if (cacheFuncs[group] !== undefined)
    cacheFuncs[group].forEach((func) => func.clearCache());
}

FunctionCache.clear = clearCache;
FunctionCache.clearAllCaches = (group) => {
  Object.keys(cacheFuncs).forEach(group => clearCache(group));
}

const timers = {};
const lastGroupCall = {};
function toggleAt(group) {
  setTimeout(() => {
    if (lastGroupCall[group] < new Date().getTime() - timers[group]) {
      clearCache(group);
    }
    toggleAt(group);
  }, timers[group]);
}

FunctionCache.cached = 0;
FunctionCache.notCahed = 0;
FunctionCache.on = (group, time) => {
  if (time) {
    const run = timers[group] === undefined;
    timers[group] = time;
    if (run) toggleAt(group);
  }
  FunctionCache.cached = 0;
  FunctionCache.notCahed = 0;
  cacheState[group] = true;
}
FunctionCache.off = (group, print) => {
  if (print) {
    const cached = FunctionCache.cached;
    const total = FunctionCache.notCahed + cached;
    const percent = (cached / total) * 100;
    console.log(`FunctionCache report: ${cached}/${total} %${percent}`);
  }
  cacheState[group] = false;
  clearCache(group);
}
let disabled = false;
FunctionCache.isOn = (group) => group === 'alwaysOn' || (!disabled && cacheState[group]);
FunctionCache.disable = () => disabled = true;
FunctionCache.enable = () => disabled = false;
module.exports = FunctionCache;
