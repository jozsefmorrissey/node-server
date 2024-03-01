
const cacheState = {};

class FunctionCache {
  constructor(func, context, group, argumentEndIndex) {
    if ((typeof func) !== 'function') return func;
    let cache = {};
    let awaitingClear = false;
    function cacheFunc() {
      lastGroupCall[cacheFunc.group()] = new Date().getTime();
      if (FunctionCache.isOn(cacheFunc.group())) {
        let c = cache;
        const endIndex = argumentEndIndex || arguments.length;
        for (let index = 0; index < endIndex; index += 1) {
          if (c[arguments[index]] === undefined) c[arguments[index]] = {};
          c = c[arguments[index]];
        }

        if (c.__FunctionCache === undefined) {
          FunctionCache.notCahed++
          c.__FunctionCache = func.apply(context, arguments);
          if (!awaitingClear) {
            setTimeout(cacheFunc.clearCache, cacheFunc.timer());
          }
        } else FunctionCache.cached++;
        return c.__FunctionCache;
      }
      FunctionCache.notCahed++
      return func.apply(context, arguments);
    }

    cacheFunc.context = () => context;
    cacheFunc.cache = () => cache;
    cacheFunc.timer = (group) => timers[group] || 200;

    cacheFunc.group = () => {
      const gp = (typeof group === 'function') ? group() : group || 'global';
      return gp;
    }

    cacheFunc.clearCache = () => ((cache = {}) && (awaitingClear = false)) || cacheFunc;

    return cacheFunc;
  }
}

const timers = {};
const lastGroupCall = {};
// async function toggleAt() {
//   const groups = Object.keys(timers);
//   const currTime = new Date().getTime();
//   for (let index = 0; index < groups.length; index++) {
//     const group = groups[index];
//     const itIsTime = lastGroupCall[group] < currTime - timers[group];
//     const firstTime = lastGroupCall[group] === undefined;
//     if (firstTime || itIsTime) {
//       lastGroupCall[group] = currTime;
//     }
//   }
//   setTimeout(toggleAt, 300);
// }
// toggleAt();

FunctionCache.cached = 0;
FunctionCache.notCahed = 0;
FunctionCache.on = (group, time) => {
  if (time) {
    const run = timers[group] === undefined;
    timers[group] = time;
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
}
let disabled = false;
FunctionCache.isOn = (group) => group === 'alwaysOn' || (!disabled && cacheState[group]);
FunctionCache.disable = () => disabled = true;
FunctionCache.enable = () => disabled = false;
module.exports = FunctionCache;
