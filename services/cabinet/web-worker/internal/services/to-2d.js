

const {Polygon3D, Vector3D, Line3D} =
    require('../../../../../public/js/utils/canvas/three-d/lib');
const Parimeters = require('../../../../../public/js/utils/canvas/two-d/maps/parimeters.js');
const Polygon2d = require('../../../../../public/js/utils/canvas/two-d/objects/polygon');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex');
const dataTransferConfig = require('../math-data-transfer-config.json');
const DTO = require('../../shared/data-transfer-object')(dataTransferConfig);
const MFC = require('./modeling/modeling-function-configuration.js');
const RDTO = require('../../shared/reconnect-transfer-object');

const ThreeView = require('../../../../../public/js/utils/canvas/two-d/objects/three-view');

function reportBack(map, taskId) {
  postMessage({id: taskId, result: {map: DTO(map)}});
}

const targetNormals = [new Vector3D(0,0,-1),new Vector3D(0,1,0),new Vector3D(1,0,0)]
function To2D(csg, normals, gap) {
  if (!(csg instanceof CSG)) return null;
  if (normals) {
    const rots = Vector3D.coDirectionalRotations(normals, targetNormals);
    csg.rotate(rots);
  }
  const polys = Polygon3D.fromCSG(csg);
  const tv = new ThreeView(polys, undefined, gap);
  return tv.all();
}

function simpleTo2D (payload) {
  payload = RDTO(payload);
  const threeViews = {};
  for (let index = 0; index < payload.objects.length; index++) {
    const obj = payload.objects[index];
    const funcs = MFC(obj);
    threeViews[obj.id] = funcs.model ? To2D(funcs.model(obj)) : null;
  }
  return threeViews;
}
To2D.simple = simpleTo2D;

function setTo2D (payload, env, taskId) {
  const assems = payload.assemblies.concat(env.generated);
  let twoDObjs = {};
  for (let index = 0; index < assems.length; index++) {
    const key = assems[index];
    const model = env.getModel(key, 'joined');
    twoDObjs[key] = To2D(model, undefined, env.gap);
    if ((index + 1) % 20 === 0) {
      reportBack(twoDObjs, taskId);
      twoDObjs = {};
    }
  }
  reportBack(twoDObjs, taskId);
}

function unionedTo2D (env) {
  let normals = !env.normals ? undefined :
      [new Vector3D(env.normals.x), new Vector3D(env.normals.y), new Vector3D(env.normals.z)]
  return To2D(env.unioned, undefined, env.gap);
}

function assembliesTo2D(payload, env, taskId) {
  if (env.unioned instanceof Object) return unionedTo2D(env);
  else return setTo2D(payload, env, taskId);
}

To2D.assemblies = assembliesTo2D;
module.exports = To2D;
