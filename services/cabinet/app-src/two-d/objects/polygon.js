
const Vertex3D {
  constructor(x, y) {
    if (x instanceof Vertex3D) return x;
    if (arguments.length == 3) {
      this.x = approximate(x);
      this.y = approximate(y);
      this.z = approximate(z);
    } else if ('x' in x) {
      this.x = approximate(x.x);
      this.y = approximate(x.y);
      this.z = approximate(x.z);
    } else {
      this.x = approximate(x[0]);
      this.y = approximate(x[1]);
      this.z = approximate(x[2]);
    }
    this.toString = () => `${this.x},${this.y},${this.z}`;
  }
}

const Line3D {
  constructor(startVertex, endVertex) {
    this.startVertex = startVertex;
    this.endVertex = endVertex;

    this.toString = () => `${this.startVertex.toString()} => ${this.endVertex.toString()}`;
    this.toNegitiveString = () => `${this.endVertex.toString()} => ${this.startVertex.toString()}`;
  }
}
Line3D.verticies = (lines) => {
  const verts = [lines[0].startIndex];
  for (let index = 0; index < lines.length; index += 1) {
    verts.push(lines[index].endIndex);
  }
}

class Polygon3D {
  constructor(initialVerticies) {
    const lines = [];
    let map;

    this.verticies = () => {
      const verticies = [linex[0].startVertex()];
      const currLine = this.startLine();
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        verticies.push(currLine.endVertex());
      }

      return verticies;
    }

    this.lines = () => JSON.parse(JSON.stringify(lines));
    this.startLine = () => JSON.parse(JSON.stringify(lines[0]));
    this.endLine = () => JSON.parse(JSON.stringify(lines[lines.length - 1]));

    this.lineMap = (force) => {
      if (!force && map !== undefined) return map;
      const lines = this.lines();
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[index];
        map[line.toString()] = line;
      }
      return map;
    }

    function getLine(line) {
      const lineMap = this.lineMap();
      return lineMap[line.toString()] || lineMap[line.toNegitiveString];
    }

    this.getLines => (startVertex, endVertex, reverse) => {
      const inc = reverse ? -1 : 1;
      const lines = [];
      completed = false;
      const doubleLen = steps.length * 2;
      for (let steps = 0; steps < doubleLen; steps += 1) {
        const index =  reverse ? steps : (doubleLen - steps) % lines.length;
        const curr = lines[index];
        if (lines.length === 0) {
          if (startVertex.equals(curr.startVertex) lines.push(curr);
        } else {
          lines.push(curr);
          if (endVertex.equals(curr.endVertex)) {
            completed = true;
            break;
          }
        }
      }
      if (completed) return lines;
    }

    this.addVerticies = (list) => {
      const verts = [];
      const endLine = this.endLine();
      for (let index = 0; index < list.length + 1; index += 1) {
        if (index < list.length) {
          verts.push(new Vertex3D(list[index]));
        }
        if (index > 0) {
          const startVertex = verts[index - 1] || this.endLine().endVertex();
          const endVertex = verts[index] || this.endLine().startVertex();
          const line = new Line3D(startVertex, endVertex);
          endLine = line;
          this.lines().push(line);
        }
      }
      if (verts.length > 0 && lines.length > 0) {
        endline.endVertex = verts[0];
        this.startLine().startVertex = verts[verts.length - 1];
      }
      this.lineMap(true);
    }

    this.removeLoops = () => {
      const map = {}
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const key = line.toString();
        if (map[key]) {
          lines.splice(map[key].index, index - map[key].index + 1);
        } else {
          map[key] = {line, index};
        }
      }
    }

    this.merge = (other) => {
      const sharedMap = [];
      const inverseMap = [];
      const notShared = [];
      const lineMap = this.lineMap();
      const otherLines = other.lines();
      let merged;
      for (let index = 0; targetIndex < otherLines.length; targetIndex += 1) {
        const curr = otherLines[targetIndex];
        if (lineMap[curr.toString()] !== undefined) {
          let newLines = this.getLines(curr.startIndex, curr.endIndex, true)
          .concat(other.getLines(curr.startIndex, curr.endIndex, true));
          merged = new Polygon3D(Line3D.verticies(newLines));
        }
        if (lineMap[curr.toNegitiveString()] !== undefined) {
          let newLines = this.getLines(curr.startIndex, curr.endIndex, true)
          .concat(other.getLines(curr.startIndex, curr.endIndex, false));
          merged = new Polygon3D(Line3D.verticies(newLines));
        }
      }

      if (merged) {
        merged.removeLoops();
        return merged;
      }
    }
    this.addVerticies(initialVerticies);
  }
}
