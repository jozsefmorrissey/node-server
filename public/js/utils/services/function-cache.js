
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
