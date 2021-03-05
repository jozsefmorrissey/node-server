
class Assembly {
  constructor(width, height, depth, defaultSizes) {
    const subAssemblies = [];
    let features = Feature.get(this.constructor.name);
    if (defaultSizes === undefined) defaultSizes = {};
    this.width = width !== undefined ? width : defaultSizes.width;
    this.height = height !== undefined ? height : defaultSizes.height;
    this.depth = depth !== undefined ? depth : defaultSizes.depth;
    this.addSubAssembly = (assembly) => subAssemblies.push(assembly);
    this.addFeature= (features) => feature.push(feature);
    const objId = this.constructor.name;
    if (Assembly.idCounters[objId] === undefined) {
      Assembly.idCounters[objId] = 0;
    }
    this.id = ++Assembly.idCounters[objId];
    Assebly.add(this);
  }
}

Assebly.add = (assembly) => {
  const name = assembly.constructor.name;
  if (Assembly.list[name] === undefined) Assembly.list[name] = [];
  Assembly.list[name].push(assembly);
}
Assebly.all = () => {
  const list = [];
  const keys = Object.keys(Assembly.list);
  keys.forEach((key) => list.push(Assembly.list[key]));
  return list;
}
Assembly.lists = {};
Assembly.idCounters = {};

class Section extends Assembly {
  constructor(templatePath, parentList, isPartition, width, height, depth) {
    super(templatePath, isPartition, width, height, depth);
    this.features = [];
    this.isPartition = () => isPartition;
    this.parentList = () => parentList;
    if (templatePath === undefined) {
      throw new Error('template path must be defined');
    }
    this.constructorId = this.constructor.name;
    this.name = this.constructorId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
    Section.sections[this.constructorId] = this;
    Section.templates[this.constructorId] = new $t(templatePath);
  }
}
Section.sections = {};
Section.getSections = (isPartition) => {
  const sections = [];
  Object.values(Section.sections).forEach((section) => {
    const part = section.isPartition();
    if(isPartition === undefined || part === isPartition) sections.push(section);
  });
  return sections;
}
Section.keys = () => Object.keys(Section.sections);
Section.templates = {};
Section.new = (constructorId) => new (Section.sections[constructorId]).constructor();
Section.render = (opening, scope) => {
  scope.featureDisplay = new FeatureDisplay(opening.features).html();
  const cId = opening.constructorId;
  if (cId === 'OpenSection') {
    return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
  }
  return Section.templates[cId].render(scope);
}


class PartitionSection extends Section {
  constructor(templatePath, parentList, width, height, depth) {
    super(templatePath, parentList, true, width, height, depth);
  }
}

class SpaceSection extends Section {
  constructor(templatePath, parentList, width, height, depth) {
    super(templatePath,  parentList, false, width, height, depth);
  }
}


const sectionFilePath = (filename) => `./public/html/planks/sections/${filename}.html`;

class Feature {
  constructor(id, properties) {
    properties = properties || [];
    this.enabled = false;
    this.name = id.replace(/([a-z])([A-Z])/g, '$1.$2')
                  .replace(/\.([a-zA-Z0-9])/g, Feature.formatName);
    this.id = id;
    this.features = [];
    this.isRoot = (path) => path === 'root';
    this.multipleFeatures = () => this.features.length > 1;
    this.checkbox = () => this.id.indexOf('has') === 0;
    this.isRadio = (siblings, path) => !(this.checkbox() || this.isRoot(path) || siblings.length === 1);
    this.addFeature = (id) => this.features.push(Feature.tree[id]);
    properties.forEach((featureId) => this.addFeature(featureId))
    Feature.byId[id] = this;
  }
}

