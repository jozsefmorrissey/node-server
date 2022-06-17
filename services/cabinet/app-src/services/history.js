
class History {
  constructor() {
    let changes = [];
    let changesIndex = [];

      this.addChange = (forward, back) => {
        changes = changes.slice(0, changesIndex);
        changes.push({forward, back});
        changesIndex++;
      }

    this.getSet = (obj, initialVals, ...attrs) => {
      attrs = Object.getSet(obj, initialVals, ...attrs);
      const objFuncs = {};
      attrs.forEach((attr) => {
        objFuncs[attr] = obj[attr];
        obj[attr] = (value) => {
          if (value !== undefined) {
            const oldValue = objFuncs[attr]();
            const back = () => objFuncs[attr](oldValue);
            const forward = () => objFuncs[attr](value);
            this.addChange(obj, forward, back);
          }
          return objFuncs[attr](value);
        }
      });
    }

    this.undo = () => {
      const change = changes[--changesIndex];
      change.back();
    }

    this.redo = () => {
      const change = changes[++changesIndex];
      change.forward();
    }

    this.canUndo =() => changesIndex > 0;
    this.canRedo = () => changeIndex < changes.length - 1;
  }
}

module.exports = History;
