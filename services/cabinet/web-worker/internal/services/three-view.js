const {Vector3D, Layer} =
    require('../../../../../public/js/utils/canvas/three-d/lib');

const copyAndRotateAndTranslate = (layers, rotations, center, vector) => {
  layers = layers.map(l => l.copy());
  layers.forEach(l => l.rotate(rotations, center) & l.translate(vector));
  return layers;
}

const layerSpliter = (l) => Vector3D.k.equals(l.normal()) ? 'inline' :
                        (Vector3D.k.inverse().equals(l.normal()) ? 'negated' :
                        (Vector3D.k.perpendicular(l.normal()) ? 'perpendicular' : 'angled'));

function orientAndFilterLayers(layers, center, normals, aligneTo, translationVector) {
  const rotations = Vector3D.coDirectionalRotations(normals, aligneTo);
  layers = copyAndRotateAndTranslate(layers, rotations, center, translationVector);
  layers = layers.filterSplit(layerSpliter);
  return layers;
}

const layerString = (layers, index, attr) => {
  return `//${index}\n${layers[attr || 'inline'].map(l => l.toDrawString()).join('\n')}`;
}

const layerSort = (a1,a2) => a1.center().z - a2.center().z;
function layerObject(layers, progress) {
  layers.sort(layerSort);
  return layers.map(l => {
    let obj = {polys: l.copy().mergedPolys()};
    progress.inc(l.polygons().length);
    return obj;
  });
}

module.exports = function (payload, taskId) {
  const csg = CSG.fromPolygons(payload.csg.polygons, true);
  const progressUpdate = () => postMessage({id: taskId, progress: progress()});
  const progress = new Progress(csg.polygons.length * 1.5).on(progressUpdate);
  const normals = Object.fromJson([payload.normals.x, payload.normals.y, payload.normals.z]);
  normals.forEach((v,i) => normals[i] = v.positiveUnit());
  const center = csg.center();
  const layers = Layer.fromCSG(csg, progress);
  const demensions = csg.demensions();
  const gap = 30;
  const topVector = new Vector3D(0, demensions.y/2 + gap , 0);
  const rightVector = new Vector3D(demensions.x/2 + gap, 0 , 0);
  const frontLayers = orientAndFilterLayers(layers, center, normals, [Vector3D.i, Vector3D.j, Vector3D.k]);
  const topLayers = orientAndFilterLayers(layers, center, normals, [Vector3D.i, Vector3D.k, Vector3D.j.inverse()], topVector);
  const rightLayers = orientAndFilterLayers(layers, center, normals, [Vector3D.k, Vector3D.j, Vector3D.i.inverse()], rightVector);
  const polys = {center, demensions, front: layerObject(frontLayers.inline, progress),
                        top: layerObject(topLayers.inline, progress),
                        right: layerObject(rightLayers.inline, progress)};
  return polys;
}
