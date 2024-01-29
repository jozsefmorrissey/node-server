const Joint = require('../../app-src/objects/joint/joint.js');
const Assembly = require('../../app-src/objects/assembly/assembly.js');
const KeyValue = require('../../../../public/js/utils/object/key-value.js');
const Property = require('../../app-src/config/property.js');
const mdConfig = require('./modeling-data-configuration.json');
const MDTO = require('../shared/data-transfer-object.js');

const objPreProc = (obj, dto, to) => {
  if (obj instanceof KeyValue) {
    dto.values = to(obj.value.values);
  }
  if (obj instanceof Assembly) {
    to.evaluateAttributes(obj, mdConfig.Assembly, dto);
  }
  if (obj instanceof Joint) {
    to.evaluateAttributes(obj, mdConfig.Joint, dto);
  }
  if (obj instanceof Property) {
    return to(obj.value());
  }
}


module.exports = MDTO(mdConfig, objPreProc);
