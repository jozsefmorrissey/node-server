const $t = require('../../../../../public/js/utils/$t.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');

const {Vertex3D, Vector3D, Polygon3D, Layer} = require('../../../../../public/js/utils/canvas/three-d/lib');

const du = require('../../../../../public/js/utils/dom-utils');
const Utils = require('./tools/utils.js');
const positionAssemblyCsg = require('../../utils.js').positionAssemblyCsg;
const Draw2d = require('../../../../../public/js/utils/canvas/two-d/draw.js');
const Tooling = require('./tooling');
const Select = require('../../../../../public/js/utils/input/styles/select.js');
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
const OpeningSketch = require('../opening-sketch.js');
const DrawLayout = require('../draw/layout.js');
const PanZoom = require('../../../../../public/js/utils/canvas/two-d/pan-zoom.js');
const ModelInfo = require('../../../web-worker/external/model-information.js');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');

const orderTemplate = new $t('documents/construction');
const roomTemplate = new $t('documents/construction/room');
const groupTemplate = new $t('documents/construction/group');
const cabinetTemplate = new $t('documents/construction/cabinet');
const cabinetListTemplate = new $t('documents/construction/cabinetList');
const panelCutListTemplate = new $t('documents/construction/panel-cut-list');
const cutListLabelTemplate = new $t('documents/construction/cut-list-label');
const cabinetPartTemplate = new $t('documents/construction/cabinet-parts');
const cutsTemplate = new $t('documents/cuts/cuts');
const openingDiagramsTemplate = new $t('documents/construction/opening-diagrams');
const threeViewTemplate = new $t('documents/construction/three-view');
const elevationDiagramsTemplate = new $t('documents/construction/elevation-diagrams');
const doorListTemplate = new $t('documents/construction/door-list');
const materialsTemplate = new $t('documents/construction/materials');
const aerialsTemplate = new $t('documents/construction/aerials');
const orderInfoTemplate = new $t('documents/construction/order-information');

const NO_CABINETS_EXIST_HTML = '<h2>Must define atleast one cabinet</h2>';

function forEachCabinetInfo(order, func) {
  Object.values(order.rooms).forEach(r => r.groups
                                .forEach(g => g.objects.forEach(func)));
}

function getCabinetInfos(order) {
  const list = [];
  forEachCabinetInfo(order, cabinet => list.push(cabinet));
  return list;
}

function listToTemplate(partInformation, type, template, width, height, thickness) {
  const partInfos = (partInformation.byCategory(type) || {PARTS: []}).PARTS;
  const map = {};
  const disp = Utils.display;
  partInfos.forEach(info => {
    const part = info.parts[0];
    const category = part.category();
    const key = disp.demensions(info.demensions);
    if (map[category] === undefined) map[category] = {};
    if (map[category][key] === undefined) {
      map[category][key] = [];
      map[category][key].info = info;
    }
    map[category][key].push(part);
  });

  const partListMap = {};
  Object.keys(map).forEach(key => partListMap[key] = Object.values(map[key]));
  return template.render({partListMap, disp, type, width, height, thickness});
}

const materialGroupInit = (map, category, groupStr, groupLen) => {
  if (map[category].pathValue(groupStr) !== undefined) return;
  const list = map[category].pathValue(groupStr, {list: []}).list;
  list.depth = groupLen;
}

function materialListToTemplate(partInformation, type, template) {
  const parts = partInformation.match(type);
  const map = {};
  const disp = Utils.display;
  parts.forEach(info => {
    const part = info.parts[0];
    if (part.parentAssembly()) {
      const category = info.category || part.category();
      const key = disp.demensions(info.demensions);
      const groups = Utils.materialGroup(info);
      groups.concatInPlace(info.subCategory);
      if (Utils.materialUnit(part).unit !== 'CUBIC') {
        if (map[category] === undefined) map[category] = {};
        groups.forEach((str, i) => materialGroupInit(map, category, groups.slice(0,i+1).join('.'), i + 1));
        map[category].pathValue(groups.join('.')).list.push(info);
      }
    }
  });

  const categories = o => {
    const cats = {};
    Object.keys(o).filter(k=>k!=='list').forEach(k => cats[k] = o[k]);
    return cats;
  }
  return template.render({partListMap: map, disp, type, categories});
}

const DocumentationHtml = {}
DocumentationHtml.print = {};
DocumentationHtml.print.container = (innerHTML) => {
  return `<div id='document-print-body'>
            <div class='document-cnt'>${innerHTML}</div>
          </div>
`;
}

