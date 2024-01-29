
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');
const SimpleModels = require('../generic-models');

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
    case "TOP_RIGHT":
      center = top.endVertex;
      center.translate(top.vector().unit().scale(-edgeOffset));
      center.translate(right.vector().unit().scale(toCenter));
      break;
    case "TOP_LEFT":
      center = top.startVertex;
      center.translate(top.vector().unit().scale(edgeOffset));
      center.translate(left.vector().unit().scale(-toCenter));
      break;
    case "BOTTOM_RIGHT":
      center = bottom.startVertex;
      center.translate(bottom.vector().unit().scale(edgeOffset));
      center.translate(right.vector().unit().scale(-toCenter));
      break;
    case "BOTTOM_LEFT":
      center = bottom.endVertex;
      center.translate(bottom.vector().unit().scale(-edgeOffset));
      center.translate(left.vector().unit().scale(toCenter));
      break;
    case "TOP":
      center = top.midpoint();
      center.translate(right.vector().unit().scale(edgeOffset));
      break;
    case "BOTTOM":
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
  const baseC = baseCenter(rMdto, environment, biPoly);
  const front = biPoly.front();
  const rotated =  rMdto.location.rotate;
  const line = rotated ? front.line(-1) : front.line(0);
  const normal = biPoly.normal();
  if (simple)
    return SimpleModels.Pull.Simple(baseC, line, normal, rMdto.projection, rMdto.centerToCenter);
  else
    return SimpleModels.Pull(baseC, line, normal, rMdto.projection, rMdto.centerToCenter);
}

module.exports = handleModel;
