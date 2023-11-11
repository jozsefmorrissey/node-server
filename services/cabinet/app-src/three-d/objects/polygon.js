
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
        const sv = line.startVertex;
        const mp = line.midpoint();
        place(sv, noZeros, oneZero, twoZeros, origin);
        place(mp, noZeros, oneZero, twoZeros, origin);
      }
      return noZeros.concat(oneZero).concat(twoZeros).concat(origin);
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
        lines[index].startVertex.rotate(rotations, center);
      }
    }

    function calcNormal() {
      let points = this.vertices();
      let vector1, vector2;
      let parrelle = true;
      let index = 0;
      while (parrelle && index < points.length - 2) {
        vector1 = points[index + 1].minus(points[index])
        vector2 = points[index + 2].minus(points[index]);
        parrelle = vector1.parrelle(vector2);
        index++;
      }
      if (parrelle)
        throw new Error('InvalidPolygon: points are in a line');

      const normVect = vector1.crossProduct(vector2);
      const mag = normVect.magnitude();
      if (mag === 0) throw new Error('InvalidPolygon: normal vector magnitude === 0');
      return normVect.scale(1 / mag);
    }
    this.normal = calcNormal;

    this.valid = () => {
      try {
        this.normal();
        return true;
      } catch (e) {
        return false;
      }
    }

    this.translate = (vector) => {
      const verts = [];
      for (let index = 0; index < lines.length; index++) {
        verts.push(lines[index].startVertex.translate(vector, true));
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
      const normal = this.normal();
      if (normal === undefined || poly.normal() === undefined) return false;
      return normal.parrelle(poly.normal());
    }

    this.offset = (left, right, up, down) => {
      lines[0].adjustLength(left - lines[0].length(), false);
      lines[0].adjustLength(lines[0].length() - right, true);
      lines[2].adjustLength(lines[2].length() - left, true);
      lines[2].adjustLength(right - lines[2].length(), false);

      lines[1].adjustLength(up - lines[1].length(), false);
      lines[1].adjustLength(lines[1].length() - down, true);
      lines[3].adjustLength(lines[3].length() - up, true);
      lines[3].adjustLength(down - lines[3].length(), false);
    }

    this.resize = (width, height) => {
      lines[0].adjustLength(width);
      lines[2].adjustLength(width);

      lines[1].adjustLength(height);
      lines[3].adjustLength(height);
    }

    this.scale = (width, height) => {
      lines[0].adjustLength(lines[0].length()*width);
      lines[2].adjustLength(lines[2].length()*width);

      lines[1].adjustLength(lines[1].length()*height);
      lines[3].adjustLength(lines[3].length()*height);
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
        vertices.push(line.startVertex);
      }

      return JSON.clone(vertices);
    }

    this.vertex = (index) => lines[Math.mod(index, lines.length)].startVertex.copy();

    this.isClockwise = () => {
      let sum = 0;
      for (let index = 0; index < lines.length; index += 1) {
        const point1 = lines[index].startVertex;
        const point2 = lines[index].startVertex;
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
      // map = new ToleranceMap({'startVertex.x': tol, 'startVertex.y': tol, 'startVertex.z': tol,
      //                         'endVertex.x': tol, 'endVertex.y': tol, 'endVertex.z': tol});
      map = new ToleranceMap({'vector.unit.i': tol, 'vector.unit.j': tol, 'vector.unit.k': tol});

      let lastEnd;
      if (!lines[0].startVertex.equals(lines[lines.length - 1].endVertex)) throw new Error('Broken Polygon');
      for (let index = 0; index < lines.length; index++) {
        lines[index]._POLY_INDEX = index;
        map.add(lines[index]);
      }
      return map;
    }

    this.copy = () => new Polygon3D(Line3D.vertices(lines, false));

    this.equals = (other) => {
      if (!(other instanceof Polygon3D)) return false;
      const verts = this.vertices();
      const otherVerts = other.vertices();
      if (verts.length !== otherVerts.length) return false;
      let otherIndex = undefined;
      let direction;
      for (let index = 0; index < verts.length * 2; index += 1) {
        const vIndex = index % verts.length;
        if (otherIndex === undefined) {
          if (index > verts.length) {
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
        verts.push(lines[index].startVertex);
      }
      return Vertex3D.center(verts);
    }

    this.addVertices = (list) => {
      if (list === undefined) return;
      const verts = [];
      const endLine = this.endLine();
      for (let index = 0; index < list.length + 1; index += 1) {
        if (index < list.length) verts[index] = new Vertex3D(list[index]);
        if (index === 0 && endLine) endLine.endVertex = verts[0];
        else if (index > 0) {
          const startVertex = verts[index - 1];
          const endVertex = verts[index] || this.startLine().startVertex;
          const line = new Line3D(startVertex, endVertex);
          lines.push(line);
          const prevLine = lines[lines.length - 2];
          // TODO: This is a plane conformity check... Could be useful if it could detect errors accruatly.
          // if (lines.length > 1 && !(normal instanceof Vector3D)) normal = calcNormal(line, prevLine);
          // else if (lines.length > 2) {
          //   const equal = normal.equals(calcNormal(line, prevLine));
          //   if (equal === false) {
          //     console.warn('Trying to add vertex that does not lie in the existing plane');
          //   }
          // }
        }
      }
      if (verts.length > 0 && lines.length > 0) {
        if (endLine) endline.endVertex = verts[0];
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
        // TODO: not sure if this will cause an issue but polygons should not have less than 3 vertices this will break toPlane functionality.
        // if (lines.length < 3) {
        //   console.warn('che che check it out', lines.length);
        // }
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
              lines[afterIndex] = new Line3D(line.startVertex.clone(), after.endVertex.clone());
              lines.splice(index--, 1);
            }
          } else if (unitVec.equals(afterVec)) {
            lines[afterIndex] = new Line3D(line.startVertex.clone(), after.endVertex.clone());
            lines.splice(index--, 1);
          }
        }
      }
      return lines;
    }

    const minVertDist = (tar, line) => {
      const dist1 = tar.startVertex.distance(line.startVertex);
      const dist2 = tar.startVertex.distance(line.endVertex);
      return dist1 <  dist2 ? dist1 : dist2;
    }

    this.distance = (other) => {
      let overlaps = false;
      const normal = this.normal();
      const thisView = this.viewFromVector(normal);
      const otherView = other.viewFromVector(normal);
      const thisVVerts = otherView.vertices();
      const otherVVerts = other.vertices();
      for (let index = 0; !overlaps && index < thisVVerts.length; index++) {
        overlaps = otherView.isWithin2d(thisVVerts[index], false, 'x', 'y');
      }
      for (let index = 0; !overlaps && index < otherVVerts.length; index++) {
        overlaps = thisView.isWithin2d(otherVVerts[index], false, 'x', 'y');
      }
      if (overlaps) {
        const center = this.center();
        const line = new Line3D(center.clone(), center.clone().translate(normal));
        const intersection = other.toPlane().intersection.line(line);
        return new Line3D(center, intersection).length();
      } else {
        const thisVerts = this.vertices();
        const otherVerts = other.vertices();
        let minDistance = Number.MAX_SAFE_INTEGER;
        for (let index = 0; index < thisVerts.length; index++) {
          for (let odex = 0; odex < otherVerts.length; odex++) {
             const dist = thisVerts[index].distance(otherVerts[odex]);
             if (dist < minDistance) minDistance = dist;
          }
        }
        return minDistance;
      }
    }

    this.merge = (other) => {
      if (!this.normal().parrelle(other.normal())) return;
      const thisPlane = this.toPlane();
      const otherPlane = other.toPlane();
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
              let thisLines = this.getLines(target.startVertex, target.endVertex);
              if (!line1.isPoint()) {
                if (!line1.startVertex.equals(thisLines[thisLines.length - 1].endVertex)) line1 = line1.negitive();
                thisLines.push(line1);
              }
              if (!line2.isPoint()) {
                if (!line2.endVertex.equals(thisLines[0].startVertex)) line2 = line2.negitive();
                thisLines = [line2].concat(thisLines);
              }
              let otherLines = other.getLines(curr.startVertex, curr.endVertex);
              if (otherLines[0].startVertex.equals(thisLines[0].startVertex)) otherLines = Line3D.reverse(otherLines);
              const startCheck = thisLines[0].startVertex.equals(otherLines[otherLines.length - 1].endVertex);
              const middleCheck = thisLines[thisLines.length - 1].endVertex.equals(otherLines[0].startVertex);
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
    this.mostInformation = () => Polygon3D.mostInformation([this])[0];

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

    this.isWithin2d = (vertex, exclusive, x, y) => {
      if (x === undefined || y === undefined) {
        const mi = Polygon3D.mostInformation([this]);
        x = mi[0]; y = mi[1];
      }
      const poly2d = this.to2D(x, y);
      const vert2d = vertex.to2D(x, y);
      return poly2d.isWithin(vert2d, exclusive);
    }

    this.intersection = {};
    this.intersection.line = (line, exclusive) => {
      const planeIntersection = this.toPlane().intersection.line(line);
      if (!planeIntersection) return null;
      const ortho = this.viewFromVector(line.vector());
      const interView = planeIntersection.viewFromVector(line.vector())[0];
      if (ortho.isWithin2d(interView, exclusive, 'x', 'y')) return planeIntersection;
      return null;
    }

    this.toString = () => {
      let str = '';
      for (let index = 0; index < lines.length; index++) {
        str += ` => ${lines[index].startVertex.toString()}`;
      }
      return `${str.substring(4)} normal: ${this.normal()}`;
    }


    this.toDetailString = () => {
      let startStr = '';
      let endStr = '';
      for (let index = 0; index < lines.length; index++) {
        startStr += ` => ${lines[index].startVertex.toString()}`;
        endStr += ` => ${lines[Math.mod(index - 1, lines.length)].endVertex.toString()}`;
      }
      return `Start Vertices: ${startStr.substring(4)}\nEnd   Vertices: ${endStr.substring(4)}`;
    }
    this.addVertices(initialVertices);
  }
}

