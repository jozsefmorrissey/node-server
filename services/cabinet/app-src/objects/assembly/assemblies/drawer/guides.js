
const Assembly = require('../../assembly.js');
const JointSettings = require('../../../../../web-worker/shared/settings.js');


// TODO: hardware should be a simpler version of assembly
class Guides extends Assembly {
  constructor(partCode) {
    super(partCode);
    this.demensions = () => {
      const dems = this.parentAssembly().position().demension();
      const drawerDepth = dems.z;
      const guideDepths = this.resolve('dbdepths', true).map(p => ({
        approx: p.value().approx.value(),
        min: p.value().min.value(),
        max: p.value().max.value(),
      }));
      const guideInfo = guideDepths.find(gd => gd.min <= drawerDepth && gd.max >= drawerDepth);
      const guideDepth = guideInfo ? guideInfo.approx : 0;
      return {x:1, y:1, z:guideDepth};
    }

    this.hash = () => Guides.hash;
  }
}

Guides.hash = 'Guides'.hash();
module.exports = Guides
