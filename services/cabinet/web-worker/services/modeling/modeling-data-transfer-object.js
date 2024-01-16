
const mathClassReg = /^.*(2|3)(d|D)$/

const mdConfig = require('./modeling-data-configuration.json');

const isPrimitive = (val) => !(val instanceof Object) && !(val instanceof Function);

const arrayMapReg = /^(.*?)\>(.*)$/
const evaluateAttributes = (object, attributes, dto) => {
  dto ||= {};
  for (let index = 0; index < attributes.length; index++) {
    let attr = attributes[index];
    if (attr === 'toString') {
      console.log('hoha')
    }
    const match = attr.match(arrayMapReg);
    if (match) {
      attr = match[1];
    }
    let value = Object.pathValue(object, attr);
    if (match) {
      const childAttrs = match[2].split(',');
      if (Array.isArray(value))
        value = value.map(o => evaluateAttributes(o, childAttrs));
      else if (value instanceof Object)
        value = evaluateAttributes(value, childAttrs);
    }
    dto.pathValue(attr, MDTO.to(value));
  }
  return dto;
}

const dtoAttr = (obj) => obj instanceof Object && mdConfig[obj.constructor.name];

const nonFuntionalAttrs = (object, dto) => {
  const keys = Object.keys(object);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value =  MDTO.to(object[key]);
    dto.pathValue(key, value);
  }
}

const toStrConstructors = ['IdString'];
const useToString = (obj) => {
  const cxtr = obj.constructor.name;
  return toStrConstructors.indexOf(cxtr) !== -1;
}

class ModelingDataTransferObject{constructor(){}};
const MDTO = ModelingDataTransferObject;

const Joint = require('../../../app-src/objects/joint/joint.js');
const Assembly = require('../../../app-src/objects/assembly/assembly.js');
const KeyValue = require('../../../../../public/js/utils/object/key-value.js');
MDTO.to = function toDto (objectOval) {
  if (objectOval === null || objectOval === undefined) return objectOval;
  if (objectOval instanceof Function) return;
  if (isPrimitive(objectOval)) return objectOval;
  if (useToString(objectOval)) return objectOval.toString();
  // if (objectOval.constructor.name.match(mathClassReg)) return objectOval.toDrawString();
  if (Array.isArray(objectOval)) return objectOval.map(oov =>  MDTO.to(oov)).filter(o => o !== undefined);
  let dto = new ModelingDataTransferObject();
  nonFuntionalAttrs(objectOval, dto);
  if (objectOval instanceof KeyValue) {
    dto.values = objectOval.value.values;
  }
  if (objectOval instanceof Assembly) {
    evaluateAttributes(objectOval, mdConfig.Assembly, dto);
  }
  if (objectOval instanceof Joint) {
    evaluateAttributes(objectOval, mdConfig.Joint, dto);
  }
  if (mdConfig[objectOval.constructor.name])
    evaluateAttributes(objectOval, mdConfig[objectOval.constructor.name], dto);
  return Object.keys(dto).length === 0 ? undefined : dto;
}

const idReg = /[A-Z][A-Za-z0-9]{1,}_[a-z0-9]{7}/;

const Vector3D = require('../../../app-src/three-d/objects/vector.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');

const vertexDefinedObj = {x: Number.isFinite, y: Number.isFinite, z: Number.isFinite};
function addMathObjectGetter(dto, rDto) {
  if (dto.defined(vertexDefinedObj)) rDto.object = () => new Vertex3D(dto);
  else if (dto.defined('i', 'j', 'k'))
    rDto.object = () => new Vector3D(dto);
  else if (Array.isArray(dto) && dto.length > 1) {
    const allVerticies = dto.find(o => !o.defined(vertexDefinedObj)) === undefined;
    if (allVerticies) {
      if (dto.length === 2) {
        rDto.object = () => new Line3D(dto);
      } else rDto.object = () => new Polygon3D(dto);
    }
  }
}

class ReconnectedMDTO{constructor(){}};
function reconnected(obj, idMap) {
  if (Array.isArray(obj)) return obj.map(dto => reconnected(dto, idMap));
  if (obj.id && Object.keys(obj).length === 1) return () => idMap[obj.id];
  const rDto = new ReconnectedMDTO();
  const keys = Object.keys(obj);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    let value = obj[key];
    let isPrim = isPrimitive(value);
    if (key === 'id') {
      if (idMap) idMap[value] = rDto;
    } else {
      if (!isPrimitive(value)) {
        value = reconnected(value, idMap);
        addMathObjectGetter(value, value);
      }
    }
    rDto[key] = value;

  }
  return rDto;
}

MDTO.reconnect = function reconnectDtos(dtos) {
  const idMap = {};
  return reconnected(dtos, idMap);
}

module.exports = MDTO;
