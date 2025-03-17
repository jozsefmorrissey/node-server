let Imposter;

class Section {
  constructor(parentId,  id) {
    let total = 0;
    let calls = 0;
    let starts = {};

    this.timeRatio = (allSectionTime) => allSectionTime ? Math.roundTo(total*100/allSectionTime, .01) : '';
    this.toString = (allSectionTime) => `${id}) ${total/1000} (${this.timeRatio(allSectionTime)}%) Called:${calls}`;
    this.start = (hash) => {
      if (starts[hash])
        throw new Error(`Starting ${parentId}-${this} section before the previous start was ended`);
      calls++;
      starts[hash] = new Date().getTime();
    }
    this.end = (hash) => {
      if (!starts[hash]) throw new Error(`Attempting to end ${parentId}-${this} section that was never started`);
      total += new Date().getTime() - starts[hash];
      delete starts[hash];
    }
    this.total = () => total;
  }
}

/* Example Use:
      const ct = new CompTime('drawLayout');
      ct.start(1);
      ct.endStart(1, 2);
      ct.endStart(2, 3);
      ct.end(3);
*/
let compTimes = {};
CompTime = function (identifier, startId) {
  if (!compTimes[identifier]) {
    const sections = {};
    const start = new Date().getTime();
    this.time = () => (new Date().getTime() - start);
    this.total = () => Object.values(sections).sum(s => s.total());
    this.start = (id, hash) => (sections[id] || (sections[id] = new Section(identifier, id))).start(hash);
    this.end = (id, hash) => sections[id].end(hash) & this.print.lastCall(identifier, 1000);
    this.endStart = (endId, startId) => this.end(endId) & this.start(startId);
    this.toString = () => `${identifier}\n` + Object.values(sections).sortByAttr('total')
                                  .map(s => `\t${s.toString(this.total())}`).join('\n')
                                  + `\nTotal: ${this.total()/1000}`
                                  + `\nTime Alive: ${this.time()/1000}\n`;
    this.print = () => console.log(this.toString());

    this.function = (obj, funcKey, id) => {
      if (!id) id = funcKey;
      const info = obj.pathInfo(funcKey);
      try {
        const func = info.value;
        info.parent[info.attr] = (...args) => {
          try {
            const callHash = String.random().hash();
            this.start(id, callHash);
            const retVal = func.apply(obj, args);
            this.end(id, callHash);
            return retVal;
          } catch (e) {
            console.warn(e);
            return func.apply(obj, args);
          }
        };
        allKeys(func).forEach(k => info.parent[info.attr][k] = func[k]);
      } catch(e) {
        console.warn(e);
      }
    }

    compTimes[identifier] = this;
  }
  if (startId) compTimes[identifier].start(startId);
  return compTimes[identifier];
}

const allKeys = (obj) => {
  const allKeys = Object.keys(obj);
  if ((typeof obj) !== 'function') {
    allKeys.concatInPlace(Object.keys(obj.__proto__));
    allKeys.concatInPlace(Object.getOwnPropertyNames(obj));
  }
  return allKeys;
}

const functionKeys = (obj, prefix) => {
  if (!obj) return [];
  const funcKeys =  allKeys(obj).filter(k => (typeof obj[k]) === 'function');

  return funcKeys.map(k => prefix ? `${prefix}.${k}` : k);
}

CompTime.object = (obj, ...funcKeys) => {
  if (funcKeys.length === 0) funcKeys = functionKeys(obj);
  const ct = new CompTime(obj.constructor.name);
  for (let i = 0; i < funcKeys.length; i++) {
    const k = funcKeys[i];
    ct.function(obj, k);
  }
}
