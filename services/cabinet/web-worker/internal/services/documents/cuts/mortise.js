
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const ChannelInfo = require('./channel');

class MortiseInfo extends ChannelInfo {
  constructor(set, jointInfo, maleModel) {
    super(set, jointInfo, maleModel);
  }
}

MortiseInfo.evaluateSets = (parrelleSets) => {
  const lenG2 = parrelleSets.filter(s => s.length > 2).length;
  const lenE2 = parrelleSets.filter(s => s.length === 2).length;
  const lenE1 = parrelleSets.filter(s => s.length === 1).length;
  return lenG2 === 0 && ((lenE2 === 2 && lenE1 === 1) || (lenE2 === 1 && lenE1 === 2));
}

ChannelInfo.register(MortiseInfo);
module.exports = MortiseInfo;
