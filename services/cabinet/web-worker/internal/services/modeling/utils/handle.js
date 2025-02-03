
const {BiPolygon} = require('../../../../../../../public/js/utils/canvas/three-d/lib');
const SimpleModels = require('../generic-models');
const {HandleCenter} = require('../../../../shared/utilities.js');
const Utils = require('utils.js');

function baseCenter(rMdto, environment, parentBiPoly) {
  let center;
  const edgeOffset = (19 * 2.54) / 16;
  const toCenter = 3 * 2.54 + rMdto.centerToCenter / 2;
  const front = parentBiPoly.front();
  const top = front.line(0);
  // TODO: Maybe... not sure why these are flipped.
  const left = front.line(-1);
  const right = front.line(1);
  const bottom = front.line(2);

  switch (rMdto.location.position) {
    case "BOTTOM_RIGHT":
      center = top[1];
      center.translate(top.vector().unit().scale(-edgeOffset));
      center.translate(right.vector().unit().scale(toCenter));
      break;
    case "BOTTOM_LEFT":
      center = top[0];
      center.translate(top.vector().unit().scale(edgeOffset));
      center.translate(left.vector().unit().scale(-toCenter));
      break;
    case "TOP_RIGHT":
      center = bottom[0];
      center.translate(bottom.vector().unit().scale(edgeOffset));
      center.translate(right.vector().unit().scale(-toCenter));
      break;
    case "TOP_LEFT":
      center = bottom[1];
      center.translate(bottom.vector().unit().scale(-edgeOffset));
      center.translate(left.vector().unit().scale(toCenter));
      break;
    case "BOTTOM":
      center = top.midpoint();
      center.translate(right.vector().unit().scale(edgeOffset));
      break;
    case "TOP":
      center = bottom.midpoint();
      center.translate(right.vector().unit().scale(-edgeOffset));
      break;
    case "RIGHT":
      center = right.midpoint();
      center.translate(top.vector().unit().scale(-edgeOffset));
      break;
    case "LEFT":
      center = left.midpoint();
      center.translate(top.vector().unit().scale(edgeOffset));
      break;
    case "CENTER":
      center = front.center();
      break;
    break;
    default:
      throw new Error('Invalid pull location');
  }
  return center;
};

const handleModel = (rMdto, environment, simple) => {
  const biPolyArr = environment.modelInfo.biPolygonArray[rMdto.parentAssembly().id];
  const biPoly = new BiPolygon(biPolyArr[0], biPolyArr[1]);
  // const baseC = baseCenter(rMdto, environment, biPoly);
  const heo = Utils.property('heo', rMdto, environment);
  const hcco = Utils.property('hcco', rMdto, environment);
  const front = biPoly.front().reverse();
  const baseC = HandleCenter(rMdto.location, front, heo, hcco, rMdto.centerToCenter);
  const rotated =  rMdto.location.rotate;
  const line = rotated ? front.line(-1) : front.line(0);
  const normal = biPoly.normal();
  const normals = {
    z: normal,
    y: line.vector().unit()
  }
  normals.x = normals.z.crossProduct(normals.y).unit();
  rMdto.position.current.normals = normals;
  if (simple)
    return SimpleModels.Pull.Simple(baseC, line, normal, rMdto.projection, rMdto.centerToCenter);
  else
    return SimpleModels.Pull(baseC, line, normal, rMdto.projection, rMdto.centerToCenter);
}

module.exports = handleModel;
