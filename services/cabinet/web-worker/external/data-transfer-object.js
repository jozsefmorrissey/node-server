const Joint = require('../../app-src/objects/joint/joint.js');
const Assembly = require('../../app-src/objects/assembly/assembly.js');
const KeyValue = require('../../../../public/js/utils/object/key-value.js');
const Property = require('../../app-src/config/property.js');
const Object3D = require('../../app-src/three-d/layout/object.js');
const Task = require('./tasks/basic.js').Task;
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
  if (obj instanceof Object3D) {
    to.evaluateAttributes(obj, mdConfig.Object3D, dto);
  }
  if (obj instanceof Task) {
    dto.payload = to(obj.payload());
    dto.process = obj.process();
  }
}


module.exports = MDTO(mdConfig, objPreProc);
