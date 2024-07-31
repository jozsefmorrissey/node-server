
const Polygon2D = require('../../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Line3D = require('./line');
const Vertex3D = require('./vertex');
const Vector3D = require('./vector');
const Plane = require('./plane');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const within = Tolerance.within(.0000001);

const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
let lastMi;
const NormalMagnitudeIsZero = 'InvalidPolygon: normal vector magnitude === 0';

const place = (vert, no, one, two, three) => {
  let count = 0;
  if (within(vert.x, 0)) count++;
  if (within(vert.y, 0)) count++;
  if (within(vert.z, 0)) count++;
  switch (count) {
    case 0: return no.push(vert);
    case 1: return one.push(vert);
    case 2: return two.push(vert);
    case 3: return three.push(vert);
  }
}

class Polygon3D {
  constructor(initialVertices) {
    if (initialVertices instanceof Polygon3D) return initialVertices;
    let lines = [];
    let map;
    let normal;
    let instance = this;

    function planePoints() {
      const noZeros = [];
      const oneZero = [];
      const twoZeros = [];
      const origin = [];

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const sv = line[0].copy();
        const mp = line.midpoint().copy();
        place(sv, noZeros, oneZero, twoZeros, origin);
        place(mp, noZeros, oneZero, twoZeros, origin);
      }
      return noZeros.concat(oneZero).concat(twoZeros).concat(origin);
    }

    this.length = () => lines.length;
    this.web = () => {
      const vertices = this.vertices();
      const lineMap = {};
      for (let i = 0; i < vertices.length; i++) {
        for (let j = 0; j < vertices.length; j++) {
          if (i != j) {
            const line = new Line3D(vertices[i].clone(), vertices[j].clone()).positiveVectorLine();
            const str = line.toString();
            if (!line.isPoint() && lineMap[str] === undefined) {
              lineMap[str] = line;
            }
          }
        }
      }
      return Object.values(lineMap);
    }

    this.reverse = () => {
      const verts = this.vertices();
      verts.reverse();
      return new Polygon3D(verts);
    }

    function getPlane() {
      let points = planePoints();
      let parrelle = true;
      let index = 2;
      const point1 = points[0];
      const point2 = points[1];
      let point3;
      while (parrelle && index < points.length) {
        point3 = points[index]
        let vector1 = point1.minus(point2);
        let vector2 = point3.minus(point2);
        parrelle = vector1.parrelle(vector2);
        index++;
      }
      return new Plane(point1, point2, point3);
    }
    this.toPlane = getPlane;

    this.rotate = (rotations, center) => {
      center ||= this.center();
      for(let index = 0; index < lines.length; index++) {
        lines[index][0].rotate(rotations, center);
      }
    }

    function calcNormal(otherPoints) {
      let points = instance.vertices();
      if (!Array.isArray(otherPoints)) {
        otherPoints = points.slice(2);
      } else {
        points.sort(Vertex3D.informationSorter);
      }
      let magnitude = 0;
      const vector1 = points[1].minus(points[0]);
      let vector2, normVect;
      for (let index = 0; magnitude == 0 && index < otherPoints.length; index++) {
        vector2 = otherPoints[index].minus(points[1]);
        normVect = vector1.crossProduct(vector2);
        magnitude = normVect.magnitude()
      }

      if (magnitude === 0) {
        throw new Error(NormalMagnitudeIsZero);
      }
      return normVect.unit();
    }
    this.normal = calcNormal;


    this.connect = (other) => {
      if (other instanceof Line3D) return this.connect.line(other);
      if (other instanceof Vertex3D) return this.connect.vertex(other);
      let intLine = this.toPlane().intersection(other.toPlane());
      if (intLine instanceof Plane) intLine = new Line3D(this.center(), other.center());
      let connector;
      if (intLine === null) {
        connector = this.connect(other.connect(this.connect(other.center())[0])[0]);
      } else {
        const onOther1 = other.connect(intLine[0])[0];
        const onOther2 = other.connect(intLine[1])[0];
        const thisConn1 = this.connect(onOther1);
        const thisConn2 = this.connect(onOther2);
        const closest = (thisConn1.length() < thisConn2.length() ? thisConn1 : thisConn2)[0];
        connector = this.connect(other.connect(closest)[0])
      }
      return connector;
    };
    this.connect.vertex = (vert) => {
      const line = Line3D.fromVector(this.normal(), vert);
      const planeInter = this.toPlane().intersection.line(line);
      if (this.isWithin(planeInter)) return new Line3D(planeInter, vert);
      const connectionLines = [];
      const lines = this.lines();
      lines.forEach(l =>
        connectionLines.push(l.connect(vert, true)));
      connectionLines.sortByAttr('length');
      return connectionLines[0];
    }
    this.connect.line = (line) => {
      const planeConn = this.toPlane().intersection.line(line);
      const interceptConn = this.connect.vertex(line.connect.vertex(planeConn, true)[0]);
      const startConn = this.connect.vertex(line[0]);
      const endConn = this.connect.vertex(line[1]);
      const possible = [interceptConn, startConn, endConn];
      const closest = possible.min(l => l.length())[1];
      return this.connect.vertex(closest);
    }

    this.valid = () => {
      let posNormal;
      try {
        posNormal = this.normal().positiveUnit();
      } catch (e) {
        return false;
      }
      const verts = this.vertices();
      for (let i = 0; i < verts.length; i++) {
        const vert1 = verts[i];
        for (let j = i + 1; j < verts.length; j++) {
          const vert2 = verts[j];
          const vector1 = vert1.minus(vert2);
          for (let k = j + 1; k < verts.length; k++) {
            const vert3 = verts[k];
            const vector2 = vert2.minus(vert3);
            const normVect = vector1.crossProduct(vector2);
            const dot = vector1.unit().dot(vector2.unit());
            if (!Tolerance.within(.5)(Math.abs(dot), 1)) {
              const mag = normVect.magnitude();
              if (mag !== 0 && !normVect.positiveUnit().equals(posNormal)) {
                return false;
              }
            }
          }
        }
      }
      return true;
    }

    // TODO(Discuss): I am inconsitantly createing code that does not modify object directly
    this.translate = (vector) => {
      const verts = [];
      for (let index = 0; index < lines.length; index++) {
        verts.push(lines[index][0].translate(vector, true));
      }
      return new Polygon3D(verts);
    }

    this.perpendicular = (poly) => {
      return this.normal().perpendicular(poly.normal());
    }
    const xyNormal = new Vector3D(0,0,1);
    const yzNormal = new Vector3D(1,0,0);
    const xzNormal = new Vector3D(0,1,0);
    this.inXY = () => this.perpendicular(xyPoly);
    this.inYZ = () => this.perpendicular(yzPoly);
    this.inXZ = () => this.perpendicular(xzPoly);

    this.parrelle = (poly) => {
      try {
        const normal = this.normal();
        if (normal === undefined || poly.normal() === undefined) return false;
        return normal.parrelle(poly.normal());
      } catch (e) {
        console.warn(e);
        return false;
      }
    }

    this.offset = (left, right, up, down) => {
      lines[0].length(left - lines[0].length(), false);
      lines[0].length(lines[0].length() - right, true);
      lines[2].length(lines[2].length() - left, true);
      lines[2].length(right - lines[2].length(), false);

      lines[1].length(up - lines[1].length(), false);
      lines[1].length(lines[1].length() - down, true);
      lines[3].length(lines[3].length() - up, true);
      lines[3].length(down - lines[3].length(), false);
    }

    function forEachVertex(func) {
      const locations = [];
      for (let target = 0; target < lines.length; target++) {
        const before = (target + lines.length - 1) % lines.length;
        const after = (target + 1) % lines.length;
        const line = {before: lines[before], target: lines[target], after: lines[after]};
        const vertex = {before: lines[before][0], target: lines[target][0], after: lines[after][0]};
        const index = {before, target, after};
        const beforeToNext = new Line3D(vertex.before, vertex.after);
        const connection = beforeToNext.connect.vertex(vertex.target);
        const info = {connection, line, vertex, index};
        if (func(info)) {
          locations.push(info);
        }
      }
      return locations;
    }


    const identifyConcaveLocations = () =>
      forEachVertex(info => info.line.after.length() + info.line.before.length() >
          info.vertex.before.distance(info.connection[1]) + info.vertex.after.distance(info.connection[1]) + .000001 &&
          !(new Line3D(info.connection[0], info.vertex.before).vector().sameDirection(new Line3D(info.connection[0], info.vertex.after).vector())) &&
          !instance.isWithin2d(info.connection[0]));
      const identifyCrissCrossLocations = () =>
        forEachVertex(info => info.line.before.intersection.segment(info.line.after, true));
      const identifyParrelleLocations = () =>
        forEachVertex(info => info.line.after.isParrelle(info.line.target));

    this.irregular = {concave: {}, crissCross: {}, parrelle: {}};
    this.irregular.parrelle.locations = () =>
          identifyParrelleLocations().map(info => info.index.target);
    this.irregular.parrelle.fill = (doNotModify) => {
      if (doNotModify) return this.copy().this.irregular.concave.fill();
      const locs = identifyParrelleLocations();
      locs.sortByAttr('index', true);
      locs.forEach(info => {
        info.line.target[1] = info.line.after[1];
        lines.splice(info.index.after, 1);
      });
      return this;
    }


    this.irregular.concave.locations = () =>
          identifyConcaveLocations().map(info => info.index.target);
    this.irregular.concave.fill = (doNotModify) => {
      if (doNotModify) return this.copy().this.irregular.concave.fill();
      const locs = identifyConcaveLocations();
      locs.sortByAttr('index', true);
      locs.forEach(info => {
        info.line.before[1] = info.line.after[0];
        lines.splice(info.index.target, 1);
      });
      return this;
    }

    this.irregular.crissCross.locations = () =>
          identifyCrissCrossLocations().map(info => info.index.target);

    this.irregular.crissCross.fill = (doNotModify) => {
      if (doNotModify) return this.copy().this.irregular.crissCross.fill();
      identifyCrissCrossLocations().forEach(info => {
        const temp = info.line.before[1];
        info.line.before[1] = info.line.after[0];
        info.line.after[0] = temp;
        info.line.target[0] = info.line.before[1];
        info.line.target[1] = temp;
      });
      return this;
    }
    this.irregular.is = () =>
      this.irregular.concave.locations().length > 0 ||
      this.irregular.crissCross.locations().length > 0 ||
      this.irregular.parrelle.locations().length > 0;


    /**
                                   1
                    <-----  ---------------  ------>
                            |             |
                      0     |             |  2
                            |             |
                    <-----  --------------   ------>
                                  3

    **/
    // Arbitrary value could be used in the future to allow variance in auto joining algorithum.
    const INT_DIST_TOL = 3*2.54;
    function extendByLines(polyOplane) {
      const plane = polyOplane instanceof Polygon3D ? polyOplane.toPlane() : polyOplane;
      const len = lines.length;
      for (let index = 0; index < len; index++) {
        const before = lines[(index + len - 1) % len];
        const after = lines[(index + 1) % len];
        const b4int = plane.intersection.line(before);
        const aftint = plane.intersection.line(after);
        if (b4int instanceof Vertex3D && aftint instanceof Vertex3D) {
          const newSide = new Line3D(b4int, aftint);
          const intDist = polyOplane.distance(b4int) + polyOplane.distance(aftint);
          if (intDist < INT_DIST_TOL) {
            const b4Index = before[0].distance(b4int) < before[1].distance(b4int) ? 0 : 1;
            const aftIndex = after[0].distance(aftint) < after[1].distance(aftint) ? 0 : 1;
            if (b4Index !== aftIndex) {
              before[b4Index].positionAt(b4int);
              after[aftIndex].positionAt(aftint);
            }
          }
        }
      }
      if (instance.irregular.is()) {
        instance.irregular.crissCross.locations();
        instance.irregular.is();
        console.warn('Polygons should be regular: it should be determined if this function is causing the irregularity');
        /* The following functions will fix irregularities */
        // instance.irregular.parrelle.fill();
        // instance.irregular.crissCross.fill();
        // instance.irregular.concave.fill();
      }

      return instance;
    }

    this.extendTo = (polyOplane, doNotModify) => {
      if (doNotModify) return this.copy().extendTo(polyOplane);
      return extendByLines(polyOplane);
    }

    this.normals = () => Polygon3D.normals(this);

    const resizeVertex = (vert, center, norms, width, height) => {
      const radial = new Line3D(center, vert);
      const radialUnit = radial.vector().unit();
      const dotW = norms.x.dot(radialUnit);
      const dotH = norms.y.dot(radialUnit);
      const hVect = norms.y.scale(dotH*height/2);
      const wVect = norms.x.scale(dotW*width/2);
      const transVect = wVect.add(hVect);
      vert.translate(transVect);
    }

    this.resize = (width, height, doNotModify) => {
      if (doNotModify) return this.copy().resize(width, height);
      console.warn.subtle('This is really a scaleing function should rewrite');
      const norms = this.normals();
      const center = this.center();
      const verts = this.vertices();
      lines.forEach(l =>
          resizeVertex(l[0], center, norms, width, height));
      return this;
    }

    this.scale = (width, height, doNotModify) => {
      if (doNotModify) return this.copy().resize(width, height);
      const norms = this.normals();
      const center = this.center();
      const verts = this.vertices();
      lines.forEach(l =>
          resizeVertex(l[0], center, norms, width, height));
      return this;
    }

    this.parrelleAt = (distance) => {
      const normal = this.normal();
      const scaled = normal.scale(distance);
      const vertices = this.vertices();
      for (let index = 0; index < vertices.length; index++) {
        vertices[index].translate(scaled);
      }
      return new Polygon3D(vertices);
    }

    this.parrelleNear = (target, distance) => {
      distance ||= 100;
      const center = this.center();
      const targetDistance = center.distance(target);
      const posPlane = this.parrelleAt(distance);
      if (posPlane.center().distance(target) < targetDistance) return posPlane;
      return this.parrelleAt(-distance);
    }

    this.vertices = () => {
      if (lines.length === 0) return [];
      const vertices = [];
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        vertices.push(line[0]);
      }

      return JSON.clone(vertices);
    }

    this.vertex = (index) => lines[Math.mod(index, lines.length)][0].copy();

    this.isClockwise = () => {
      let sum = 0;
      for (let index = 0; index < lines.length; index += 1) {
        const point1 = lines[index][0];
        const point2 = lines[index][0];
        sum += (point2.x - point1.x)*(point2.y + point1.y)*(point2.z - point1.z);
      }
      return sum > 0;
    }

    this.lines = () => JSON.clone(lines);
    this.line = (index) => JSON.clone(lines[Math.mod(index, lines.length)]);
    this.startLine = () => lines[0];
    this.endLine = () => lines[lines.length - 1];

    const tol = '+.00001';
    this.lineMap = (force) => {
      if (!force && map !== undefined) return map;
      if (lines.length === 0) return {};
      // map = new ToleranceMap({'0.x': tol, '0.y': tol, '0.z': tol,
      //                         '1.x': tol, '1.y': tol, '1.z': tol});
      map = new ToleranceMap({'vector.unit.i': tol, 'vector.unit.j': tol, 'vector.unit.k': tol});

      let lastEnd;
      if (!lines[0][0].equals(lines[lines.length - 1][1])) throw new Error('Broken Polygon');
      for (let index = 0; index < lines.length; index++) {
        lines[index]._POLY_INDEX = index;
        map.add(lines[index]);
      }
      return map;
    }

    this.copy = () => new Polygon3D(Line3D.vertices(lines, true));

    this.equals = (other) => {
      if (!(other instanceof Polygon3D)) return false;
      const verts = this.vertices();
      const otherVerts = other.vertices();
      if (verts.length !== otherVerts.length) return false;
      let otherIndex = undefined;
      let direction;
      for (let i = 0; i < verts.length; i++) {
        if(!verts[i].equals(otherVerts[i])) return false;
      }
      return true;
    }

    this.equivalent = (other) => {
      if (!(other instanceof Polygon3D)) return false;
      const verts = this.vertices();
      const otherVerts = other.vertices();
      if (verts.length !== otherVerts.length) return false;
      let otherIndex = undefined;
      let direction;
      for (let index = 0; index < verts.length * 2; index += 1) {
        const vIndex = index % verts.length;
        if (otherIndex === undefined) {
          if (index >= verts.length) {
            return false
          } if(verts[index].equals(otherVerts[0])) {
            otherIndex = otherVerts.length * 2;
          }
        } else if (otherIndex === otherVerts.length * 2) {
          if (verts[vIndex].equals(otherVerts[1])) direction = 1;
          else if(verts[vIndex].equals(otherVerts[otherVerts.length - 1])) direction = -1;
          else return false;
          otherIndex += direction * 2;
        } else if (!verts[vIndex].equals(otherVerts[otherIndex % otherVerts.length])) {
          return false;
        } else {
          otherIndex += direction;
        }
      }
      return true;
    }

    function getLine(line) {
      const lineMap = this.lineMap();
      const matches = lineMap.matches(line);
      if (matches && matches.length > 1) throw new Error('THIS SHOULD NOT HAPPEN!!!! REMOVE LINES IS BROKEN... probably');
      return matches ? matches[0] : null;
    }

    this.getLines = (startVertex, endVertex, reverse) => {
      const subSection = [];
      let completed = false;
      let shared;
      const compareLine = new Line3D(startVertex, endVertex);
      const compareLineI = new Line3D(endVertex,startVertex);

      const doubleLen = lines.length * 2;
      for (let steps = 0; steps < doubleLen; steps += 1) {
        const index =  (!reverse ? steps : (doubleLen - steps - 1)) % lines.length;
        const curr = lines[index];
        if (!shared) {
          if (compareLine.equals(curr) || compareLineI.equals(curr)) shared = curr;
        } else {
          if (shared === curr) {
            completed = true;
            break;
          } else subSection.push(!reverse ? curr : curr.negitive());
        }
      }
      if (completed) return subSection;
    }

    this.center = () => {
      const verts = [];
      for (let index = 0; index < lines.length; index++) {
        verts.push(lines[index][0]);
      }
      return Vertex3D.center(verts);
    }

    this.addVertices = (list) => {
      if (list === undefined) return;
      const verts = [];
      const endLine = this.endLine();
      for (let index = 0; index < list.length + 1; index += 1) {
        if (index < list.length) verts[index] = new Vertex3D(list[index]);
        if (index === 0 && endLine) endLine[1] = verts[0];
        else if (index > 0) {
          const startVertex = verts[index - 1];
          const endVertex = verts[index] || this.startLine()[0];
          const line = new Line3D(startVertex, endVertex);
          lines.push(line);
          const prevLine = lines[lines.length - 2];
          if (lines.length > 2 && !(normal instanceof Vector3D)) {
            try {
              normal = calcNormal().positiveUnit();
            } catch (e) {
              if (e.message !== NormalMagnitudeIsZero) {
                console.error(e);
              }
            }
          } else if (lines.length > 3) {
            const equal = normal.equals(calcNormal(endVertex).positiveUnit());
            if (equal === false) {
              console.warn('Trying to add vertex that does not lie in the existing plane');
            }
          }
        }
      }
      if (verts.length > 0 && lines.length > 0) {
        if (endLine) endline[1] = verts[0];
      }
      this.lineMap(true);
      // this.removeLoops();
    }

    this.rebuild = (newVertices) => {
      lines = [];
      this.addVertices(newVertices);
    }

    this.shift = (startVertexIndex) => {
      lines.slice(startVertexIndex).concat(lines.slice(0,startVertexIndex))
    }

    this.orderBy = {};
    this.orderBy.polygon = (other) => {
      if (!(other instanceof Polygon3D)) return;
      const verts = this.vertices();
      const otherVerts = other.vertices();
      const vertLen = verts.length;
      if (otherVerts.length !== vertLen)
        throw new Error('When using a Polygon3D to order another they must have an equal number of verticies');
      let shortest;
      for (let shift = 0; shift < vertLen; shift++) {
        let dist = 0;
        for (let index = 0; index < vertLen; index++) {
          dist += otherVerts[index].distance(verts[(index + shift) % vertLen]);
        }
        if (shift === 0 || dist < shortest.dist) {
          shortest = {dist, shift};
        }
      }
      if (shortest.shift === 0) return null;
      this.shift(shortest.shift);
      return shortest.shift;
    }

    this.orderBy.vertex = (startTarget) => {
      if (!(startTarget instanceof Vertex3D)) return;
      const verts = this.vertices();
      const vertLen = verts.length;
      let shortest;
      for (let shift = 0; shift < vertLen; shift++) {
        let dist = 0;
        for (let index = 0; index < vertLen; index++) {
          dist += startTarget.distance(verts[index + shift]);
        }
        if (shift === 0 || dist < shortest.dist) {
          shortest = {dist, shift};
        }
      }
      if (shortest.shift === 0) return null;
      this.shift(shortest.shift);
      return shortest.shift;
    }

    this.removeLoops = () => {
      let removed = true;
      const orig = lines;
      while (removed && lines.length > 0) {
        removed = false;
        const map = this.lineMap();
        for (let index = 0; index < lines.length; index += 1) {
          const line = lines[index];
          if (line.isPoint()) {
            lines = JSON.clone(lines);
            lines.splice(index, 1);
            removed = true;
          } else {
            const match = map.matches(line);
            if (match.length > 1) {
              const startIndex = line._POLY_INDEX;
              const endIndex = match._POLY_INDEX;
              if (startIndex > endIndex)
              throw new Error('THIS SHOULD NOT HAPPEN!!!!!! WTF!!!!');
              const forwardDiff = endIndex - startIndex;
              const reverseDiff = lines.length - forwardDiff;
              if (forwardDiff > reverseDiff) {
                lines = lines.slice(startIndex, endIndex);
              } else {
                lines = lines.slice(0, startIndex).concat(lines.slice(endIndex));
              }

              const newVerts = Line3D.vertices(lines, false);
              this.rebuild(newVerts);
              removed = true;
              break;
            }
          }
        }

        if (removed) this.lineMap(true);
      }
    }

    this.path = () => {
      let path = '';
      this.vertices().forEach((v) => path += `${v.toString()} => `);
      return path.substring(0, path.length - 4);
    }

    let removeBackTractedVertices = (verts) => {
      let vlen = verts.length;
      const compareBeforeAndAfter = (vert, i) =>
          verts[(vlen+i-1)%vlen].equals(verts[(i+1)%vlen]);

      let equalIndex;
      while (verts.length > 2 && (equalIndex = verts.findIndex(compareBeforeAndAfter)) !== -1) {
        verts.splice(equalIndex, 1);
        verts.splice(equalIndex % (vlen - 1), 1);
        vlen -= 2;
      }
      return verts;
    }

    const cleanLines = (lines) => {
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (line.isPoint()) {
          lines.splice(index--, 1);
        } else {
          const afterIndex = (index + 1) % lines.length;
          const after = lines[afterIndex];
          const unitVec = line.vector().unit();
          const afterVec = after.vector().unit();
          if (unitVec.equals(afterVec.inverse())) {
            const lineLen = line.length();
            const afterLen = after.length();
            if (line.length() === after.length()) {
              lines.splice(index, 1);
              lines.splice(index % lines.length, 1);
              index = index < 3 ? 0 : index - 3;
            } else {
              lines[afterIndex] = new Line3D(line[0].clone(), after[1].clone());
              lines.splice(index--, 1);
            }
          } else if (unitVec.equals(afterVec)) {
            lines[afterIndex] = new Line3D(line[0].clone(), after[1].clone());
            lines.splice(index--, 1);
          }
        }
      }
      return lines;
    }

    const minVertDist = (tar, line) => {
      const dist1 = tar[0].distance(line[0]);
      const dist2 = tar[0].distance(line[1]);
      return dist1 <  dist2 ? dist1 : dist2;
    }

    this.distance = (other) => this.connect(other).length();

    let printMerge = (poly, otherPoly, target, curr, combineInfo) =>{
      let str = '';
      str += `//target poly\n${poly.toDrawString('red')}`;
      str += `\n//target\n${target.toDrawString('red')}`;
      str += `\n\n//curr poly\n${otherPoly.toDrawString('blue')}`;
      str += `\n//curr\n${curr.toDrawString('blue')}`;
      str += '\n\n' + combineInfo.map(v => v.toString()).join('\n');
      str += '\n//merge\n' + poly.merge(otherPoly, true).toDrawString('green');
      console.log(str);
    }

    // TODO: Needs work. I think just polys that share multipleLines...
    this.merge = (other, recursive) => {
      const pm = printMerge;
      if (!this.normal().parrelle(other.normal())) return;
      // try {
      //   const combined = new Polygon3D(this.vertices().concat(other.vertices()));
      //   if (!combined.normal.parrelle(normal)) return;
      // } catch (e) {
      //   return;
      // }
      if (this.equals(other)) return this.copy();
      // const thisPlane = this.toPlane();
      // const otherPlane = other.toPlane();
      // if (!thisPlane.equivalent(otherPlane)) return;
      const lineMap = this.lineMap();
      const allOtherLines = other.lines();
      let merged;
      for (let index = 0; !merged && index < allOtherLines.length; index += 1) {
        const curr = allOtherLines[index];
        let vertices, thisLines, otherLines;
        const matches = lineMap.matches(curr);
        if (matches !== null) {
          for (let index = 0; !merged && index < matches.length; index++) {
            const target = matches[index];
            const combineInfo = target.combineOrder(curr);
            if (combineInfo && combineInfo.shorterBy > .000001) {
              let line1 = new Line3D(combineInfo[0], combineInfo[1]);
              let line2 = new Line3D(combineInfo[2], combineInfo[3]);
              if (minVertDist(target, line1) !== 0) {
                const temp = line1;line1 = line2;line2 = temp;
                if (minVertDist(target, line1) !== 0)
                  throw new Error("10/30/2023 This Shouldn't consider removing if it has not been a problem");
              }
              let thisLines = this.getLines(target[0], target[1]);
              if (!line1.isPoint()) {
                if (!line1[0].equals(thisLines[thisLines.length - 1][1])) line1 = line1.negitive();
                thisLines.push(line1);
              }
              if (!line2.isPoint()) {
                if (!line2[1].equals(thisLines[0][0])) line2 = line2.negitive();
                thisLines = [line2].concat(thisLines);
              }
              let otherLines = other.getLines(curr[0], curr[1]);
              if (otherLines[0][0].equals(thisLines[0][0])) otherLines = Line3D.reverse(otherLines);
              const startCheck = thisLines[0][0].equals(otherLines[otherLines.length - 1][1]);
              const middleCheck = thisLines[thisLines.length - 1][1].equals(otherLines[0][0]);
              vertices = Line3D.vertices(cleanLines(otherLines.concat(thisLines)), false);
              merged = new Polygon3D(removeBackTractedVertices(vertices));
              merged.normal();
            }
          }
        }
      }

      if (merged) {
        return merged;
      }
    }

    this.viewFromVector = (vector) => Polygon3D.viewFromVector([this], vector)[0];
    this.mostInformation = () => Polygon3D.mostInformation([this]);

    this.to2D = (x, y) => {
      if (!x || !y) {
        const mi = this.mostInformation();
        x ||= mi[0];
        y ||= mi[1];
        if (lastMi && (mi[0] !== lastMi[0] || mi[1] !== lastMi[1])) {
          console.info.subtle('change in mi');
        }
        lastMi = mi;
      }
      return new Polygon2D(Vertex3D.to2D(this.vertices(),  x, y));
    }

    const zVector = new Vector3D(0,0,1);
    this.coDirectionalRotations = (vector) => Line3D.coDirectionalRotations(this.normal(), vector || zVector);

    this.alignZpolyNorms = () => {
      const copy = this.copy();
      copy.rotate(this.coDirectionalRotations());
      return copy;
    }

    this.isWithin2d = (vertex, exclusive) => {
      if (vertex instanceof Line3D) return this.isWithin2d(vertex[0]) && this.isWithin2d(vertex[1]);
      const withinLines = this.lines().map(l => l.within(vertex)).find(v => v===true);
      if (!exclusive && (withinLines || !this.valid())) return withinLines;
      if (exclusive && withinLines) return false;
      const zAligned = this.alignZpolyNorms();
      vertex = vertex.copy();
      vertex.rotate(this.coDirectionalRotations(), this.center());

      const poly2d = zAligned.to2D('x', 'y');
      const vert2d = vertex.to2D('x', 'y');
      return poly2d.isWithin(vert2d, exclusive);
    }

    this.isWithin = (vertex, exclusive) => {
      const verts = this.vertices();
      if (verts.length < 3) return false;
      verts.concat(vertex);
      const other = new Polygon3D(verts);
      if (!other.parrelle(other)) return false;
      return this.isWithin2d(vertex, exclusive);
    }

    this.withinPlane = (other) => {
      try {
        const posUnit = this.normal().positiveUnit();
        if (!other.normal().positiveUnit().equals(posUnit)) return false;
        if (!this.normal(other.vertices()).positiveUnit().equals(posUnit)) return false;
      } catch (e) {
        console.error(e);
        return false;
      }
      return true;
    }

    function vertexJustInside(endpoint, center) {
      const vector = new Line3D(endpoint, center).vector().unit().scale(.001);
      return endpoint.translate(vector, true);
    }

    this.overlaps = (other, returnInfo, otherIsParrelle) => {
      if (!(otherIsParrelle || this.parrelle(other)) || !this.withinPlane(other)) return false;
      const verts = this.vertices();
      const otherVerts = other.vertices();
      const info = {within: [], outside: [], onParrimeter: []};
      const isWithin = () => info.within.length > 0 || info.isWithin;
      for (let index = 0; (returnInfo || !isWithin()) && index < otherVerts.length; index++) {
          if (this.isWithin2d(otherVerts[index])) {
            if (this.isWithin2d(otherVerts[index], true)) {
              info.isWithin = true;
              info.within.push(otherVerts[index]);
            } else info.onParrimeter.push(otherVerts[index]);
          } else info.outside.push(otherVerts[index]);
      }
      for (let index = 0; !isWithin() && index < verts.length; index++) {
          if (other.isWithin2d(verts[index], true)) {
            info.isWithin = true;
          }
      }

      let within = isWithin();
      within ||= other.isWithin2d(this.center());
      within ||= this.isWithin2d(other.center());
      delete info.isWithin;
      return within ? (returnInfo ? info : true) : false;
    }

    this.intersection = (other) => {
      console.warn('Use at your own RISH! \n\tI couldent even spell risk the code is probably trash');
      let planeInt = this.toPlane().intersection(other.toPlane());
      if (planeInt === null) return null;
      if (planeInt instanceof Plane) {
        const overlapInfo = this.overlaps(other, true);
        if (overlapInfo) {
          const within = overlapInfo.onParrimeter.concat(overlapInfo.within);
          if (within.length > 1) {
            planeInt = new Line3D(within[0], within[1]);
          } else return null;
        } else {
          const center = Vertex3D.center(this.vertices().concat(other.vertices()));
          planeInt = new Line3D(center, center);
        }
      }
      const vector = planeInt.vector().unit().scale(1000000);
      const tp1 = this.intersection.line(Line3D.startAndVector(planeInt[0], vector));
      const tp2 = this.intersection.line(Line3D.startAndVector(planeInt[0], vector.inverse()));
      const to1 = other.intersection.line(Line3D.startAndVector(planeInt[0], vector));
      const to2 = other.intersection.line(Line3D.startAndVector(planeInt[0], vector.inverse()));
      const withinBoth = [];
      if (tp1 && other.isWithin(tp1)) withinBoth.push(tp1);
      if (tp2 && other.isWithin(tp2)) withinBoth.push(tp2);
      if (to1 && this.isWithin(to1)) withinBoth.push(to1);
      if (to2 && this.isWithin(to2)) withinBoth.push(to2);
      if (withinBoth.length === 0) return null;
      if (withinBoth.length === 1) return withinBoth[0];
      const longest = Line3D.longest(...withinBoth);
      if (goDownTheRabbitHole) this.intersection(other);
      return longest;
    };
    this.intersection.line = (line, exclusive) => {
      const planeInt = this.toPlane().intersection.line(line);
      if (!planeInt) return null;
      const ortho = this.viewFromVector(this.normal());
      const interView = planeInt.viewFromVector(this.normal());
      if (planeInt instanceof Line3D) {
        const vector = planeInt.vector().unit();
        const p1 = this.connect.line(Line3D.startAndVector(planeInt[0], vector));
        const p2 = this.connect.line(Line3D.startAndVector(planeInt[1], vector));
        return new Line3D(p1[0], p2[0]);
      }
      if (ortho.isWithin2d(interView, exclusive)) return planeInt;
      return null;
    }

    this.toString = () => {
      let str = '[';
      for (let index = 0; index < lines.length; index++) {
        str += ` => ${lines[index][0].toString()}`;
      }
      return `${str.substring(4)} normal: ${this.normal()}`;
    }

    const vertexColor = (i) => i===0?'red':(i===1?'blue':(i===2?'green':i===3?'black':(String.color.next())));
    this.toDrawString = (color, includeNormal) => {
      const colorString = (typeof color) === 'string' ? color : 'blue';
      let str = '';
      for (let index = 0; index < lines.length; index++) {
        str += `,${lines[index][0].toString(.001)}`;
      }
      if (includeNormal !== true) return `${colorString}[${str.substring(1)}]`;
      const start = this.center();
      const end = new Vertex3D(this.normal().scale(10).add(start));
      const normalStr = `[${start.toString(.001)},${end.toString(.001)})`;

      const vertexStr = this.vertices().map((v,i) => `\t${vertexColor(i)}${v.toString(.001)}`).join('\n');

      return `${colorString}[${str.substring(1)}]\n${colorString}${normalStr}\n${vertexStr}`;

    }

    this.addVertices(initialVertices);
  }
}

