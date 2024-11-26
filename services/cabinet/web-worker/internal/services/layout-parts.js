
const Corner = require('../../../app-src/two-d/layout/corner.js')
const Door = require('../../../app-src/two-d/layout/door.js')
const OnWall = require('../../../app-src/two-d/layout/on-wall.js')
const Wall = require('../../../app-src/two-d/layout/wall.js')
const Window = require('../../../app-src/two-d/layout/window.js')
const Parimeters2d = require('../../../../../public/js/utils/canvas/two-d/maps/parimeters.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');

const lineTo3DVerts = (line, bottomHeight, topHeight) => {
  return [{x: line[0].x, y:bottomHeight, z: line[0].y},
                {x: line[1].x, y:bottomHeight, z: line[1].y},
                {x: line[1].x, y:topHeight, z: line[1].y},
                {x: line[0].x, y:topHeight, z: line[0].y}];
}

module.exports = (payload) => {
  const wallObjs = Object.fromJson(payload.layout.walls);
  const cabinets = payload.partInfos.filter(pi => pi.category === 'Cabinet');
  const layoutVerts = new Parimeters2d(wallObjs).polygons()[0].vertices();
  const maxWallHeight = wallObjs.max(w => w.height()).height();

  const walls = wallObjs.map(w => new Polygon3D(lineTo3DVerts(w, 0, w.height())))
  const floor = new Polygon3D(layoutVerts.map(v => new Vertex3D(v.x, 0, v.y)));
  const ceiling = new Polygon3D(layoutVerts.map(v => new Vertex3D(v.x, maxWallHeight, v.y)));
  console.log(payload);
}
