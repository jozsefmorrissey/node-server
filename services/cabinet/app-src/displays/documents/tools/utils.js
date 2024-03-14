
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const Vector3D = require('../../../three-d/objects/vector.js');

const Utils = {};
Utils.display = {};
Utils.display.measurement = (val) => new Measurement(Math.abs(val)).display();
const disp = Utils.display.measurement;
Utils.display.vertex3D = (vert) => `(${disp(vert.x)}, ${disp(vert.y)})`;//` X ${disp(vert.z)}`;
Utils.display.vertex2d = (vert) => `(${disp(vert.x())}, ${disp(vert.y())})`;
Utils.display.demensions = (dems) => `${disp(dems.x)} X ${disp(dems.y)} X ${disp(dems.z)}`;
Utils.display.degrees = (degrees) => `${Math.round(degrees * 10) / 10}`;
Utils.display.partIdPrefix = (part) => {
  const cabinet = part.getAssembly('c');
  const room = cabinet.group().room().name();
  const cId = cabinet.userIdentifier();
  return `${room}:${cId}`;
}

Utils.display.partIds = (parts) => {
  let partStr;
  if (parts.length === 1) partStr = parts[0].userFriendlyId();
  else partStr = `[${parts.map(p => p.userFriendlyId()).join(',')}]`;
  return `${Utils.display.partIdPrefix(parts[0])}:${partStr}`;
}
Utils.display.roots = (parts) => {
  const map = {};
  for (let index = 0; index < parts.length; index++) {
    const root = parts[index].getRoot();
    map[root.id()] = root;
  }
  return Object.values(map).map(r => r.userFriendlyId());
}

Utils.display.partCodes = (parts) => {
  if (EPNTS.getEnv() !== 'local') return '';
  let partStr;
  if (parts.length === 1) partStr = parts[0].userFriendlyId();
  else partStr = `[${parts.map(p => p.userFriendlyId()).join(',')}]`;
  return `${partStr}`;
}


Utils.printPolys = (csgs, colors) => {
  colors ||= [];
  let str = '';
  for (let index = 0; index < csgs.length; index++) {
    const polys = Polygon3D.fromCSG(csgs[index]);
    const color = colors[index%colors.length];
    for (let j = 0; j < polys.length; j++) {
      str += polys[j].toDrawString(color) + '\n';
    }
    str += '\n';
  }
  console.log(str);
}

Utils.display.materialUnits = (partList) => {
  if (partList[0][0].constructor.MATERIAL_UNIT == 'Qty')
    return partList.map(list => list.length).sum();

  let area = 0;
  for (let index = 0; index < partList.length; index++) {
    const list = partList[0];
    const qty = list.length;
    area += qty * Measurement.area([list.info.demensions]);
  }
  return Measurement.display.area(area);
}

module.exports = Utils;