Polygon3D.merge = (polygons) => {
  if (polygons instanceof CSG) polygons = Polygon3D.fromCSG(polygons);
  const tol = '+.001';
  const tolMap = new ToleranceMap({'normal.positiveUnit.i': tol,
                        'normal.positiveUnit.j': tol,
                        'normal.positiveUnit.k': tol,
                        'toPlane.axisIntercepts.x': tol,
                        'toPlane.axisIntercepts.y': tol,
                        'toPlane.axisIntercepts.z': tol});
  tolMap.addAll(polygons);

  polygons.deleteAll();
  tolMap.forEachSet((polys) => {
    let currIndex = 0;
    while (currIndex < polys.length - 1) {
      const target = polys[currIndex];
      for (let index = currIndex + 1; index < polys.length; index += 1) {
        const other = polys[index];
        const merged = target.merge(other);
        if (merged) {
          polys[currIndex--] = merged;
          polys.splice(index, 1);
          break;
        }
      }
      currIndex++;
    }
    polygons.concatInPlace(polys);
  });


  return polygons;
}

const xyPoly = new Polygon3D([[1,10,0],[11,2,0],[22,1,0]]);
const yzPoly = new Polygon3D([[6,0,1],[10,0,27],[2,0,11]]);
const xzPoly = new Polygon3D([[0,11,13],[0,12,23],[0,22,3]]);

