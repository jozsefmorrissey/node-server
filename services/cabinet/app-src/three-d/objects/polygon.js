
const Polygon2D = require('../../two-d/objects/polygon.js');
const Line2D = require('../../two-d/objects/line.js');
const Line3D = require('./line');
const Vertex3D = require('./vertex');
const Vector3D = require('./vector');
const Plane = require('./plane');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');

const CSG = require('../../../public/js/3d-modeling/csg.js');
let lastMi;

class Polygon3D {
  constructor(initialVerticies) {
    let lines = [];
    let map;
    let normal;
    let instance = this;

    function getPlane() {
      let points = this.verticies();
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
      let points = this.verticies();
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
      return normVect.scale(1 / normVect.magnitude());
    }
    this.normal = calcNormal;

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

    this.parrelleAt = (distance) => {
      const normal = this.normal();
      const scaled = normal.scale(distance);
      const verticies = this.verticies();
      for (let index = 0; index < verticies.length; index++) {
        verticies[index].translate(scaled);
      }
      return new Polygon3D(verticies);
    }

    this.verticies = () => {
      if (lines.length === 0) return [];
      const verticies = [];
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        verticies.push(line.startVertex);
      }

      return JSON.clone(verticies);
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

    const tol = .00001;
    this.lineMap = (force) => {
      if (!force && map !== undefined) return map;
      if (lines.length === 0) return {};
      map = new ToleranceMap({'startVertex.x': tol, 'startVertex.y': tol, 'startVertex.z': tol,
                              'endVertex.x': tol, 'endVertex.y': tol, 'endVertex.z': tol});
      let lastEnd;
      if (!lines[0].startVertex.equals(lines[lines.length - 1].endVertex)) throw new Error('Broken Polygon');
      for (let index = 0; index < lines.length; index++) {
        lines[index]._POLY_INDEX = index;
        map.add(lines[index]);
      }
      return map;
    }

    this.copy = () => new Polygon3D(Line3D.verticies(lines));

    this.equals = (other) => {
      if (!(other instanceof Polygon3D)) return false;
      const verts = this.verticies();
      const otherVerts = other.verticies();
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
      const matches = lineMap.matches(line) || lineMap.matches(line.negitive());
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

    this.addVerticies = (list) => {
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
          // if (lines.length > 1 && !(normal instanceof Vector3D)) normal = calcNormal(line, prevLine);
          // else if (lines.length > 2) {
          //   const equal = normal.equals(calcNormal(line, prevLine));
          //   if (equal === false) {
          //     console.log('Trying to add vertex that does not lie in the existing plane');
          //   }
          // }
        }
      }
      if (verts.length > 0 && lines.length > 0) {
        if (endLine) endline.endVertex = verts[0];
      }
      this.lineMap(true);
      this.removeLoops();
    }

