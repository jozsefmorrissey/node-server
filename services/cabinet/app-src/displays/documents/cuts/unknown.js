
const ChannelInfo = require('./channel');

class UnknownInfo extends ChannelInfo {
  constructor(set, jointInfo, maleModel) {
    super(set, jointInfo, maleModel);
    this.toolType = () => 'unknown';
    this.toString = () => jointInfo.joint().toString();
  }
}

UnknownInfo.evaluateSets = (parrelleSets) => {
  const lenG2 = parrelleSets.filter(s => s.length > 2);
  const lenE2 = parrelleSets.filter(s => s.length === 2);
  return lenG2.length > 0 || lenE2.length > 2;
}

ChannelInfo.register(UnknownInfo);
module.exports = UnknownInfo;
