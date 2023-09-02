const MeasurementHoverMap2d = require('../../../../public/js/utils/canvas/two-d/hover-map/measurements.js');


class LayoutHoverMap extends MeasurementHoverMap2d {
  constructor(layout, panZ) {
    super(panZ);
    const instance = this;
    let layoutHoverEnabled = true;

    this.layoutHover = (hover) => {
      if (hover !== undefined && layoutHoverEnabled !== hover) {
        layoutHoverEnabled = hover;
        construct();
      }
      return layoutHoverEnabled;
    }

    function construct() {
      const l = layout instanceof Function ? layout() : layout;
      instance.clear();
      if (layoutHoverEnabled) {
        const walls = l.walls();
        for (let index = 0; index < walls.length; index++) {
          const wall = walls[index];
          wall.windows().forEach(w => instance.add(w.toLine, 5, w));
          wall.doors().forEach(d => instance.add(d.toLine, 20, d));
          instance.add(wall.startVertex(), 24);
          instance.add(wall.endVertex(), 24);
          instance.add(wall, 10);
        }
      }
      const objects = l.activeObjects();
      for (let index = 0; index < objects.length; index++) {
        const snap = objects[index].snap2d.top();
        const snapLocs = snap.snapLocations();
        snapLocs.forEach(l => instance.add(l.center(), 6, l));
        instance.add(snap.object(), () => snap.minRadius(), snap);
      }
    }

    this.update = () => construct();

    construct();
  }
}


module.exports = LayoutHoverMap;
