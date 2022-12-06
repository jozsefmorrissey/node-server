
const Polygon2D = require('../../two-d/objects/polygon.js');
const Line2D = require('../../two-d/objects/line.js');
const Line3D = require('./line');
const Vertex3D = require('./vertex');
const Vector3D = require('./vector');
const approximate = require('../../../../../public/js/utils/approximate.js');

const CSG = require('../../../public/js/3d-modeling/csg.js');

class Polygon3D {
  constructor(initialVerticies) {
    const lines = [];
    let map;
    let normal;
    let instance = this;

    function calcNormal() {
        const points = [lines[0].startVertex, lines[1].startVertex, lines[2].startVertex];
        const vector1 = points[1].minus(points[0]);
        const vector2 = points[2].minus(points[0]);
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

    this.lineMap = (force) => {
      if (!force && map !== undefined) return map;
      if (lines.length === 0) return {};
      map = {};
      let lastEnd;
      if (!lines[0].startVertex.equals(lines[lines.length - 1].endVertex)) throw new Error('Broken Polygon');
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (lastEnd && !line.startVertex.equals(lastEnd)) throw new Error('Broken Polygon');
        lastEnd = line.endVertex;
        map[line.toString()] = line;
      }
      return map;
    }

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
      return lineMap[line.toString()] || lineMap[line.toNegitiveString()];
    }

    this.getLines = (startVertex, endVertex, reverse) => {
      const inc = reverse ? -1 : 1;
      const subSection = [];
      let completed = false;
      const doubleLen = lines.length * 2;
      for (let steps = 0; steps < doubleLen; steps += 1) {
        const index =  (!reverse ? steps : (doubleLen - steps - 1)) % lines.length;
        const curr = lines[index];
        if (subSection.length === 0) {
          if (startVertex.equals(!reverse ? curr.startVertex : curr.endVertex)) {
            subSection.push(!reverse ? curr : curr.negitive());
            if (endVertex.equals(reverse ? curr.startVertex : curr.endVertex)) {
              completed = true;
              break;
            }
          }
        } else {
          subSection.push(!reverse ? curr : curr.negitive());
          if (endVertex.equals(reverse ? curr.startVertex : curr.endVertex)) {
            completed = true;
            break;
          }
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
      this.removeLoops();
      this.lineMap(true);
    }

    this.removeLoops = () => {
      const map = {}
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const key = line.toString();
        const negKey = line.toNegitiveString();
        if (map[key]) {
          lines.splice(map[key].index, index - map[key].index + 1);
        } else if (map[negKey]) {
          lines.splice(map[negKey].index, index - map[negKey].index + 1);
        } else {
          map[key] = {line, index};
        }
      }
    }

    this.path = () => {
      let path = '';
      this.verticies().forEach((v) => path += `${v.toString()} => `);
      return path.substring(0, path.length - 4);
    }

    this.merge = (other) => {
      // if (!this.normal.equals(other.normal)) return;
      const sharedMap = [];
      const inverseMap = [];
      const notShared = [];
      const lineMap = this.lineMap();
      const otherLines = other.lines();
      let merged;
      for (let index = 0; index < otherLines.length; index += 1) {
        const curr = otherLines[index];
        if (lineMap[curr.toString()] !== undefined) {
          let thisLines = this.getLines(curr.startVertex, curr.endVertex, true);
          let otherLines = other.getLines(curr.endVertex, curr.startVertex, false);
          if (thisLines && otherLines) {
            if (thisLines[0].startVertex.equals(otherLines[0].startVertex)) {
              merged = new Polygon3D(Line3D.verticies(thisLines.concat(otherLines.reverse())));
            } else {
              merged = new Polygon3D(Line3D.verticies(thisLines.concat(otherLines)));
            }
          }
        }
        if (lineMap[curr.toNegitiveString()] !== undefined) {
          let thisLines = this.getLines(curr.endVertex, curr.startVertex, true);
          let otherLines = other.getLines(curr.startVertex, curr.endVertex, true);
          if (thisLines[0].startVertex.equals(otherLines[0].startVertex)) {
            merged = new Polygon3D(Line3D.verticies(thisLines.concat(otherLines.reverse())));
          } else {
            merged = new Polygon3D(Line3D.verticies(thisLines.concat(otherLines)));
          }
        }
      }

      if (merged) {
        // merged.removeLoops();
        return merged;
      }
    }

    function mostInformation() {
      const verts = instance.verticies();
      const center = instance.center();
      const diff = {x: 0, y:0, z: 0};
      for(let index = 0; index < verts.length; index++) {
        const v = verts[index];
        diff.x = Math.abs(v.x - center.x);
        diff.y = Math.abs(v.y - center.y);
        diff.z = Math.abs(v.z - center.z);
      }
      return diff.x < diff.y ?
            (diff.x < diff.z ? ['y', 'z'] :
            (diff.z < diff.y ? ['x', 'y'] : ['x', 'z'])) :
            (diff.y < diff.z ? ['x', 'z'] : ['x', 'y']);
    }

    this.to2D = (x, y) => {
      if (!x || !y) {
        const mi = mostInformation();
        x ||= mi[0];
        y ||= mi[1];
      }
      const verts = this.verticies();
      const verts2D = [];
      for (let index = 0; index < verts.length; index++) {
        verts2D.push({x: verts[index][x], y: verts[index][y]});
      }
      return new Polygon2D(verts2D);
    }

    this.toString = () => {
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

Polygon3D.merge = (polygons) => {
  let currIndex = 0;
  while (currIndex < polygons.length - 1) {
    const target = polygons[currIndex];
    for (let index = currIndex + 1; index < polygons.length; index += 1) {
      const other = polygons[index];
      const merged = target.merge(other);
      if (merged) {
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

// const include = (axis1, axis2, axis3) => !(Math.abs(axis1) === 1 || Math.abs(axis2) === 1);
// const include = (axis1, axis2, axis3) => axis3 !== 0 && axis1 === 0 && axis2 === 0;
const include = (n1, n2) => ((n1[0] * n2[0]) + (n1[1] * n2[1]) + (n1[2] * n2[2])) !== 0;
const to2D = (x,y) => (p) => p.to2D(x,y)
Polygon3D.toTwoD = (polygons) => {
  const frontView = Polygon3D.viewFromVector(polygons, polygons.normals.front);
  const leftView = Polygon3D.viewFromVector(polygons, polygons.normals.left);
  const topView = Polygon3D.viewFromVector(polygons, polygons.normals.top);
  const map = {xy: frontView.map(to2D()),
                xz: leftView.map(to2D()),
                yz: topView.map(to2D())};
  return map;
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
    if (valid) orthoPolys.push(new Polygon3D(orthoVerts))
  }
  return orthoPolys;
}

module.exports = Polygon3D;