DocumentationHtml.cabinetList = (partInformation) => {
  const cabinets = getCabinetInfos(partInformation.order());
  return cabinetListTemplate.render({cabinets, Utils});
}

const area = (dem) => dem.x * dem.y * dem.z;
const sorter = (pi1, pi2) => area(pi2.demensions) - area(pi1.demensions);
DocumentationHtml.parts = (cabinetPartMap) => {
  if (!cabinetPartMap) return '';

  const parentScope = {};

  parentScope.DocumentationDisplay = DocumentationHtml;
  parentScope.viewContainer = viewContainer;
  parentScope.disp = Utils.display;
  parentScope.views  = pi => pi.views ||= buildViews(pi);
  parentScope.toolingHtml = pi => pi.toolingHtml ||= cutsTemplate.render(pi, null, parentScope);
  parentScope.subCategories = cat => Object.values(cat.subCategories || {});
  let html = '';
  Object.keys(cabinetPartMap).forEach(key1 => {
    Object.keys(cabinetPartMap[key1]).forEach(key2 => {
      const scope = {root: cabinetPartMap[key1].root, category: cabinetPartMap[key1][key2]};
      html += cabinetPartTemplate.render(scope, null, parentScope);
    });
  });

  return html;
}

const partsFunction = (partType) => (partInformation) => {
  const cabinetPartMap = partInformation.byCabinet(p => p.category === partType && p.cuts && p.cuts.length);
  return DocumentationHtml.parts(cabinetPartMap);
};

DocumentationHtml.panels = partsFunction('Panel');
DocumentationHtml.shelves = partsFunction('Shelve');
DocumentationHtml.frames = partsFunction('Frame');
DocumentationHtml.panels.cutList = (partInformation) => DocumentationHtml.parts.cutList(partInformation, 'Panel');
DocumentationHtml.shelves.cutList = (partInformation) => DocumentationHtml.parts.cutList(partInformation, 'Shelve');
DocumentationHtml.frames.cutList = (partInformation) => DocumentationHtml.parts.cutList(partInformation, 'Frame');


DocumentationHtml.panels.main = (orderInfo) => {
  const order = orderInfo.order;
  orderInfo.targetInputSelector = order.worthSaving() ? buildTargetInputSelector(orderInfo) : null;
  orderInfo.selectorHtml = orderInfo.targetInputSelector ? orderInfo.targetInputSelector.html() : NO_CABINETS_EXIST_HTML;
  orderInfo.DocumentationHtml = DocumentationHtml;
  return orderTemplate.render(orderInfo);
}

DocumentationHtml.orderInfo = (order) => {
  return orderInfoTemplate.render({order, Utils});
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
      const draw = new DrawLayout(canvas, room.layout, true);
      draw.centerAndScaleAppropriatly()
      draw();
      // const panZ = new PanZoom(canvas, () => draw());
    });
  });
  return aerialsTemplate.render({order});
}


DocumentationHtml.parts.cutList = (partInformation, partType) => {
  const disp = Utils.display;
  const scope = {};
  const parts = partInformation.parts().filter(p => p.category === partType).sort((p1, p2) => {
    const s1 = p1.categories.join('-');
    const s2 = p2.categories.join('-');
    if (s1 !== s2) return s1 < s2 ? 1 : -1;
    const n1 = p1.parts[0].getRoot().name();
    const n2 = p2.parts[0].getRoot().name();
    if (n1 !== n2) return n1 < n2 ? 1 : -1;
    return p1.partsId === p2.partsId ? 0 : (p1.partsId < p2.partsId ? 1 : -1)
  });
  const pages = [];
  let currentCat;
  parts.forEach(info => info.parts.forEach((part) => {
    const cat = info.categories.join('-');
    if (currentCat !== cat) pages.push(`<div class=\'center-all\'>${currentCat = cat}</div>`);
    pages.push(cutListLabelTemplate.render({info, part, disp}));
  }));
  let levelOffCount = 30 - (pages.length % 30);
  pages.concatInPlace(Array.fill(levelOffCount, ''));//<div class=\'center-all\'>X</div>'));
  pages.group(30,3);

  scope.disp = Utils.display;
  scope.pages = pages;
  return DocumentationHtml.print.container(panelCutListTemplate.render(scope));
}

