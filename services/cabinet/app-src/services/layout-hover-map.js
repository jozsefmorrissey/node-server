const HoverMap2d = require('../../../../public/js/utils/canvas/two-d/hover-map.js');


class LayoutHoverMap extends HoverMap2d {
  constructor(layout) {
    super();
    const instance = this;
    let layoutHoverEnabled = true;

    this.layoutHover = (hover) => {
      if (hover !== undefined && layoutHoverEnabled !== hover) {
        layoutHoverEnabled = hover;
        construct();
      }
      return layoutHoverEnabled;
    }

    let drawMap = false;
    function construct() {
      instance.clear();
      if (layoutHoverEnabled) {
        const walls = layout.walls();
        for (let index = 0; index < walls.length; index++) {
          const wall = walls[index];
          if (!drawMap) wall.windows().forEach(w => instance.add(w.toLine, 5, w));
          if (!drawMap) wall.doors().forEach(d => instance.add(d.toLine, 20, d));
          instance.add(wall.startVertex(), 20);
          instance.add(wall, 10);
        }
      }
      const objects = layout.activeObjects();
      for (let index = 0; index < objects.length; index++) {
        const snap = objects[index].snap2d.top();
        const snapLocs = snap.snapLocations();
        snapLocs.forEach(l => instance.add(l.center(), 6, l));
        if (drawMap) snap.object().lines().forEach(l => instance.add(l, 15));
        if (!drawMap) instance.add(snap.center(), 60, snap);
      }
    }

    this.update = () => construct();

    construct();
    layout.onChange(construct);
  }
}

module.exports = LayoutHoverMap;
