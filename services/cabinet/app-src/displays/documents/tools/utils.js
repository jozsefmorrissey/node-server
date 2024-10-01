
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const Vector3D = require('../../../three-d/objects/vector.js');
const $t = require('../../../../../../public/js/utils/$t.js');
const within = require('../../../../../../public/js/utils/tolerance.js').within(.01);

const Utils = {};
Utils.display = {};
Utils.display.measurement = (val) => new Measurement(Math.abs(val)).display();
const disp = Utils.display.measurement;
const ms = (val) => val ? disp(val) : '';
Utils.display.vertex3D = (vert) => `(${disp(vert.x)}, ${disp(vert.y)})`;//` X ${disp(vert.z)}`;
Utils.display.vertex2d = (vert) => `(${disp(vert.x)}, ${disp(vert.y)})`;
Utils.display.demensions = (dems) => `${disp(dems.x)} X ${disp(dems.y)} X ${disp(dems.z)}`;
Utils.display.line2d = (l) => `(${disp(l[0].x)},${disp(l[0].y)}),(${disp(l[1].x)},${disp(l[1].y)})`;
Utils.display.roundTo = (val, percision) => Math.roundTo(val, percision || .1);
Utils.display.axis = {
  x: (axis) => ms(axis.z.x.length()),
  y: (axis) => axis.z.y.isLine() ? '' : disp(axis.z.y.length()),
  z: (axis) => axis.z.z.isLine() ? '' : disp(axis.z.z.length()),
}


Utils.display.degrees = (degrees) => `${Math.round(degrees * 10) / 10}`;
let tol = .01;
Utils.display.angle = (cut, zOnz) => {
  const degree = Math.toDegrees(cut.axis[zOnz].y.to2D().radians.positive());
  let relitive = Math.roundTo(-1 * ((degree - 90) % 180), .1);
  if (within(Math.abs(relitive), 90)) relitive = 0;
  return relitive || '';
}
Utils.display.group = (part) => part.getAssembly('c').group().room().name();
Utils.display.cabinet = (part) => part.getAssembly('c').userIdentifier();
Utils.display.partIdPrefix = (part) => {
  const cabinet = part.getAssembly('c');
  const room = cabinet.group().room().name();
  const cId = cabinet.userIdentifier();
  return `${room}:${cId}`;
}

Utils.display.partIds = (parts) => {
  let partStr = parts[0].userFriendlyId();
  if (parts.length !== 1)
    partStr += `[${parts.map(p => p.userFriendlyId()).join(',')}]`;
  return `${partStr} ${Utils.display.cabinet(parts[0])} ${Utils.display.group(parts[0])}`;
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

Utils.materialUnit = (part) => {
  const munit = part.resolve('munit', true)[part.category()] || 'Qty';
  const unit = munit.unit || munit;
  const attribute = munit.attribute || munit;
  return {unit, attribute};
}


const forEach = (part, selector, func) => {
  const assems = part.getSubassemblies();
  assems.forEach(a =>
    (a.partCode().match(selector) || a.locationCode().match(selector)) && func(a));
}

Utils.count = {};
Utils.count.shelves = (cabinet) => {
  let count = 0;
  forEach(cabinet, /^S[0-9]{1,}:sh[0-9]{1,}$/, () => count++)
  return count;
}

const firstOfNestedList = (nestedList => {
  let target = nestedList;
  while (Array.isArray(target)) target = target[0];
  return target.parts[0];
});

Utils.display.material = (partList) => {
  const part = firstOfNestedList(partList);
  const {unit, attribute} = Utils.materialUnit(part);
  const matFunc = Utils.display.material[unit.toLowerCase()] || Utils.display.material.qty;
  return matFunc(partList);
}
Utils.display.material.unit = (partList, group) => {
  const {unit, attribute} = Utils.materialUnit(firstOfNestedList(partList));
  if (unit === 'Qty') return 'Qty';
  return group;
}

Utils.display.material.qty = (infoOnestedList) => Array.isArray(infoOnestedList) ?
  infoOnestedList.elements().sum(info => info.parts.length) :
  infoOnestedList.parts.length;
Utils.display.material.cubic = Utils.display.material.qty;
Utils.display.material.set = Utils.display.material.qty;

Utils.display.material.lin = (partList) => {
  let length = 0;
  for (let index = 0; index < partList.length; index++) {
    const list = partList[index];
    const qty = list.sum(info => info.parts.length);
    length += qty * list[0].demensions.y;
  }
  return `${disp(length)} LIN`;
}

Utils.display.material.sq = (partList) => {
  let area = 0;
  for (let index = 0; index < partList.length; index++) {
    const list = partList[index];
    const qty = list.sum(info => info.parts.length);
    area += qty * Measurement.area([list[0].demensions]);
  }
  return Measurement.display.area(area);
}

Utils.materialGroup = (info) => {
  const part = info.parts[0];
  const {unit, attribute} = Utils.materialUnit(part);
  let sizeStr;
  switch (unit) {
    case 'Qty': sizeStr = `Qty:${String.random()}`; break;
    case 'LIN':
      const widths =  part.resolve('linw', true)[part.category()];
      const width = info.demensions.x;
      const bestWidth = !widths ? width : widths.find(p => p.value() > width - .0001).value();
      sizeStr = `${disp(bestWidth)} X ${disp(info.demensions.z)}`;
      break;
    case 'SQ': sizeStr = disp(info.demensions.z); break;
    case 'CUBIC': sizeStr = Utils.display.demensions(info.demensions); break;
    case 'SET': sizeStr = disp(info.pathValue(attribute)); break;
    default: throw new Error('Undefined Group: Howd that get in there...');
  }
  if (attribute !== unit) return `${unit}(${sizeStr})`;
  return sizeStr;
}

Utils.textToHtml = (text) => {
  const clean = $t.clean(text);
  return clean.replace(/\n/g, '<br>');
}

module.exports = Utils;
