
const Vertex3D = require('./vertex');

const epsilon = 1e-6;
function intersectLinePlane(line, plane, segment) {
  const vect0 = line.startVertex.vector();
  const vect1 = line.endVertex.vector();
  const planePoint = plane[0];
  const planeNormal = plane.normal();
  u = vect1.minus(vect0);
  dot = planeNormal.dot(u);

  if (Math.abs(dot) > epsilon) {
    w = vect0.minus(planePoint);
    fac = -planeNormal.dot(w) / dot;
    u = u.scale(fac);
    const intersection = new Vertex3D(vect0.add(u));
    if (segment) {
      if (frac <= 1 && frac >= 0) return intersection;
      return null;
    }
    return intersection;
  }

  return null;
}

module.exports = intersectLinePlane;
