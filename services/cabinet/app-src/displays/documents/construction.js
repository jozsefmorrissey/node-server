const $t = require('../../../../../public/js/utils/$t.js');
const Global = require('../../services/global.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
const Draw2d = require('../../../../../public/js/utils/canvas/two-d/draw.js');
const du = require('../../../../../public/js/utils/dom-utils');
const PartInfo = require('./part');
const Panel = require('../../objects/assembly/assemblies/panel.js');
const Utils = require('./tools/utils.js');
const Tooling = require('./tooling');
const Select = require('../../../../../public/js/utils/input/styles/select.js');
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
const Jobs = require('../../../web-worker/external/jobs.js');

const orderTemplate = new $t('documents/construction');
const roomTemplate = new $t('documents/construction/room');
const groupTemplate = new $t('documents/construction/group');
const cabinetTemplate = new $t('documents/construction/cabinet');
const partTemplate = new $t('documents/construction/part');
const taskCompletionTemplate = new $t('documents/task-completion');

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
  if (info.model === undefined) return;
  const side = rightOleft ? 'Right' : 'Left';
  const model = CSG.fromPolygons(info.model[side.toLowerCase()].polygons, true);
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
  draw.text(side, sideLabelCenter, textProps);
  const infoEdges = info.fenceEdges[side.toLowerCase()];
  const edges = infoEdges.map(l => new Line2d(l[0], l[1]));
  const transLine = new Line2d(Vertex2d.center(Line2d.vertices(edges)), newCenter);
  edges.forEach((l, i) =>
    draw.text(infoEdges[i].label, scaledMidpoint(l, newCenter, coeficient, transLine), textProps));
  return canvas;
}

function buildViews(info) {
  return views = {
    right: buildCanvas(info, true),
    left: buildCanvas(info, false)
  }
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
                  selectorHtml, hash, disp: Utils.display});
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
      disp: Utils.display});
  }
}

const Group = {
  html: (group) => {
    order = Global.order();
    return groupTemplate.render({order, group, sortParts, viewContainer,
                  disp: Utils.display});
  }
}

const Cabinet = {
  html: (cabinet) => {
    order = Global.order();
    return cabinetTemplate.render({order, cabinet, sortParts, viewContainer,
                  disp: Utils.display});
  }
}

const toolingHtml = (toolingInfo) => new Tooling(toolingInfo).html();
const panelInfoRender = (_parts, containerOid) => async (map, job) => {
  const container = containerOid instanceof HTMLElement ? containerOid : du.id(containerOid);
  if (container) {
    let html = '';
    const root = _parts[0].getRoot();
    const keys = Object.keys(map);
    for (let index = 0; index < keys.length; index++) {
      const info = map[keys[index]];
      const parts = info.partIds.map(id => root.constructor.get(id));
      const scope = {parts, info, toolingHtml, viewContainer, disp: Utils.display};
      scope.views = buildViews(info);
      html += partTemplate.render(scope);
    }
    container.innerHTML = html;
  }
}

const recusiveAddTask = (list, task) => task.tasks  ?
  task.tasks().forEach(t => recusiveAddTask(list, t)) :
  (task.task ? recusiveAddTask(list, task.task()) : list.push(task));
const progressUpdate = (containerOid) => (task, job) => {
  if (job.task().status() === 'complete') return;
  const tasks = [];
  recusiveAddTask(tasks, job);
  const container = containerOid instanceof HTMLElement ? containerOid : du.id(containerOid);
  container.innerHTML = taskCompletionTemplate.render({tasks});
}

const Panels = (parts, containerOid) => {
  const job = new Jobs.Documentation.Panels(parts);
  job.on.change(progressUpdate(containerOid));
  job.then(panelInfoRender(parts, containerOid), console.error).queue();
  return job;
};

module.exports = {Order, Room, Group, Cabinet, Panels};
