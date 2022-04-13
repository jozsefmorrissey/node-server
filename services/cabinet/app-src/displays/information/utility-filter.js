


const Measurement = require('../../../../../public/js/utils/measurement.js');

class UFObj {
  constructor(order) {
    class Row {
      constructor(groupName, assembly, index) {
        this.groupName = groupName;
        this.cabnetId = index;//assembly.getAssembly('c').name;
        this.type = assembly.constructor.name;
        this.partName = assembly.partName().replace(/.*\.(.*)/, '$1');
        const dems = assembly.position().demension();
        const accuracy = undefined; //'1/32';
        dems.y = new Measurement(dems.y).display(accuracy);
        dems.x = new Measurement(dems.x).display(accuracy);
        dems.z = new Measurement(dems.z).display(accuracy);
        this.size = `${dems.y} x ${dems.x} x ${dems.z}`;
        this.partCode = `${index}-${assembly.partCode()}`;
        this.cost = '$0';
        this.notes = assembly.notes || '';
      }
    }
    const cabinets = [];
    const array = [];
    Object.values(order.rooms).forEach((room, rIndex) => room.groups.forEach((group, gIndex) => {
      group.cabinets.forEach((cabinet, index) => {
        const cabinetId = `${rIndex+1}-${gIndex+1}-${index+1}`;
        array.push(new Row(group.name(), cabinet, cabinetId));
        cabinet.getParts().forEach((part) => array.push(new Row(group.name(), part, cabinetId)));
      });
    }));
    return array;
  }
}
module.exports = UFObj
