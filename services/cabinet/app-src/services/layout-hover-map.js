const HoverMap2d = require('../../../../public/js/utils/canvas/two-d/hover-map.js');
const LineMeasurement2d = require('../../../../public/js/utils/canvas/two-d/objects/line-measurement.js');

const LAYOUT_HM_GROUP = 'layout-group';
class LayoutHoverMap extends HoverMap2d {
  constructor(layout) {
    super();
    const instance = this;
    let layoutHoverEnabled = true;

    this.layoutHover = (hover) => {
      if (hover !== undefined && layoutHoverEnabled !== hover) {
        layoutHoverEnabled = hover;
        construct();
        instance.oft(layoutHoverEnabled, LAYOUT_HM_GROUP);
      }
      return layoutHoverEnabled;
    }

    function addOnWallLine(ow) {
      ow.endpoints2D();
      instance.add(ow.toLine(), 40, ow);
    }

    function addOnWall(ow) {
      ow.endpoints2D();
      instance.add(ow.toLine, 40, ow, LAYOUT_HM_GROUP);
      const center = layout.center()
      const mp = new LineMeasurement2d(ow.prevLine(), center, null, ow.fromPreviousWall);
      const mn = new LineMeasurement2d(ow.nextLine(), center, null, ow.fromNextWall);
      ow.prevLine.measurement = mp;
      ow.nextLine.measurement = mn;
      instance.add(mp.midpoints.further, 10, mp, LAYOUT_HM_GROUP);
      instance.add(mn.midpoints.further, 10, mn, LAYOUT_HM_GROUP);
    }

    let drawMap = false;
    function construct() {
      instance.clear();
      const walls = layout.walls();
      for (let index = 0; index < walls.length; index++) {
        const wall = walls[index];
        const addOnWallFunc = drawMap ? addOnWallLine : addOnWall;
        wall.windows().forEach(addOnWallFunc);
        wall.doors().forEach(addOnWallFunc);
        instance.add(wall.startVertex(), 20, null, LAYOUT_HM_GROUP);
        instance.add(wall, 10, null, LAYOUT_HM_GROUP);
        const measurement = new LineMeasurement2d(wall, layout.center(), null, layout.reconsileLength(wall));
        wall.measurment = measurement;
        instance.add(measurement.midpoints.further, 10, measurement, LAYOUT_HM_GROUP);
      }
      const objects = layout.activeObjects();
      for (let index = 0; index < objects.length; index++) {
        const snap = objects[index].snap2d.top();
        const snapLocs = snap.snapLocations();
        snapLocs.forEach(l => instance.add(l.center, 15, l));
        if (drawMap) snap.object().lines().forEach(l => instance.add(l, 15));
        if (!drawMap) instance.add(snap.center, 60, snap);
      }
    }

    this.update = () => construct();

    construct();
    layout.onChange(construct);
  }
}

module.exports = LayoutHoverMap;
