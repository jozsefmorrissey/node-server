


const Measurement = require('../../../../../public/js/utils/measurement.js');

class UFObj {
  constructor(order) {
    class Row {
      constructor(groupName, assembly, index) {
        this.groupName = groupName;
        this.type = assembly.constructor.name;
        const dems = assembly.position().demension();
        dems.y = new Measurement(dems.y).display();
        dems.x = new Measurement(dems.x).display();
        dems.z = new Measurement(dems.z).display();
        this.size = `${dems.y} x ${dems.x} x ${dems.z}`;
        this.quantity = 1;
        this.cost = '$0';
        this.notes = assembly.notes || '';
      }
    }
    const cabinets = [];
    const obj = [];
    Object.values(order.rooms).forEach((room, rIndex) => room.groups.forEach((group, gIndex) => {
      group.cabinets.forEach((cabinet, index) => {
        const cabinetId = `${rIndex+1}-${gIndex+1}-${index+1}`;
        cabinet.getParts().forEach((part) => {
          const row = new Row(group.name(), part, cabinetId);
          if (obj[row.size] === undefined) obj[row.size] = row;
          else {
            obj[row.size].quantity++;
          }
        });
      });
    }));
    return Object.values(obj);
  }
}
module.exports = UFObj
