const Vertex2d = require('./vertex');
const Line2d = require('./line');

class Polygon2d {
  constructor(initialVertices) {
    let lines = [];
    const instance = this;
    let faceIndecies = [2];
    let map

    this.vertices = (target, before, after) => {
      if (lines.length === 0) return [];
      const fullList = [];
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        fullList.push(line.startVertex());
      }
      if (target) {
        const vertices = [];
        const index = fullList.indexOf(target);
        if (index === undefined) return null;
        vertices = [];
        for (let i = before; i < before + after + 1; i += 1) vertices.push(fullList[i]);
        return vertices;
      } else return fullList;
    }

    this.reverse = () => {
      const verts = instance.vertices();
      for (let index = lines.length - 1; index > -1; index--) {
        const line = lines[index];
        const startVert = index === lines.length - 1 ? verts[0] : verts[index + 1];
        const endVert = verts[index];
        line.startVertex(startVert);
        line.endVertex(endVert);
      }
      lines = lines.reverse();
      faceIndecies.forEach((index, i) => {
          faceIndecies[i] = lines.length - index - 1;
      });
    }

    this.mirrorX = () => {
      const start = this.center().copy();
      const end = start.translate(0, 10, true);
      const mirror = new Line2d(start, end);
      mirror.mirrorX(this.vertices());
    }
    this.mirrorY = () => {
      const start = this.center().copy();
      const end = start.translate(10, 0, true);
      const mirror = new Line2d(start, end);
      const verts = this.vertices();
      mirror.mirrorPoints(verts);
    }

    this.verticesAndMidpoints = (target, before, after) => {
      const verts = this.vertices();
      const both = [];
      for (let index = 0; index < verts.length; index++) {
        const sv = verts[index];
        const ev = verts[index + 1 === verts.length ? 0 : index + 1];
        both.push(sv);
        both.push(Vertex2d.center(sv, ev));
      }
      return both;
    }

    function addNieghborsOfVertexWithinLine(vertex, indicies) {
      const list = [];
      for (let index = 0; index < indicies.length; index++) {
        const i = indicies[index];
        let found = false;
        for (let index = 0; !found && index < lines.length; index++) {
          const line = lines[index];
          if (line.withinSegmentBounds(vertex)) {
            found = true;
            if (i > 0) {
              list.push(instance.neighbors(line.endVertex(), i - 1)[0]);
            } else if (i < 0) {
              list.push(instance.neighbors(line.startVertex(), i + 1)[0]);
            } else {
              list.push(vertex);
            }
          }
        }
        if (!found) list.push(null);
      }
      return list;
    }

    this.neighbors = (vertex,...indicies) => {
      const verts = this.verticesAndMidpoints();
      const targetIndex = verts.equalIndexOf(vertex);
      if (targetIndex !== -1) {
        const list = [];
        for (let index = 0; index < indicies.length; index++) {
          const i = indicies[index];
          const offsetIndex = Math.mod(targetIndex + i, verts.length);
          list.push(verts[offsetIndex]);
        }
        return list;
      }
      return addNieghborsOfVertexWithinLine(vertex, indicies);
    }

    // TODO: this function is rotating should use degrees not theta.
    function positionRelitiveToVertex(vertex, moveTo, externalVertex) {
      const center = instance.center();
      if (moveTo.theta) {
        if (externalVertex) {
          vertex.rotate(moveTo.theta, center);
          throw new Error('is this used?');
        }
        const rotatedPoly = instance.rotate(moveTo.theta, vertex, true);
        const rotatedCenter = rotatedPoly.center();
        const offset = rotatedCenter.differance(vertex);
        return moveTo.center.translate(offset.x(), offset.y(), true);
      }
      const offset = center.differance(vertex);
      return moveTo.center.translate(offset.x(), offset.y(), true);
    }

    function vertexFunction(midpoint) {
      const getVertex = midpoint ? (line) => line.midpoint() : (line) => line.startVertex().copy();
      return (index, moveTo) => {
        const vertex = getVertex(lines[Math.mod(index, lines.length)]);
        if (moveTo === undefined) return vertex;
        return positionRelitiveToVertex(vertex, moveTo);
      }
    }