Feature.byId = {};
Feature.objMap = {};
Feature.addRelations = (id, names) => {
  names.forEach((name) => {
    if (Feature.map[id] === undefined) Feature.map[id] = [];
    Feature.map[id].push(Feature.byId(name));
  });
};
Feature.getList = () => {
  const list = [];
  Feature.byId(id).forEach((feature) => list.push(new feature.constructor());
  return list;
}
Feature.formatName = (match) => ` ${match[1].toUpperCase()}`;

new Feature('thickness');
new Feature('inset');
new Feature('fullOverlay');
new Feature('1/8');
new Feature('1/4');
new Feature('1/2');
new Feature('roundOver', ['1/8', '1/4', '1/2']);
new Feature('knockedOff');
new Feature('hasFrame', ['thickness']);
new Feature('hasPanel', ['thickness']);
new Feature('insetProfile');
new Feature('glass');
new Feature('edgeProfile', ['roundOver', 'knockedOff']);
new Feature('drawerFront', ['edgeProfile'])
new Feature('doveTail');
new Feature('miter');
new Feature('drawerBox', ['doveTail', 'miter'])
new Feature('insetPanel', ['glass', 'insetProfile'])
new Feature('solid');
new Feature('doorType', ['fullOverlay', 'inset']);
new Feature('doorStyle', ['insetPanel', 'solid'])
new Feature('drawerType', ['fullOverlay', 'inset']);
console.log(JSON.stringify(Feature.tree, null, 2));

Feature.addRelations('Drawer', ['drawerType', 'drawerFront', 'drawerBox']);
Feature.addRelations('PartitionSection', ['hasFrame', 'hasPanel']);
Feature.addRelations('Door', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('DoubleDoor', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('FalseFront', ['drawerType', 'edgeProfile']);

class Cost {
  constructor(id, formula, options) {
    formula = formula || 0;
    const optionalPercentage = options.optionalPercentage;
    const demMutliplier = options.demMutliplier;
    let percentage = 100;
    const getMutliplier = (attr) => {
      if (options.demMutliplier !== undefined) {
        return options.demMutliplier;
      }
      return 'llwwdd';
    }
    this.calc(assembly) => {
      let priceStr = formula.toLowerCase();
      for (let index = 0; index < 6; index += 1) {
        const char = priceStr[index];
        let multiplier;
        switch (char) {
          case 'l': value = assembly['length'] break;
          case 'w': value = assembly['width'] break;
          case 'd': value = assembly['depth'] break;
          default: value = 1;
        }
        priceStr.replace(new RegExp(`/${char}/`), assembly[value]);
      }
      try {
        const price = eval(priceStr)
        if (optionalPercentage) price*percentage;
        return price;
      } catch (e) {
        return -0.01;
      }
    }

    const cName = this.constructor.name;
    if (Cost.lists[cName]) Cost.lists[cName] = {};
    if (Cost.lists[cName][id]) Cost.lists[cName][id] = [];
    Cost.lists[cName][id].push(this);

  }
}
Cost.lists = {};
Const.objMap = {}
Const.get = (name) => {
  const obj = Cost.lists[id];
  if (obj === undefined) return null;
  return new obj.constructor();
}
Cost.addRelations = (type, id, name) {
  names.forEach((name) => {
    if (objMap[id] === undefined) Cost.objMap[id] = {Labor: [], Material: []}
    if (type === Labor) Cost.objMap[id].Labor.push(Cost.get(name));
    if (type === Material) Cost.objMap[id].Material.push(Cost.get(name));
  });
}
class Labor extends Cost {
  constructor (id, formula, optionalPercentage) {
  }
}
Labor.addRelations = (id, name) => Cost.addRelations(Labor, id, name);

class Material extends Cost {
  constructor (id, formula, optionalPercentage) {
  }
}
Material.addRelations = (id, name) => Cost.addRelations(Material, id, name);

new Labor('Pannel', '1+(0.05*l*w'));
new Labor('Frame', '0.25');
new Labor('GlueFrame', '0.25');
new Labor('SandFrame', '0.05*l*l*w*w*d*d');
new Labor('SandPanel', '(0.25*l*w)/12');
new Labor('GlueMiter', '(0.25*l*l*w*w)');
new Labor('InstallBlumotionGuides', '2');
new Labor('InstallOtherGuides', '2');
new Labor('InstallFushHinges', '2');
new Labor('installOverLayHinges', '2');
new Labor('Paint', '(l*l*w*w*.1)/12');
new Labor('Stain', '(l*l*w*w*.25)/12');
new Labor('InstallDrawerFront', '2');
new Labor('InstallPullout', 10);

new Material('Wood');
new Material('Wood.SoftMapel', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Wood.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Wood.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood');
new Material('Plywood.SoftMapel.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Hickory.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Oak.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.SoftMapel.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Hickory.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Oak.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Glass');
new Material('Glass.Flat', '(l*w*d)*.2', {optionalPercentage: true});
new Material('Glass.textured', '(l*w*d)*.2', {optionalPercentage: true});

class DrawerSection extends SpaceSection {
  constructor(parentList, width, height, depth) {
    super(sectionFilePath('drawer'), parentList, width, height, depth);
  }
}
new DrawerSection();

class DividerSection extends PartitionSection {
  constructor(parentList, width, height, depth) {
    super(sectionFilePath('divider'), parentList, width, height, depth);
  }
}
new DividerSection();

class DoorSection extends SpaceSection {
  constructor(parentList, width, height, depth) {
    super(sectionFilePath('door'), parentList, width, height, depth);
  }
}
new DoorSection();
console.log(JSON.stringify(new DoorSection().features, null, 2))

class DualDoorSection extends SpaceSection {
  constructor(parentList, width, height, depth) {
    super(sectionFilePath('dual-door'), parentList, width, height, depth);
  }
}
new DualDoorSection();

class FalseFrontSection extends SpaceSection {
  constructor(parentList, width, height, depth) {
    super(sectionFilePath('false-front'), parentList, width, height, depth);
  }
}
new FalseFrontSection();

class FrameDivider extends Assembly {
  constructor (width, height, depth) {
    super(width, height, depth);
  }
}

const divSet = {horizontal: [], vertical: []};
const getHorizontalDivSet = (id) => divSet.horizontal[id];
const getVerticalDivSet = (id) => divSet.vertical[id];
const setDivSet = (id, sizes) => {
  if (divSet[type][sizes.length] === undefined) divSet[type][sizes.length] = [];
  divSet[type][sizes.length] = sizes;
}
const setHorizontalDivSet = (id, sizes) => (id, sizes, 'horizontal');
const setVerticalDivSet = (id, sizes) => (id, sizes, 'vertical');

class OpenSection extends SpaceSection {
  constructor(parentList, width, height, depth) {
    super(sectionFilePath('open'), parentList, width, height, depth);
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.vertical = true;
    this.sections = [];
    this.dividerCount = () => (this.sections.length - 1) / 2
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical;

    this.init = () => {
      if (this.sections.length === 0) {
        this.sections.push(new OpenSection(undefined, undefined, undefined, this));
      }
    }
    this.divide = (dividerCount) => {
      if (!Number.isNaN(dividerCount)) {
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount * 2 + 1);
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = 0; index < diff; index +=1) {
            this.sections.push(new DividerSection(this));
            this.sections.push(new OpenSection(this));
          }
        }
      }
    }
    this.size = () => {
      return {width: this.width, height: this.height};
    }
  }
}

