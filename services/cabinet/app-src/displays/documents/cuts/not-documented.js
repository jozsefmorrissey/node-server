const CutInfo = require('./cut');

class NotDocumentedCut extends CutInfo {
  constructor(set, jointInfo, maleModel) {
    super(set, jointInfo, maleModel);
    this.documented(false);
    this.toDrawString = () => '//Not Documented';
  }
}

NotDocumentedCut.evaluateSets = (parrelleSets) => {
  return parrelleSets.length === 0;
}

CutInfo.register(NotDocumentedCut);
module.exports = NotDocumentedCut;
