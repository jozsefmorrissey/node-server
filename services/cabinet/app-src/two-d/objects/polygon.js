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

Polygon2d.center = (...polys) => {
  const centers = [];
  for (let index = 0; index < polys.length; index += 1) {
    centers.push(polys[index].center());
  }
  return Vertex2d.center(...centers);
}

Polygon2d.lines = (...polys) => {
  let lines = [];
  for (let index = 0; index < polys.length; index += 1) {
    lines = lines.concat(polys[index].lines());
  }
  // TODO: patchy fix.... there is somthing wrong with my algorythym
  return Line2d.consolidate(...lines);
}

new Polygon2d();
module.exports = Polygon2d;