const framedFrameWidth = 1.5;
const framelessFrameWidth = 3/4;
const defaultCabinetSize = {width: 22, height: 24, depth: 21}
class Cabinet extends Assembly {
  constructor(width, height, depth) {
    super(width, height, depth, defaultCabinetSize);
    let frameWidth = framedFrameWidth;
    let toeKickHeight = 4;
    let verticelSections = [];
    let horizontalSections = [];
    const panels = 0;
    this.opening = new OpenSection();
    const framePieces = 0;
    const addFramePiece = (piece) => framePieces.push(piece);
    const framePieceCount = () => pieces.length;
    const addPanel = (panel) => panels.push(panel);
    const panelCount = () => panels.length;
    const opening = () => {
      const w = width - (frameWidth * 2);
      const h = height - toeKickHeight - (frameWidth * 2);
      return {width: w, height: h};
    }
  }
}







// ----------------------------------  Display  ---------------------------//

function createElement(tagname, attributes) {
  const elem = document.createElement(tagname);
  const keys = Object.keys(attributes);
  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
  return elem;
}

function up(selector, node) {
  if (node instanceof HTMLElement) {
    if (node.matches(selector)) {
      return node;
    } else {
      return up(selector, node.parentNode);
    }
  }
}

function down(selector, node) {
    function recurse (currNode, distance) {
      if (currNode.matches(selector)) {
        return { node: currNode, distance };
      } else {
        let found = { distance: Number.MAX_SAFE_INTEGER };
        for (let index = 0; index < currNode.children.length; index += 1) {
          distance++;
          const child = currNode.children[index];
          const maybe = recurse(child, distance);
          found = maybe && maybe.distance < found.distance ? maybe : found;
        }
        return found;
      }
    }
    return recurse(node, 0).node;
}

