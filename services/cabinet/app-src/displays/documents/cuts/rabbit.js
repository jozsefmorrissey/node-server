
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Vector3D = require('../../../three-d/objects/vector.js');
const ChannelInfo = require('./channel');

class RabbitInfo extends ChannelInfo {
  constructor(set, jointInfo, maleModel) {
    super(set, jointInfo, maleModel);
  }
}

RabbitInfo.evaluateSets = (parrelleSets, zPolys) => {
  const lenG2 = parrelleSets.filter(s => s.length > 2);
  const lenE2 = parrelleSets.filter(s => s.length === 2);
  const lenE1 = parrelleSets.filter(s => s.length === 1);
  return !(lenG2.length > 0 || lenE2.length > 2) &&
      zPolys.length !== 0 && (lenE2.length === 0 && lenE1.length === 2)
}

ChannelInfo.register(RabbitInfo);
module.exports = RabbitInfo;