Polygon3D.mostInformation = (polygons) => {
  const verts = [];
  polygons.forEach(p => verts.concatInPlace(p.vertices()));
  return Vertex3D.mostInformation(verts);
}

Polygon3D.lines2d = (polygons, x, y) => {
  if (polygons instanceof Polygon3D) polygons = [polygons];
  if (polygons instanceof CSG) polygons = Polygon3D.fromCSG(polygons);
  // Polygon3D.merge(polygons);
  let lines = [];
  polygons.map(p => p.to2D(x, y)).forEach(p => lines.concatInPlace(p.lines()));
  return Line2d.consolidate(lines);
}

Polygon3D.toDrawString2d = (polygons, x, y,...colors) => {
  Polygon3D.merge(polygons)
  let drawString = '';
  for (let index = 0; index < polygons.length; index++) {
    const lines = Polygon3D.lines2d([polygons[index]], x, y);
    drawString += Line2d.toDrawString(lines, colors[index % colors.length]) + '\n\n';
  }
  return drawString;
}

const to2D = (mi) => (p) => p.to2D(mi[0],mi[1]);
Polygon3D.toTwoD = (polygons, vector, axis) => {
  const view = Polygon3D.viewFromVector(polygons, vector, true);
  axis ||= Polygon3D.mostInformation(view);
  const twoD = view.map(to2D(axis));
  const twoDlines = Polygon2D.lines(twoD);
  twoDlines.axis = axis;
  return twoDlines;
}

