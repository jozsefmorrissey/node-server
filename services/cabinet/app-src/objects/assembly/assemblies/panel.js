


const Assembly = require('../assembly.js');
const Joint = require('../../joint/joint.js');
const {Vertex3D} = require('../../../../../../public/js/utils/canvas/three-d/lib.js');

class Panel extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
    this.category('Panel');
  }
}
Panel.property('manuallyConfigurable', true, false, false, false);

class PanelAutoConfigured extends Panel {
  constructor(...args) {
    super(...args);
  }
}
PanelAutoConfigured.property('manuallyConfigurable', false, false, false, false);

function absoluteVector() {
  const pos = this.parentAssembly().position();
  const verts = Vertex3D.fromLimits(pos.limits());
  const rotatedVector = unitVector.rotate(pos.rotation());
  const vector = Vertex3D.magnitudeVector(rotatedVector, verts);
  return vector;
}

class PanelVoidIndex extends PanelAutoConfigured {
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
    this.normals = (array) => {
      const vects = this.vectors();
      const normArr = ['x', 'y', 'z'].map(xyz => vects[xyz].unit());
      return array ? normArr : {x: normArr[0], y: normArr[1], z: normArr[2]};
    }
    this.width = () =>
      this.resolve('vpt');
  }
}


class PanelToeKickBacker extends PanelAutoConfigured {
  constructor(...args) {
    super(...args);
  }
}

Panel.VoidIndex = PanelVoidIndex;
Panel.ToeKickBacker = PanelToeKickBacker;
Panel.AutoConfigured = PanelAutoConfigured;

module.exports = Panel
