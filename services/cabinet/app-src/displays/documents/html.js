const $t = require('../../../../../public/js/utils/$t.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
const du = require('../../../../../public/js/utils/dom-utils');
const Utils = require('./tools/utils.js');
const Draw2d = require('../../../../../public/js/utils/canvas/two-d/draw.js');
const Tooling = require('./tooling');
const Select = require('../../../../../public/js/utils/input/styles/select.js');
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
const OpeningSketch = require('../opening-sketch.js');
const DrawLayout = require('../draw/layout.js');
const PanZoom = require('../../../../../public/js/utils/canvas/two-d/pan-zoom.js');

const orderTemplate = new $t('documents/construction');
const roomTemplate = new $t('documents/construction/room');
const groupTemplate = new $t('documents/construction/group');
const cabinetTemplate = new $t('documents/construction/cabinet');
const cabinetListTemplate = new $t('documents/construction/cabinetList');
const panelCutListTemplate = new $t('documents/construction/panel-cut-list');
const partTemplate = new $t('documents/construction/part');
const openingDiagramsTemplate = new $t('documents/construction/opening-diagrams');
const doorListTemplate = new $t('documents/construction/door-list');
const materialsTemplate = new $t('documents/construction/materials');
const aerialsTemplate = new $t('documents/construction/aerials');

const NO_CABINETS_EXIST_HTML = '<h2>Must define atleast one cabinet</h2>';

function forEachCabinetInfo(orderInfo, func) {
  orderInfo.rooms.forEach(r => r.groups.forEach(g => g.cabinets.forEach(func)));
}

function getCabinetInfos(orderInfo) {
  const list = [];
  forEachCabinetInfo(orderInfo, cInfo => list.push(cInfo));
  return list;
}

function allPartsOfType (orderInfo, type) {
  const parts = [];
  const isReg = type instanceof RegExp;
  forEachCabinetInfo(orderInfo, c => {
    const keys = Object.keys(c.parts);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if ((isReg && key.match(type)) || (!isReg && key === type)) {
        Object.values(c.parts[key]).forEach(info => info.parts.forEach((part) => {
          parts.push({part, info});
        }));
      }
    }
  });
  return parts;
}

function listToTemplate(orderInfo, type, template) {
  const parts = allPartsOfType(orderInfo, type);
  const map = {};
  const disp = Utils.display;
  parts.forEach(d => {
    const category = d.part.category;
    const key = disp.demensions(d.info.demensions);
    if (map[category] === undefined) map[category] = {};
    if (map[category][key] === undefined) {
      map[category][key] = [];
      map[category][key].info = d.info;
    }
    map[category][key].push(d.part);
  });

  const partListMap = {};
  Object.keys(map).forEach(key => partListMap[key] = Object.values(map[key]));
  return template.render({partListMap, disp, type});
}

function materialListToTemplate(orderInfo, type, template) {
  const parts = allPartsOfType(orderInfo, type);
  const map = {};
  const disp = Utils.display;
  parts.forEach(d => {
    const category = d.part.category;
    const key = disp.demensions(d.info.demensions);
    const thickness = disp.measurement(d.info.demensions.z);
    if (map[category] === undefined) map[category] = {};
    if (map[category][thickness] === undefined) map[category][thickness] = {};
    if (map[category][thickness][key] === undefined) {
      map[category][thickness][key] = [];
      map[category][thickness][key].info = d.info;
    }
    map[category][thickness][key].push(d.part);
  });

  const partListMap = {};
  Object.keys(map).forEach(category => Object.keys(map[category]).forEach(thickness => {
    if (partListMap[category] === undefined) partListMap[category] = {};
    partListMap[category][thickness] = Object.values(map[category][thickness]);
  }));
  return template.render({partListMap, disp, type});
}

const DocumentationHtml = {}
DocumentationHtml.print = {};
DocumentationHtml.print.container = (innerHTML) => {
  return `<div id='document-print-body'>
            <div class='document-cnt'>${innerHTML}</div>
          </div>
`;
}

DocumentationHtml.cabinetList = (orderInfo) => {
  const cabinetInfos = getCabinetInfos(orderInfo);
  return cabinetListTemplate.render({cabinetInfos, Utils});
}