Polygon3D.parrelleSets = (polygons, tolerance) => {
  const tolmap = new ToleranceMap({'normal.positiveUnit.i': tolerance,
                                  'normal.positiveUnit.j': tolerance,
                                  'normal.positiveUnit.k': tolerance});
  tolmap.addAll(polygons);
  const groups = tolmap.group().sortByAttr('length').reverse();
  return groups;
}

Polygon3D.toThreeView = (polygons, normals, gap) => {
  const ThreeView = require('../../../../../public/js/utils/canvas/two-d/objects/three-view.js');
  return new ThreeView(polygons, normals, gap);
}

Polygon3D.fromCSG = (polys) => {
  if (polys instanceof CSG) polys = polys.polygons;
  const isArray = Array.isArray(polys);
  if (!isArray) polys = [polys];
  const poly3Ds = [];
  for (let index = 0; index < polys.length; index++) {
    const csgPoly = polys[index];
    const verts = [];
    try {
      for (let vIndex = 0; vIndex < csgPoly.vertices.length; vIndex++) {
        const v = csgPoly.vertices[vIndex];
        verts.push(new Vertex3D({x: v.pos.x, y: v.pos.y, z: v.pos.z}));
      }
      let polygon = new Polygon3D(verts);
      if (!polygon.normal().sameDirection(new Vector3D(csgPoly.plane.normal))) {
        polygon = polygon.reverse();
        console.warn.subtle(5000, 'never tested should work...');
      }
      poly3Ds.push(polygon);
    } catch (e) {
      console.warn('Error converting CSG polygon:\n\t', csgPoly.toDrawString());
    }
  }
  if (!isArray) return poly3Ds[0];
  // Polygon3D.merge(poly3Ds);
  return poly3Ds;
}

