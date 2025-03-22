const Controller = require('../views/controllers/object/layout');
const $t = require('../../../../../public/js/utils/$t.js');
const inputs = require('../../input/inputs.js');
const Utils = require('../documents/tools/utils.js');


const dividerTemplate = new $t('advanced/cabinet/divider');
const toeKickTemplate = new $t('cabinet/toe-kick');
const voidTemplate = new $t('advanced/subassemblies/void');



const Displays = {
  OpeningToeKick: (toeKick) => toeKickTemplate.render({toeKick, inputs, Measurement}),
  Divider: (divider) => dividerTemplate.render({Utils, divider, inputs, Measurement}),
  Void: (vOid) => voidTemplate.render({void: vOid, inputs, Measurement}),
  SectionProperties: (section) => {
    const patterInputHtml = Controller.patterInputHtml(section);
    const scope = {section, inputs, patterInputHtml};
    return Controller.html(section);
  }
}

const viewTemplateFiles = ['door', 'drawer-box', 'panel']
const typeTemplateMap = {};

viewTemplateFiles.forEach(type => typeTemplateMap[type.toCamelCap()] = new $t(`views/parts/type/${type}`));
viewTemplateFiles.forEach(type => Displays[type.toCamelCap()] = (assembly) => {
  const template = typeTemplateMap[assembly.constructor.name];
  return template ? template.render({assembly, inputs, Measurement}) : '';
});

module.exports = Displays;