    this.relativeToExternalVertex = (vertex, moveTo) => positionRelitiveToVertex(vertex, moveTo, true);
    this.vertex = vertexFunction();
    this.midpoint = vertexFunction(true);
    this.point = (index, moveTo) => {
      if (index % 2 === 0) return this.vertex(index/2, moveTo);
      else return this.midpoint((index - 1)/2, moveTo);
    }

    this.midpoints = () => {
      const list = [];
      for (let index = 0; index < lines.length; index++) {
        list.push(this.midpoint(index));
      }
      return list;
    }

    this.radians = (rads) => {
      const currRads = new Line2d(this.center(), this.faces()[0].midpoint()).radians();
      if (Number.isFinite(rads)) {
        const radOffset = rads - currRads;
        this.rotate(radOffset);
        return rads;
      }
      return currRads;
    }
    this.angle = (angle) => Math.toDegrees(this.radians(Math.toRadians(angle)));

    this.faceIndecies = (indicies) => {
      if (indicies) {
        if (indicies.length > 1) console.warn.subtle(500, 'vertex sorting has not been tested for multple faces');
        faceIndecies = [0];
        const i = indicies[0];
        lines = lines.slice(i).concat(lines.slice(0, i));
        for (let index = 1; index < lines.length; index++) {
          const ind = Math.mod(indicies[index] - i, lines.length);
          if (!Number.isNaN(ind)) faceIndecies.push(ind);
        }
      }
      return faceIndecies;
    }
    this.faces = () => this.lines().filter((l, i) => faceIndecies.indexOf(i) !== -1);
    this.normals = () => {
      let normals = [];
      let center = this.center();
      for (let index = 0; index < faceIndecies.length; index++) {
        const line = lines[faceIndecies[index]];
        if (line)
          normals.push(new Line2d(center.copy(), line.midpoint()));
      }
      return normals;
    }

    this.lines = () => lines;
    this.startLine = () => lines[0];
    this.endLine = () => lines[lines.length - 1];
    this.valid = () => lines.length > 2;