Polygon3D.fromVectorObject =
    (width, height, center, vectorObj) => {
  center ||= new Vertex(0,0,0);
  vectorObj ||= {x: new Vector3D(1,0,0), y: new Vector3D(0,1,0)}
  const hw = width/2;
  const hh = height/2;
  const wV = vectorObj.x;
  const hV = vectorObj.y;
  const vector1 = center.translate(hV.scale(hh), true).translate(wV.scale(-hw));
  const vector2 = center.translate(hV.scale(hh), true).translate(wV.scale(hw));
  const vector3 = center.translate(hV.scale(-hh), true).translate(wV.scale(hw));
  const vector4 = center.translate(hV.scale(-hh), true).translate(wV.scale(-hw));
  return new Polygon3D([vector1, vector2, vector3, vector4]);
}

Polygon3D.fromLines = (lines) => {
  lines = lines.map(l => l.clone());
  const center = Vertex3D.center(...Line3D.vertices(lines));
  const radialLine = new Line3D(center, lines[0][0]);
  const normalVector = radialLine.vector().crossProduct(new Line3D(center, lines[0][1]).vector());
  Line3D.radialSort(lines, center, normalVector);
  const verts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const nextLine = lines[index];
    const targetLine = lines[Math.mod(index - 1, lines.length)];
    if (!nextLine[0].equals(targetLine[1])) {
      verts.push(targetLine[1]);
    }
    verts.push(nextLine[0]);
  }
  return new Polygon3D(verts);
}

