


const Measurement = require('../../../../../public/js/utils/measurment.js');

class UFObj {
  constructor(order) {
    class Row {
      constructor(assembly, index) {
        this.cabnetId = index;//assembly.getAssembly('c').name;
        this.type = assembly.constructor.name;
        this.partName = assembly.partName.replace(/.*\.(.*)/, '$1');
        const dems = assembly.position().demension();
        const accuracy = undefined; //'1/32';
        dems.y = new Measurement(dems.y).fraction(accuracy);
        dems.x = new Measurement(dems.x).fraction(accuracy);
        dems.z = new Measurement(dems.z).fraction(accuracy);
        this.size = `${dems.y} x ${dems.x} x ${dems.z}`;
        this.partCode = `${index}-${assembly.partCode}`;
        this.cost = '$0';
        this.notes = assembly.notes || '';
      }
    }
    const cabinets = [];
    const array = [];
    order.rooms.forEach((room) => room.cabinets.forEach((cabinet, index) => {
      array.push(new Row(cabinet, index));
      cabinet.getParts().forEach((part) => array.push(new Row(part, index)));
    }));
    return array;
  }
}
module.exports = UFObj




