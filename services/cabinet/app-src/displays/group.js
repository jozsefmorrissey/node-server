


const Group = require('../objects/group.js');
const PropertyConfig = require('../config/property/config.js');
const Properties = require('../config/properties.js');
const CabinetDisplay = require('./cabinet.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Input = require('../../../../public/js/utils/input/input.js');
const Inputs = require('../input/inputs.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const Global = require('../services/global.js');

const currentStyleState = {};

class GroupDisplay extends Lookup {
  constructor() {
    super();

    let _active;
    this.active = (active) => {
      if (active) _active = active;
      return _active;
    }
    function setCurrentStyleState(values) {
      values = values || dit.values();
      const nId = dit.constructor.decode(dit.root().id()).id;
      currentStyleState[nId] = values;
      return values;
    }

    function setFrameProps(values) {
      const frameWidthNode = values._NODE.getByName('frameWidth');
      _active.resolve('fls', !frameWidthNode);
      if (frameWidthNode) {
        const frameWidth = frameWidthNode.inputArray()[0].value();
        _active.propertyConfig.display('dft', frameWidth);
      }
    }
    function setStyleProps(values) {
      const style = values.style;
      const styleKeys = {};
      Properties.groups()[style].forEach(p => styleKeys[p.code()] = true);
      Object.keys(values).forEach(k => {
        if (styleKeys[k] !== undefined) _active.propertyConfig.display(k, values[k], true);
      });
    }
    function updateDescriptor() {
      const elem = du.find(`[group-id='${_active.id()}'] .group-descriptor`);
      const style = _active.propertyConfig.value('style');
      const template = GroupDisplay.descriptorTemplates[style];
      elem.innerHTML = template.render({group: _active});
    }
    function onCabinetStyleSubmit(values) {
      const style = values.style;
      _active.propertyConfig('style', style);
      setFrameProps(values);
      setStyleProps(values[style]);
      console.log(updateDescriptor());
    }

    function styleSelector(group) {
      const dit = GroupDisplay.DecisionInputTree(onCabinetStyleSubmit, group);
      return dit.html();
    }
    function propertyHtml(group) {return GroupDisplay.propertyMenuTemplate.render({styleSelector, group})};
    this.bodyHtml = (group) =>  {
      // setTimeout(initializeDitButton, 200);
      return GroupDisplay.bodyTemplate.render({group, groupDisplay: this, propertyHtml});
    }
    this.html = (group) => {
      return GroupDisplay.headTemplate.render({propertyHtml, group, groupDisplay: this, body: this.bodyHtml(group)});
    }

    let cabDisps = {};
    this.cabinetDisplay = (group) => {
      if (!group) return;
      if (!cabDisps[group.id()]) {
          cabDisps[group.id()] = new CabinetDisplay(`[group-id="${group.id()}"].cabinet-cnt`, group);
      }
      return cabDisps[group.id()]

    }
    this.cabinet = (group) =>
        this.cabinetDisplay(group).active();

    this.cabinetHtml = (group) =>  this.cabinetDisplay(group) ? this.cabinetDisplay(group).html() : '';
  }
}

GroupDisplay.DecisionInputTree = (onSubmit, group) => {
  const propertyConfig = new PropertyConfig();
  const styles = Properties.cabinetStyles();
  const cabinetStyles = new Select({
    name: 'style',
    list: styles,
    inline: true,
    label: 'Style'
    // value: propertyConfigInst.cabinetStyle()
  });

  const hasFrame = new Select({
      name: 'frameStyle',
      inline: true,
      index: group.resolve('fls') ? 0 : 1,
      list: ['Frameless', 'Framed'],
    });

  const payload = {inputArray: [hasFrame, cabinetStyles]};
  const props = {buttonText: 'Change'};
  const dit = new DecisionInputTree('cabinetStyle', payload, props);
  dit.on.submit(onSubmit);
  dit.on.change((values) => {
    const ovNode = values._NODE.getByName('Overlay');
    if (ovNode) {
      const frameWidthNode = values._NODE.getByName('frameWidth');
      const frameless = group.resolve('fls', !frameWidthNode);
      const ovVal = group.propertyConfig('ov').value(frameless);
      ovNode.inputArray()[0].setValue(ovVal, false);
    }
  });
  const root = dit.root();


  const overlay = group.propertyConfig('ov').display();
  const overlayInput = Inputs('width', {label: 'Overlay', name: 'ov', value: overlay});
  root.then('Overlay', {inputArray: [overlayInput]});
  let cond = DecisionInputTree.getCondition('style', 'Overlay');
  root.conditions.add(cond, 'Overlay');

  const inset = group.propertyConfig('is').display();
  const insetInput = Inputs('width', {label: 'Inset', name: 'is', value: inset});
  root.then('Inset', {inputArray: [insetInput]});
  cond = DecisionInputTree.getCondition('style', 'Inset');
  root.conditions.add(cond, 'Inset');

  const revealProps = Properties.groups()['Reveal'];
  const inputArray = revealProps.map(p =>
      Inputs('width', {label: p.name().replace('Reveal ', ''), name: p.code(), value: p.display()}))
  root.then('Reveal', {inputArray});
  cond = DecisionInputTree.getCondition('style', 'Reveal');
  root.conditions.add(cond, 'Reveal');

  const frameWidth = group.propertyConfig('dfw').display();
  const fwInput = Inputs('width', {label: 'Frame Width', name: 'frameWidth', value: frameWidth});
  root.then('frameWidth', {inputArray: [fwInput]});
  cond = DecisionInputTree.getCondition('frameStyle', 'Framed');
  root.conditions.add(cond, 'frameWidth');

  return dit;
}
// du.on.match('click', `.group-display-header`, (target) => {
//   const allBodys = du.find.all('.group-display-body');
//   for (let index = 0; index < allBodys.length; index += 1) {
//     allBodys[index].hidden = true;
//   }
//   const allHeaders = du.find.all('.group-display-header');
//   for (let index = 0; index < allHeaders.length; index += 1) {
//     du.class.remove(allHeaders[index], 'active');
//   }
//   du.class.add(target, 'active');
//   const body = du.find.closest('.group-display-body', target);
//   const groupDisplayId = du.find.up('[group-display-id]', target).getAttribute('group-display-id');
//   const groupDisplay = GroupDisplay.get(groupDisplayId);
//   const group = Group.get(target.getAttribute('group-id'));
//   Global.group(group);
//   body.innerHTML = groupDisplay.bodyHtml(group);
//   groupDisplay.active(group);
//   groupDisplay.cabinetDisplay(group).refresh();
//   body.hidden = false;
// });

GroupDisplay.valueUpdate = (target) => {
  const group = Group.get(target.getAttribute('group-id'));
  const value = target.value;
  target.value = group.name(value);
}

// du.on.match('change', `[group-id].group-input`, GroupDisplay.valueUpdate);

GroupDisplay.headTemplate = new $t('group/head');
GroupDisplay.bodyTemplate = new $t('group/body');
GroupDisplay.descriptorTemplates = {
  Overlay: new $t('group/descriptors/overlay'),
  Inset: new $t('group/descriptors/inset'),
  Reveal: new $t('group/descriptors/reveal')
}
GroupDisplay.propertyMenuTemplate = new $t('properties/property-menu');
module.exports = GroupDisplay
