const $t = require('../../../../../public/js/utils/$t.js');
const Global = require('../../services/global.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
const Draw2d = require('../../../../../public/js/utils/canvas/two-d/draw.js');
const du = require('../../../../../public/js/utils/dom-utils');
const PartInfo = require('./part');
const Panel = require('../../objects/assembly/assemblies/panel.js');
const CutInfo = require('./cuts/cut.js');
const Select = require('../../../../../public/js/utils/input/styles/select.js');
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js')

const orderTemplate = new $t('documents/construction');
const roomTemplate = new $t('documents/construction/room');
const groupTemplate = new $t('documents/construction/group');
const cabinetTemplate = new $t('documents/construction/cabinet');
const partTemplate = new $t('documents/construction/part');

const typeFilter = (obj) => {
  const cn = obj.constructor.name;
  if (cn === 'DrawerBox') return 'DrawerBox';
  if (cn === 'Handle') return 'Handle';
  if (cn === 'PanelModel') return 'Panel';
  if (cn === 'DrawerFront') return 'DrawerFront';
  if (cn === 'Door') return 'Door';
  if (cn === 'Panel') return 'Panel';
  return 'unknown';
}

const scaledMidpoint = (l, center, coeficient, transLine) => {
  const midpoint = l.clone().translate(transLine).midpoint();
  let CSGv = new CSG.Vertex({x:midpoint.x(),y: midpoint.y(),z: 0}, [1,0,0]);
  CSGv.scale(center,  coeficient);
  return {
    x: ((midpoint.x() - center.x + 2.5)*coeficient) + center.x,
    y: ((midpoint.y() - center.y - 5)*coeficient) + center.y
  }
}

const textProps = {size: '10px', radians: Math.PI};
function buildCanvas(info, rightOleft) {
  model = info.model(rightOleft);
  const canvas = du.create.element('canvas', {class: 'upside-down part-canvas'});
  const newCenter = {x: canvas.width / 2, y: canvas.height/2, z:0};
  const sideLabelCenter = {x: canvas.width - 5, y: canvas.height - 10, z:0};
  const dems = model.demensions();
  const coeficient = ((canvas.height*.6) / dems.y);
  model.scale(coeficient);
  model.center(newCenter);
  const draw = new Draw2d(canvas);
  const lines = Polygon3D.lines2d(Polygon3D.merge(Polygon3D.fromCSG(model)), 'x', 'y');
  draw(lines, null, .3);
  const side = rightOleft ? 'Right' : 'Left';
  draw.text(side, sideLabelCenter, textProps);
  const edges = info.fenceEdges(rightOleft);
  const transLine = new Line2d(Vertex2d.center(Line2d.vertices(edges)), newCenter);
  edges.forEach(l => draw.text(l.label, scaledMidpoint(l, newCenter, coeficient, transLine), textProps));
  return canvas;
}

function partInfo(part) {
  const info = new PartInfo(part);
  const cutList = info.cutInfo();
  if (cutList) {
    info.views = {
      right: buildCanvas(info, true),
      left: buildCanvas(info, false)
    }
  }
  return info;
}

function sortParts(parts) {
  const sorted = {};
  let index = 'A'.charCodeAt(0);
  parts.forEach(part => {
    if (part instanceof Panel) {
      const pInfo = partInfo(part);
      part.index = String.fromCharCode(index++);
      const type = typeFilter(part);
      if (sorted[type] === undefined) sorted[type] = [];
      let found = false;
      sorted[type].forEach(info => {
        if (info.merge(pInfo)) {
          found = true;
        }
      });
      if (!found) {
        sorted[type].push(pInfo);
      }
    }
  });
  return sorted;
}

const sideFilter = (cl) => {
  const min = round(Math.min(cl.startVertex().y(), cl.endVertex().y()));
  return (s) => !s.isParrelle(cl) && min >= round(cl.findIntersection(s).y());
}

const lineDistanceSorter = (cl) => (a,b) => a.distance(cl) - b.distance(cl);

function viewContainer(view) {
  const id = `view-container-${String.random()}`;
  setTimeout(() => {
    if (view) {
      const cnt = du.id(id);
      cnt.append(view);
    }
  });
  return id;
}

function targetSelected(values) {
  const order = Global.order();
  let htmlStr;
  const room = order.rooms[values.room];
  if (room === undefined) throw new Error('Must select room');
  const groupObj = values[values.room];
  const group = room.groups.find(g => g.name() === groupObj.group);
  if(group === undefined) htmlStr = Room.html(room);
  else {
    cabName = groupObj[groupObj.group].cabinet
    const cabinet = group.objects.find(c => c.userFriendlyId() === cabName);
    if(cabinet === undefined) htmlStr = Group.html(group);
    else {
      htmlStr = Cabinet.html(cabinet);
    }
  }
  const printBody = du.id('print-body');
  du.show(printBody);
  const cnt = du.find.down('.document-cnt', printBody);
  cnt.innerHTML = htmlStr;
}

function getCabinetSelect(group) {
  return new Select({
    label: 'Cabinet',
    name: 'cabinet',
    inline: true,
    class: 'center',
    optional: true,
    value: group.objects[0].userIdentifier(),
    list: [''].concat(group.objects.map(c => c.userIdentifier()))
  });
}

function getGroupSelect(room) {
  return new Select({
    label: 'Group',
    name: 'group',
    inline: true,
    class: 'center',
    optional: true,
    value: room.groups[0].name(),
    list: [''].concat(room.groups.map(g => g.name()))
  });
}

function buildTargetInputSelector(order) {
  const rooms = Object.values(order.rooms);
  const roomInput = new Select({
    label: 'Room',
    name: 'room',
    inline: true,
    class: 'center',
    value: rooms[0].name(),
    list: [''].concat(rooms.map(r => r.name()))
  });
  const props = {buttonText: 'Select Scope'}
  const inputTree = new DecisionInputTree('Document', {inputArray: [roomInput]}, props);
  let roomBranch = inputTree.root();
  for (let index = 0; index < rooms.length; index++) {
    const room = rooms[index];
    const roomName = room.name();
    const groupSelect = getGroupSelect(room);
    groupBranch = roomBranch.then(roomName, {inputArray: [groupSelect]});
    const cond = DecisionInputTree.getCondition('room', roomName);
    roomBranch.conditions.add(cond, roomName);
    for (let index = 0; index < room.groups.length; index++) {
      const group = room.groups[index];
      const groupName = group.name();
      const cabinetSelect = getCabinetSelect(group);
      const cond = DecisionInputTree.getCondition('group', groupName);
      cabinetBranch = groupBranch.then(groupName, {inputArray: [cabinetSelect]});
      groupBranch.conditions.add(cond, groupName);
    }
  }
  inputTree.onSubmit(targetSelected);
  return inputTree;
}

const openingCanvasId = (cabinet) => `construction-opening-sketch-${cabinet.id()}`;

function orderStructureHash(order) {
  const rooms = Object.values(order.rooms);
  const roomKeys = Object.keys(order.rooms)
  const groups = [];
  rooms.forEach(r => groups.concatInPlace(r.groups));
  const groupKeys = groups.map(g => g.name());
  const cabinets = [];
  groups.forEach(g => cabinets.concatInPlace(g.objects));
  const cabinetKeys = cabinets.map(c => c.userFriendlyId());
  const hashStr = `${roomKeys}${groupKeys}${cabinetKeys}`;
  const hash = hashStr.hash();
  return hash;
}

const NO_CABINETS_EXIST_HTML = '<h2>Must define atleast one cabinet</h2>';
const Order = {
  html: (order) => {
    order ||= Global.order();
    const targetInputSelector = order.worthSaving() ? buildTargetInputSelector(order) : null;
    const selectorHtml = targetInputSelector ? targetInputSelector.html() : NO_CABINETS_EXIST_HTML;
    const hash = orderStructureHash(order);
    return orderTemplate.render({order, sortParts, viewContainer, targetInputSelector,
                  selectorHtml, hash, disp: CutInfo.display});
  },
  shouldRender: (container) => {
    const hash = Number.parseInt(du.find.down('[hash]', container).getAttribute('hash'));
    return hash !== orderStructureHash(Global.order());
  }
}

const Room ={
  html: (room) => {
    order = Global.order();
    return roomTemplate.render({order, room, sortParts, viewContainer,
      disp: CutInfo.display});
  }
}

const Group = {
  html: (group) => {
    order = Global.order();
    return groupTemplate.render({order, group, sortParts, viewContainer,
                  disp: CutInfo.display});
  }
}

const Cabinet = {
  html: (cabinet) => {
    order = Global.order();
    return cabinetTemplate.render({order, cabinet, sortParts, viewContainer,
                  disp: CutInfo.display});
  }
}

const Part = {
  html: (part) => {
    const info = partInfo(part);
    return partTemplate.render({info, viewContainer, disp: CutInfo.display});
  }
};

module.exports = {Order, Room, Group, Cabinet, Part};
