
const Vertex3D = require('../vertex.js');
const Vector3D = require('../vector.js');

class SpatialNode {
  constructor(object, tolerance, sectorMap, payload) {
    const neighbors = {}
    sectorMap ||= new Vector3D.SectorMap();
    const sectors = Object.keys(sectorMap);
    sectors.forEach(s => (neighbors[s] = []) & (this[s] = () => neighbors[s]));
    this.object = () => object;
    this.payload = () => payload;
    this.sectorMap = () => sectorMap;
    this.connect = (other) => {
      let connection = object.connect(other.object());
      const isVertex = connection instanceof Vertex3D;
      if (isVertex || connection.length() < tolerance) {
        if (isVertex || connection.isPoint())
        connection = object.resize(-1, -1, true).connect(other.object());
        const sector = Vector3D.sector(connection.vector().unit(), sectorMap);
        neighbors[sector].push(other);
      }
    }
    this.neighbors = () => Object.values(neighbors).concatElements();
    this.toDrawString = () => {
      let str = `${object.toDrawString('green')}\n`;
      for (let index = 0; index < sectors.length; index++) {
        str += `//${index} ${sectors[index]}\n\t${this[sectors[index]]().map(sn => sn.object().toDrawString())}\n`;
      }
      return str;
    }
  }
}

class SpatialMap {
  constructor(tolerance) {
    tolerance ||= .0001;
    const nodes = [];
    this.add = (object, sectorMap, payload) => {
      if (!sectorMap && object.normals) sectorMap = new Vector3D.SectorMap(object.pathValue('normals'));
      const spatialNode = new SpatialNode(object, tolerance, sectorMap, payload);
      nodes.forEach(sn => sn.connect(spatialNode) & spatialNode.connect(sn));
      nodes.push(spatialNode);
    }
    this.addAll = (objects) => objects.forEach(obj => this.add(obj));
    this.nodes = () => nodes;
    this.node = (object) => nodes.find(node => object === node.object());
  }
}

module.exports = SpatialMap;