Polygon3D.from2D = (polygon2d) => {
  const verts = polygon2d.vertices();
  const initialVertices = [];
  for (let index = 0; index < verts.length; index++) {
    const vert = verts[index];
    initialVertices.push(new Vertex3D(vert.x, vert.y, 0));
  }
  return new Polygon3D(initialVertices);
}


Polygon3D.radialSort2D = (polys, viewFrom, ccw, center, degreesOstartpoint) => {
  center ||= Vertex3D.center(polys.map(p => p.center()));
  degreesOstartpoint ||= 0;
  centers = [];
  polys.forEach(p => centers.push(p.center()) & (centers[centers.length - 1].poly = p));
  Vertex3D.radialSort2D(centers, viewFrom, ccw, center, degreesOstartpoint);
  return polys.copy(centers.map(c => c.poly));
}

const randValue = () => Math.random() > .5 ? Math.random() * 200000 - 100000 : 0;
for (let index = 0; index < 10000; index++) {
  const vector = new Vector3D(randValue(), randValue(), randValue());
}

Polygon3D.viewFromVector = (polygons, vector) => {
  if (polygons instanceof CSG) polygons = Polygon3D.fromCSG(polygons);
  const orthoPolys = [];
  for (let p = 0; p < polygons.length; p++) {
    const vertices = polygons[p].vertices();
    const orthoVerts = Vertex3D.viewFromVector(vertices, vector);
    try {
      const poly = new Polygon3D(orthoVerts);
      orthoPolys.push(poly);
    } catch(e) {}
  }
  return orthoPolys;
}

