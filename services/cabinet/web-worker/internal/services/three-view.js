const Vector3D = require('../../../app-src/three-d/objects/vector.js');
const Layer = require('../../../app-src/three-d/objects/layer.js');

const copyAndRotate = (layers, rotations, center) => {
  layers = layers.map(l => l.copy());
  layers.forEach(l => l.rotate(rotations, center));
  return layers;
}

const layerSpliter = (l) => Vector3D.k.equals(l.normal()) ? 'inline' :
                        (Vector3D.k.inverse().equals(l.normal()) ? 'negated' :
                        (Vector3D.k.perpendicular(l.normal()) ? 'perpendicular' : 'angled'));

function orientAndFilterLayers(layers, center, normals, aligneTo) {
  const rotations = Vector3D.coDirectionalRotations(normals, aligneTo);
  layers = copyAndRotate(layers, rotations, center);
  layers = layers.filterSplit(layerSpliter);
  return layers;
}

module.exports = function (payload, taskId) {
  const csg = CSG.fromPolygons(payload.csg.polygons, true);
  const normals = Object.fromJson([payload.normals.x, payload.normals.y, payload.normals.z]);
  normals.forEach((v,i) => normals[i] = v.positiveUnit());
  const center = csg.center();
  const layers = Layer.fromCSG(csg);
  const frontLayers = orientAndFilterLayers(layers, center, normals, [Vector3D.i, Vector3D.j, Vector3D.k]);
  const topLayers = orientAndFilterLayers(layers, center, normals, [Vector3D.i, Vector3D.k, Vector3D.j.inverse()]);
  const rightLayers = orientAndFilterLayers(layers, center, normals, [Vector3D.k, Vector3D.j, Vector3D.i.inverse()]);
  console.log(frontLayers.inline[7].lines())

  console.log(Vector3D);
  console.log(Layer);
}
