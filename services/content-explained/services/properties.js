
class Properties {
  constructor(obj) {
    this.get = function (id) {
      const path = id.split('.');
      let currValue = obj;
      for (let index = 0; currValue && index < path.length; index += 1) {
        currValue = currValue[path[index]];
      }
      return (typeof currValue) === 'object' ?
                JSON.parse(JSON.stringify(currValue)) : currValue;
    }
  }
}