    this.rebuild = (newVerticies) => {
      lines = [];
      this.addVerticies(newVerticies);
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
            const posMatch = map.matches(line);
            const negMatch = map.matches(line.negitive());
            if (posMatch.length > 1 || (negMatch && negMatch.length !== 0)) {
              let match = negMatch ? negMatch[0] : posMatch[1];
              const startIndex = line._POLY_INDEX;
              const endIndex = match._POLY_INDEX;
              if (startIndex > endIndex)
              throw new Error('THIS SHOULD NOT HAPPEN!!!!!! WTF!!!!');
              const forwardDiff = endIndex - startIndex;
              const reverseDiff = lines.length - forwardDiff;
              if (Math.max(forwardDiff, reverseDiff) < 3) {
                console.log('che che');
              }
              if (forwardDiff > reverseDiff) {
                lines = lines.slice(startIndex, endIndex);
              } else {
                lines = lines.slice(0, startIndex).concat(lines.slice(endIndex));
              }

              const newVerts = Line3D.verticies(lines);
              this.rebuild(newVerts);
              removed = true;
              break;
            }
          }
        }
        // TODO: not sure if this will cause an issue but polygons should not have less than 3 verticies this will break toPlane functionality.
        // if (lines.length < 3) {
        //   console.log('che che check it out', lines.length);
        // }
        if (removed) this.lineMap(true);
      }
    }

    this.path = () => {
      let path = '';
      this.verticies().forEach((v) => path += `${v.toString()} => `);
      return path.substring(0, path.length - 4);
    }


    this.merge = (other) => {
      if (!this.normal().parrelle(other.normal())) return;
      const thisPlane = this.toPlane();
      const otherPlane = other.toPlane();
      // if (!thisPlane.equivalent(otherPlane)) return;
      const lineMap = this.lineMap();
      const allOtherLines = other.lines();
      let merged;
      for (let index = 0; index < allOtherLines.length; index += 1) {
        const curr = allOtherLines[index];
        let verticies, thisLines, otherLines;
        if (lineMap.matches(curr) !== null) {
          thisLines = this.getLines(curr.startVertex, curr.endVertex, true);
          otherLines = other.getLines(curr.endVertex, curr.startVertex, false);
        } else if (lineMap.matches(curr.negitive()) !== null) {
          thisLines = this.getLines(curr.endVertex, curr.startVertex, false);
          otherLines = other.getLines(curr.startVertex, curr.endVertex, false);
        }

        if (thisLines && otherLines) {
          if (thisLines[0].startVertex.equals(otherLines[0].startVertex))
            thisLines = Line3D.reverse(thisLines);

          const startCheck = thisLines[0].startVertex.equals(otherLines[otherLines.length - 1].endVertex);
          const middleCheck = thisLines[thisLines.length - 1].endVertex.equals(otherLines[0].startVertex);
          if (!(middleCheck && startCheck))
            console.warn('coommmmooon!!!!');
          verticies = Line3D.verticies(otherLines.concat(thisLines));
          merged = new Polygon3D(verticies);
          try {
            merged.normal();
          } catch (e) {
            console.warn('again wtf!!!');
            new Polygon3D(verticies);
            new Polygon3D(verticies);
            new Polygon3D(verticies);
          }
        }
      }

      if (merged) {
        return merged;
      }
    }

    this.viewFromVector = () => Polygon3D.viewFromVector([this])[0];
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

      const verts = this.verticies();
      const verts2D = [];
      for (let index = 0; index < verts.length; index++) {
        verts2D.push({x: verts[index][x], y: verts[index][y]});
      }
      return new Polygon2D(verts2D);
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
      return `Start Verticies: ${startStr.substring(4)}\nEnd   Verticies: ${endStr.substring(4)}`;
    }
    this.addVerticies(initialVerticies);
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
    const verts = poly.verticies();
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

// const include = (axis1, axis2, axis3) => !(Math.abs(axis1) === 1 || Math.abs(axis2) === 1);
// const include = (axis1, axis2, axis3) => axis3 !== 0 && axis1 === 0 && axis2 === 0;
const include = (n1, n2) => ((n1[0] * n2[0]) + (n1[1] * n2[1]) + (n1[2] * n2[2])) !== 0;
const to2D = (mi) => (p) => p.to2D(mi[0],mi[1]);
const defaultNormals = {front: new Vector3D(0,0,-1), right: new Vector3D(-1,0,0), top: new Vector3D(0,-1,0)};
Polygon3D.toTwoD = (polygons, vector, axis) => {
  const view = Polygon3D.viewFromVector(polygons, vector);
  axis ||= Polygon3D.mostInformation(view);
  const twoD = view.map(to2D(axis));
  const twoDlines = Polygon2D.lines(twoD);
  twoDlines.axis = axis;
  return twoDlines;
}

