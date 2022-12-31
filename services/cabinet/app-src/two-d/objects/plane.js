
class Plane2d {
  constructor(vertices) {
    this.getLines = () => {
      const lines = [];
      for (let index = 0; index < vertices.length; index += 1) {
        lines.push(new Line2d(vertices[index], vertices[(index + 1) % vertices.length]));
      }
      return lines;
    }
  }
}

Plane2d.getPlanes = (planes) => {
  const ps = [];
  planes.forEach((p) => ps.push(new Plane2d(p)));
  return ps;
}

Plane2d.consolidatePolygons = (polygons) => {
  const consolidated = {top: {}, left: {}, front: {}};
  function group(g, poly) {

    map.xy[index].push({x: v.pos.x, y: v.pos.y, level: v.pos.z});
    map.xz[index].push({x: v.pos.x, y: v.pos.z, level: v.pos.y});
    map.yz[index].push({x: v.pos.y, y: v.pos.z, level: v.pos.x});
  }
  const map = {xy: [], xz: [], yz: []};
  polygons.forEach((p, index) => {
    map.xy.push([]);
    map.xz.push([]);
    map.yz.push([]);
    p.vertices.forEach((v) => {
      map.xy[index].push({x: v.pos.x, y: v.pos.y, level: v.pos.z});
      map.xz[index].push({x: v.pos.x, y: v.pos.z, level: v.pos.y});
      map.yz[index].push({x: v.pos.y, y: v.pos.z, level: v.pos.x});
    });
  });
  return map;
}

new Plane2d();
module.exports = Plane2d;
