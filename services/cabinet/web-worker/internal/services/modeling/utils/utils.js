
const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');

function toBiPolygon(assem, env) {
  if (Array.isArray(assem.position.current.points)) {
    const poly = new Polygon3D(assem.position.current.points);
    const biPoly = BiPolygon.fromPolygon(poly, 0, assem.position.current.thickness);
    return biPoly;
  }
  const current = assem.position.current;
  const dems = current.demension;
  if (Math.min(dems.x, dems.y, dems.z) > .001) return BiPolygon.fromPositionObject(current);
  return null;
}

const vectObj = (obj) => new Vector3D(obj);
function normals(part, env) {
  let norms = part.position.current.normals;
  if (norms === undefined) return {x: Vector3D.i, y: Vector3D.j, z: Vector3D.k}
  if (part.id.startsWith('PanelVoidIndex')) {
    norms = Polygon3D.normals(Polygon3D.fromCSG(env.modelInfo.model[part.id].polygons, true));
  } else if (norms.DETERMINE_FROM_MODEL) {
    norms = Polygon3D.normals(Polygon3D.fromCSG(env.modelInfo.model[part.id].polygons, true));
  } else if (norms.DETERMINE_FROM_PARENT !== undefined) {
    const parentNorms = normals(part.parentAssembly(), env);
    norms = parentNorms;
  } else if (part.id.startsWith('Panel_') && part.parentAssembly().id.startsWith('Divider_')) {
    return normals(part.parentAssembly(), env);
  } else {
    norms.x = new Vector3D(norms.x); norms.y = new Vector3D(norms.y); norms.z = new Vector3D(norms.z);
  }
  return norms;
}

function property(path, assem, env) {
  let target = assem;
  while(target) {
    if (target.values) {
      const value = Object.pathValue(target.values, path);
      if (value !== undefined) return value;
    }
    target = target.parentAssembly && target.parentAssembly();
  }
  let value = Object.pathValue(env.propertyConfig, path)
  return value;
}

property.set = (assem, env, ...setNameOpropName) => {
    const set = {};
    setNameOpropName.forEach(sOp => {
      const target = property(sOp, assem, env);
      if (!Array.isArray(target)) set[sOp] = target;
      else {
        target.forEach(p => set[p] = property(p, assem, env));
      }
    });
    return set;
}

module.exports = {
  toBiPolygon, normals, property
}
