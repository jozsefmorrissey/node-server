const Polygon3D = require('./polygon');
const Vertex3D = require('./vertex');
const Line3D = require('./line');
const ToleranceMap = require('../../../tolerance-map.js');

class DepthBreathFirstSearchObject {
  constructor(vert, verts) {
    const tolerance = .01
    verts = verts.map(v=>v);
    verts = verts.filter(v => !v.equals(vert))
    verts.sort(Vertex3D.sortByCenter(vert));
    const tolMap = new ToleranceMap({'vector().unit().i()': tolerance,
                                    'vector().unit().j()': tolerance,
                                    'vector().unit().k()': tolerance});
    let index = 0;
    this.index = () => {
      while (this.connections.matches(new Line3D(vert, verts[index])).length > 0) {
        index++;
      }
      return index;
    }
    this.target = () => verts[this.index()];
    this.vertex = () => vert;
    this.distance = () => this.exhasted() ? Number.MAX_SAFE_INTEGER : vert.distance(this.target());
    this.exhasted = () => this.index() === verts.length;
    this.line = () => new Line3D(vert, this.target());
    this.inc = () => index++;
    this.connections = () => tolMap.group().concatElements();
    this.connections.add = (line) => {
      tolMap.add(line);
    }
    this.connections.matches = (line) => tolMap.matches(line);
  }
}

class Excavated3D extends Polygon3D {
  constructor(initialVertices, excavations) {
      super(initialVertices);

      const _excavations = [];
      this.add = (excavation) => (excavation instanceof Polygon3D) && _excavations.push(excavation);
      this.vertices.all = () => this.vertices().concat(this.vertices.excavations());
      this.vertices.excavations = () => Line3D.intersections(this.lines.excavations());
      this.lines.all = () => this.lines().concat(this.lines.excavations());
      this.lines.excavations = () => _excavations.map(e => e.lines()).concatElements();
      let grid;
      this.grid = () => {
        if (grid && this.hash() === grid.hash) return grid;
        const verts = this.vertices.all();
        const vertSearchList = verts.map((v,i) => new DepthBreathFirstSearchObject(v, verts.slice(i + 1)));
        const vertSearchHashMap = {};
        vertSearchList.forEach(v => vertSearchHashMap[v.vertex().hash()] = v);
        grid = [];
        while (vertSearchList.length) {
          vertSearchList.sortByAttr('distance');
          let dbfso = vertSearchList[0];
          while (dbfso && dbfso.exhasted()) {
            vertSearchList.splice(0,1);
            dbfso = vertSearchList[0];
          }
          if (dbfso) {
            const line = dbfso.line();
            dbfso.inc();
            if (dbfso.connections.matches(line).length === 0) {
              if (!_excavations.find(e => e.isWithin(line.connect.vertex(e.center(), true)[0], true))) {
                grid.push(line);
                dbfso.connections.add(line);
                vertSearchHashMap[line[1].hash()].connections.add(line.negitive());
              }
            }
          }
        }
        Line3D.removeIntersecting(grid);
        grid.hash = this.hash();
        return grid;
      }

      this.hash = () => this.lines.all().map(l => l.hash()).sum();
      if (Array.isArray(excavations)) excavations.forEach(e => this.add(e));
  }
}

module.exports = Excavated3D;
