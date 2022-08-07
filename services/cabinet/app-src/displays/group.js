


const Group = require('../objects/group.js');
const PropertyConfig = require('../config/property/config.js');
const Properties = require('../config/properties.js');
const CabinetDisplay = require('./cabinet.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Input = require('../../../../public/js/utils/input/input.js');
const ExpandableObject = require('../../../../public/js/utils/lists/expandable-object.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const ThreeDMain = require('../displays/three-d-main.js');

class GroupDisplay extends Lookup {
  constructor(group) {
    super();
    function onCabinetStyleChange(values) {
      group.propertyConfig.set(values.style, values.subStyle);
      ThreeDMain.update();
    }
    const dit = GroupDisplay.DecisionInputTree(onCabinetStyleChange, group.propertyConfig);
    function styleSelector() {
      return dit.root().payload().html();
    }
    function propertyHtml() {return GroupDisplay.propertyMenuTemplate.render({styleSelector})};
    this.html = () => {
      return GroupDisplay.headTemplate.render({group, propertyHtml, groupDisplay: this});
    }
    this.bodyHtml = () =>  GroupDisplay.bodyTemplate.render({group, propertyHtml});

    this.cabinetDisplay = new CabinetDisplay(`[group-id="${group.id()}"].cabinet-cnt`, group);
    this.cabinet = () => this.cabinetDisplay().active();
  }
}

GroupDisplay.DecisionInputTree = (onComplete, propertyConfigInst) => {
  const dit = new DecisionInputTree(onComplete, {buttonText: 'Change', noSubmission: 2000});
  const propertyConfig = new PropertyConfig();
  const styles = propertyConfig.cabinetStyles();
  const cabinetStyles = new Select({
    name: 'style',
    list: styles,
    label: 'Style',
    value: propertyConfigInst.cabinetStyle()
  });

  const hasFrame = new Input({
    name: 'hasFrame',
    type: 'checkbox',
    label: 'Has Frame'
  })

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