function closest(selector, node) {
  const visited = [];
  function recurse (currNode, distance) {
    let found = { distance: Number.MAX_SAFE_INTEGER };
    if (!currNode || (typeof currNode.matches) !== 'function') {
      return found;
    }
    visited.push(currNode);
    if (currNode.matches(selector)) {
      return { node: currNode, distance };
    } else {
      for (let index = 0; index < currNode.children.length; index += 1) {
        const child = currNode.children[index];
        if (visited.indexOf(child) === -1) {
          const maybe = recurse(child, distance + index + 1);
          found = maybe && maybe.distance < found.distance ? maybe : found;
        }
      }
      if (visited.indexOf(currNode.parentNode) === -1) {
        const maybe = recurse(currNode.parentNode, distance + 1);
        found = maybe && maybe.distance < found.distance ? maybe : found;
      }
      return found;
    }
  }

  return recurse(node, 0).node;
}


const selectors = {};
let matchRunIdCount = 0;
function getTargetId(target) {
  if((typeof target.getAttribute) === 'function') {
    let targetId = target.getAttribute('ce-match-run-id');
    if (targetId === null || targetId === undefined) {
      targetId = matchRunIdCount + '';
      target.setAttribute('ce-match-run-id', matchRunIdCount++)
    }
    return targetId;
  }
  return target === document ?
        '#document' : target === window ? '#window' : undefined;
}

function runMatch(event) {
  const  matchRunTargetId = getTargetId(event.currentTarget);
  const selectStrs = Object.keys(selectors[matchRunTargetId][event.type]);
  selectStrs.forEach((selectStr) => {
    const target = up(selectStr, event.target);
    if (target) {
      selectors[matchRunTargetId][event.type][selectStr].forEach((func) => func(target, event));
    }
  })
}

function matchRun(event, selector, func, target) {
  target = target || document;
  const  matchRunTargetId = getTargetId(target);
  if (selectors[matchRunTargetId] === undefined) {
    selectors[matchRunTargetId] = {};
  }
  if (selectors[matchRunTargetId][event] === undefined) {
    selectors[matchRunTargetId][event] = {};
    target.addEventListener(event, runMatch);
  }
  if (selectors[matchRunTargetId][event][selector] === undefined) {
    selectors[matchRunTargetId][event][selector] = [];
  }

  selectors[matchRunTargetId][event][selector].push(func);
}

class DivisionPattern {
  constructor() {
    this.patterns = {};
    const instance = this;
    this.filter = (dividerCount) => {
      const sectionCount = dividerCount + 1;
      if (sectionCount < 2) return '';
      let filtered = '';
      let patternArr = Object.values(this.patterns);
      patternArr.forEach((pattern) => {
        if (pattern.restrictions === undefined || pattern.restrictions.indexOf(sectionCount) !== -1) {
          filtered += `<option value='${pattern.name}'>${pattern.name}</option>`;
        }
      });
      this.inputStr
      return filtered;
    }
    this.add = (name, resolution, inputarr, restrictions) => {
      inputarr = inputarr || [];
      let inputHtml = '';
      inputarr.forEach((label, index) => {
        const labelTag = `<label>${label}</label>`;
        const inputTag = `<input class='division-pattern-input' name='${name}' index='${index}'>`;
        inputHtml += labelTag + inputTag;
      });
      this.patterns[name] = {name, resolution, restrictions, inputHtml};
    }
    matchRun('change', '.open-pattern-select', (target) => {
      target.nextElementSibling.innerHTML = instance.patterns[target.value].inputHtml;
    });
    matchRun('keyup', '.division-pattern-input', (target) => {
      const name = target.getAttribute('name');
      const index = Number.parseInt(target.getAttribute('index'));
      const value = Number.parseFloat(target.value);
      const inputs = target.parentElement.querySelectorAll('.division-pattern-input');
      const pattern = instance.patterns[name];

      const values = pattern.resolution(24, 1.5, index, value);
      for (let index = 0; index < values.length; index += 1){
        const value = values[index];
        if(value) inputs[index].value = value;
      }
    });
  }
}