    this.lineMap = (force) => {
      if (!force && map !== undefined) return map;
      if (lines.length === 0) return {};
      map = {};
      let lastEnd;
      if (!lines[0].startVertex().equals(lines[lines.length - 1].endVertex())) throw new Error('Broken Polygon');
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (lastEnd && !line.startVertex().equals(lastEnd)) throw new Error('Broken Polygon');
        lastEnd = line.endVertex();
        map[line.toString()] = line;
      }
      return map;
    }

    this.equals = (other) => {
      if (!(other instanceof Polygon2d)) return false;
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
      return lineMap[line.toString()] || lineMap[line.toNegitiveString()];
    }

    this.toDrawString = () => {
      return Line2d.toDrawString(instance.lines()) + '\n' + Line2d.toDrawString(instance.normals(), 'red');
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
          if (startVertex.equals(!reverse ? curr.startVertex() : curr.endVertex())) {
            subSection.push(!reverse ? curr : curr.negitive());
            if (endVertex.equals(reverse ? curr.startVertex() : curr.endVertex())) {
              completed = true;
              break;
            }
          }
        } else {
          subSection.push(!reverse ? curr : curr.negitive());
          if (endVertex.equals(reverse ? curr.startVertex() : curr.endVertex())) {
            completed = true;
            break;
          }
        }
      }
      if (completed) return subSection;
    }

    this.translate = (xDiff, yDiff) => {
      for (let index = 0; index < lines.length; index++) {
        lines[index].startVertex().translate(xDiff, yDiff);
      }
    }

    this.center = (center) => {
      const curr = Vertex2d.center(...this.vertices());
      if (center !== undefined) {
        const diff = center.differance(curr);
        this.translate(diff.x(), diff.y());
      }
      return Vertex2d.center(...this.vertices());
    }

    this.rotate = (theta, pivot, doNotModify) => {
      pivot ||= this.center();
      const poly = doNotModify ? this.copy() : this;
      if (doNotModify) return this.copy().rotate(theta, pivot);
      for (let index = 0; index < lines.length; index++) {
        lines[index].startVertex().rotate(theta, pivot);
      }
      return this;
    }

    this.centerOn = (newCenter) => {
      if (newCenter) {
        newCenter = new Vertex2d(newCenter);
        const center = this.center();
        const diff = newCenter.copy().differance(center);
        this.translate(diff.x(), diff.y());
      }
    }

    this.addVertices = (list) => {
      if (list === undefined) return;
      const verts = [];
      const endLine = this.endLine();
      for (let index = 0; index < list.length + 1; index += 1) {
        if (index < list.length) verts[index] = new Vertex2d(list[index]);
        if (index > 0) {
          const startVertex = verts[index - 1];
          const endVertex = verts[index] || this.startLine().startVertex();
          const line = new Line2d(startVertex, endVertex);
          lines.push(line);
        }
      }
      if (verts.length > 0 && lines.length > 0) {
        if (endLine) endline.endVertex(verts[0]);
      }
      // this.removeLoops();
      this.lineMap(true);
    }

    this.addBest = (lineList) => {
      if (lineList.length > 100) throw new Error('This algorythum is slow: you should either find a way to speed it up or use a different method');
      const lastLine = lines[lines.length - 2];
      const endVert = lastLine.endVertex();
      lineList.sort(Line2d.distanceSort(endVert));
      const nextLine = lineList[0].acquiescent(lastLine);
      const connectLine = new Line2d(endVert, nextLine.startVertex());
      endVert.translate(connectLine.run()/2, connectLine.rise()/2);
      lines.splice(lines.length - 1, 1);
      const newLastLine = new Line2d(endVert, nextLine.endVertex());
      const newConnectLine = new Line2d(nextLine.endVertex(), lines[0].startVertex());
      lines.push(newLastLine);
      if (!newConnectLine.isPoint()) lines.push(newConnectLine);
      lineList.splice(0,1);
    }

    this.path = (offset) => {
      offset ||= 0;
      let path = '';
      const verts = this.vertices();
      for (let index = 0; index < verts.length; index++) {
        const i = Math.mod(index + offset, verts.length);
        path += `${verts[i].toString()} => `
      }
      return path.substring(0, path.length - 4);
    }

    this.toString = this.path;
    this.area = () => {
      let total = 0;
      let verts = this.vertices();
      for (var i = 0, l = verts.length; i < l; i++) {
        var addX = verts[i].x();
        var addY = verts[i == verts.length - 1 ? 0 : i + 1].y();
        var subX = verts[i == verts.length - 1 ? 0 : i + 1].x();
        var subY = verts[i].y();

        total += (addX * addY * 0.5);
        total -= (subX * subY * 0.5);
      }

      return Math.abs(total);
    }

    this.clockWise = () => {
      let sum = 0;
      for (let index = 0; index < lines.length; index++) {
        const l = lines[index];
        sum += (l.endVertex().x() - l.startVertex().x()) * (l.endVertex().y() + l.startVertex().y());
      }
      return sum >= 0;
    }

    function ensure(antiClockWise) {
      if (instance.clockWise() === !antiClockWise) return;
      instance.reverse();
    }
    this.ensureClockWise = () => ensure();
    this.ensureAntiClockWise = () => ensure(true);

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

    this.copy = () => {
      const copy = new Polygon2d(this.vertices().map((v) => v.copy()));
      copy.faceIndecies(this.faceIndecies());
      return copy;
    }

    this.addVertices(initialVertices);
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

Polygon2d.build = (lines) => {
  const start = lines[0].startVertex().copy();
  const end = lines[0].endVertex().copy();
  lines.splice(0, 1);
  const poly = new Polygon2d([start, end]);
  while (lines.length > 0) {
    poly.addBest(lines);
  }
  return poly;
}

Polygon2d.fromLines = (lines) => {
  if (lines === undefined || lines.length === 0) return null;
  let lastLine = lines[0];
  const verts = [lastLine.startVertex()];
  for (let index = 1; index < lines.length; index++) {
    let line = lines[index].acquiescent(lastLine);
    if (!line.startVertex().equals(verts[verts.length - 1])) {
      verts.push(line.startVertex());
    }
    if (!line.endVertex().equals(verts[verts.length - 1])) {
      if (index !== lines.length - 1 || !line.endVertex().equals(verts[0]))
        verts.push(line.endVertex());
    }
    lastLine = line;
  }
  return new Polygon2d(verts);
}