DocumentationHtml.doorList = (orderInfo) => {
  return listToTemplate(orderInfo, 'Door', doorListTemplate, 'Width', 'Height', 'Thickness');
}

DocumentationHtml.drawerFrontList = (orderInfo) => {
  return listToTemplate(orderInfo, 'DrawerFront', doorListTemplate, 'Width', 'Height', 'Thickness');
}

DocumentationHtml.drawerBoxList = (orderInfo) => {
  return listToTemplate(orderInfo, 'DrawerBox', doorListTemplate, 'Width', 'Height', 'Depth');
}

DocumentationHtml.shelveList = (orderInfo) => {
  return listToTemplate(orderInfo, 'Shelve', doorListTemplate, 'Width', 'Depth', 'Thickness');
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
      const sectionPropList = OpeningSketch.demensionSections(cabinet);
      let index = 0;
      let setIndex = 0;
      while (target = sectionPropList[index++]) {
        const i1 = Math.floor(setIndex/2);
        const i2 = setIndex++%2;
        if (sectionSets[i1] === undefined) sectionSets[i1] = [];
        sectionSets[i1][i2] = target;
      }
      return sectionSets;
    }
    const disp = Utils.display;
    const html = openingDiagramsTemplate.render({disp, sectionSets, cabinetSets, cntId: openingDiagramCntId(reqId), hash});
    cnt.innerHTML = DocumentationHtml.print.container(html);
  }
}

DocumentationHtml.buildDiagram = (partInformation, containerOselector) => {
  const reqId = String.random();
  const cabinetInfos = partInformation.cabinets();
  const cabinets = cabinetInfos.map(ci => ci.parts[0]);
  const html = DocumentationHtml.sketchLayout(cabinets, containerOselector, reqId);

  setTimeout(() => {
    cabinetInfos.forEach(info => {
      const cabinet = info.parts[0];
      const selector = `#${openingDiagramCntId(reqId)(cabinet.id())}`;
      new OpeningSketch(selector, cabinet, info);
    });
  })
  return html;
}

const cabCanvasId = (cabinet, dir) => `cabinet-${dir}-${cabinet.id()}-canvas`;
const ij = [Vector3D.i, Vector3D.j];
function drawNormalizedLayers(cabInfo, layers, dir, x, y) {
  const canvas = du.id(cabCanvasId(cabInfo.parts[0], dir));
  layers = layers.map(l => l.copy());
  const cabNorms = cabInfo.parts[0].normals();
  const norms = [cabNorms[x], cabNorms[y]];
  const rotations = Vector3D.coDirectionalRotations(norms, ij);
  const center = cabInfo.model.csg.center();
  const dems = cabInfo.demensions;
  layers.forEach(l => l.rotate(rotations, center));
  layers.sort((a,b) => a.center().z - b.center().z);
  const draw = new Draw2d(canvas);
  draw.position(center, {x: dems[x] * 1.1, y: dems[y] * 1.1});
  draw(layers);
}
async function drawCabinets(cabinets) {
  for (let index = 0; index < cabinets.length; index++) {
    const cabInfo = cabinets[index];
    const normals = cabInfo.normals;
    const layers = cabInfo.layers;
    drawNormalizedLayers(cabInfo, layers, 'front', 'x', 'y');
    drawNormalizedLayers(cabInfo, layers, 'top', 'x', 'z');
    drawNormalizedLayers(cabInfo, layers, 'side', 'z', 'y');
  }
}

DocumentationHtml.threeView = (partInformation) => {
  const cabinetInfos = partInformation.cabinets();
  setTimeout(() => drawCabinets(cabinetInfos));
  const disp = Utils.display;
  return threeViewTemplate.render({cabinetInfos, cabCanvasId, disp})
}