matchRun('change', '.feature-radio', (target) => {
  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
  target.nextElementSibling.hidden = !target.checked;
});

DivisionPattern = new DivisionPattern();

DivisionPattern.add('Unique',(length, array) => {

});

DivisionPattern.add('Equal', (length, index, value) => {

});

DivisionPattern.add('1 to 2', (length, dividerLength, index, value) => {
  if (index === 0) {
    const twoValue = (length - dividerLength * 2 - value) / 2;
    return [, twoValue];
  } else {
    const oneValue = (length - (value + dividerLength) * 2);
    return [oneValue];
  }
}, ['first(1):', 'next(2)'], [3]);

DivisionPattern.add('2 to 2', (length, array) => {

}, ['first(2):', 'next(2)'], [4]);

DivisionPattern.add('1 to 3', (length, array) => {

}, ['first(1):', 'next(3)'], [4]);

// properties
//  required: {
//  getHeader: function returns html header string,
//  getBody: function returns html body string,
//}
//  optional: {
//  list: list to use, creates on undefined
//  getObject: function returns new list object default is generic js object,
//  parentSelector: cssSelector only reqired for refresh function,
//  listElemLable: nameOfElementType changes add button label,
//  hideAddBtn: defaults to false,
//  type: defaults to list,
//  selfCloseTab: defalts to true - allows clicking on header to close body,
//  findElement: used to find elemenents related to header - defaults to closest
//}
class ExpandableList {
  constructor(props) {
    props.list = props.list || [];
    props.type = props.type || 'list';
    props.findElement = props.findElement || ((selector, target) =>  closest(selector, target));
    this.findElement = props.findElement;
    props.selfCloseTab = props.selfCloseTab === undefined ? true : props.selfCloseTab;
    props.getObject = props.getObject || (() => {});
    props.id = ExpandableList.lists.length;
    this.id = () => props.id;
    let pendingRefresh = false;
    let lastRefresh = new Date().getTime();
    const storage = {};
    props.activeIndex = 0;
    ExpandableList.lists[props.id] = this;
    this.add = () => {
      props.list.push(props.getObject());
      this.refresh();
    };
    this.isSelfClosing = () => props.selfCloseTab;
    this.remove = (index) => {
      props.list.splice(index, 1);
      this.refresh();
    }
    this.refresh = (type) => {
      props.type = (typeof type) === 'string' ? type : props.type;
      if (!pendingRefresh) {
        pendingRefresh = true;
        setTimeout(() => {
          const parent = document.querySelector(props.parentSelector);
          const html = ExpandableList[`${props.type}Template`].render(props);
          if (parent && html !== undefined) parent.innerHTML = html;
          pendingRefresh = false;
        }, 100);
      }
    };
    this.activeIndex = (value) => value === undefined ? props.activeIndex : (props.activeIndex = value);
    this.value = (index) => (key, value) => {
      if (index === undefined) index = props.activeIndex;
      if (storage[index] === undefined) storage[index] = {};
      if (value === undefined) return storage[index][key];
      storage[index][key] = value;
    }
    this.set = (index, value) => props.list[index] = value;
    this.htmlBody = (index) => props.getBody(props.list[index]);
    this.refresh();
  }
}
ExpandableList.lists = [];
ExpandableList.listTemplate = new $t('./public/html/planks/expandable-list.html');
ExpandableList.pillTemplate = new $t('./public/html/planks/expandable-pill.html');
ExpandableList.sidebarTemplate = new $t('./public/html/planks/expandable-sidebar.html');
ExpandableList.getIdAndIndex = (target) => {
  const cnt = up('.expand-header,.expand-body', target);
  const id = cnt.getAttribute('ex-list-id');
  const index = cnt.getAttribute('index');
  return {id, index};
}
ExpandableList.getValueFunc = (target) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].value(idIndex.index);
}

