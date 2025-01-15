
const Polygon3D = require('polygon');
const Plane = require('plane');
const Vector3D = require('vector');
const Vertex3D = require('vertex');
const Line3D = require('line');
const Parimeter3D = require('parimeter');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');

const tol = .001;
const within = Tolerance.within(tol);

class Layer {
  constructor(polygonOs) {
    const instance = this;
    let list = polygonOs instanceof Polygon3D ? [polygonOs] : polygonOs || [];
    this.polygons = () => list.map(p => p.copy());
    this.vertices = () => {
      const verts = [];
      list.forEach(p => verts.concatInPlace(p.vertices()));
      return verts;
    }
    list = this.polygons();
    const primary = () => list[0];

    this.add = (poly) => {
      if (poly.area() < .01) {
        console.warn.logarithmic('Polygon will not be added\n\tArea < .1mm');
        return null;
      }

      const norm = this.normal();
      if (norm) poly = norm.equals(poly.normal()) ? poly : poly.reverse();
      if (list.length === 0 || poly.normal().equals(norm)) {
        list.push(poly);
        return true;
      }
      return false;
    }

    this.parimeter = () => {
      console.warn.logarithmic('Parimeter3D does not deal well with disconnected internal lines.\n\tsee "Layer: lines" test for and example senario')
      return new Parimeter3D(this.lines(), this.normal());
    }
    this.combined = () => new Layer(this.parimeter());

    this.addAll = (polys) => {
      polys.forEach(p => this.add(p));
    }

    this.reverse = () => {
      list.forEach(p => p.reverse());
    }
    this.limitPoly = () => {
      const polys = Polygon3D.fromLines(this.lines());
      const tolMap = Vertex3D.ToleranceMap();
      tolMap.addAll(Line3D.vertices(this.lines()));
      const vts = tolMap.minSet().map(v => v);
      const center = Vertex3D.midrange(vts);
      Vertex3D.radialSort2D(vts, this.normal(), true, center, Vertex3D.center(vts.slice(0,2)));
      const poly = new Polygon3D(Line3D.combine(new Polygon3D(vts).lines()).map(l=>l[0]));
      if (poly.irregular.is()) {
        console.warn('Make sure this is working properly');
        poly.irregular.fix();
      }
      return poly;
    }

    this.normal = () => primary() && primary().normal();
    this.toPlane = () => primary() && primary().toPlane();
    this.parrelle = (other) => primary() && primary().parrelle(other);
    this.withinPlane = (other) => primary() && primary().withinPlane(other);

    this.rotate = (rotations, center) => {
      for (let index = 0; index < list.length; index++) {
        list[index].rotate(rotations, center);
      }
    }

    this.connect = (to) => {
      if (to instanceof Vertex3D || to instanceof Line3D) {
        const connections = list.map(p => p.connect(to));
        return connections.min(l => l.length());
      } else {
        const plane = this.toPlane();
        const otherPlane = to instanceof Plane ? to : to.toPlane();
        const planeIntersection = plane.intersection(otherPlane);
        const closestToIntersection = this.connect(planeIntersection)[1];
        let connection = to.connect(closestToIntersection);
        connection = this.connect(connection[0]);
        let lastLen;
        let itterations = 0;
        do {
          itterations++;
          connection = to.connect(connection[0]);
          lastLen = connection.length();
          connection = this.connect(connection[0]);
          if (itterations > 100) throw new Error('Something is wrong');
        } while (lastLen - connection.length() > .00001);
        if (itterations > 5)
          console.warn.logarithmic('Layer Connection Algorithym is not working as well as expected');
        console.log(itterations);
        return connection;
      }
    }

    this.translate = (vector) => {
      const polys = this.polygons().map(p => p.translate(vector));
      return new Layer(polys);
    }
    this.shatter = () => {
      const layer = new Layer([]);
      const polys = this.polygons().map(p => p.shatter(Math.floor(Math.random()*3))).concatElements();
      layer.addAll(polys);
      return layer;
    }

    this.copy = () => new Layer(list);

    this.web = () => {
      const vertices = Line3D.vertices(this.lines());
      const lineMap = {};
      for (let i = 0; i < vertices.length; i++) {
        for (let j = 0; j < vertices.length; j++) {
          if (i != j) {
            const line = new Line3D(vertices[i].clone(), vertices[j].clone()).positive();
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

    const onlyDefinedOnce = (t) => {
      const tolmap = new ToleranceMap({'0.x': t, '0.y': t, '0.z': t,
                                        '1.x': t, '1.y': t, '1.z': t});
      list.forEach(p => p.lines().forEach(l => tolmap.add(l.positive())));

      const lines = [];
      const groups = tolmap.group().forEach(s => s.length === 1 && lines.push(s[0]));
      return lines;
    }

    const removeLinesThatDoNotShareAVertex = (lines, t) => {
      let found;
      do {
        const map = new ToleranceMap({'vertex.x': t, 'vertex.y': t, 'vertex.z': t});
        const lvObj = (line, vertex) => ({line, vertex});
        lines.forEach(l => map.addAll([lvObj(l, l[0]), lvObj(l, l[1])]));
        const singleSets = map.group().filter(s => s.length === 1);
        const notOnParimeter = singleSets.map(s=>s[0].line);
        if (found = notOnParimeter.length) lines.removeAll(notOnParimeter)
      } while(found);
      return lines;
    }

    const printGroup = (group, overlaping) => {
      let str = '';
      const colors = Array.fill(group.length, String.color.next);
      str += group.map((l,i) => l.toDrawString(colors[i])).join('\n') + '\n\n';
      str += group.map((g,i) => g.subtract(overlaping[i])
                  .map(l => l.toDrawString(colors[i]))).concatElements().join('\n\n');
      console.log(str);
    }

    const printGroupIndex = (group, overlaping, index) => {
      let str = '';
      str += group[index].toDrawString('green') + '\n\n';
      str += overlaping[index].map(l => l.toDrawString('red')).join('\n\n') + '\n\n';
      str += group[index].subtract(overlaping[index]).map(l => l.toDrawString('blue')).join('\n\n');
      console.log(str);
    }

    let overlapsAnother = (t) => {
      const tolmap = new ToleranceMap({'(x,y,z)().vertex.(x,y,z)': .0001, 'vector().positiveUnit().(i,j,k)': .001});
      let slicedLines = list.map(p => p.lines().map(l => l.clone())).concatElements();
      // slicedLines = Line3D.sliceAll(slicedLines);
      tolmap.addAll(slicedLines);

      const lines = [];
      const groups = tolmap.group();
      for(let gi = 0; gi < groups.length; gi++) {
        const group = groups[gi];
        const overlaps = [];
        const overlaping = Array.fill(group.length, () => []);
        for (let i = 0; i < group.length; i++) {
          const target = group[i];
          for (let j = i+1; j < group.length; j++) {
            const other = group[j];
            const ints = target.intersection.overlap(other);
            if (ints) {
              if (!ints.find(v => target[0].equals(v) || target[1].equals(v)) &&
                  ints.find(v => target.within(v) === true) &&
                  ints.find(v => other.within(v) === true)) {
                overlaps[i] = overlaps[j] = true;
                overlaping[i].push(other);overlaping[j].push(target);
              }
            }
          }
        }
        lines.concatInPlace(group.map((g,i) => g.subtract(overlaping[i])).concatElements());
      }
      // setTimeout(() => {
      //   if (instance.parimeter().length === 0) {
      //     overlapsAnother.force(t);
      //   }
      // });
      return Line3D.combine(lines);
    }
    overlapsAnother = overlapsAnother.HashCache(this);

    this.lines = (tolerance) => {
      let t = tolerance || .00001;
      return overlapsAnother(t);
      let lines = onlyDefinedOnce(t);
      // removeLinesThatDoNotShareAVertex(lines, t);
      Line3D.combine(lines);
      lines = Line3D.sliceAll(lines);
      removeLinesThatDoNotShareAVertex(lines, t);
      Line3D.combine(lines);
      return lines;
    }
    this.lines.all = () => this.polygons().map(p => p.lines()).concatElements();

    this.to2D = (x, y) => {
      const lines = this.lines();
      let twoDlines = [];
      lines.forEach(l => twoDlines.push(l.to2D(x, y)));
      return twoDlines;
    }

    this.toDrawString = (color, includeNormal) => {
      color ||= 'blue';
      let str = primary() ? primary().toDrawString(color, includeNormal) : '';
      list.forEach(p => str += `\n\t${p.toDrawString(color)}`);
      return str;
    }
    this.toWireDrawString = (color) => {
      color ||= 'blue';
      let str = ''
      const lines = this.lines();
      lines.forEach(l => str += `\t[${l[0].toString()},${l[1].toString()}]\n`)
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

    this.hash = () => this.polygons().map(p => p.hash()).sum();

    this.merge = (other) => {
      const normalsEquivalent = this.normal().positiveUnit().equals(other.normal().positiveUnit());
      if (!normalsEquivalent) return null;
      return new Layer(this.polygons().concat(other.polygons()));
    }
  }
}

Layer.fromPolygons = (polys) => {
  const tolmap = new ToleranceMap({'normal().i()': tol,
                        'normal().j()': tol,
                        'normal().k()': tol,
                        'toPlane().axisIntercepts().x': tol,
                        'toPlane().axisIntercepts().y': tol,
                        'toPlane().axisIntercepts().z': tol});
  tolmap.addAll(polys);
  const layers = [];
  const groups = tolmap.group();
  groups.forEach(g => layers.push(new Layer(g)));
  return layers;
}

Layer.fromCSG = (csg) => Layer.fromPolygons(Polygon3D.fromCSG(csg));

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
  layers.forEach((l,i) => str += l.toDrawString(colors[i % colors.length]) + '\n\n');
  return str;
}

const getPolys = (polysOlayersOcsgOs) => {
  let polys = [];
  if (polysOlayersOcsgOs instanceof CSG)
    polys.concatInPlace(Polygon3D.fromCSG(polysOlayersOcsgOs));
  else if (polysOlayersOcsgOs instanceof Layer)
    polys.concatInPlace(polysOlayersOcsgOs.polygons());
  else if (polysOlayersOcsgOs instanceof Polygon3D)
    polys.push(polysOlayersOcsgOs);
  else
    polys.concatInPlace(polysOlayersOcsgOs.map(plc => getPolys(plc)).elements());
  return polys;
}

Layer.from = (polysOlayersOcsgOs) => Layer.fromPolygons(getPolys(polysOlayersOcsgOs));

const centerSort = (center) => (p1, p2) => p2.toPlane().distance(center) - p1.toPlane().distance(center);
Layer.axis = (polysOlayersOcsgOs) => {
  const nonLayer = !Array.isArray(polysOlayersOcsgOs) ? true :
                      polysOlayersOcsgOs.find(plc => !(plc instanceof Layer));
  try {
    const layers = nonLayer ? Layer.from(polysOlayersOcsgOs) : polysOlayersOcsgOs;
    const parimeters = layers.map((l,i) => l.parimeter());
    const axisObj = parimeters.map((polys,i) =>
    ({polys, axis: polys.length === 1 ? polys[0].axis() : Polygon3D.axis(polys)}));
    axisObj.forEach(ao => ao.length = (ao.axis.y.length() * 2) + ao.axis.x.length());
    axisObj.sortByAttr('length', true);
    const y = axisObj[0].axis.y;
    const x = axisObj[0].axis.x;
    let z = y.vector().unit().crossProduct(x.vector().unit());
    const center = Vertex3D.midrange(layers.map(l => l.vertices()).elements());
    const parrellePolys = parimeters.map(p=>p[0]).filter(p => p.normal().parrelle(z));
    if (parrellePolys.length === 1) z = new Line3D(center, center);
    else {
      parrellePolys.sort(centerSort(center));
      const magnitude = parrellePolys[0].distance(parrellePolys[1]);
      z = Line3D.fromVector(z.scale(magnitude), center.translate(z.scale(magnitude/-2), true));
    }
    x.centerOn(center); y.centerOn(center);

    return {y,x,z};
  } catch (e) {
    console.log(e);
    throw e;
  }
}

Layer.normals = (polysOlayersOcsgOs) => {
  let axis = Layer.axis(polysOlayersOcsgOs);
  const x = axis.x.vector().unit();
  const y = axis.y.vector().unit();
  const z = x.crossProduct(y).unit();
  return {x,y,z};
}

Layer.fromLimits = (vectsOvertsOlinesOpolysOcsgs) => {
  const vertices = Polygon3D.vertices(vectsOvertsOlinesOpolysOcsgs);
  const limits = Math.minMax(vertices, ['x', 'y', 'z']);

  const x = limits.x.max; const xn = limits.x.min;
  const y = limits.y.max; const yn = limits.y.min;
  const z = limits.z.max; const zn = limits.z.min;
  const center = new Vertex3D((x+xn)/2,(y+yn)/2,(z+zn)/2);

  const verts = [
    new Vertex3D(x,y,z),new Vertex3D(xn,y,z),new Vertex3D(xn,yn,z),new Vertex3D(x,yn,z),
    new Vertex3D(x,y,zn),new Vertex3D(xn,y,zn),new Vertex3D(xn,yn,zn),new Vertex3D(x,yn,zn),
  ];
  const polys = [
    new Polygon3D([verts[0],verts[1],verts[2],verts[3]]),
    new Polygon3D([verts[7],verts[6],verts[5],verts[4]]),
    new Polygon3D([verts[4],verts[5],verts[1],verts[0]]),
    new Polygon3D([verts[6],verts[7],verts[3],verts[2]]),
    new Polygon3D([verts[5],verts[6],verts[2],verts[1]]),
    new Polygon3D([verts[7],verts[4],verts[0],verts[3]]),
  ];
  console.log(polys.map(p => p.toDrawString('red', true)).join('\n'));
  return polys;
}

let lineCount = 0;
Layer.toWireDrawString = (layers) => {
  let str = '';
  layers.forEach(l => (str += l.toWireDrawString() + '\n'));
  return str;
}

Layer.parrelleSets = (polygons, tolerance) => {
  const tolmap = new ToleranceMap({'normal().positiveUnit().i()': tolerance,
                                  'normal().positiveUnit().j()': tolerance,
                                  'normal().positiveUnit().k()': tolerance});
  tolmap.addAll(polygons);
  const groups = tolmap.group().sortByAttr('length').reverse();
  return groups;
}

Object.class.register(Layer, 'polygons')
Layer.fromJson = (json) => {
  return new Layer(Object.fromJson(json.polygons));
}


module.exports = Layer;
