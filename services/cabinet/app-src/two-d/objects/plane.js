
class Plane2D extends Lookup {
  constructor(verticies) {
    super();
    this.getLines = () => {
      const lines = [];
      for (let index = 0; index < verticies.length; index += 1) {
        lines.push(new Line2D(verticies[index], verticies[(index + 1) % verticies.length]));
      }
      return lines;
    }
  }
}

Plane2D.getPlanes = (planes) => {
  const ps = [];
  planes.forEach((p) => ps.push(new Plane2D(p)));
  return ps;
}

Plane2D.consolidatePolygons = (polygons) => {
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