ExpandableList.set = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  ExpandableList.lists[idIndex.id].set(idIndex.index, value);
}

ExpandableList.value = (key, value, target) => {
  return ExpandableList.getValueFunc(target)(key, value);
}
matchRun('click', '.expandable-list-add-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  ExpandableList.lists[id].add();
});
matchRun('click', '.expandable-item-rm-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  const index = target.getAttribute('index');
  ExpandableList.lists[id].remove(index);
});
ExpandableList.closeAll = (header) => {
  const hello = 'world';
}

matchRun('click', '.expand-header', (target, event) => {
  const isActive = target.matches('.active');
  const id = target.getAttribute('ex-list-id');
  const list = ExpandableList.lists[id];
  if (isActive && event.target === target) {
    target.className = target.className.replace(/(^| )active( |$)/g, '');
    list.findElement('.expand-body', target).style.display = 'none';
    list.activeIndex(null);
    target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'none';
  } else {
    const headers = up('.expandable-list', target).querySelectorAll('.expand-header');
    const bodys = up('.expandable-list', target).querySelectorAll('.expand-body');
    const rmBtns = up('.expandable-list', target).querySelectorAll('.expandable-item-rm-btn');
    headers.forEach((header) => header.className = header.className.replace(/(^| )active( |$)/g, ''));
    bodys.forEach((body) => body.style.display = 'none');
    rmBtns.forEach((rmBtn) => rmBtn.style.display = 'none');
    const body = list.findElement('.expand-body', target);
    body.style.display = 'block';
    const index = target.getAttribute('index');
    list.activeIndex(index);
    body.innerHTML = list.htmlBody(index);
    target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
    target.className += ' active';
  }
});

class Show {
  constructor(name) {
    this.name = name;
    Show.types[name] = this;
  }
}
Show.types = {};
Show.listTypes = () => Object.values(Show.types);
new Show('None');
new Show('Flat');
new Show('Inset Panel');

const OpenSectionDisplay = {};
OpenSectionDisplay.html = (opening, list, sections) => {
  const openDispId = OpenSectionDisplay.getId(opening);
  opening.init();
  OpenSectionDisplay.sections[opening.id] = opening;
  const patterns = DivisionPattern.filter(opening.dividerCount());
  const selectPatternId = OpenSectionDisplay.getSelectId(opening);
  setTimeout(() => OpenSectionDisplay.refresh(opening), 100);
  const storage = {};
  return OpenSectionDisplay.template.render({opening, openDispId, patterns, selectPatternId, storage, list, sections});
}

OpenSectionDisplay.getSelectId = (opening) => `opin-division-patturn-select-${opening.id}`;
OpenSectionDisplay.template = new $t('./public/html/planks/opening.html');
OpenSectionDisplay.listBodyTemplate = new $t('./public/html/planks/opening-list-body.html');
OpenSectionDisplay.listHeadTemplate = new $t('./public/html/planks/opening-list-head.html');
OpenSectionDisplay.sections = {};
OpenSectionDisplay.lists = {};
OpenSectionDisplay.getId = (opening) => `open-section-display-${opening.id}`;

