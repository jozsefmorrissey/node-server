
const Corner = require('../../../app-src/two-d/layout/corner.js')
const Door = require('../../../app-src/two-d/layout/door.js')
const OnWall = require('../../../app-src/two-d/layout/on-wall.js')
const Wall = require('../../../app-src/two-d/layout/wall.js')
const Window = require('../../../app-src/two-d/layout/window.js')
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Parimeters2d = require('../../../../../public/js/utils/canvas/two-d/maps/parimeters.js');
const Parimeter = require('../../../app-src/three-d/objects/parimeter.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Layer = require('../../../app-src/three-d/objects/layer.js');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');


const lineTo3DVerts = (line, bottomHeight, topHeight) => {
  return [{x: line[0].x, y:bottomHeight, z: line[0].y},
                {x: line[1].x, y:bottomHeight, z: line[1].y},
                {x: line[1].x, y:topHeight, z: line[1].y},
                {x: line[0].x, y:topHeight, z: line[0].y}];
}

function peels(info) {
  const csg = CSG.fromPolygons(info.polygons, true);
  const silhouette = Object.fromJson(info.silhouette);
  const ASSEMBLY = info.ASSEMBLY;
  const topVector = {i:0,j:1,k:0};
  let topPeel = csg.peel(topVector, .001);
  const bottomPeel = csg.peel({i:0,j:-1,k:0}, .001);

  // topPeel = topPeel.union(topPeel);
  const topLayer = Layer.fromCSG(topPeel.polygons.filter(p => p.plane.normal.y === 1))[0];
  const top = topLayer.parimeter()[0];

  const bottomLayer = Layer.fromCSG(bottomPeel.polygons.filter(p => p.plane.normal.y === -1))[0];
  const bottom = bottomLayer.parimeter()[0];

  return {top,bottom,csg,silhouette,ASSEMBLY};
}

function withWallsOutline(polys, walls) {
  walls = walls.filter(w => polys.find(p => p.connect(w).length() < 3));
  const height = polys[0].center().y;
  const wallLines = walls.map(w =>
    Line3D.combine(w.lines().map(l => {l = l.clone(); l[0].y = l[1].y = height; return l;}))[0]);
  const lines = polys.map(p => p.lines()).concatElements();;//.concat(wallLines);
  const outline = new Parimeter(lines);
  return outline;
}

function organize(map, walls, floor, ceiling) {
  const allObjects = new ToleranceMap({'center().y': .0001});
  const assembliesOnly = new ToleranceMap({'center().y': .0001});
  Object.values(map).forEach(info => {
    if (info.ASSEMBLY) {
      assembliesOnly.add.all([info.top, info.bottom]);
    }
    allObjects.add.all([info.top, info.bottom]);
  });
  const polys = assembliesOnly.group().sortByAttr('0.center().y');
  const outlines = polys.map(g => withWallsOutline(g, walls));
  return {polys, outlines, walls, floor, ceiling};
}

module.exports = (payload) => {
  const bMap = payload.boxMap;
  Object.keys(bMap).forEach(k => bMap[k] = peels(bMap[k]));
  const wallObjs = Object.fromJson(payload.layout.walls);

  const layoutVerts = new Parimeters2d(wallObjs).polygons()[0].vertices();
  const maxWallHeight = wallObjs.max(w => w.height()).height();

  const walls = wallObjs.map(w => new Polygon3D(lineTo3DVerts(w, 0, w.height())))
  const floor = new Polygon3D(layoutVerts.map(v => new Vertex3D(v.x, 0, v.y)));
  const ceiling = new Polygon3D(layoutVerts.map(v => new Vertex3D(v.x, maxWallHeight, v.y)));
  const groups = organize(bMap, walls, floor, ceiling);

  console.log(payload);
  return groups
}
