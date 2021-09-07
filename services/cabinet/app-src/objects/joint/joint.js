



class Joint {
  constructor(joinStr) {
    const match = joinStr.match(Joint.regex);
    this.malePartCode = match[1];
    this.femalePartCode = match[2];

    this.updatePosition = () => {};

    this.getFemale = () => this.parentAssembly.getAssembly(this.femalePartCode);
    this.getMale = () => this.parentAssembly.getAssembly(this.malePartCode);

    this.maleOffset = () => 0;
    this.femaleOffset = () => 0;
    this.setParentAssembly = (pa) => this.parentAssembly = pa;

    this.getDemensions = () => {
      const malePos = getMale();
      const femalePos = getFemale();
      // I created a loop but it was harder to understand
      return undefined;
    }

    if (Joint.list[this.malePartCode] === undefined) Joint.list[this.malePartCode] = [];
    if (Joint.list[this.femalePartCode] === undefined) Joint.list[this.femalePartCode] = [];
    Joint.list[this.malePartCode].push(this);
    Joint.list[this.femalePartCode].push(this);
  }
}
Joint.list = {};
Joint.regex = /([a-z0-1\.]{1,})->([a-z0-1\.]{1,})/;

Joint.classes = {};
Joint.register = (clazz) =>
  Joint.classes[clazz.prototype.constructor.name] = clazz;
Joint.new = function (id) {
  return new Joint.classes[id](...Array.from(arguments).slice(1));
}
module.exports = Joint