Polygon3D.toDrawString = (polygons, ...colors) => {
  colors ||= ['blue']
  if (polygons instanceof CSG) polygons = Polygon3D.fromCSG(polygons);
  let str = '';
  polygons.forEach((p, i) => str += p.toDrawString(colors[i%colors.length]).split('\n')[0] + '\n')
  return str;
}

const centerSort = (center) => (p1, p2) => p2.distance(center) - p1.distance(center);
function normalsGivinPolygons(polygons) {
  const sets = Polygon3D.parrelleSets(polygons);
  const positionObjs = [];
  for (let index = 0; index < sets.length; index++) {
    const set = sets[index];
    if (set.length > 1) {
      const center = Vertex3D.center(polygons.map(p => p.center()));
      set.sort(centerSort(center));
      const distance = set[0].distance(set[1])
      positionObjs.push({index, distance});
    }
  }
  positionObjs.sortByAttr('distance');
  return Polygon3D.normals(sets[positionObjs[0].index][0]);
}

function normalsGivenAPolygon(polygon) {
  const lines = polygon.lines();
  Line3D.combine(lines);
  const pSets = Line3D.parrelleSets(lines).filter(s => s.length > 1);
  const normals = {
    z: polygon.normal(),
    y: pSets[0][0].vector().unit(),
  }
  normals.x = normals.z.crossProduct(normals.y).unit();
  return normals;
}

