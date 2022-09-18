


const Group = require('../objects/group.js');
const PropertyConfig = require('../config/property/config.js');
const Properties = require('../config/properties.js');
const CabinetDisplay = require('./cabinet.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Input = require('../../../../public/js/utils/input/input.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const ThreeDMain = require('../displays/three-d-main.js');

const currentStyleState = {};

function disableButton(values, dit, elem) {
  const nId = dit.node.constructor.decode(dit.root().id()).id;
  const currState = currentStyleState[nId];
  const rootId = dit.node.constructor.decode(dit.root().id()).id;
  const button = du.find(`button[root-id='${rootId}']`);
  if (button) button.hidden = Object.equals(currState, values);
  const headers = du.find.downAll('.group-header', du.find.up('.group-cnt', button));
  headers.forEach((header) => {
    header.hidden = currState.style !== header.getAttribute("cab-style");
    if (!header.hidden) du.find.down('.group-key', header).innerText = currState.subStyle;
  });
}

class GroupDisplay extends Lookup {
  constructor(group) {
    super();
    function setCurrentStyleState(values) {
      values = values || dit.values();
      const nId = dit.node.constructor.decode(dit.root().id()).id;
      currentStyleState[nId] = values;
      disableButton(values, dit);
      return values;
    }
    function onCabinetStyleSubmit(values) {
      setCurrentStyleState(values);
      group.propertyConfig.set(values.style, values.subStyle);
      ThreeDMain.update();
    }

    let initialized = false;
    function initializeDitButton() {
      if (initialized) disableButton(dit.values(), dit);
      else {
        disableButton(setCurrentStyleState(), dit);
        initialized = true;
      }
    }
    const dit = GroupDisplay.DecisionInputTree(onCabinetStyleSubmit, group.propertyConfig);
    function styleSelector() {
      return dit.root().payload().html();
    }
    function propertyHtml() {return GroupDisplay.propertyMenuTemplate.render({styleSelector})};
    this.html = () => {
      return GroupDisplay.headTemplate.render({group, propertyHtml, groupDisplay: this});
    }
    this.bodyHtml = () =>  {
      setTimeout(initializeDitButton, 200);
      return GroupDisplay.bodyTemplate.render({group, propertyHtml});
    }

    this.cabinetDisplay = new CabinetDisplay(`[group-id="${group.id()}"].cabinet-cnt`, group);
    this.cabinet = () => this.cabinetDisplay().active();
  }
}

GroupDisplay.DecisionInputTree = (onSubmit, propertyConfigInst) => {
  const dit = new DecisionInputTree(undefined, {buttonText: 'Change'});
  dit.onChange(disableButton);
  dit.onSubmit(onSubmit);
  const propertyConfig = new PropertyConfig();
  const styles = propertyConfig.cabinetStyles();
  const cabinetStyles = new Select({
    name: 'style',
    list: styles,
    label: 'Style',
    value: propertyConfigInst.cabinetStyle()
  });

  const hasFrame = new Select({
      name: 'FrameStyle',
      list: ['Frameless', 'Framed', 'Frame Only'],
      value: 'Frameless'
    });

  const style = dit.branch('style', [hasFrame, cabinetStyles]);
  styles.forEach((styleName) => {
    const properties = Properties.groupList(styleName);
    const selectObj = Object.keys(properties);
    const select = new Select({
      name: 'subStyle',
      list: selectObj,
      value: propertyConfigInst.cabinetStyleName()
    });
    const condtionalPayload = new DecisionInputTree.ValueCondition('style', [styleName], [select]);
    style.conditional(styleName, condtionalPayload);
  });

  return dit;
}

du.on.match('click', `.group-display-header`, (target) => {
  const allBodys = du.find.all('.group-display-body');
  for (let index = 0; index < allBodys.length; index += 1) {
    allBodys[index].hidden = true;
  }
  const allHeaders = du.find.all('.group-display-header');
  for (let index = 0; index < allHeaders.length; index += 1) {
    du.class.remove(allHeaders[index], 'active');
  }
  du.class.add(target, 'active');
  const body = du.find.closest('.group-display-body', target);
  const groupDisplayId = du.find.up('[group-display-id]', target).getAttribute('group-display-id');
  const groupDisplay = GroupDisplay.get(groupDisplayId);
  body.innerHTML = groupDisplay.bodyHtml();
  groupDisplay.cabinetDisplay.refresh();
  body.hidden = false;
});

GroupDisplay.valueUpdate = (target) => {
  const group = Group.get(target.getAttribute('group-id'));
  const value = target.value;
  group.name(value);
}

du.on.match('change', `[group-id].group-input`, GroupDisplay.valueUpdate);

GroupDisplay.headTemplate = new $t('group/head');
GroupDisplay.bodyTemplate = new $t('group/body');
GroupDisplay.propertyMenuTemplate = new $t('properties/property-menu');
module.exports = GroupDisplay
