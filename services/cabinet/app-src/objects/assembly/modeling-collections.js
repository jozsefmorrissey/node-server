
const userDefinedReg = /^[^_^:]{1,}?_([^_^:]*$|AUTOTK_OpenTK:)/;
class ModelingCollections {
  constructor(assem) {
    const Assembly = ModelingCollections.Assembly;
    this.physical = () => {
      return assem.getSubassemblies().filter((a) => {
        if (!(a instanceof Assembly && a.included() && a.part())) return false;
        if (a.locationCode().match(userDefinedReg)) return !a.composite();
        return a.outline() === false;
      });
    };
    this.physical.outline = () => {
      return assem.getSubassemblies().filter((a) => {
        if (!(a instanceof Assembly && a.included() && a.part())) return false;
        if (a.allModels()) return true;
        if (a.locationCode().match(userDefinedReg)) return true;
        return a.outline() === true;
      });
    };
    this.physical.simple = () => {
      return assem.getSubassemblies().filter((a) => {
        if (!(a instanceof Assembly && a.included() && a.part())) return false;
        if (a.allModels()) return true;
        if (a.locationCode().match(userDefinedReg)) return true;
        return a.composite();
      });
    };
    return this.physical;
  }
}


module.exports = ModelingCollections;
