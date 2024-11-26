
const Vertex3D = require('../vertex.js');
const Vector3D = require('../vector.js');

class SpatialNode {
  constructor(object, tolerance, sectorMap, payload) {
    const neighbors = {}
    if (object.constructor.name !== 'Polygon3D') {
      console.warn('some algorithyms expect Polygon3D... SpatialMap.neighbors');
    }
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

    this.connectNodes = (object) => this.nodes()
                .map(node => ({node, connection: node.object().connect(object).negitive().directional(false, false)}));
    this.closest = (object) => {
      const min = this.connectNodes().map(l=>l.length());
      return min;
    }
    this.neighbors = (object, ...vectors) => {
      const nodes = this.nodes();
      const connObj = this.connectNodes(object);
      const center = object.center();
      const neighbors = Array.fill(vectors.length, () => []);
      for (let j = 0; j < connObj.length; j++) {
        const connection = connObj[j].connection;
        const node = connObj[j].node;
        const connUnit = connection.vector().unit();
        if (connection.isPoint()) {
          let index = vectors.minIndex(v => node.object().center().distance(new Vertex3D(v).translate(center)));
          neighbors[index].push({dot:1, index, connection, node});
        } else {
          let max;
          for (let index = 0; index < vectors.length; index++) {
            const dot = vectors[index].unit().dot(connUnit);
            if (!max || dot > max.dot) max = {dot, index, connection, node};
          }
          if (max && max.dot > .0001) neighbors[max.index].push(max);
        }
      }
      neighbors.forEach((list,j) => {
        list.sort((n1,n2) => n1.connection.length() - n2.connection.length())
        neighbors[j] = neighbors[j].map(o => o.node);
      });
      return neighbors;
    }
  }
}

module.exports = SpatialMap;
