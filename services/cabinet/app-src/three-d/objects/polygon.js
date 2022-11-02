
const Polygon2D = require('../../two-d/objects/polygon.js');
const Line2D = require('../../two-d/objects/line.js');
const Line3D = require('./line');
const Vertex3D = require('./vertex');
const Vector3D = require('./vector');

const CSG = require('../../../public/js/3d-modeling/csg.js');

class Polygon3D {
  constructor(initialVerticies) {
    const lines = [];
    let map;
    let normal;
    this.normal = () => normal;

    function calcNormal(l1, l2) {
      return l1.vector().dot(l2.vector());
    }

    this.perpendicular = (poly) => {
      if (normal === undefined || poly.normal() === undefined) return false;
      return normal.perpendicular(poly.normal());
    }
    this.inXY = () => this.perpendicular(xyPoly);
    this.inYZ = () => this.perpendicular(yzPoly);
    this.inXZ = () => this.perpendicular(xzPoly);

    this.parrelle = (poly) => {
      if (normal === undefined || poly.normal() === undefined) return false;
      return normal.parrelle(poly.normal());
    }

    this.verticies = () => {
      if (lines.length === 0) return [];
      const verticies = [];
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        verticies.push(line.startVertex);
      }

      return verticies;
    }

    this.lines = () => lines;
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
          if (lines.length > 1 && !(normal instanceof Vector3D)) normal = calcNormal(line, prevLine);
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

const xyPoly = new Polygon3D([[1,1,0],[1,2,0],[2,1,0]]);
const yzPoly = new Polygon3D([[1,0,1],[1,0,2],[2,0,1]]);
const xzPoly = new Polygon3D([[0,1,1],[0,1,2],[0,2,1]]);

// const include = (axis1, axis2, axis3) => !(Math.abs(axis1) === 1 || Math.abs(axis2) === 1);
// const include = (axis1, axis2, axis3) => axis3 !== 0 && axis1 === 0 && axis2 === 0;
const include = (n1, n2) => ((n1[0] * n2[0]) + (n1[1] * n2[1]) + (n1[2] * n2[2])) !== 0;
Polygon3D.toTwoD = (polygons) => {
  const map = {xy: [], xz: [], zy: []};
  for (let index = 0; index < polygons.length; index += 1) {
    const poly = polygons[index];
    const norm = poly.normal();
    const includeXY = poly.inXY();//include(norm, [0,0,1]);//include(norm[0], norm[1], norm[2]);
    const includeXZ = poly.inXZ();//include(norm, [0,1,0]);//include(norm[0], norm[2], norm[1]);
    const includeZY = poly.inYZ();//include(norm, [1,0,0]);//include(norm[2], norm[1], norm[0]);
    const indexXY = map.xy.length;
    const indexXZ = map.xz.length;
    const indexZY = map.zy.length;
    if (includeXY) map.xy[indexXY] = [];
    if (includeXZ) map.xz[indexXZ] = [];
    if (includeZY) map.zy[indexZY] = [];
    poly.verticies().forEach((vertex) => {
      if (includeXY) map.xy[indexXY].push({x: vertex.x, y: -1 * vertex.y, layer: vertex.z});
      if (includeXZ) map.xz[indexXZ].push({x: vertex.x, y: -1 * vertex.z, layer: vertex.y});
      if (includeZY) map.zy[indexZY].push({x: -1 * vertex.z, y: -1 * vertex.y, layer: vertex.x});
    });
    if (includeXY) map.xy[indexXY] = new Polygon2D(map.xy[indexXY]);
    if (includeXZ) map.xz[indexXZ] = new Polygon2D(map.xz[indexXZ]);
    if (includeZY) map.zy[indexZY] = new Polygon2D(map.zy[indexZY]);
  }
  return map;
}

module.exports = Polygon3D;
