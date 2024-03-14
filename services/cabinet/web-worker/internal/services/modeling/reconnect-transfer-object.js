
const idReg = /[A-Z][A-Za-z0-9]{1,}_[a-z0-9]{7}/;

const Vector3D = require('../../../../app-src/three-d/objects/vector.js');
const Vertex3D = require('../../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');

const isPrimitive = (val) => !(val instanceof Object) && !(val instanceof Function);

const vertexDefinedObj = {x: Number.isFinite, y: Number.isFinite, z: Number.isFinite};
function addMathObjectGetter(dto, rDto) {
  if (dto.defined(vertexDefinedObj)) rDto.object = () => new Vertex3D(dto);
  else if (dto.defined('i', 'j', 'k'))
    rDto.object = () => new Vector3D(dto);
  else if (Array.isArray(dto) && dto.length > 1) {
    const allVerticies = dto.find(o => !o.defined(vertexDefinedObj)) === undefined;
    if (allVerticies) {
      if (dto.length === 2) rDto.object = () => new Line3D(dto);
      else rDto.object = () => new Polygon3D(dto);
    }
  }
}

const isFunc = (filter) => filter instanceof Function ? filter :
  (filter instanceof RegExp ? (a) => a && a.locationCode.match(filter) : a => a && a.partCode === filter);

class ReconnectedMDTO{constructor(){}};
function reconnected(obj, idMap) {
  if (isPrimitive(obj)) return obj;
  const root = (rMdto) => () => rMdto.linkListFind('parentAssembly', (a) => a.parentAssembly === undefined);
  const up = (rMdto) => (filter) => {
    return reconnectDtos(rMdto.linkListFind('parentAssembly', isFunc(filter)), idMap);
  }
  const down = (rMdto) => filter => {
    const is = isFunc(filter);
    const child = rMdto.linkListFind('children', (a) => is(a instanceof Function ? a() : a));
    return child ? reconnectDtos(child instanceof Function ? child() : child, idMap) : null;
  }
  const find = (rMdto) => (filter) => {
    let found = up(rMdto)(filter);
    if (found) return found;
    return down(root(rMdto))(filter);
  }


  if (Array.isArray(obj)) return obj.map(dto => reconnected(dto, idMap));
  if (obj.id && Object.keys(obj).length === 1) return () => reconnectDtos(idMap[obj.id], idMap) || obj.id;
  const rDto = new ReconnectedMDTO();
  const keys = Object.keys(obj);
  let hasId = false;
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    let value = obj[key];
    let isPrim = isPrimitive(value);
    if (isPrim && key === 'id') {
      if (idMap) idMap[value] = rDto;
      hasId = true;
    } else {
      if (!isPrimitive(value)) {
        value = reconnected(value, idMap);
        addMathObjectGetter(value, value);
      }
    }
    rDto[key] = value;
  }
  if (hasId) {
    rDto.find = find(rDto);
    rDto.find.up = up(rDto);
    rDto.find.down = down(rDto);
    rDto.find.root = root(rDto);
  }
  return rDto;
}

function reconnectDtos(dtos, idMap) {
  if ((typeof dtos) === 'string') dtos = idMap[dtos];
  if (!dtos) return dtos;
  if (dtos instanceof ReconnectedMDTO) return dtos;
  return reconnected(dtos, idMap || {});
}

module.exports = reconnectDtos;