const elevationCanvasId = index => `elevation-disp-group-${index}`;
DocumentationHtml.elevationDiagram = (partInformation) => {
  const cabinetInfos = partInformation.cabinets();
  if (cabinetInfos.find(info => info.parts.length > 1))
    console.warn.logarithmic('Algorithym is not set up for duplicate cabinets');
  const normalMap = new ToleranceMap({"normals.z.(i,j,k)": .001});
  normalMap.addAll(cabinetInfos);
  const groups = normalMap.group();
  if (Object.values(partInformation.order().rooms).find(room => room.layout().walls().length > 4))
    console.warn.logarithmic('Algorithym is not set up for rooms with more than 4 walls need to sort/makeNew groups based on distance');

  groups.forEach((group, i) => {
    group.normals = [group[0].normals.x, group[0].normals.y, group[0].normals.z];
    group.rotz = Vector3D.coDirectionalRotations(group.normals);
    group.csg = new CSG();
    group.forEach(info => {
      group.csg = group.csg.union(positionAssemblyCsg(info.model.csg, info.parts[0]));
    });
  });

  for (let i = 0; i < groups.length; i++) {
    const polys = Polygon3D.fromCSG(groups[i].csg.cube());
    for (let j = i + 1; j < groups.length; j++) {
      const dist = polys.map(p => p.distance(new Vertex3D(groups[j].csg.center()))).min();
      if (dist < 2.54*36) {
        groups[i].concatInPlace(groups[j]);
        groups[i].csg = groups[i].csg.union(groups[j].csg);
        groups.splice(j, 1);
        j--;
      }
    }
  }

  const groupLayerArr = groups.map((group, i) => {
    group.csg.rotate(group.rotz);
    const layers = Layer.fromCSG(group.csg);
    layers.sortByAttr('center().z');
    return layers;
  });

  setTimeout(() => {
    groups.forEach((group, i) => {
      const canvas = du.id(elevationCanvasId(i));
      const draw = new Draw2d(canvas);
      const dems = group.csg.demensions();
      draw.position(group.csg.center(), {x: dems.x * 1.1, y: dems.y * 1.1});
      draw(groupLayerArr[i]);
    });
  }, 2000);

  return elevationDiagramsTemplate.render({groups, elevationCanvasId});
}


module.exports = DocumentationHtml;


function buildCanvas(info, zOnz) {
  if (info.model === undefined) return;
  const side = zOnz ? 'z' : '-z';
  const model = info.model.csg;
  const layers = info.model[side];
  const center = model.center();
  const canvas = du.create.element('canvas', {class: 'mirror-x part-canvas'});
  const dems = model.demensions();
  const draw = new Draw2d(canvas);
  draw.staticOffset = true;
  draw.position(center, {x: dems.x * 1.5, y: dems.y * 1.5});
  const size = `${.1*Math.max(dems.x, dems.y)}px`;

  const corners = draw.corners();
  const sideLabel = Vector3D.sector(zOnz ? info.normals.z : info.normals.z.inverse());
  const leftOright = sideLabel.match(/^(Left|Front|Top)$/) !== null;
  const sideLabelCenter = {x: corners[1].x, y: corners[1].y, z:0};

  const origin = new Vertex2d(0, 0);
  draw(origin);
  draw.text('(0,0)', origin, {size, radians: Math.PI, location: 'BottomRight', mirror: 'y'});

  draw(layers);
  // draw.text(sideLabel, sideLabelCenter, {size, radians: Math.PI, location: 'BottomLeft', mirror: 'y'});
  const infoEdges = info.fenceEdges[side];
  const edges = infoEdges.map(l => l.copy());
  edges.forEach((l, i) => {
    const textProps = {size, radians: l.radians()-Math.PI, location: 'Top', mirror: 'y'};
    const label = l.label;
    const text = `${label}`;
    draw.text(text, l.midpoint(), textProps);
  });

  info.cuts.filter(c => c.marker && c.marker.line && c.primarySide === leftOright).forEach((c,i) => {
    const line = c.marker.line;
    const radians = line.radians()-Math.PI;
    const textProps = {size, radians, location: 'Left', mirror: 'y'};
    const label = c.marker.label;
    const text = `${label}`;
    draw.text(text, line[1], textProps);
  });
  const finishedInt = info.model.finishedInterior;
  const material = finishedInt && finishedInt[side] ? 'Pre Finished' : '';
  return {canvas, label: sideLabel, leftOright, material};
}

function buildViews(info) {
  if (!info.cuts || info.cuts.length === 0) return;
  const view1 = buildCanvas(info, info.primarySide);
  const view2 = buildCanvas(info, !info.primarySide);
  return views = {
    left: view1,
    right: view2
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
  inputTree.on.submit(targetSelected(orderInfo));
  return inputTree;
}

function viewContainer(viewObj) {
  const id = `view-container-${String.random()}`;
  setTimeout(() => {
    if (viewObj && viewObj.canvas) {
      const cnt = du.id(id);
      cnt.append(viewObj.canvas);
    }
  });
  return id;
}

du.on.match('keycombo(Control,p)', '*', () => console.log('before print'));
du.on.match('keycombo(Control,z)', '*', () => console.log('after print'));
