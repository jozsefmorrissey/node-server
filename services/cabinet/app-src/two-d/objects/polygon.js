const Vertex2d = require('./vertex');
const Line2d = require('./line');

class Polygon2d {
  constructor(initialVerticies) {
    const lines = [];
    let map;

    this.verticies = (target, before, after) => {
      if (lines.length === 0) return [];
      const fullList = [];
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        fullList.push(line.startVertex());
      }
      if (target) {
        const verticies = [];
        const index = fullList.indexOf(target);
        if (index === undefined) return null;
        verticies = [];
        for (let i = before; i < before + after + 1; i += 1) verticies.push(fullList[i]);
        return verticies;
      } else return fullList;

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
      if (!lines[0].startVertex().equal(lines[lines.length - 1].endVertex())) throw new Error('Broken Polygon');
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (lastEnd && !line.startVertex().equal(lastEnd)) throw new Error('Broken Polygon');
        lastEnd = line.endVertex();
        map[line.toString()] = line;
      }
      return map;
    }

    this.equal = (other) => {
      if (!(other instanceof Polygon2d)) return false;
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
          } if(verts[index].equal(otherVerts[0])) {
            otherIndex = otherVerts.length * 2;
          }
        } else if (otherIndex === otherVerts.length * 2) {
          if (verts[vIndex].equal(otherVerts[1])) direction = 1;
          else if(verts[vIndex].equal(otherVerts[otherVerts.length - 1])) direction = -1;
          else return false;
          otherIndex += direction * 2;
        } else if (!verts[vIndex].equal(otherVerts[otherIndex % otherVerts.length])) {
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
          if (startVertex.equal(!reverse ? curr.startVertex() : curr.endVertex())) {
            subSection.push(!reverse ? curr : curr.negitive());
            if (endVertex.equal(reverse ? curr.startVertex() : curr.endVertex())) {
              completed = true;
              break;
            }
          }
        } else {
          subSection.push(!reverse ? curr : curr.negitive());
          if (endVertex.equal(reverse ? curr.startVertex() : curr.endVertex())) {
            completed = true;
            break;
          }
        }
      }
      if (completed) return subSection;
    }

    this.center = () => Vertex2d.center(...this.verticies());

    this.translate = (xDiff, yDiff) => {
      for (let index = 0; index < lines.length; index++) {
        lines[index].startVertex().translate(xDiff, yDiff);
      }
    }

    this.centerOn = (newCenter) => {
      newCenter = new Vertex2d(newCenter);
      const center = this.center();
      const diff = newCenter.copy().differance(center);
      this.translate(diff.x(), diff.y());
    }

    this.addVerticies = (list) => {
      if (list === undefined) return;
      if ((lines.length === 0) && list.length < 3) return;//console.error('A Polygon Must be initialized with 3 verticies');
      const verts = [];
      const endLine = this.endLine();
      for (let index = 0; index < list.length + 1; index += 1) {
        if (index < list.length) verts[index] = new Vertex2d(list[index]);
        if (index === 0 && endLine) endLine.endVertex() = verts[0];
        else if (index > 0) {
          const startVertex = verts[index - 1];
          const endVertex = verts[index] || this.startLine().startVertex();
          const line = new Line2d(startVertex, endVertex);
          lines.push(line);
        }
      }
      if (verts.length > 0 && lines.length > 0) {
        if (endLine) endline.endVertex() = verts[0];
      }
      // this.removeLoops();
      this.lineMap(true);
    }

    this.path = () => {
      let path = '';
      this.verticies().forEach((v) => path += `${v.toString()} => `);
      return path.substring(0, path.length - 4);
    }

    this.toString = this.path;

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

    this.addVerticies(initialVerticies);
  }
}

Polygon2d.centerOn = (newCenter, polys) => {
  newCenter = new Vertex2d(newCenter);
  const center = Polygon2d.center(...polys);
  const diff = newCenter.copy().differance(center);
  for (let index = 0; index < polys.length; index++) {
    const poly = polys[index];
    poly.translate(diff.x(), diff.y());
  }
}

Polygon2d.minMax = (...polys) => {
  const centers = [];
  const max = new Vertex2d(Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER);
  const min = new Vertex2d(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  for (let index = 0; index < polys.length; index += 1) {
    const verts = polys[index].verticies();
    for (let vIndex = 0; vIndex < verts.length; vIndex++) {
      const vert = verts[vIndex];
      if (max.x() < vert.x()) max.x(vert.x());
      if (max.y() < vert.y()) max.y(vert.y());
      if (min.x() > vert.x()) min.x(vert.x());
      if (min.y() > vert.y()) min.y(vert.y());
    }
  }
  return {min, max};
}

Polygon2d.center = (...polys) => {
  const minMax = Polygon2d.minMax(...polys);
  return Vertex2d.center(minMax.min, minMax.max);
}

Polygon2d.lines = (...polys) => {
  if (Array.isArray(polys[0])) polys = polys[0];
  let lines = [];
  for (let index = 0; index < polys.length; index += 1) {
    lines = lines.concat(polys[index].lines());
  }
  // return lines;
  const consolidated = Line2d.consolidate(...Line2d.consolidate(...lines));
  if (consolidated.length !== Line2d.consolidate(...consolidated).length) {
    console.error.subtle('Line Consolidation malfunction');
  }
  return consolidated;
}

Polygon2d.outline = (lines, searchLineCount) => {
  searchLineCount ||= 16;
  const center = Vertex2d.center(Line2d.vertices(lines));
  const offset = (2 * Math.PI) / searchLineCount;
  const parremeter = [];
  let radians = -Math.PI;
  let lastLine;
  for (let index = 0; index < searchLineCount; index++) {
    const radial = Line2d.startAndTheta(center, radians, 1000000);
    let max;
    for (let lIndex = 0; lIndex < lines.length; lIndex++) {
      let line = lines[lIndex];
      if (lastLine && lastLine.endVertex().distance(line.endVertex()) <
          lastLine.endVertex().distance(line.startVertex())) {
        line = line.negitive();
      }
      const intersection = line.findSegmentIntersection(radial, true);
      if (intersection) {
        const distance = intersection.distance(center);
        if (max === undefined || max.distance < distance) {
          max = {line, distance};
        }
      }
    }
    if ((!lastLine && max) || (max && !max.line.equals(lastLine))) {
      lastLine = max.line;
      parremeter.push(lastLine);
    }
    radians += offset;
  }
  const verts = [parremeter[0].startVertex()];
  let lastParremterLine;
  for (let index = 0; index < parremeter.length; index++) {
    const line = parremeter[index];
    if (!line.equals(lastParremterLine)) {
      if (!line.startVertex().equal(verts[verts.length - 1])) {
        verts.push(line.startVertex());
      }
      if (!line.endVertex().equal(verts[verts.length - 1])) {
        verts.push(line.endVertex());
      }
    }
    lastParremterLine = line;
  }
  return new Polygon2d(verts);
}

new Polygon2d();
module.exports = Polygon2d;