// This only really makes since for a four sided polygon that has atleast one set of parrelle sides.
Polygon3D.normals = (polygonOs) => {
  if (Array.isArray(polygonOs))
    if (polygonOs.length > 1) return normalsGivinPolygons(polygonOs);
    else polygonOs = polygonOs[0];
  return normalsGivenAPolygon(polygonOs);
}

const addVector = (normals, axis, attr, centerLine) => {
  const vector = centerLine.vector();
  const scalar = vector.dot(normals[attr]);
  if (scalar != 0) {
    const axesVector = normals[attr].scale(scalar);
    const axes = Line3D.fromVector(axesVector);
    axes.centerOn(centerLine.midpoint());
    axis[attr].push(axes);
    return true;
  }
  return false;
}

const centerXYZon = (xyz, center) => (attr) =>
  xyz[attr].centerOn(center) || centerXYZon(xyz, center);

Polygon3D.axis = (polygons, normals) => {
  normals ||= Polygon3D.normals(polygons);
  const axis = {x: [], y: [], z: []};
  const verts = []
  for (let i = 0; i < polygons.length; i++) {
    let poly = polygons[i];
    verts.concatInPlace(poly.vertices());
    const lines = poly.web();
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      addVector(normals, axis, 'x', line);
      addVector(normals, axis, 'y', line);
      addVector(normals, axis, 'z', line);
    }
  }
  axis.x.sortByAttr('length');axis.y.sortByAttr('length');axis.z.sortByAttr('length');
  const org = () => new Line3D(new Vertex3D(), new Vertex3D());
  const min = {x: axis.x[0] || org(), y: axis.y[0] || org(), z: axis.z[0] || org()}
  const max = {x: axis.x[axis.x.length - 1] || org(),
                y: axis.y[axis.y.length - 1] || org(),
                z: axis.z[axis.z.length - 1] || org()}
  axis.x = Line3D.averageLine(axis.x, org());
  axis.y = Line3D.averageLine(axis.y, org());
  axis.z = Line3D.averageLine(axis.z, org());
  const center = Math.midrange(verts, ['x', 'y', 'z']);
  centerXYZon(axis, center)('x')('y')('z');
  centerXYZon(min, center)('x')('y')('z');
  centerXYZon(max, center)('x')('y')('z');
  axis.min = min;
  axis.max = max;
  return axis;
}

Polygon3D.fromIntersections = (intersected, intersectors) => {
  let lines = [];
  const plane = intersected.toPlane();
  const mi = Polygon3D.mostInformation([intersected]);
  const poly2d = intersected.to2D(mi[0], mi[1]);
  for (let index = 0; index < intersectors.length; index++) {
    const polyLines = intersectors[index].lines();
    const verts = [];
    for (let lIndex = 0; lIndex < polyLines.length; lIndex++) {
      const line = polyLines[lIndex];
      const intersect = plane.intersection.line(line);
      if (intersect) {
        if (poly2d.isWithin(intersect.to2D(mi[0], mi[1]))) {
          verts.push(intersect);
        }
      }
    }
    if (verts.length > 1) {
      let biggest = new Line3D(verts[0], verts[1]);
      for (let vIndex = 2; vIndex < verts.length; vIndex++) {
        const vert = verts[vIndex];
        const line1 = biggest.clone();
        line1[0] = vert;
        const line2 = biggest.clone();
        line2[1] = vert;
        if (line1.length() > biggest.length()) biggest = line1;
        if (line2.length() > biggest.length()) biggest = line2;
      }
      lines.push(biggest);
    }
  }
  for (let index = 1; index < lines.length + 1; index++) {
    let prevLine = lines[index - 1];
    const i = index % lines.length;
    let line = lines[i];
    if (index === 1) {
      const ssd = prevLine[0].distance(line[0]);
      const sed = prevLine[0].distance(line[1]);
      const esd = prevLine[1].distance(line[0]);
      const eed = prevLine[1].distance(line[1]);
      const minS = ssd < sed ? ssd : sed;
      const minE = esd < eed ? esd : eed;
      if (minS < minE) prevLine = lines[0] = prevLine.negitive();
    }
    const endVertCloser = prevLine[1].distance(line[1]) <
                          prevLine[1].distance(line[0]);
    if (endVertCloser) line = lines[i] = line.negitive();
    const connected = prevLine[1].equals(line[0]);
    if (!connected) {
      const newL = new Line3D(prevLine[1], line[0]);
      lines = lines.splice(0, i).concat([newL]).concat(lines);
    }
  }
  return new Polygon3D(lines.map(l => l[0]));
}

Object.class.register(Polygon3D);
Polygon3D.toJson = (poly) => {
  return {verts: poly.vertices(), _TYPE: Polygon3D.name};
}
Polygon3D.fromJson = (json) => new Polygon3D(json.verts.map(j => Vertex3D.fromJson(j)));
module.exports = Polygon3D;