function printMerge(target, other, merged) {
  console.log(`target: ${target.toString()}`);
  console.log(`other: ${other.toString()}`);
  console.log(`merged: ${merged.toString()}`);
  target.merge(other);
}

let doIt = false;
Polygon3D.merge = (polygons) => {
  let currIndex = 0;
  while (currIndex < polygons.length - 1) {
    const target = polygons[currIndex];
    for (let index = currIndex + 1; index < polygons.length; index += 1) {
      const other = polygons[index];
      const merged = target.merge(other);
      if (merged) {
        if (doIt) printMerge(target, other, merged);
        polygons[currIndex--] = merged;
        polygons.splice(index, 1);
        break;
      }
    }
    currIndex++;
  }
}

const xyPoly = new Polygon3D([[1,10,0],[11,2,0],[22,1,0]]);
const yzPoly = new Polygon3D([[6,0,1],[10,0,27],[2,0,11]]);
const xzPoly = new Polygon3D([[0,11,13],[0,12,23],[0,22,3]]);

Polygon3D.mostInformation = (polygons) => {
  const diff = {x: 0, y:0, z: 0};
  for (let pIndex = 0; pIndex < polygons.length; pIndex++) {
    const poly = polygons[pIndex];
    const verts = poly.vertices();
    const center = poly.center();
    for(let index = 0; index < verts.length; index++) {
      const v = verts[index];
      diff.x += Math.abs(v.x - center.x);
      diff.y += Math.abs(v.y - center.y);
      diff.z += Math.abs(v.z - center.z);
    }
  }
  return diff.x < diff.y ?
        (diff.x < diff.z ? ['y', 'z'] :
        (diff.z < diff.y ? ['x', 'y'] : ['x', 'z'])) :
        (diff.y < diff.z ? ['x', 'z'] : ['x', 'y']);
}