const area = (dem) => dem.x * dem.y * dem.z;
const sorter = (pi1, pi2) => area(pi2.demensions) - area(pi1.demensions);
DocumentationHtml.parts = (partInfo) => {
  if (!partInfo) return '';
  const parts = Object.values(partInfo);
  parts.sort(sorter);
  let html = '<div class="cabinet-part-doc-cnt">';
  parts.forEach((pi, index) => {
    if (pi.toolingInfo && !Object.keys(pi.toolingInfo).length) return;
    pi.DocumentationDisplay = DocumentationHtml;
    pi.viewContainer = viewContainer;
    pi.disp = Utils.display;
    pi.index = index;
    pi.views ||= buildViews(pi);
    pi.toolingHtml ||= new Tooling(pi).html;
    html += partTemplate.render(pi);
  });
  return html + '</div>';
}

const partsFunction = (partType) => (info) => {
  if (info.cabinet) return DocumentationHtml.parts.cabinet(info, partType);
  else if (info.group) return DocumentationHtml.parts.group(info, partType);
  else if (info.room) return DocumentationHtml.parts.room(info, partType);
  else if (info.order) return DocumentationHtml.parts.order(info, partType);
  else return DocumentationHtml.parts.part(info, partType);
};

DocumentationHtml.panels = partsFunction('Panel');
DocumentationHtml.shelves = partsFunction('Shelve');

DocumentationHtml.panels.main = (orderInfo) => {
  const order = orderInfo.order;
  orderInfo.targetInputSelector = order.worthSaving() ? buildTargetInputSelector(orderInfo) : null;
  orderInfo.selectorHtml = orderInfo.targetInputSelector ? orderInfo.targetInputSelector.html() : NO_CABINETS_EXIST_HTML;
  orderInfo.DocumentationHtml = DocumentationHtml;
  return orderTemplate.render(orderInfo);
}

DocumentationHtml.aerials = (order) => {
  setTimeout(() => {
    Object.values(order.rooms).forEach(room => {
      const orderName = `${order.name().toKebab()}-${room.name().toKebab()}`;
      const canvasSelector = `.aerial-views [order-room='${orderName}']`;
      const canvas = du.find(canvasSelector);
      const pageWidth = du.convertCssUnit('210mm');
      canvas.height = pageWidth;
      canvas.width = pageWidth;
      const draw = new DrawLayout(canvas, room.layout);
      draw();
      // const panZ = new PanZoom(canvas, () => draw());
    });
  });
  return aerialsTemplate.render({order});
}

DocumentationHtml.parts.order = (orderInfo, partType) => {
  const order = orderInfo.order;
  let html = `<div class='order-part-doc-cnt' order-hash='${order.hash()}'>`;
  orderInfo.rooms.forEach(roomInfo => html += DocumentationHtml.parts.room(roomInfo, partType));
  return html + '</div>';
}

DocumentationHtml.panels.cutList = (orderInfo) => DocumentationHtml.parts.cutList(orderInfo, 'Panel');
DocumentationHtml.shelves.cutList = (orderInfo) => DocumentationHtml.parts.cutList(orderInfo, 'Shelve');

DocumentationHtml.parts.cutList = (orderInfo, partType) => {
  console.log(orderInfo);
  const panels = new Array(10).fill(null).map(() => ['','','']);
  const pages = [];
  let currentIndex = 0;
  let pageIndex = -1;
  const disp = Utils.display;
  orderInfo.rooms.forEach(r => r.groups.forEach(g => g.cabinets.forEach(c => {
    if (!c.parts[partType]) return;
    Object.values(c.parts[partType]).forEach(p => p.parts.forEach((part) => {
      const targetIndex = Math.floor((currentIndex % 30)/3);
      if (currentIndex % 30 === 0) pages[++pageIndex] = new Array(10).fill(null).map(() => ['','','']);
      const panels = pages[pageIndex];
      if (!panels[targetIndex]) panels[targetIndex] = [];
      const demensions = p.demensions;
      const nextIndex = panels[targetIndex].findIndex(v => v === '');
      panels[targetIndex][nextIndex] = `${Utils.display.partIdPrefix(part)}:${part.userFriendlyId()}
          <br>
          ${disp.measurement(demensions.x)} X
          ${disp.measurement(demensions.y)} X
          ${disp.measurement(demensions.z)}`;
      currentIndex++;
    }));
  })));
  return DocumentationHtml.print.container(panelCutListTemplate.render({pages}));
}

