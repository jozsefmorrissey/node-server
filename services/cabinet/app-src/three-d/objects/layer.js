
const Polygon3D = require('polygon');
const Line3D = require('line');
const Vertex3D = require('vertex');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');

const tol = .0001;
const within = Tolerance.within(tol);

class Layer {
  constructor(polygonOs) {
    let list = polygonOs instanceof Polygon3D ? [primary] : polygonOs;
    this.polygons = () => list.map(p => p.copy());
    list = this.polygons();
    const primary = list[0];

    this.add = (poly) => {
      const norm = this.normal();
      poly = norm.equals(poly.normal()) ? poly : poly.reverse();
      if (poly.normal().equals(norm)) {
        list.push(poly);
        return true;
      }
      return false;
    }

    this.addAll = (polys) => {
      polys.forEach(p => this.add(p));
    }

    this.reverse = () => {
      list.forEach(p => p.reverse());
    }

    this.normal = () => primary.normal();
    this.toPlane = () => primary.toPlane();
    this.parrelle = (other) => primary.parrelle(other);
    this.withinPlane = (other) => primary.withinPlane(other);

    this.rotate = (rotations, center) => {
      for (let index = 0; index < list.length; index++) {
        list[index].rotate(rotations, center);
      }
    }

    this.translate = (vector) => {
      const polys = this.polygons().map(p => p.translate(vector));
      return new Layer(polys);
    }

    this.copy = () => new Layer(list);

    this.web = () => {
      const vertices = Line3D.vertices(this.lines());
      const lineMap = {};
      for (let i = 0; i < vertices.length; i++) {
        for (let j = 0; j < vertices.length; j++) {
          if (i != j) {
            const line = new Line3D(vertices[i].clone(), vertices[j].clone()).positiveVectorLine();
            const detStr = line.toString(.000001);
            if (!line.isPoint() && lineMap[detStr] === undefined) {
              lineMap[detStr] = line;
            }
          }
        }
      }
      return Object.values(lineMap);
    }

    this.center = () => {
      const verts = [];
      list.forEach(p => verts.concatInPlace(p.vertices()));
      return Vertex3D.midrange(verts);
    }

    const sortClosest = (vert) => (pa, pb) => pa.center().distance(vert) - pb.center().distance(vert);
    this.overlaps = (other) => {
      const otherIsParrelle = this.parrelle(other);
      if (!otherIsParrelle) return false;
      if (!(other instanceof Layer)) throw new Error(`'${other}' is not an instance of Layer`);
      if (!this.sameLayer(other)) return false;
      const otherPolys = other.polygons();
      let overlaps = false;
      list.sort(sortClosest(other.center()));
      for (let i = 0; !overlaps && i < otherPolys.length; i++) {
        for (let j = 0; !overlaps && j < list.length; j++) {
          overlaps = list[j].overlaps(otherPolys[i], null, otherIsParrelle);
        }
      }
      return overlaps;
    }

    this.lines = (tolerance) => {
      let t = tolerance || tol;
      const tolmap = new ToleranceMap({'0.x': t, '0.y': t, '0.z': t,
                                        '1.x': t, '1.y': t, '1.z': t});

      list.forEach(p => p.lines().forEach(l => tolmap.add(l.positiveVectorLine())));
      const lines = [];
      const groups = tolmap.group().forEach(s => s.length === 1 && lines.push(s[0]));
      Line3D.combine(lines);
      Line3D.combine(lines);
      const vertTolMap = new ToleranceMap({'x': t, 'y': t, 'z': t});
      lines.forEach(l => vertTolMap.add(l[0]) & vertTolMap.add(l[1]));
      return lines.filter(l => vertTolMap.matches(l[0]).length === 2 && vertTolMap.matches(l[1]).length === 2);
    }

    this.to2D = (x, y) => {
      const lines = this.lines();
      let twoDlines = [];
      lines.forEach(l => twoDlines.push(l.to2D(x, y)));
      return twoDlines;
    }

    this.toDrawString = (color, excludeNormal) => {
      color ||= 'blue';
      let str = primary.toDrawString(color, excludeNormal);
      list.forEach(p => str += `\n\t${p.toDrawString(color, true)}`);
      return str;
    }
    this.toWireDrawString = (color) => {
      color ||= 'blue';
      let str = ''
      const lines = this.lines();
      lines.forEach(l => str += `\t[${l[0].toString()},${l[1].toString()}]\n`)
      return str;
    }

    this.toDetailString = () => {
      let str = '';
      list.forEach(p => str += `${p.toDetailString()}\n`);
      return str;
    }

    const testIntercept = (a, b, attr, within) =>
        (Number.isNaN(a[attr]) && Number.isNaN(b[attr])) || within(a[attr], b[attr]);
    this.sameLayer = (other) => {
      const thisIntercepts = this.toPlane().axisIntercepts();
      const otherIntercepts = other.toPlane().axisIntercepts();
      return testIntercept(thisIntercepts, otherIntercepts, 'x', within) &&
              testIntercept(thisIntercepts, otherIntercepts, 'y', within) &&
              testIntercept(thisIntercepts, otherIntercepts, 'z', within);
    }

    this.hash = () => this.toDetailString().hash();

    this.merge = (other) => {
      const normalsEquivalent = this.normal().positiveUnit().equals(other.normal().positiveUnit());
      if (!normalsEquivalent) return null;
      return new Layer(this.polygons().concat(other.polygons()));
    }
  }
}

Layer.fromCSG = (csg) => {
  const polys = Polygon3D.fromCSG(csg);
  const tolmap = new ToleranceMap({'normal.positiveUnit.i': tol,
                        'normal.positiveUnit.j': tol,
                        'normal.positiveUnit.k': tol,
                        'toPlane.axisIntercepts.x': tol,
                        'toPlane.axisIntercepts.y': tol,
                        'toPlane.axisIntercepts.z': tol});
  tolmap.addAll(polys);
  const layers = [];
  const groups = tolmap.group();
  groups.forEach(g => layers.push(new Layer(g)));
  return layers;
}

Layer.to2D = (layersOcsg, x, y) => {
  let layers = layersOcsg instanceof CSG ? Layer.fromCSG(layersOcsg) : layersOcsg;
  const lines2d = [];
  for (let index = 0; index < layers.length; index++) {
    lines2d.concatInPlace(layers[index].to2D(x, y));
  }
  return Line2d.consolidate(lines2d);
}

Layer.toDrawString = (layers, ...colors) => {
  let str = '';
  layers.forEach((l,i) => str += l.toDrawString(colors[i % colors.length], true) + '\n\n');
  return str;
}

let lineCount = 0;
Layer.toWireDrawString = (layers) => {
  let str = '';
  layers.forEach(l => (str += l.toWireDrawString() + '\n'));
  return str;
}

Layer.parrelleSets = (polygons, tolerance) => {
  const tolmap = new ToleranceMap({'normal.positiveUnit.i': tolerance,
                                  'normal.positiveUnit.j': tolerance,
                                  'normal.positiveUnit.k': tolerance});
  tolmap.addAll(polygons);
  const groups = tolmap.group().sortByAttr('length').reverse();
  return groups;
}

module.exports = Layer;
