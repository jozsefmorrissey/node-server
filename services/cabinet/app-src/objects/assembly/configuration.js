
const Line3D = require('../../../../../public/js/utils/canvas/three-d/objects/line');
const Position3D = require('../../../../../public/js/utils/canvas/three-d/objects/position');
const Vertex3D = require('../../../../../public/js/utils/canvas/three-d/objects/vertex');

const ensureVector = (cno, attr) => cno[attr].length === 2 ?
    cno[attr] = new Line3D(this.evalObject(cno[attr][0]), this.evalObject(cno[attr][1])).vector().unit() :
    (cno[attr] instanceof Position3D ? cno[attr] :
      cno[attr] = new Position3D(this.eval(cno[attr][0]), this.eval(cno[attr][1]), this.eval(cno[attr][2])).unit());

const vectorNormals = (vectConf) => {
  const norms = Object.merge({}, vectConf);
  if (norms.calc !== 0) ensureVector(norms, 'x');
  if (norms.calc !== 1) ensureVector(norms, 'y');
  if (norms.calc !== 2) ensureVector(norms, 'z');
  if (norms.calc === 0) norms.x = norms.y.crossProduct(norms.z).unit();
  if (norms.calc === 1) norms.y = norms.x.crossProduct(norms.z).unit();
  if (norms.calc === 2) norms.z = norms.x.crossProduct(norms.y).unit();
  return norms;
}

class AssemblyConfiguration {
  constructor(assem, config) {
    let normObj, lastNormHash, lastNorm;
    Object.merge(this, AssemblyConfiguration.convert(config), true);
    const defConf = defaultConfig();
    Object.merge(this, defConf, true)

    this.normals = () => {
      let norms;
      if (this.NORMALS.TYPE === 'PARENT') return {DETERMINE_FROM_PARENT: true};
      else if (this.NORMALS.TYPE === 'MODEL') return {DETERMINE_FROM_MODEL: true};
      else if (this.NORMALS.TYPE === 'ROTATION') {
        const rotation = assem.rotation();
        norms = new Position3D(
          new Vertex3D(1,0,0).rotate(rotation).vector(),
          new Vertex3D(0,1,0).rotate(rotation).vector(),
          new Vertex3D(0,0,1).rotate(rotation).vector());
      } else if (this.NORMALS.TYPE === 'VECTOR')
        norms = vectorNormals(assem.evalObject(this.NORMALS.vectors));
      else if (this.NORMALS.TYPE === 'Lines')
        norms = lineNormals(assem.evalObject(this.NORMALS.lines));

      return norms;
    }
    this.manual = () => !this.NORMALS.TYPE === 'PARENT' && !this.NORMALS.TYPE === 'MODEL';

    this.hash = () => Object.hash(this);
    this.toJson = () => {
      const defConf = defaultConfig();
      const nonDefault =  Object.filter(this, (obj, path) => !(obj instanceof Object) &&
                this.pathValue(path) !== defConf.pathValue(path));
      return nonDefault.filtered || {};
    }
  }
}

AssemblyConfiguration.TYPES = {
  POSITION: {},
  NORMALS: {}
};

['BOX', 'POLY'].forEach(str =>
    AssemblyConfiguration.TYPES.POSITION.property(str, str, true, false, false));
['ROTATION', 'VECTOR', 'LINE', 'PARENT', 'MODEL'].forEach(str =>
    AssemblyConfiguration.TYPES.NORMALS.property(str, str, true, false, false));

const defaultVectors = () => [new Position3D(1,0,0), new Position3D(0,1,0), new Position3D(0,0,1)];

const defaultConfig = () => {
  return {
    POSITION: {
      TYPE: 'BOX',
      TYPES: AssemblyConfiguration.TYPES.POSITION,
      center: new Position3D(),
      demension: new Position3D(1,1,1),
      rotation: new Position3D(),
      thickness: 1.905,
      points: [new Position3D(0,0,0),new Position3D(0,10,0),new Position3D(10,10,0),new Position3D(10,0,0)]
    },
    NORMALS: {
      TYPE: 'ROTATION',
      TYPES: AssemblyConfiguration.TYPES.NORMALS,
      vectors: new Position3D(...defaultVectors()),
      lines: new Position3D(...defaultVectors().map(v => [new Position3D(), v]))
    }
  };
}

const funcOposition = (val) => val instanceof Function ? val : new Position3D(val);
AssemblyConfiguration.convert = (config) => {
  if (!config || config.POSITION) return config;
  config = Object.merge({}, config);
  config = Object.merge(config, defaultConfig(), true);
  const assConfig = {
    POSITION: {
      TYPE: 'BOX',
      center: funcOposition(config.center),
      demension: funcOposition(config.demension),
      rotation: funcOposition(config.rotation),
      thickness: config.thickness,
      points: config.points
    },
    NORMALS: {
      TYPE: 'ROTATION',
    }
  }
  if (config.normalInfo) {
    const calc = config.normalInfo.calc;
    if (config.normalInfo.style === 'line') {
      assConfig.NORMALS.lines = config.lines.map(l => [new Position3D(l[0], calc), new Position3D(l[1], calc)]);
    } else if (config.normalInfo.style === 'vector') {
      assConfig.NORMALS.vectors = new Position3D(config.normalInfo.normals)
                                            .map(v => new Position3D(...v));
    }
  }
  return assConfig;
}

module.exports = AssemblyConfiguration;
