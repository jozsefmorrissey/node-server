
const mathClassReg = /^.*(2|3)(d|D)$/

const attributeMap = {
  Assembly: ['id',"parentAssembly.id","partCode","partCode","locationCode","part","includeJoints", "position"],
  Position: ["current.center","current.demension","current.normals","current.biPolyNorm"],
  DividerSection: [],
  SectionProperties: ['id', 'top.id', 'bottom.id', 'left.id', 'right.id', 'rotation', 'coordinates.inner',
      'divideRight', 'pattern.str', 'verticalDivisions', 'dividerCount', 'sectionCount',
      'coordinates.outer', 'dividerJoint', 'isVertical', 'divider.id', 'sections>id'],
  DivideSection: [],
  DrawerSection: [],
  PanelSection: [],
  FalseFrontSection: [],
  DualDoorSection: ["gap"],
  DoorSection: [],
  Frame: [],
  Panel: [],
  PanelVoidIndex: ['index'],
  PanelToeKickBacker: [],
  Void: [],
  Screw: [],
  Handle: [],
  DoorCatch: [],
  Hinge: [],
  Door: [],
  HasPull: [],
  Divider: ['maxWidt', 'planeThickness', 'type'],
  OpeningToeKick: ['leftCornerCutter.id', 'rightCornerCutter.id', 'toKickPanel.id',
      'toeKickCutter.id', 'opening.id', 'autoToeKick.id'],
  AutoToekick: [],
  DrawerBox: [],
  DrawerFront: [],
  Guides: [],
  Cabinet: [],
  Cutter: [],
  CutterModel: [],
  CutterReference: ['reference', 'fromPoint', 'offset', 'front'],
  CutterPoly: ['poly'],
  ControlableAbyss: [],
  CabinetOpeningCorrdinates: ['coordinates'],
  Vector3D: ['i', 'j', 'k']
}


const isPrimitive = (val) => !(val instanceof Object) && !(val instanceof Function);

const arrayMapReg = /^(.*?)\>(.*)$/
const evaluateAttributes = (object, attributes, dto) => {
  dto ||= {};
  for (let index = 0; index < attributes.length; index++) {
    let attr = attributes[index];
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
    dto.pathValue(attr, DTO.to(value));
  }
  return dto;
}

const dtoAttr = (obj) => obj instanceof Object && attributeMap[obj.constructor.name];

const nonFuntionalAttrs = (object, dto) => {
  const keys = Object.keys(object);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value =  DTO.to(object[key]);
    dto.pathValue(key, value);
  }
}

const toStrConstructors = ['IdString'];
const useToString = (obj) => {
  const cxtr = obj.constructor.name;
  return toStrConstructors.indexOf(cxtr) !== -1;
}

class DataTransferObject{constructor(){}};
const DTO = DataTransferObject;

const Assembly = require('../../app-src/objects/assembly/assembly.js');
const KeyValue = require('../../../../public/js/utils/object/key-value.js');
DTO.to = function toDto (objectOval) {
  if (objectOval === null || objectOval === undefined) return objectOval;
  if (objectOval instanceof Function) return;
  if (isPrimitive(objectOval)) return objectOval;
  if (useToString(objectOval)) return objectOval.toString();
  // if (objectOval.constructor.name.match(mathClassReg)) return objectOval.toDrawString();
  if (Array.isArray(objectOval)) return objectOval.map(oov =>  DTO.to(oov)).filter(o => o !== undefined);
  let dto = new DataTransferObject();
  nonFuntionalAttrs(objectOval, dto);
  if (objectOval instanceof KeyValue) {
    dto.values = objectOval.value.values;
  }
  if (objectOval instanceof Assembly) {
    evaluateAttributes(objectOval, attributeMap.Assembly, dto);
  }
  if (attributeMap[objectOval.constructor.name])
    evaluateAttributes(objectOval, attributeMap[objectOval.constructor.name], dto);
  return Object.keys(dto).length === 0 ? undefined : dto;
}

const idReg = /[A-Z][A-Za-z0-9]{1,}_[a-z0-9]{7}/;

const Vector3D = require('../../app-src/three-d/objects/vector.js');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../app-src/three-d/objects/line.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');

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

class ReconnectedDTO{constructor(){}};
function reconnected(obj, idMap) {
  if (Array.isArray(obj)) return obj.map(dto => reconnected(dto, idMap));
  if (obj.id && Object.keys(obj).length === 1) return () => idMap[obj.id];
  const rDto = new ReconnectedDTO();
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

DTO.reconnect = function reconnectDtos(dtos) {
  const idMap = {};
  return reconnected(dtos, idMap);
}

module.exports = DTO;