DocumentationHtml.doorList = (orderInfo) => {
  return listToTemplate(orderInfo, 'Door', doorListTemplate);
}

DocumentationHtml.drawerFrontList = (orderInfo) => {
  return listToTemplate(orderInfo, 'DrawerFront', doorListTemplate);
}

DocumentationHtml.drawerBoxList = (orderInfo) => {
  return listToTemplate(orderInfo, 'DrawerBox', doorListTemplate);
}

DocumentationHtml.shelveList = (orderInfo) => {
  return listToTemplate(orderInfo, 'Shelve', doorListTemplate);
}

DocumentationHtml.materials = (orderInfo) => {
  return materialListToTemplate(orderInfo, /.{1,}/, materialsTemplate);
}


const openingDiagramCntId = (reqId) => (cabId) => `cabinet-opening-sketch-${reqId}-${cabId}`;
DocumentationHtml.sketchLayout = (cabinets, containerOselector, reqId) => {
  reqId ||= String.random();
  const cnt = containerOselector instanceof HTMLElement ? containerOselector : du.find(containerOselector);
  if (cnt) {
    const hash = cabinets.map(c => c.hash()).sum() + '';
    const cabinetSets = [];
    cabinets.forEach((c, i) => {
      const i1 = Math.floor(i/2);
      const i2 = i%2;
      if (cabinetSets[i1] === undefined) cabinetSets[i1] = [];
      cabinetSets[i1][i2] = c;
    });

    const includeSection = (section, relitiveCheck) => {
      const hasCover = section.cover() !== undefined !== null;
      const includesDivider = section.divideRight();
      const hasShelves = section.shelves.lengh > 0;
      if (hasCover || includesDivider || hasShelves) return true;
      if (relitiveCheck) return false;
      const sections = section.sections;
      const childNotIncluded = sections.length === 1 && !includeSection(sections[0], true);
      const parentNotIncluded = sections.length === 0 &&
            section.parentAssembly().sections.length === 1 && !includeSection(section.parentAssembly(), true);
      return childNotIncluded || parentNotIncluded;
    }

    const sectionSets = (cabinet) => {
      const sectionSets = [];
      const sectionPropList = cabinet.openings.map(o => o.sectionProperties());
      let index = 0;
      let setIndex = 0;
      while (target = sectionPropList[index++]) {
        if (includeSection(target)) {
          const i1 = Math.floor(setIndex/2);
          const i2 = setIndex++%2;
          if (sectionSets[i1] === undefined) sectionSets[i1] = [];
          sectionSets[i1][i2] = target;
        }
        sectionPropList.concatInPlace(target.sections);
      }
      return sectionSets;
    }
    const disp = Utils.display;
    const html = openingDiagramsTemplate.render({disp, sectionSets, cabinetSets, cntId: openingDiagramCntId(reqId), hash});
    cnt.innerHTML = DocumentationHtml.print.container(html);
  }
}

DocumentationHtml.openingDiagram = (modelInfoMap, reqId) => {
  reqId ||= String.random();
  const cabinets = [];
  Object.keys(modelInfoMap).forEach(id => {
    const cabinet = Lookup.get(id);
    const modelInfo = modelInfoMap[id];
    const selector = `#${openingDiagramCntId(reqId)(id)}`;
    new OpeningSketch(selector, cabinet, modelInfo);
  });
}

DocumentationHtml.parts.room = (roomInfo, partType) => {
  return roomTemplate.render({roomInfo, partType, DocumentationHtml});
}

DocumentationHtml.parts.group = (groupInfo, partType) => {
  if (!groupInfo) return '';
  return groupTemplate.render({groupInfo, partType, DocumentationHtml});
}

DocumentationHtml.parts.cabinet = (cabinetInfo, partType) => {
  return cabinetTemplate.render({cabinetInfo, partType, DocumentationHtml});
}





module.exports = DocumentationHtml;


