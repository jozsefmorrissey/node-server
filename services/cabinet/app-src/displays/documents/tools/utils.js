
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
Utils.display.partIds = (parts) => {
  const cId = parts[0].getAssembly('c').groupIndex();
  let partStr;
  if (parts.length === 1) partStr = parts[0].userFriendlyId();
  else partStr = `[${parts.map(p => p.userFriendlyId()).join(',')}]`;
  if (!Number.isFinite(cId)) return partStr;
  return `${cId}-${partStr}`;
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

module.exports = Utils;
