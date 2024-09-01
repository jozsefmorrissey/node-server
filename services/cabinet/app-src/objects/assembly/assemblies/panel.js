


const Assembly = require('../assembly.js');
const Joint = require('../../joint/joint.js');
const Vertex3D = require('../../../three-d/objects/vertex.js');

class Panel extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
    this.category = 'Panel';
    Object.getSet(this, {hasFrame: false});
  }
}

function absoluteVector() {
  const pos = this.parentAssembly().position();
  const verts = Vertex3D.fromLimits(pos.limits());
  const rotatedVector = unitVector.rotate(pos.rotation());
  const vector = Vertex3D.magnitudeVector(rotatedVector, verts);
  return vector;
}

class PanelVoidIndex extends Panel {
  constructor(index, vOid, included, zNormal, xNormal) {
    const partCode = `:p${index}`;
    super(partCode);
    this.index = index;
    this.included = included;
    this.vectors = () => {
      const pos = this.parentAssembly().position();
      const verts = Vertex3D.fromLimits(pos.limits());
      const rotatedZ = zNormal.rotate(pos.rotation());
      const rotatedX = xNormal.rotate(pos.rotation());
      const rotatedY = rotatedZ.crossProduct(rotatedX);
      const z = Vertex3D.magnitudeVector(rotatedZ, verts);
      const x = Vertex3D.magnitudeVector(rotatedX, verts);
      const y = Vertex3D.magnitudeVector(rotatedY, verts);
      return {x,y,z};
    }
    this.normals(false, {DETERMINE_FROM_PARENT: true});
    this.width = () => this.resolve('vpt');
  }
}

class PanelToeKickBacker extends Panel {
  constructor(...args) {
    super(...args);
  }
}

Panel.abbriviation = 'pn';

Panel.VoidIndex = PanelVoidIndex;
Panel.ToeKickBacker = PanelToeKickBacker;

module.exports = Panel