const scaledMidpoint = (l, center, coeficient) => {
  const midpoint = l.midpoint();
  let centerOffset = Line2d.startAndTheta(midpoint, new Line2d(center, midpoint).radians(), 7.5/coeficient)[1];

  // TODO: make offset perpendicular to line...
  // const perp = l.clone().translate(transLine).perpendicular(15/coeficient);
  // centerOffset = perp[0].distance(center) > perp[1].distance(center) ? perp[0] : perp[1];
  // console.log(l.clone().translate(transLine) + '\nblue' + new Vertex2d(center) + '\n' + perp + '\nred' + centerOffset);
  return {
    x: ((centerOffset.x() - center.x + 1.25/coeficient)*coeficient) + center.x,
    y: ((centerOffset.y() - center.y - 2/coeficient)*coeficient) + center.y
  }
}

const textProps = {size: '12px', radians: Math.PI};
function buildCanvas(info, rightOleft) {
  if (info.model === undefined) return;
  const side = rightOleft ? 'Right' : 'Left';
  const model = CSG.fromPolygons(info.model[side.toLowerCase()].polygons, true);

  const canvas = du.create.element('canvas', {class: 'upside-down part-canvas'});
  const newCenter = {x: canvas.width / 2, y: canvas.height/2, z:0};
  const dems = model.demensions();
  const coefY = ((canvas.height*.6) / dems.y);
  const coefX = ((canvas.width*.6) / dems.x);
  const coeficient = coefX > coefY ? coefY : coefX;
  model.scale(coeficient);
  model.center(newCenter);
  const draw = new Draw2d(canvas);
  const lines = Polygon3D.lines2d(Polygon3D.merge(Polygon3D.fromCSG(model)), 'x', 'y');
  draw(lines, null, .5);
  const sideLabelCenter = {x: canvas.width - 5, y: canvas.height - 10, z:0};
  const sideLabel = rightOleft ? 'Right | Up' : 'Left | Down';
  draw.text(sideLabel, sideLabelCenter, textProps);
  const infoEdges = info.fenceEdges[side.toLowerCase()];
  const edges = infoEdges.map(l => new Line2d(l[0], l[1]));
  const transLine = new Line2d(Vertex2d.center(Line2d.vertices(edges)), newCenter);
  edges.forEach((l, i) =>
    draw.text(infoEdges[i].label, scaledMidpoint(l.clone().translate(transLine), newCenter, coeficient), textProps));
  return canvas;
}

function buildViews(info) {
  if (!info.toolingInfo || Object.keys(info.toolingInfo).length === 0) return;
  return views = {
    right: buildCanvas(info, true),
    left: buildCanvas(info, false)
  }
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

function targetSelected(orderInfo) {
  return (values, elem) => {
    const treeCnt = du.find.up('.decision-input-tree', elem);
    const roomSel = du.find.down('[name="room"]', treeCnt);
    const groupSel = du.find.down('[name="group"]', treeCnt);
    const cabSel = du.find.down('[name="cabinet"]', treeCnt);


    const room = values.room || null
    const group = values.pathValue(`${room}.group`) || null;
    const cabinet = values.pathValue(`${room}.${group}.cabinet`) || null;

    const roomOpt = du.find(`option[value="${room}"`);
    const groupOpt = du.find(`option[value="${group}"`);
    const cabOpt = du.find(`option[value="${cabinet}"`);

    let info;
    if (roomOpt && groupOpt && cabOpt)
      info = orderInfo.rooms[roomOpt.index - 1].groups[groupOpt.index - 1].cabinets[cabOpt.index - 1].parts.Panel;
    else if (roomOpt && groupOpt)
      info = orderInfo.rooms[roomOpt.index - 1].groups[groupOpt.index - 1];
    else if (roomOpt)
      info = orderInfo.rooms[roomOpt.index - 1];
    else
      info = orderInfo;

    const html = DocumentationHtml.panels(info);

    const printBody = du.id('document-print-body');
    du.show(printBody);
    const cnt = du.find.down('.document-cnt', printBody);
    cnt.innerHTML = html;
  }
}


function buildTargetInputSelector(orderInfo) {
  const rooms = orderInfo.rooms.map(ri => ri.room);
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
  inputTree.onSubmit(targetSelected(orderInfo));
  return inputTree;
}

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

du.on.match('keycombo(Control,p)', '*', () => console.log('before print'));
du.on.match('keycombo(Control,z)', '*', () => console.log('after print'));