Polygon3D.toThreeView = (polygons, normals, gap) => {
  normals ||= defaultNormals;
  gap ||= 10;
  const frontView = Polygon3D.viewFromVector(polygons, normals.front);
  const rightView = Polygon3D.viewFromVector(polygons, normals.right);
  const topView = Polygon3D.viewFromVector(polygons, normals.top);

  const frontAxis = Polygon3D.mostInformation(frontView);
  const rightAxis = Polygon3D.mostInformation(rightView);
  const topAxis = Polygon3D.mostInformation(topView);

  if (topAxis.indexOf(frontAxis[1]) !== -1) frontAxis.reverse();
  if (topAxis.indexOf(rightAxis[1]) !== -1) rightAxis.reverse();
  if (frontAxis.indexOf(topAxis[1]) !== -1) topAxis.reverse();

  const front2D = frontView.map(to2D(frontAxis));
  const right2D = rightView.map(to2D(rightAxis));
  const top2D = topView.map(to2D(topAxis));

  Polygon2D.centerOn({x:0,y:0}, front2D);

  const frontMinMax = Polygon2D.minMax(...front2D);
  const rightMinMax = Polygon2D.minMax(...right2D);
  const topMinMax = Polygon2D.minMax(...top2D);
  const rightCenterOffset = frontMinMax.max.x() + gap + (rightMinMax.max.x() - rightMinMax.min.x())/2;
  const topCenterOffset = frontMinMax.max.y() + gap + (topMinMax.max.y() - topMinMax.min.y())/2;

  Polygon2D.centerOn({x:rightCenterOffset, y:0}, right2D);
  Polygon2D.centerOn({x:0,y:topCenterOffset}, top2D);

  const front = Polygon2D.lines(front2D);
  const right = Polygon2D.lines(right2D);
  const top = Polygon2D.lines(top2D);

  return {front, right, top}
}

Polygon3D.fromCSG = (polys) => {
  const isArray = Array.isArray(polys);
  if (!isArray) polys = [polys];
  const poly3Ds = [];
  for (let index = 0; index < polys.length; index++) {
    const poly = polys[index];
    const verts = [];
    for (let vIndex = 0; vIndex < poly.vertices.length; vIndex++) {
      const v = poly.vertices[vIndex];
      verts.push(new Vertex3D({x: v.pos.x, y: v.pos.y, z: v.pos.z}));
    }
    poly3Ds.push(new Polygon3D(verts));
  }
  if (!isArray) return poly3Ds[0];
  return poly3Ds;
}

Polygon3D.fromVectorObject =
    (width, height, center, vectorObj) => {
  center ||= new Vertex(0,0,0);
  vectorObj ||= {width: new Vector3D(1,0,0), height: new Vector3D(0,1,0)}
  const hw = width/2;
  const hh = height/2;
  const wV = vectorObj.width;
  const hV = vectorObj.height;
  const vector1 = center.translate(hV.scale(hh), true).translate(wV.scale(-hw));
  const vector2 = center.translate(hV.scale(hh), true).translate(wV.scale(hw));
  const vector3 = center.translate(hV.scale(-hh), true).translate(wV.scale(hw));
  const vector4 = center.translate(hV.scale(-hh), true).translate(wV.scale(-hw));
  return new Polygon3D([vector1, vector2, vector3, vector4]);
}

Polygon3D.fromLines = (lines) => {
  const verts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startVertex.equals(lines[Math.mod(index - 1, lines.length)].endVertex)) throw new Error('Lines must be connected');
    verts.push(lines[index].startVertex);
  }
  return new Polygon3D(verts);
}

Polygon3D.from2D = (polygon2d) => {
  const verts = polygon2d.verticies();
  const initialVerticies = [];
  for (let index = 0; index < verts.length; index++) {
    const vert = verts[index];
    initialVerticies.push(new Vertex3D(vert.x(), vert.y(), 0));
  }
  return new Polygon3D(initialVerticies);
}

Polygon3D.viewFromVector = (polygons, vector) => {
  const orthoPolys = [];
  for (let p = 0; p < polygons.length; p++) {
    const verticies = polygons[p].verticies();
    const orthoVerts = [];
    const vertLocs = {};
    let valid = true;
    for (let v = 0; valid && v < verticies.length; v++) {
      const vertex = verticies[v];
      const u = new Vector3D(vertex.x, vertex.y, vertex.z);
      const projection = u.projectOnTo(vector);
      const orthogonal = new Vertex3D(u.minus(projection));
      const accStr = orthogonal.toString();
      if (vertLocs[accStr]) valid = false;
      else vertLocs[accStr] = true;
      orthoVerts.push(orthogonal);
    }
    if (valid) orthoPolys.push(new Polygon3D(orthoVerts));
  }
  return orthoPolys;
}

module.exports = Polygon3D;