Polygon3D.lines2d = (polygons, x, y) => {
  Polygon3D.merge(polygons);
  let lines = [];
  polygons.map(p => p.to2D('x', 'y')).forEach(p => lines.concatInPlace(p.lines()));
  return Line2d.consolidate(...lines);
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
  const groups = tolmap.group();
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
    const poly = polys[index];
    const verts = [];
    try {
      for (let vIndex = 0; vIndex < poly.vertices.length; vIndex++) {
        const v = poly.vertices[vIndex];
        verts.push(new Vertex3D({x: v.pos.x, y: v.pos.y, z: v.pos.z}));
      }
      poly3Ds.push(new Polygon3D(verts));
    } catch {
      console.warn('Error converting CSG polygon:\n\t', 'poly.toString()')
    }
  }
  if (!isArray) return poly3Ds[0];
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
  const radialLine = new Line3D(center, lines[0].startVertex);
  const normalVector = radialLine.vector().crossProduct(new Line3D(center, lines[0].endVertex).vector());
  Line3D.radialSort(lines, center, normalVector);
  const verts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const nextLine = lines[index];
    const targetLine = lines[Math.mod(index - 1, lines.length)];
    if (!nextLine.startVertex.equals(targetLine.endVertex)) {
      verts.push(targetLine.endVertex);
    }
    verts.push(nextLine.startVertex);
  }
  return new Polygon3D(verts);
}