OpenSectionDisplay.getList = (root) => {
  let openId = root.id;
  if (OpenSectionDisplay.lists[openId]) return OpenSectionDisplay.lists[openId];
  const sections = Object.values(Section.sections);
  const getObject = (target) => sections[Math.floor(Math.random()*sections.length)];
  const parentSelector = `#${OpenSectionDisplay.getId(root)}`
  const list = root.sections;
  const hideAddBtn = true;
  const selfCloseTab = true;
  let exList;
  const getHeader = (opening, index) => {
    const sections = index % 2 === 0 ? Section.getSections(false) : [];
    return OpenSectionDisplay.listHeadTemplate.render({opening, sections});
  }
  const getBody = (opening) => {
    const list = OpenSectionDisplay.getList(root);
    return Section.render(opening, {opening, list, sections});
  }
  const findElement = (selector, target) => down(selector, up('.expandable-list', target));
  const expListProps = {
    parentSelector, getHeader, getBody, getObject, list, hideAddBtn,
    selfCloseTab, findElement
  }
  exList = new ExpandableList(expListProps);
  OpenSectionDisplay.lists[openId] = exList;
  return exList;
}

OpenSectionDisplay.refresh = (opening) => {
  const orientations = document.querySelectorAll(`[name="orientation-${opening.id}"]`);
  const orientParent = orientations[0].parentElement;
  if (opening.isVertical() === true) {
    orientations[1].checked = true;
    orientParent.style.display = 'inline-block';
  } else if (opening.isVertical() === false) {
    orientations[0].checked = true;
    orientParent.style.display = 'inline-block';
  } else {
    orientParent.style.display = 'none';
  }
  const id = OpenSectionDisplay.getId(opening);
  const target = document.getElementById(id);
  const type = opening.isVertical() === true ? 'pill' : 'sidebar';
  OpenSectionDisplay.getList(opening).refresh(type);
  const select = document.getElementById(OpenSectionDisplay.getSelectId(opening));
  if (opening.dividerCount() < 1) select.style.display = 'none';
  else {
    select.style.display = 'inline-block';
    select.innerHTML = DivisionPattern.filter(opening.dividerCount());
  }
}
OpenSectionDisplay.onChange = (target) => {
  const id = target.getAttribute('opening-id');
  const value = Number.parseInt(target.value);
  const opening = OpenSectionDisplay.sections[id];
  opening.divide(value);
  OpenSectionDisplay.refresh(opening);
  target.focus();
};

OpenSectionDisplay.onOrientation = (target) => {
  const openId = Number.parseInt(target.getAttribute('open-id'));
  const value = target.value;
  const opening = OpenSectionDisplay.sections[openId];
  opening.vertical =  value === 'vertical';
  OpenSectionDisplay.refresh(opening);
};

OpenSectionDisplay.onSectionChange = (target) => {
  ExpandableList.value('selected', target.value, target);
  ExpandableList.set(target, Section.new(target.value));
}

matchRun('keyup', '.open-division-input', OpenSectionDisplay.onChange);
matchRun('click', '.open-division-input', OpenSectionDisplay.onChange);
matchRun('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
matchRun('change', '.open-divider-select', OpenSectionDisplay.onSectionChange)

class CabinetDisplay {
  constructor(parentSelector) {
    const getHeader = (cabinet, index) => CabinetDisplay.headTemplate.render(cabinet);
    const showTypes = Show.listTypes();
    const getBody = (cabinet, index) =>
      CabinetDisplay.bodyTemplate.render({cabinet, showTypes, OpenSectionDisplay});
    const getObject = () => new Cabinet();
    const expListProps = {
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Cabinet'
    };
    new ExpandableList(expListProps);
  }
}
CabinetDisplay.bodyTemplate = new $t('./public/html/planks/cabinet-body.html');
CabinetDisplay.headTemplate = new $t('./public/html/planks/cabinet-head.html');

class FeatureDisplay {
  constructor(features, parentSelector) {
    this.html = () => FeatureDisplay.template.render({features, id: 'root'});
    this.refresh = () => {
      const container = document.querySelector(parentSelector);
      container.innerHTML = this.html;
    }
  }
}
FeatureDisplay.template = new $t('./public/html/planks/features.html');

window.onload = () => {
  const dummyText = (prefix) => (item, index) => `${prefix} ${index}`;
  const cabinetDisplay = new CabinetDisplay('body');
};