Polygon2d.minMax = (...polys) => {
  const centers = [];
  const max = new Vertex2d(Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER);
  const min = new Vertex2d(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  for (let index = 0; index < polys.length; index += 1) {
    const verts = polys[index].vertices();
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
  const consolidated = Line2d.consolidate(...lines);
  if (consolidated.length !== Line2d.consolidate(...consolidated).length) {
    console.error.subtle('Line Consolidation malfunction');
  }
  return consolidated;
}



const vertRegStr = "\\(([0-9]*(\\.[0-9]*|))\\s*,\\s*([0-9]*(\\.[0-9]*|))\\)";
const vertReg = new RegExp(vertRegStr);
const vertRegG = new RegExp(vertRegStr, 'g');

Polygon2d.fromString = (str) => {
  const vertStrs = str.match(vertRegG);
  const verts = vertStrs.map((str) => {
    const match = str.match(vertReg);
    return new Vertex2d(Number.parseFloat(match[1]), Number.parseFloat(match[3]));
  });
  return new Polygon2d(verts);
}

const tol = .1;
Polygon2d.toParimeter = (lines, recurseObj) => {
  if (lines.length < 2) throw new Error('Not enough lines to create a parimeter');
  let lineMap, splitMap, parimeter;
  if (recurseObj) {
    lineMap = recurseObj.lineMap;
    splitMap = recurseObj.splitMap;
    parimeter = recurseObj.parimeter;
  } else {
    lineMap = Line2d.toleranceMap(tol, true, lines);
    const center = Vertex2d.center(Line2d.vertices(lines));
    const isolate = Line2d.isolateFurthestLine(center, lines);
    splitMap = Vertex2d.toleranceMap();
    // splitMap.add(isolate.line.startVertex());
    parimeter = [isolate.line];
  }
  parimeter.slice(1).forEach((l) => {
    if (splitMap.matches(l.startVertex()).length === 0)
      throw new Error('wtf');
  });
  if (parimeter.length > lines.length) return null;
  const sv = parimeter[0].startVertex();
  const ev = parimeter[parimeter.length - 1].endVertex();
  const alreadyVisitedStart = splitMap.matches(sv).length !== 0;
  const alreadyVisitedEnd = splitMap.matches(ev).length !== 0;
  if (alreadyVisitedEnd || alreadyVisitedStart) return null;
  const madeItAround = parimeter.length > 1 && sv.equals(ev);
  if (madeItAround) return Polygon2d.fromLines(parimeter);

  const startLine = parimeter[0];
  const partialParimeters = []
  const lastLine = parimeter[parimeter.length - 1];
  let matches = lineMap.matches(lastLine.negitive());
  if (matches.length < 2) {
    if (parimeter.length === 1) {
      lines.remove(lastLine);
      return Polygon2d.toParimeter(lines);
    } else return null;
  }
    // throw new Error('A parimeter must exist between lines for function to work');
  for (let index = 0; index < matches.length; index++) {
    if (splitMap.matches(matches[index].endVertex()).length === 0) {
      const newParim = Array.from(parimeter).concat(matches[index]);
      const newSplitMap = splitMap.clone();
      newSplitMap.add(matches[index].startVertex());
      partialParimeters.push({parimeter: newParim, splitMap: newSplitMap, lineMap});
    }
  }

  let biggest = null;
  for (let index = 0; index < partialParimeters.length; index ++) {
    const recObj = partialParimeters[index];
    const searchResult = Polygon2d.toParimeter(lines, recObj);
    if (biggest === null || (searchResult !== null && biggest.area() < searchResult.area()))
      biggest = searchResult;
  }
  if (recurseObj === undefined)
    biggest = biggest.clockWise() ? biggest : new Polygon2d(biggest.vertices().reverse());
  return biggest;
}


new Polygon2d();
module.exports = Polygon2d;
