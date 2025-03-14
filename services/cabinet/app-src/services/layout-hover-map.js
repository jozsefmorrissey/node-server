const HoverMap2d = require('../../../../public/js/utils/canvas/two-d/hover-map.js');
const LineMeasurement2d = require('../../../../public/js/utils/canvas/two-d/objects/line-measurement.js');

const LAYOUT_HM_GROUP = 'layout-group';
class LayoutHoverMap extends HoverMap2d {
  constructor(layout) {
    super();
    const instance = this;
    let layoutHoverEnabled = true;

    this.layoutHover = () => {
      let hover = layout.objects.active().length === 0;
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

    function buildWall(wall) {
      const addOnWallFunc = drawMap ? addOnWallLine : addOnWall;
      wall.windows().forEach(addOnWallFunc);
      wall.doors().forEach(addOnWallFunc);
      instance.add(wall[0], 20, null, LAYOUT_HM_GROUP);
      instance.add(wall, 10, null, LAYOUT_HM_GROUP);
      const measurement = new LineMeasurement2d(wall, layout.center(), null, layout.reconsileLength(wall));
      wall.measurment = measurement;
      return instance.add(measurement.midpoints.further, 10, measurement, LAYOUT_HM_GROUP);
    }

    function buildSnap(snap) {
      const snapLocs = snap.snapLocations();
      snapLocs.forEach(l => instance.add(l.center, 5, l));
      if (drawMap) return snap.object().lines().forEach(l => instance.add(l, 15));
      if (!drawMap) return instance.add(snap.center, 60, snap);
    }

    let prevHashMap;
    let drawMap = false;
    function construct() {
      // if (!Global.loaded) return;
      instance.clear();
      const walls = layout.walls();
      let hashMap = new HashMap();
      for (let index = 0; index < walls.length; index++) {
        buildWall(walls[index]);
      }
      const objects = layout.objects.active();
      for (let index = 0; index < objects.length; index++) {
        const snap = objects[index].snap2d.top();
        const hash = snap.object().hash() + objects[index].hash();
        buildSnap(snap);
      }
      prevHashMap = hashMap;
    }

    this.update = construct;//() => construct.lastCall('internal update', 500);

    construct();
    layout.on.change(this.update);
  }
}

module.exports = LayoutHoverMap;
