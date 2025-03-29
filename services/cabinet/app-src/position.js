
const {Vertex3D, Line3D, BiPolygon} = require('../../../public/js/utils/canvas/three-d/lib.js');

class Position {
  constructor(assembly) {

    const xyVertex = (index) => {
      const norms = this.normals();
      const xVect = index === 0 || index === 3 ? norms.x.inverse() : norms.x;
      const yVect = index === 0 || index === 2 ? norms.y : norms.y.inverse();
      return assembly.center().translate([xVect, yVect]);
    }

    this.vertex = (index, frontOback, axis, ratio) => {
      if (!Number.isInteger(index) || index < 0) return null;
      let point1, point2;
      const config = assembly.config;
      if (config && config.points)
       if (config.points[index]) {
         point1 = new Vertex3D(assembly.evalObject(config.points[index]));
         point2 = new Vertex3D(assembly.evalObject(config.points[(index + 1) % config.points.length]));
       } else return null;
      else {
        if (index > 3) return null;
        point1 = xyVertex(index); point2 = xyVertex(index === 3 ? 0 : index + 1);
      }
      if (ratioOaxis.match(ratioReg)) {
        const vector = new Line3D(point1, point2).vector();
        point1.translate(vector.scale(Math.ratio(ratioOaxis)));
      }
      const zVect = !Boolean.is(frontOback) ? {i:0,j:0,k:0} :
                                  (frontOback ? norms.z : norms.z.inverse());
      point.translate([zVect]);
      return axis ? point[axis] : point;
    }

    this.current = () => {
      const config = assembly.config;
      if (config && config.points) {
        const current = assembly.evalObject(config);
        current.normals = this.normals(false);
        current.center = Vertex3D.center(current.points).translate(current.normals.z.scale(current.thickness/-2));
        return current;
      }
      const position = {
        center: assembly.center(),
        demension: assembly.demension(),
        rotation: assembly.rotation(),
        normals: assembly.normals()
      };
      return position;
    }

    this.centerAdjust = (centerAxis, directionAxis, offset) => {
      const magnitude = directionAxis[0] === '-' ? -1 : 1;
      const axis = directionAxis.replace(/\+|-/, '');
      offset ||= assembly.demension[axis]() / 2;
      return assembly.center[centerAxis]() + (magnitude * offset);
    }

    this.limits = () => {
      let center = assembly.center();
      let d = assembly.demension().rotate(assembly.rotation());
      return  {
        x: center.x + d.x / 2,
        '-x': center.x - d.x / 2,
        y: center.y + d.y / 2,
        '-y': center.y - d.y / 2,
        z: center.z + d.z / 2,
        '-z': center.z - d.z / 2,
      }
    }
    this.limits.endpoints = () => Vertex3D.fromLimits(this.limits());

    this.toBiPolygon = () => BiPolygon.fromPositionObject(this.current());

    this.toString = () => {
      const curr = this.current();
      curr.center = curr.center;
      curr.demension = curr.demension;
      curr.rotation = curr.rotation;
      return `center: ${curr.center}, demensions: ${curr.demension}, rotation: ${curr.rotation}`;
    }
  }
}


module.exports = Position