Polygon3D.from2D = (polygon2d) => {
  const verts = polygon2d.vertices();
  const initialVertices = [];
  for (let index = 0; index < verts.length; index++) {
    const vert = verts[index];
    initialVertices.push(new Vertex3D(vert.x(), vert.y(), 0));
  }
  return new Polygon3D(initialVertices);
}

const randValue = () => Math.random() > .5 ? Math.random() * 200000 - 100000 : 0;
for (let index = 0; index < 10000; index++) {
  const vector = new Vector3D(randValue(), randValue(), randValue());
}

Polygon3D.viewFromVector = (polygons, vector) => {
  const orthoPolys = [];
  for (let p = 0; p < polygons.length; p++) {
    const vertices = polygons[p].vertices();
    const orthoVerts = Vertex3D.viewFromVector(vertices, vector);
    orthoPolys.push(new Polygon3D(orthoVerts));
  }
  return orthoPolys;
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
        line1.startVertex = vert;
        const line2 = biggest.clone();
        line2.endVertex = vert;
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
      const ssd = prevLine.startVertex.distance(line.startVertex);
      const sed = prevLine.startVertex.distance(line.endVertex);
      const esd = prevLine.endVertex.distance(line.startVertex);
      const eed = prevLine.endVertex.distance(line.endVertex);
      const minS = ssd < sed ? ssd : sed;
      const minE = esd < eed ? esd : eed;
      if (minS < minE) prevLine = lines[0] = prevLine.negitive();
    }
    const endVertCloser = prevLine.endVertex.distance(line.endVertex) <
                          prevLine.endVertex.distance(line.startVertex);
    if (endVertCloser) line = lines[i] = line.negitive();
    const connected = prevLine.endVertex.equals(line.startVertex);
    if (!connected) {
      const newL = new Line3D(prevLine.endVertex, line.startVertex);
      lines = lines.splice(0, i).concat([newL]).concat(lines);
    }
  }
  return new Polygon3D(lines.map(l => l.startVertex));
}

module.exports = Polygon3D;
